import { useEffect, useMemo, useRef, useState } from "react";
import { Blobatar } from "blobatar/react";
import schools from "../data/schools.json";
import companies from "../data/companies.json";
import {
  ArrowLeft,
  ArrowRight,
  Bug,
  Camera,
  CheckCircle,
  CopySimple,
  Clock,
  DownloadSimple,
  FileArrowUp,
  FileXls,
  Plus,
  PencilSimple,
  Scan,
  Trash,
  UploadSimple,
  Users,
  Info,
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react";
import {
  contextIsComplete,
  createRegistryContext,
  createWeek,
  deliveryStatus,
  exportDeliveryState,
  exportWeekCsv,
  findStudentByMatrixValue,
  findWeekByMatrixValue,
  matrixPeriodLabel,
  mergeStudents,
  parseMatrixPayload,
  parsePortableDeliveryFile,
  readDeliveryState,
  registerDelivery,
  removeDelivery,
  statusFromTimestamp,
  weekSummary,
  writeDeliveryState,
} from "../services/delivery-registry.js";
import { VERSION } from "../domain/records.js";
import {
  createScannerIssue,
  formatScannerDiagnostic,
  scannerCodeForCameraError,
  scannerDiagnosticSnapshot,
} from "../services/scanner-diagnostics.js";
import { notify } from "../services/rare-notification.jsx";
import "../delivery-registry.css";

const ZXING_SOURCES = [
  "https://cdn.jsdelivr.net/npm/@zxing/browser@0.2.1/umd/zxing-browser.min.js",
  "https://unpkg.com/@zxing/browser@0.2.1/umd/zxing-browser.min.js",
];

let zxingLoadPromise = null;

function loadExternalScript(src, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const existing = [...document.scripts].find((script) => script.src === src);
    if (existing?.dataset.loaded === "true") {
      resolve();
      return;
    }

    // Los scripts del HTML son parser-blocking. Si llegamos aquí y el global
    // no existe, ese elemento ya no va a volver a emitir "load"; se reemplaza
    // para que el reintento tenga eventos observables y un código diagnóstico.
    if (existing) existing.remove();
    const script = document.createElement("script");
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("El lector tardó demasiado en cargar."));
    }, timeout);

    const cleanup = () => {
      clearTimeout(timer);
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
    };
    const onLoad = () => {
      script.dataset.loaded = "true";
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      script.remove();
      reject(new Error("No se pudo cargar el lector Data Matrix."));
    };

    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    script.src = src;
    script.async = true;
    document.head.appendChild(script);
  });
}

async function ensureZxingBrowser() {
  if (window.ZXingBrowser) {
    window.__deliveryZxingSource ||= "preloaded";
    return window.ZXingBrowser;
  }
  if (!zxingLoadPromise) {
    zxingLoadPromise = (async () => {
      for (const src of ZXING_SOURCES) {
        try {
          await loadExternalScript(src);
          if (window.ZXingBrowser) {
            window.__deliveryZxingSource = src;
            return window.ZXingBrowser;
          }
        } catch {
          // Prueba el siguiente origen.
        }
      }
      throw new Error("No se pudo cargar ZXing Browser.");
    })().catch((error) => {
      zxingLoadPromise = null;
      throw error;
    });
  }
  return zxingLoadPromise;
}

const statusMeta = {
  entregado: { label: "Entregado", icon: CheckCircle },
  entregado_tarde: { label: "Entregado a destiempo", icon: Clock },
  no_entregado: { label: "No entregado", icon: XCircle },
};

function formatDateTime(value) {
  if (!value) return "Sin registro";
  const date = new Date(value);
  if (!Number.isFinite(+date)) return "Sin registro";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value + "T12:00:00");
  if (!Number.isFinite(+date)) return value;
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatPeriod(startDate, endDate) {
  if (!startDate && !endDate) return "Sin periodo";
  if (!endDate || startDate === endDate) return formatDate(startDate || endDate);
  return formatDate(startDate) + " – " + formatDate(endDate);
}

const tutorialSteps = [
  {
    title: "Escuela",
    text: "Selecciona el plantel del registro.",
    visual: "school",
  },
  {
    title: "Alumnos",
    text: "Agrega nombre, especialidad y empresa.",
    visual: "students",
  },
  {
    title: "Semana",
    text: "Define la fecha y hora límite.",
    visual: "week",
  },
  {
    title: "Escaneo",
    text: "Escanea las bitácoras en cualquier orden. El periodo del Data Matrix decide la semana y la hora decide si fue a tiempo o a destiempo.",
    visual: "scan",
  },
];

function shortSchool(name) {
  return schools.find((item) => item.name === name)?.shortName || name || "";
}

function shortCompany(name) {
  return companies.find((item) => item.name === name)?.shortName || name || "";
}

function resultBoxFromPoints(video, points) {
  if (
    !video ||
    !points?.length ||
    !video.videoWidth ||
    !video.videoHeight ||
    !video.clientWidth ||
    !video.clientHeight
  )
    return null;
  const xs = points
    .map((point) => Number(point?.getX?.() ?? point?.x))
    .filter(Number.isFinite);
  const ys = points
    .map((point) => Number(point?.getY?.() ?? point?.y))
    .filter(Number.isFinite);
  if (!xs.length || !ys.length) return null;

  const scale = Math.max(
    video.clientWidth / video.videoWidth,
    video.clientHeight / video.videoHeight,
  );
  const shownW = video.videoWidth * scale;
  const shownH = video.videoHeight * scale;
  const offsetX = (video.clientWidth - shownW) / 2;
  const offsetY = (video.clientHeight - shownH) / 2;
  const minX = Math.min(...xs) * scale + offsetX;
  const maxX = Math.max(...xs) * scale + offsetX;
  const minY = Math.min(...ys) * scale + offsetY;
  const maxY = Math.max(...ys) * scale + offsetY;
  const pad = Math.max(
    8,
    Math.min(video.clientWidth, video.clientHeight) * 0.018,
  );
  return {
    left: Math.max(0.5, ((minX - pad) / video.clientWidth) * 100),
    top: Math.max(0.5, ((minY - pad) / video.clientHeight) * 100),
    width: Math.min(
      99,
      Math.max(9, ((maxX - minX + pad * 2) / video.clientWidth) * 100),
    ),
    height: Math.min(
      99,
      Math.max(9, ((maxY - minY + pad * 2) / video.clientHeight) * 100),
    ),
  };
}

function normalizeHeader(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function pickColumn(row, aliases) {
  const wanted = new Set(aliases.map(normalizeHeader));
  for (const [key, value] of Object.entries(row || {})) {
    if (wanted.has(normalizeHeader(key)) && String(value || "").trim())
      return String(value).trim();
  }
  return "";
}

function spreadsheetRowsToStudents(rows) {
  return rows
    .map((row) => {
      const values = Object.values(row || {});
      const name =
        pickColumn(row, [
          "nombre",
          "nombre completo",
          "alumno",
          "estudiante",
          "nombre del alumno",
        ]) ||
        String(values.find((value) => String(value || "").trim()) || "").trim();
      return {
        name,
        specialty: pickColumn(row, ["especialidad", "carrera"]),
        company: pickColumn(row, ["empresa", "organismo", "empresa u organismo"]),
      };
    })
    .filter((student) => student.name);
}

function ScanSound({ tone }) {
  useEffect(() => {
    if (!tone) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "square";
      oscillator.frequency.value = tone === "ok" ? 1550 : tone === "seen" ? 760 : 420;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.008);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        ctx.currentTime + (tone === "ok" ? 0.085 : 0.15),
      );
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + (tone === "ok" ? 0.09 : 0.16));
      oscillator.addEventListener("ended", () => ctx.close());
    } catch {
      // El escaneo sigue funcionando aunque el navegador bloquee audio.
    }
  }, [tone]);
  return null;
}

export default function DeliveryRegistry({ onClose }) {
  const initialState = useMemo(() => readDeliveryState(), []);
  const initiallyStarted =
    contextIsComplete(initialState.context) ||
    initialState.students.length > 0 ||
    initialState.weeks.length > 0;
  const [state, setState] = useState(initialState);
  const [view, setView] = useState(initiallyStarted ? "home" : "welcome");
  const [activeWeekId, setActiveWeekId] = useState(
    initialState.weeks.at(-1)?.id || "",
  );
  const [contextForm, setContextForm] = useState(() =>
    createRegistryContext(initialState.context),
  );
  const [setupStep, setSetupStep] = useState(0);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [studentForm, setStudentForm] = useState({
    name: "",
    specialty: "",
    company: "",
  });
  const [weekForm, setWeekForm] = useState({
    label: "",
    startDate: "",
    dueAt: "",
  });
  const [editingStudentId, setEditingStudentId] = useState("");
  const [notice, setNotice] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scanQueue, setScanQueue] = useState([]);
  const [scanMessage, setScanMessage] = useState("Apunta la cámara al Data Matrix.");
  const [scanTone, setScanTone] = useState("");
  const [scanBox, setScanBox] = useState(null);
  const [scannerError, setScannerError] = useState(null);
  const [cameraState, setCameraState] = useState("idle");
  const videoRef = useRef(null);
  const scanControls = useRef(null);
  const cameraStreamRef = useRef(null);
  const nativeFrameRef = useRef(0);
  const pendingIds = useRef(new Set());
  const scanBoxTimer = useRef(null);
  const tutorialOpenRef = useRef(false);
  const scanProcessorRef = useRef(null);

  const activeWeek = useMemo(
    () => state.weeks.find((week) => week.id === activeWeekId) || null,
    [state.weeks, activeWeekId],
  );
  const activeSummary = useMemo(
    () => (activeWeek ? weekSummary(activeWeek, state.students) : null),
    [activeWeek, state.students],
  );
  const started =
    contextIsComplete(state.context) ||
    state.students.length > 0 ||
    state.weeks.length > 0;
  const registrySchool =
    schools.find((school) => school.name === state.context.school) ||
    schools[0] ||
    {};

  const commit = (producer) => {
    const next =
      typeof producer === "function" ? producer(state) : producer;
    const saved = writeDeliveryState(next);
    setState(saved);
    return saved;
  };

  const showNotice = (kind, title, description = "") =>
    setNotice({ kind, title, description });

  const clearNotice = () => setNotice(null);

  const reportScannerIssue = (code, error, extra = {}) => {
    const issue = createScannerIssue(code, error, extra);
    setScannerError(issue);
    console.error("[Registro de entrega][" + issue.code + "]", {
      ...issue,
      cameraState,
      zxingLoaded: Boolean(window.ZXingBrowser),
    });
    return issue;
  };

  const clearScannerIssue = () => setScannerError(null);

  const copyScannerDiagnostic = async () => {
    if (!scannerError) return;
    const diagnostic = scannerDiagnosticSnapshot({
      issue: scannerError,
      cameraState,
      video: videoRef.current,
      stream: cameraStreamRef.current,
      zxing: window.ZXingBrowser,
      version: VERSION,
    });
    const text = formatScannerDiagnostic(diagnostic);
    try {
      await navigator.clipboard.writeText(text);
      notify("success", "Diagnóstico copiado", scannerError.code);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand?.("copy");
      area.remove();
      notify("success", "Diagnóstico copiado", scannerError.code);
    }
  };

  useEffect(() => {
    if (activeWeekId && !state.weeks.some((week) => week.id === activeWeekId))
      setActiveWeekId(state.weeks.at(-1)?.id || "");
  }, [state.weeks, activeWeekId]);

  useEffect(() => {
    tutorialOpenRef.current = tutorialOpen;
  }, [tutorialOpen]);

  useEffect(() => {
    const theme = document.querySelector('meta[name="theme-color"]');
    if (!theme) return;
    const previous = theme.getAttribute("content") || "#f5f5f7";
    theme.setAttribute("content", view === "scanner" ? "#050607" : "#f5f5f7");
    return () => theme.setAttribute("content", previous);
  }, [view]);

  const showDetection = (kind, box) => {
    setScanTone("");
    requestAnimationFrame(() => setScanTone(kind));
    setScanBox({
      ...(box || { left: 31, top: 26, width: 38, height: 48 }),
      tone: kind,
    });
    clearTimeout(scanBoxTimer.current);
    scanBoxTimer.current = setTimeout(() => {
      setScanBox(null);
      setScanTone("");
    }, 900);
  };

  const processScanValue = (rawValue, points) => {
    if (tutorialOpenRef.current) return;
    const payload = parseMatrixPayload(rawValue);
    const student = findStudentByMatrixValue(state.students, rawValue);
    if (!student) {
      setScanMessage("Código leído, pero el alumno no coincide con la base.");
      showDetection("error");
      return;
    }

    const targetWeek = findWeekByMatrixValue(
      state.weeks,
      rawValue,
      activeWeekId,
    );
    if (!targetWeek) {
      const period = matrixPeriodLabel(rawValue);
      setScanMessage(
        period
          ? "No existe una semana para " + period + "."
          : "Este código antiguo necesita una semana seleccionada.",
      );
      showDetection("error");
      return;
    }

    if (targetWeek.deliveries?.[student.id]) {
      setScanMessage(
        student.name + " ya estaba registrado en " + targetWeek.label + ".",
      );
      showDetection("seen");
      return;
    }

    const pendingKey = targetWeek.id + ":" + student.id;
    if (pendingIds.current.has(pendingKey)) {
      setScanMessage(
        student.name + " ya fue detectado para " + targetWeek.label + ".",
      );
      showDetection("seen");
      return;
    }

    pendingIds.current.add(pendingKey);
    const at = new Date().toISOString();
    const status = statusFromTimestamp(targetWeek, at);
    setScanQueue((current) => [
      ...current,
      {
        studentId: student.id,
        name: student.name,
        at,
        weekId: targetWeek.id,
        weekLabel: targetWeek.label,
        startDate: targetWeek.startDate,
        endDate: targetWeek.endDate,
        status,
        matrixVersion: payload.version,
      },
    ]);
    setScanMessage(
      student.name +
        " → " +
        targetWeek.label +
        (status === "entregado_tarde" ? " · A destiempo" : ""),
    );

    const box = resultBoxFromPoints(videoRef.current, points);
    showDetection("ok", box);
  };

  scanProcessorRef.current =
    view === "scanner" ? processScanValue : null;

  const stopCamera = () => {
    const controls = scanControls.current;
    scanControls.current = null;
    if (controls?.stop) {
      try {
        const stopped = controls.stop();
        Promise.resolve(stopped).catch(() => {});
      } catch {
        // Safari puede lanzar si el track terminó al cambiar de app.
      }
    }

    if (nativeFrameRef.current) {
      cancelAnimationFrame(nativeFrameRef.current);
      nativeFrameRef.current = 0;
    }

    const stream = cameraStreamRef.current;
    cameraStreamRef.current = null;
    stream?.getTracks?.().forEach((track) => {
      try {
        track.stop();
      } catch {
        // El track ya puede estar terminado en iOS.
      }
    });

    const video = videoRef.current;
    if (video) {
      try {
        video.pause();
      } catch {
        // Sin acción.
      }
      try {
        video.srcObject = null;
      } catch {
        video.removeAttribute("src");
      }
    }
  };

  const cameraErrorUserMessage = (error) => {
    const name = String(error?.name || "");
    if (name === "NotAllowedError" || name === "SecurityError")
      return "Safari no tiene permiso para usar la cámara. Permite la cámara para este sitio y toca Reintentar.";
    if (name === "NotFoundError" || name === "DevicesNotFoundError")
      return "No se encontró una cámara disponible en este dispositivo.";
    if (name === "NotReadableError" || name === "TrackStartError")
      return "La cámara está ocupada por otra app o pestaña. Ciérrala y vuelve a intentarlo.";
    if (name === "OverconstrainedError")
      return "La cámara no aceptó la configuración solicitada. Toca Reintentar.";
    if (name === "AbortError")
      return "iPhone o iPad interrumpió el acceso a la cámara. Toca Reintentar.";
    return (
      error?.message ||
      "No se pudo abrir la cámara. Revisa el permiso e inténtalo de nuevo."
    );
  };

  const attachStreamToVideo = async (video, stream) => {
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.setAttribute("muted", "");
    video.muted = true;
    video.autoplay = true;

    await new Promise((resolve, reject) => {
      let settled = false;
      const finish = (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        video.removeEventListener("loadedmetadata", check);
        video.removeEventListener("canplay", check);
        video.removeEventListener("playing", check);
        if (error) reject(error);
        else resolve();
      };
      const check = () => {
        if (
          video.srcObject === stream &&
          video.readyState >= 2 &&
          video.videoWidth > 0 &&
          video.videoHeight > 0
        )
          finish();
      };
      const timer = setTimeout(
        () => {
          const error = new Error("La vista de cámara no recibió video.");
          error.scannerCode = "VID-102";
          finish(error);
        },
        8000,
      );

      // Los listeners se registran antes de asignar srcObject. En Safari el
      // evento loadedmetadata puede ocurrir antes de que video.play() resuelva.
      video.addEventListener("loadedmetadata", check);
      video.addEventListener("canplay", check);
      video.addEventListener("playing", check);
      video.srcObject = stream;

      const playResult = video.play();
      if (playResult?.catch)
        playResult.catch((error) => {
          error.scannerCode = error.scannerCode || "VID-103";
          finish(error);
        });

      check();
    });
  };

  const startLiveDecoder = async (video) => {
    let ZX = window.ZXingBrowser;
    if (!ZX) {
      try {
        ZX = await ensureZxingBrowser();
      } catch (error) {
        error.scannerCode = error.scannerCode || "ZX-201";
        throw error;
      }
    }

    const Reader =
      ZX?.BrowserDatamatrixCodeReader || ZX?.BrowserMultiFormatReader;

    if (Reader) {
      const options = {
        delayBetweenScanAttempts: 90,
        delayBetweenScanSuccess: 220,
        tryPlayVideoTimeout: 8000,
      };
      let reader;
      try {
        reader = ZX.BrowserDatamatrixCodeReader
          ? new ZX.BrowserDatamatrixCodeReader(undefined, options)
          : new ZX.BrowserMultiFormatReader(undefined, options);
      } catch (error) {
        error.scannerCode = "ZX-203";
        throw error;
      }

      if (
        !ZX.BrowserDatamatrixCodeReader &&
        ZX.BarcodeFormat?.DATA_MATRIX !== undefined
      )
        reader.possibleFormats = [ZX.BarcodeFormat.DATA_MATRIX];

      try {
        scanControls.current = reader.scan(video, (result, error) => {
        if (result) {
          scanProcessorRef.current?.(
            result.getText?.() || result.text || "",
            result.getResultPoints?.() || [],
          );
          return;
        }

        const errorName = String(
          error?.name || error?.constructor?.name || "",
        );
        if (
          error &&
          errorName &&
          !/NotFound|Checksum|Format/i.test(errorName)
        ) {
          reportScannerIssue("ZX-205", error, {
            stage: "decode-loop",
            source: "ZXing Browser",
            message:
              "La cámara sigue activa, pero el decodificador encontró un error durante la lectura.",
          });
        }
        });
      } catch (error) {
        error.scannerCode = "ZX-204";
        throw error;
      }
      return true;
    }

    if ("BarcodeDetector" in window) {
      const formats = await window.BarcodeDetector.getSupportedFormats?.();
      if (formats && !formats.includes("data_matrix")) {
        const error = new Error(
          "BarcodeDetector no soporta Data Matrix en este navegador.",
        );
        error.scannerCode = "BD-206";
        throw error;
      }

      const detector = new window.BarcodeDetector({
        formats: ["data_matrix"],
      });
      const loop = async () => {
        if (!cameraStreamRef.current) return;
        try {
          const results = await detector.detect(video);
          results.forEach((result) => {
            const b = result.boundingBox;
            scanProcessorRef.current?.(
              result.rawValue,
              b
                ? [
                    { x: b.x, y: b.y },
                    { x: b.x + b.width, y: b.y + b.height },
                  ]
                : [],
            );
          });
        } catch {
          // Un fotograma sin lectura no detiene el escáner.
        }
        nativeFrameRef.current = requestAnimationFrame(loop);
      };
      loop();
      return true;
    }

    const error = new Error(
      "ZXing cargó sin un lector Data Matrix compatible y no hay BarcodeDetector utilizable.",
    );
    error.scannerCode = "ZX-202";
    throw error;
  };

  const startCamera = async () => {
    if (cameraState === "starting") return;
    stopCamera();
    clearScannerIssue();
    setCameraState("starting");
    setScanMessage("Solicitando cámara…");

    let stream = null;
    try {
      if (!window.isSecureContext) {
        const error = new Error("La cámara requiere una conexión HTTPS segura.");
        error.scannerCode = "CAM-001";
        throw error;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        const error = new Error(
          "Este navegador no ofrece acceso compatible a la cámara.",
        );
        error.scannerCode = "CAM-002";
        throw error;
      }

      // Pedimos la cámara antes de cargar cualquier otra cosa para conservar el
      // gesto del usuario en Safari/iOS.
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: "environment" },
        });
      } catch (firstError) {
        const name = String(firstError?.name || "");
        if (
          !["OverconstrainedError", "NotFoundError", "DevicesNotFoundError"].includes(
            name,
          )
        )
          throw firstError;

        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: true,
        });
      }

      cameraStreamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        const error = new Error("No se encontró la vista de cámara.");
        error.scannerCode = "VID-101";
        throw error;
      }

      setScanMessage("Iniciando vista de cámara…");
      await attachStreamToVideo(video, stream);

      // Desde este punto la cámara ya está funcionando. Un fallo del lector no
      // debe volver a apagarla, especialmente en Safari.
      setCameraState("ready");
      setScanMessage("Cámara lista. Preparando lector…");

      try {
        const decoderReady = await startLiveDecoder(video);
        if (decoderReady) {
          clearScannerIssue();
          setScanMessage("Cámara lista. Acerca el Data Matrix al recuadro.");
        } else {
          reportScannerIssue("ZX-202", null, {
            stage: "decoder-capability",
            source: "ZXing / BarcodeDetector",
            message:
              "La cámara está activa, pero no se encontró un lector Data Matrix compatible.",
          });
          setScanMessage("Cámara activa · lector no disponible.");
        }
      } catch (decoderError) {
        reportScannerIssue(
          decoderError?.scannerCode || "ZX-204",
          decoderError,
          {
            stage:
              decoderError?.scannerCode === "ZX-201"
                ? "load-library"
                : decoderError?.scannerCode === "ZX-203"
                  ? "create-reader"
                  : decoderError?.scannerCode === "BD-206"
                    ? "barcode-detector"
                    : "start-reader",
            source: "ZXing Browser",
            message:
              "La cámara está activa, pero el lector Data Matrix no pudo iniciar.",
          },
        );
        setScanMessage("Cámara activa · lector no disponible.");
      }
    } catch (error) {
      stream?.getTracks?.().forEach((track) => {
        try {
          track.stop();
        } catch {
          // Sin acción.
        }
      });
      if (cameraStreamRef.current === stream) cameraStreamRef.current = null;
      const video = videoRef.current;
      if (video?.srcObject === stream) video.srcObject = null;
      const code =
        error?.scannerCode ||
        (String(error?.scannerCode || "").startsWith("VID-")
          ? error.scannerCode
          : scannerCodeForCameraError(error));
      reportScannerIssue(code, error, {
        stage: code.startsWith("VID-") ? "video-preview" : "open-camera",
        source: "getUserMedia / HTMLVideoElement",
        message:
          code.startsWith("VID-")
            ? "La cámara entregó un stream, pero la vista de video no pudo iniciar."
            : cameraErrorUserMessage(error),
      });
      setCameraState("error");
      setScanMessage("La cámara necesita atención.");
    }
  };

  useEffect(() => {
    if (view !== "scanner") {
      stopCamera();
      setCameraState("idle");
      return;
    }

    pendingIds.current = new Set();
    setScanQueue([]);
    clearScannerIssue();
    setScanMessage("Toca Activar cámara para comenzar.");
    setCameraState("idle");

    return () => {
      stopCamera();
      clearTimeout(scanBoxTimer.current);
    };
  }, [view]);

  useEffect(() => {
    if (view !== "scanner") return;

    const suspendForIos = () => {
      if (!document.hidden && document.visibilityState !== "hidden") return;
      stopCamera();
      setCameraState("idle");
      clearScannerIssue();
      setScanMessage("Cámara pausada. Toca Activar cámara para continuar.");
    };

    document.addEventListener("visibilitychange", suspendForIos);
    window.addEventListener("pagehide", suspendForIos);
    return () => {
      document.removeEventListener("visibilitychange", suspendForIos);
      window.removeEventListener("pagehide", suspendForIos);
    };
  }, [view]);


  const startSetup = () => {
    setContextForm(createRegistryContext(state.context));
    setSetupStep(0);
    setView("setup");
  };

  const saveContext = () => {
    const context = createRegistryContext(contextForm);
    if (!contextIsComplete(context)) {
      showNotice("warning", "Falta seleccionar el plantel");
      return false;
    }
    commit({ ...state, context });
    setContextForm(context);
    clearNotice();
    return true;
  };

  const importPortable = async (file) => {
    if (!file) return;
    try {
      const imported = parsePortableDeliveryFile(await file.text());
      const saved = writeDeliveryState(imported);
      setState(saved);
      setContextForm(saved.context);
      setActiveWeekId(saved.weeks.at(-1)?.id || "");
      clearNotice();
      notify(
        "success",
        "Registro cargado",
        saved.students.length +
          " alumnos · " +
          saved.weeks.length +
          " semanas",
      );
      setView(
        saved.weeks.length || saved.students.length || contextIsComplete(saved.context)
          ? "home"
          : "welcome",
      );
    } catch (error) {
      showNotice(
        "error",
        "No se pudo abrir el registro",
        error?.message || "Revisa que sea un archivo compatible.",
      );
    }
  };

  const importSpreadsheet = async (file) => {
    if (!file) return;
    try {
      if (!window.XLSX) throw new Error("No se pudo cargar el lector de Excel.");
      const workbook = window.XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = window.XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const incoming = spreadsheetRowsToStudents(rows);
      if (!incoming.length)
        throw new Error("No se encontraron nombres de alumnos en la primera hoja.");
      const merged = mergeStudents(state.students, incoming);
      commit({ ...state, students: merged.students });
      clearNotice();
      notify(
        "success",
        "Alumnos importados",
        merged.added +
          " nuevos · " +
          merged.updated +
          " actualizados",
      );
    } catch (error) {
      showNotice(
        "error",
        "No se pudo importar la lista",
        error?.message || "Revisa el archivo e inténtalo otra vez.",
      );
    }
  };

  const addStudent = (event) => {
    event.preventDefault();
    const nextStudent = {
      name: String(studentForm.name || "").replace(/\s+/g, " ").trim(),
      specialty: String(studentForm.specialty || "").trim(),
      company: String(studentForm.company || "").trim(),
    };
    if (!nextStudent.name || !nextStudent.specialty || !nextStudent.company) {
      showNotice(
        "warning",
        "Faltan datos del alumno",
        "Completa nombre, especialidad y empresa.",
      );
      return;
    }

    if (editingStudentId) {
      const duplicate = state.students.some(
        (student) =>
          student.id !== editingStudentId &&
          student.name.localeCompare(nextStudent.name, "es", {
            sensitivity: "base",
          }) === 0,
      );
      if (duplicate) {
        showNotice(
          "warning",
          "Nombre ya registrado",
          "Revisa si se trata del mismo alumno antes de continuar.",
        );
        return;
      }
      commit({
        ...state,
        students: state.students.map((student) =>
          student.id === editingStudentId
            ? { ...student, ...nextStudent }
            : student,
        ),
      });
      setEditingStudentId("");
      setStudentForm({ name: "", specialty: "", company: "" });
      clearNotice();
      notify("success", "Alumno actualizado", nextStudent.name);
      return;
    }

    const merged = mergeStudents(state.students, [nextStudent]);
    commit({ ...state, students: merged.students });
    setStudentForm({ name: "", specialty: "", company: "" });
    clearNotice();
    if (merged.added)
      notify("success", "Alumno agregado", nextStudent.name);
    else
      showNotice(
        "info",
        "El alumno ya existe",
        "No se agregó un registro duplicado.",
      );
  };

  const editStudent = (student) => {
    setEditingStudentId(student.id);
    setStudentForm({
      name: student.name || "",
      specialty: student.specialty || "",
      company: student.company || "",
    });
    clearNotice();
  };

  const deleteStudent = (studentId) => {
    const studentName =
      state.students.find((student) => student.id === studentId)?.name ||
      "Alumno";
    const next = {
      ...state,
      students: state.students.filter((student) => student.id !== studentId),
      weeks: state.weeks.map((week) => {
        const deliveries = { ...week.deliveries };
        delete deliveries[studentId];
        return { ...week, deliveries };
      }),
    };
    commit(next);
    clearNotice();
    notify("info", "Alumno eliminado", studentName);
  };

  const addWeek = (event, downloadAfter = false) => {
    event?.preventDefault?.();
    if (!weekForm.startDate) {
      showNotice(
        "warning",
        "Falta el periodo",
        "Selecciona la fecha inicial de la bitácora.",
      );
      return;
    }
    if (!weekForm.dueAt) {
      showNotice(
        "warning",
        "Falta la fecha límite",
        "Define la fecha y hora de entrega.",
      );
      return;
    }
    if (!state.students.length) {
      showNotice(
        "warning",
        "No hay alumnos",
        "Agrega al menos un alumno antes de crear la semana.",
      );
      return;
    }
    const week = createWeek({
      label: weekForm.label || "Semana " + (state.weeks.length + 1),
      startDate: weekForm.startDate,
      dueAt: new Date(weekForm.dueAt).toISOString(),
    });
    if (
      state.weeks.some(
        (item) =>
          item.startDate === week.startDate && item.endDate === week.endDate,
      )
    ) {
      showNotice(
        "warning",
        "Ese periodo ya existe",
        formatPeriod(week.startDate, week.endDate),
      );
      return;
    }
    const saved = commit({ ...state, weeks: [...state.weeks, week] });
    setActiveWeekId(week.id);
    setWeekForm({ label: "", startDate: "", dueAt: "" });
    clearNotice();
    if (downloadAfter) exportDeliveryState(saved);
    notify(
      "success",
      "Semana creada",
      week.label + (downloadAfter ? " · Archivo guardado" : ""),
    );
    setView("week");
  };

  const registerManual = (studentId) => {
    if (!activeWeek || activeWeek.closedAt) return;
    const student = state.students.find((item) => item.id === studentId);
    const weeks = state.weeks.map((week) =>
      week.id === activeWeek.id
        ? registerDelivery(week, studentId, new Date().toISOString(), "manual")
        : week,
    );
    commit({ ...state, weeks });
    notify("success", "Entrega registrada", student?.name || "");
  };

  const undoDelivery = (studentId) => {
    if (!activeWeek || activeWeek.closedAt) return;
    const student = state.students.find((item) => item.id === studentId);
    commit({
      ...state,
      weeks: state.weeks.map((week) =>
        week.id === activeWeek.id ? removeDelivery(week, studentId) : week,
      ),
    });
    notify("info", "Registro retirado", student?.name || "");
  };

  const toggleWeekClosed = () => {
    if (!activeWeek) return;
    const reopening = Boolean(activeWeek.closedAt);
    const closedAt = reopening ? "" : new Date().toISOString();
    commit({
      ...state,
      weeks: state.weeks.map((week) =>
        week.id === activeWeek.id ? { ...week, closedAt } : week,
      ),
    });
    notify(
      "info",
      reopening ? "Semana reabierta" : "Semana cerrada",
      activeWeek.label,
    );
  };

  const finishScan = () => {
    stopCamera();
    let weeks = state.weeks;
    if (scanQueue.length) {
      const grouped = new Map();
      for (const item of scanQueue) {
        const items = grouped.get(item.weekId) || [];
        items.push(item);
        grouped.set(item.weekId, items);
      }
      weeks = state.weeks.map((week) => {
        let updatedWeek = week;
        for (const item of grouped.get(week.id) || [])
          updatedWeek = registerDelivery(
            updatedWeek,
            item.studentId,
            item.at,
            "camera",
          );
        return updatedWeek;
      });
    }

    const saved = commit({ ...state, weeks });
    if (scanQueue.length) exportDeliveryState(saved);

    const lastWeekId = scanQueue.at(-1)?.weekId || activeWeekId;
    if (lastWeekId) setActiveWeekId(lastWeekId);

    const lateCount = scanQueue.filter(
      (item) => item.status === "entregado_tarde",
    ).length;
    notify(
      scanQueue.length ? "success" : "info",
      scanQueue.length ? "Registro terminado" : "Sin nuevas lecturas",
      scanQueue.length
        ? scanQueue.length +
            " entregas registradas" +
            (lateCount ? " · " + lateCount + " a destiempo" : "") +
            " · Archivo guardado"
        : "No se registraron entregas en esta sesión.",
    );
    setView(lastWeekId ? "week" : "home");
  };

  const scanImageFile = async (file) => {
    if (!file) return;
    try {
      clearScannerIssue();
      let ZX = window.ZXingBrowser;
      if (!ZX) {
        try {
          ZX = await ensureZxingBrowser();
        } catch {
          ZX = null;
        }
      }
      if (ZX?.BrowserDatamatrixCodeReader || ZX?.BrowserMultiFormatReader) {
        const Reader =
          ZX.BrowserDatamatrixCodeReader || ZX.BrowserMultiFormatReader;
        const reader = ZX.BrowserDatamatrixCodeReader
          ? new Reader()
          : new Reader();
        if (
          !ZX.BrowserDatamatrixCodeReader &&
          ZX.BarcodeFormat?.DATA_MATRIX !== undefined
        )
          reader.possibleFormats = [ZX.BarcodeFormat.DATA_MATRIX];

        const url = URL.createObjectURL(file);
        try {
          const result = await reader.decodeFromImageUrl(url);
          scanProcessorRef.current?.(
            result.getText?.() || result.text || "",
            result.getResultPoints?.() || [],
          );
          return;
        } finally {
          URL.revokeObjectURL(url);
        }
      }

      if ("BarcodeDetector" in window) {
        const formats = await window.BarcodeDetector.getSupportedFormats?.();
        if (formats && !formats.includes("data_matrix"))
          throw new Error("Este navegador no admite Data Matrix en imágenes.");
        const bitmap = await createImageBitmap(file);
        try {
          const detector = new window.BarcodeDetector({
            formats: ["data_matrix"],
          });
          const results = await detector.detect(bitmap);
          if (!results.length) throw new Error("No se encontró un Data Matrix.");
          scanProcessorRef.current?.(results[0].rawValue, []);
          return;
        } finally {
          bitmap.close?.();
        }
      }

      throw new Error("No hay un lector Data Matrix disponible.");
    } catch (error) {
      reportScannerIssue(error?.scannerCode || "IMG-301", error, {
        stage: "decode-image",
        source: "Archivo / ZXing",
        message: "No se pudo leer el Data Matrix de la imagen seleccionada.",
      });
    }
  };

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es-MX");
    let list = state.students.filter((student) =>
      [student.name, student.specialty, student.company]
        .join(" ")
        .toLocaleLowerCase("es-MX")
        .includes(term),
    );
    if (activeWeek && statusFilter !== "all")
      list = list.filter(
        (student) => deliveryStatus(activeWeek, student.id) === statusFilter,
      );
    if (activeWeek) {
      const order = { no_entregado: 0, entregado_tarde: 1, entregado: 2 };
      list = [...list].sort((a, b) => {
        const difference =
          order[deliveryStatus(activeWeek, a.id)] -
          order[deliveryStatus(activeWeek, b.id)];
        return difference || a.name.localeCompare(b.name, "es");
      });
    }
    return list;
  }, [state.students, search, activeWeek, statusFilter]);

  const renderStatus = (week, student) => {
    const status = deliveryStatus(week, student.id);
    const meta = statusMeta[status];
    const Icon = meta.icon;
    const delivery = week?.deliveries?.[student.id];
    return (
      <div className="delivery-student-card" key={student.id}>
        <div className="delivery-avatar">
          <Blobatar name={student.name || "Alumno"} size={52} />
        </div>
        <div className="delivery-student-main">
          <strong>{student.name}</strong>
          <span>
            {[student.specialty, shortCompany(student.company)]
              .filter(Boolean)
              .join(" · ") || "Sin datos"}
          </span>
          <div className={`delivery-status delivery-status-${status}`}>
            <Icon size={17} weight="fill" />
            {meta.label}
          </div>
        </div>
        <div className="delivery-student-time">
          <span>Registro</span>
          <strong>{formatDateTime(delivery?.registeredAt)}</strong>
          {delivery?.source && (
            <small>{delivery.source === "camera" ? "Cámara" : "Manual"}</small>
          )}
        </div>
        <div className="delivery-row-actions">
          {status === "no_entregado" ? (
            <button
              className="btn"
              type="button"
              disabled={Boolean(week.closedAt)}
              onClick={() => registerManual(student.id)}
            >
              Registrar
            </button>
          ) : (
            <button
              className="btn"
              type="button"
              disabled={Boolean(week.closedAt)}
              onClick={() => undoDelivery(student.id)}
            >
              Corregir
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={"delivery-app" + (view === "scanner" ? " scanner-active" : "")}>
      <ScanSound tone={scanTone} />
      <header className="delivery-topbar">
        <button className="delivery-brand" type="button" onClick={onClose}>
          <img
            src={
              location.pathname.includes("/registro-entrega/")
                ? "../Assets/Edu.png"
                : "Assets/Edu.png"
            }
            alt="Educación Dual"
          />
        </button>
        <div className="delivery-top-actions">
          <button
            className="btn"
            type="button"
            aria-label="Abrir tutorial"
            onClick={() => {
              setTutorialStep(0);
              setTutorialOpen(true);
            }}
          >
            <Info size={18} />
            <span className="delivery-action-label">Tutorial</span>
          </button>
          <label
            className="btn delivery-file-button"
            aria-label="Abrir archivo de registro"
            title="Abrir archivo"
          >
            <UploadSimple size={18} />
            <span className="delivery-action-label">Abrir archivo</span>
            <input
              hidden
              type="file"
              accept=".json,application/json"
              onChange={(event) => {
                importPortable(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
          {started && (
            <button
              className="btn primary"
              type="button"
              aria-label="Guardar archivo de registro"
              title="Guardar archivo"
              onClick={() => {
                exportDeliveryState(state);
                notify(
                  "success",
                  "Archivo guardado",
                  "Registro de entrega actualizado.",
                );
              }}
            >
              <DownloadSimple size={18} />
              <span className="delivery-action-label">Guardar archivo</span>
            </button>
          )}
        </div>
      </header>

      <main className="delivery-shell">
        {view === "welcome" && (
          <section className="delivery-welcome">
            <div className="delivery-welcome-copy">
              <h1>Registro de entrega</h1>
              <p>Control semanal de bitácoras.</p>
            </div>
            <div className="delivery-welcome-cards">
              <button
                className="delivery-entry-card"
                type="button"
                onClick={() => {
                  setTutorialStep(0);
                  setTutorialOpen(true);
                }}
              >
                <div className="delivery-entry-icon">
                  <FileArrowUp size={42} />
                </div>
                <strong>Tutorial</strong>
                <span>Ver cómo funciona</span>
              </button>
              <button
                className="delivery-entry-card primary"
                type="button"
                onClick={startSetup}
              >
                <div className="delivery-entry-icon">
                  <Scan size={42} />
                </div>
                <strong>Ingresar</strong>
                <span>Configurar registro</span>
              </button>
            </div>
          </section>
        )}

        {notice && view !== "scanner" && view !== "welcome" && (
          <div
            className={"delivery-notice " + (notice.kind || "info")}
            role={notice.kind === "error" ? "alert" : "status"}
          >
            <span className="delivery-notice-icon" aria-hidden="true">
              {notice.kind === "error" || notice.kind === "warning" ? (
                <WarningCircle size={20} weight="fill" />
              ) : (
                <Info size={20} weight="fill" />
              )}
            </span>
            <div className="delivery-notice-copy">
              <strong>{notice.title}</strong>
              {notice.description && <span>{notice.description}</span>}
            </div>
            <button type="button" onClick={clearNotice} aria-label="Cerrar aviso">
              Cerrar
            </button>
          </div>
        )}

        {view === "setup" && (
          <section className="delivery-setup">
            <div className="delivery-setup-head">
              <div>
                <span className="delivery-kicker">
                  Configuración · {setupStep + 1} de 3
                </span>
                <h1>
                  {setupStep === 0
                    ? "Escuela"
                    : setupStep === 1
                      ? "Alumnos"
                      : "Semana"}
                </h1>
              </div>
              <div className="delivery-setup-progress">
                <i className="active" />
                <i className={setupStep >= 1 ? "active" : ""} />
                <i className={setupStep >= 2 ? "active" : ""} />
              </div>
            </div>

            {setupStep === 0 && (
              <div className="delivery-setup-card">
                <div className="delivery-form delivery-school-form">
                  <label className="delivery-field">
                    <span>Plantel</span>
                    <select
                      value={contextForm.school}
                      onChange={(event) =>
                        setContextForm(
                          createRegistryContext({ school: event.target.value }),
                        )
                      }
                    >
                      <option value="">Selecciona un plantel</option>
                      {schools.map((school) => (
                        <option key={school.id} value={school.name}>
                          {school.shortName || school.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="delivery-setup-actions">
                  <button
                    className="btn"
                    type="button"
                    onClick={() => setView(started ? "home" : "welcome")}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn primary"
                    type="button"
                    onClick={() => {
                      if (saveContext()) setSetupStep(1);
                    }}
                  >
                    Continuar
                    <ArrowRight size={17} />
                  </button>
                </div>
              </div>
            )}

            {setupStep === 1 && (
              <div className="delivery-setup-card">
                <div className="delivery-context-banner">
                  <strong>{shortSchool(state.context.school)}</strong>
                  <button
                    className="btn"
                    type="button"
                    onClick={() => setSetupStep(0)}
                  >
                    Cambiar
                  </button>
                </div>

                <label className="delivery-action-tile delivery-import-single">
                  <FileXls size={34} />
                  <strong>Importar Excel o CSV</strong>
                  <input
                    hidden
                    type="file"
                    accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    onChange={(event) => {
                      importSpreadsheet(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </label>

                <form
                  className="delivery-form delivery-student-form"
                  onSubmit={addStudent}
                >
                  <label className="delivery-field">
                    <span>Nombre</span>
                    <input
                      value={studentForm.name}
                      onChange={(event) =>
                        setStudentForm({
                          ...studentForm,
                          name: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="delivery-field">
                    <span>Especialidad</span>
                    <select
                      value={studentForm.specialty}
                      onChange={(event) =>
                        setStudentForm({
                          ...studentForm,
                          specialty: event.target.value,
                        })
                      }
                    >
                      <option value="">Selecciona</option>
                      {(registrySchool.specialties || []).map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                  </label>
                  <label className="delivery-field">
                    <span>Empresa</span>
                    <select
                      value={studentForm.company}
                      onChange={(event) =>
                        setStudentForm({
                          ...studentForm,
                          company: event.target.value,
                        })
                      }
                    >
                      <option value="">Selecciona</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.name}>
                          {company.shortName || company.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="btn primary delivery-form-submit" type="submit">
                    {editingStudentId ? (
                      <PencilSimple size={17} />
                    ) : (
                      <Plus size={17} />
                    )}
                    {editingStudentId ? "Actualizar" : "Agregar"}
                  </button>
                  {editingStudentId && (
                    <button
                      className="btn delivery-form-submit"
                      type="button"
                      onClick={() => {
                        setEditingStudentId("");
                        setStudentForm({
                          name: "",
                          specialty: "",
                          company: "",
                        });
                      }}
                    >
                      Cancelar
                    </button>
                  )}
                </form>

                <div className="delivery-roster-head">
                  <strong>{state.students.length} alumnos</strong>
                </div>
                <div className="delivery-student-list compact">
                  {state.students.map((student) => (
                    <div className="delivery-base-row" key={student.id}>
                      <Blobatar name={student.name} size={44} />
                      <div>
                        <strong>{student.name}</strong>
                        <span>
                          {[student.specialty, shortCompany(student.company)]
                            .filter(Boolean)
                            .join(" · ") || "Sin datos"}
                        </span>
                      </div>
                      <div className="delivery-base-actions">
                        <button
                          className="btn"
                          type="button"
                          aria-label={"Editar " + student.name}
                          onClick={() => editStudent(student)}
                        >
                          <PencilSimple size={18} />
                        </button>
                        <button
                          className="btn delivery-danger"
                          type="button"
                          aria-label={"Eliminar " + student.name}
                          onClick={() => deleteStudent(student.id)}
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="delivery-setup-actions">
                  <button
                    className="btn"
                    type="button"
                    onClick={() => setSetupStep(0)}
                  >
                    Atrás
                  </button>
                  <button
                    className="btn primary"
                    type="button"
                    disabled={!state.students.length}
                    onClick={() => setSetupStep(2)}
                  >
                    Continuar
                    <ArrowRight size={17} />
                  </button>
                </div>
              </div>
            )}

            {setupStep === 2 && (
              <div className="delivery-setup-card">
                <form
                  className="delivery-form delivery-week-form"
                  onSubmit={(event) => addWeek(event, true)}
                >
                  <label className="delivery-field delivery-field-wide">
                    <span>Nombre de la semana</span>
                    <input
                      value={weekForm.label}
                      onChange={(event) =>
                        setWeekForm({ ...weekForm, label: event.target.value })
                      }
                      placeholder={"Semana " + (state.weeks.length + 1)}
                    />
                  </label>
                  <label className="delivery-field">
                    <span>Fecha inicial</span>
                    <input
                      required
                      type="date"
                      value={weekForm.startDate}
                      onChange={(event) =>
                        setWeekForm({
                          ...weekForm,
                          startDate: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="delivery-field">
                    <span>Fecha y hora límite</span>
                    <input
                      required
                      type="datetime-local"
                      value={weekForm.dueAt}
                      onChange={(event) =>
                        setWeekForm({ ...weekForm, dueAt: event.target.value })
                      }
                    />
                  </label>
                  <button
                    className="btn primary delivery-form-submit"
                    type="submit"
                  >
                    Crear y entrar
                  </button>
                </form>
                <div className="delivery-setup-actions">
                  <button
                    className="btn"
                    type="button"
                    onClick={() => setSetupStep(1)}
                  >
                    Atrás
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {view === "home" && (
          <>
            <section className="delivery-hero compact">
              <span className="delivery-kicker">Registro de entrega</span>
              <h1>{shortSchool(state.context.school) || "Tu registro"}</h1>
            </section>

            <section className="delivery-summary-grid">
              <article className="delivery-summary-card">
                <Users size={28} />
                <span>Alumnos</span>
                <strong>{state.students.length}</strong>
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    setContextForm(state.context);
                    setSetupStep(1);
                    setView("setup");
                  }}
                >
                  Administrar base
                </button>
              </article>
              <article className="delivery-summary-card">
                <FileArrowUp size={28} />
                <span>Semanas</span>
                <strong>{state.weeks.length}</strong>
                <button
                  className="btn"
                  type="button"
                  onClick={() => setView("new-week")}
                >
                  Nueva semana
                </button>
              </article>
              <article className="delivery-summary-card">
                <Scan size={28} />
                <span>Escaneo</span>
                <strong className="delivery-summary-text">
                  {state.weeks.at(-1)?.label || "Sin semana"}
                </strong>
                <button
                  className="btn primary"
                  type="button"
                  disabled={!state.weeks.length || !state.students.length}
                  onClick={() => {
                    const week = state.weeks.at(-1);
                    setActiveWeekId(week.id);
                    setView("scanner");
                  }}
                >
                  Escanear entregas
                </button>
              </article>
            </section>

            <section className="delivery-panel">
              <div className="delivery-panel-head">
                <div>
                  <span className="delivery-kicker">Historial</span>
                  <h2>Semanas</h2>
                </div>
                <button
                  className="btn"
                  type="button"
                  onClick={() => setView("new-week")}
                >
                  <Plus size={18} />
                  Nueva semana
                </button>
              </div>
              {state.weeks.length ? (
                <div className="delivery-week-list">
                  {[...state.weeks].reverse().map((week) => {
                    const summary = weekSummary(week, state.students);
                    return (
                      <button
                        className="delivery-week-row"
                        key={week.id}
                        type="button"
                        onClick={() => {
                          setActiveWeekId(week.id);
                          setStatusFilter("all");
                          setView("week");
                        }}
                      >
                        <div>
                          <strong>{week.label}</strong>
                          <span>
                            {formatPeriod(week.startDate, week.endDate)}
                            {" · Límite: " + formatDateTime(week.dueAt)}
                            {week.closedAt ? " · Cerrada" : ""}
                          </span>
                          <div className="delivery-week-progress">
                            <i style={{ width: summary.percent + "%" }} />
                          </div>
                        </div>
                        <b>
                          {summary.registered}/{summary.total}
                        </b>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="delivery-empty-week">
                  <strong>Aún no hay semanas.</strong>
                  <span>Crea la primera para comenzar a registrar.</span>
                </div>
              )}
            </section>


          </>
        )}

        {view === "new-week" && (
          <section className="delivery-panel delivery-narrow-panel">
            <div className="delivery-panel-head">
              <div>
                <span className="delivery-kicker">Nueva semana</span>
                <h2>Configura el periodo de entrega</h2>
              </div>
              <button
                className="btn"
                type="button"
                onClick={() => setView("home")}
              >
                Volver
              </button>
            </div>
            <form
              className="delivery-form delivery-week-form"
              onSubmit={(event) => addWeek(event, false)}
            >
              <label className="delivery-field delivery-field-wide">
                <span>Nombre de la semana</span>
                <input
                  value={weekForm.label}
                  onChange={(event) =>
                    setWeekForm({ ...weekForm, label: event.target.value })
                  }
                  placeholder={"Semana " + (state.weeks.length + 1)}
                />
              </label>
              <label className="delivery-field">
                <span>Fecha inicial</span>
                <input
                  required
                  type="date"
                  value={weekForm.startDate}
                  onChange={(event) =>
                    setWeekForm({ ...weekForm, startDate: event.target.value })
                  }
                />
              </label>
              <label className="delivery-field">
                <span>Fecha y hora límite</span>
                <input
                  required
                  type="datetime-local"
                  value={weekForm.dueAt}
                  onChange={(event) =>
                    setWeekForm({ ...weekForm, dueAt: event.target.value })
                  }
                />
              </label>
              <button
                className="btn primary delivery-form-submit"
                type="submit"
              >
                Crear semana
              </button>
            </form>
          </section>
        )}

        {view === "week" && activeWeek && activeSummary && (
          <>
            <section className="delivery-week-head">
              <button
                className="btn"
                type="button"
                onClick={() => setView("home")}
              >
                <ArrowLeft size={18} />
                Semanas
              </button>
              <div>
                <span className="delivery-kicker">
                  {activeWeek.closedAt ? "Semana cerrada" : "Registro activo"}
                </span>
                <h2>{activeWeek.label}</h2>
                <p>
                  {formatPeriod(activeWeek.startDate, activeWeek.endDate)}
                  {" · Límite: " + formatDateTime(activeWeek.dueAt)}
                </p>
              </div>
              <div className="delivery-week-head-actions">
                <button
                  className="btn"
                  type="button"
                  onClick={() => exportWeekCsv(state, activeWeek.id)}
                >
                  <DownloadSimple size={18} />
                  CSV
                </button>
                <button className="btn" type="button" onClick={toggleWeekClosed}>
                  {activeWeek.closedAt ? "Reabrir" : "Cerrar semana"}
                </button>
                <button
                  className="btn primary"
                  type="button"
                  disabled={!state.students.length}
                  onClick={() => setView("scanner")}
                >
                  <Camera size={18} />
                  Escanear
                </button>
              </div>
            </section>

            <section className="delivery-stat-row">
              {["entregado", "entregado_tarde", "no_entregado"].map(
                (status) => {
                  const meta = statusMeta[status];
                  return (
                    <button
                      type="button"
                      className={
                        statusFilter === status
                          ? "delivery-stat-card active"
                          : "delivery-stat-card"
                      }
                      key={status}
                      onClick={() =>
                        setStatusFilter((current) =>
                          current === status ? "all" : status,
                        )
                      }
                    >
                      <span>{meta.label}</span>
                      <strong>{activeSummary[status]}</strong>
                    </button>
                  );
                },
              )}
            </section>

            <section className="delivery-completion">
              <div>
                <strong>{activeSummary.percent}% registrado</strong>
                <span>
                  {activeSummary.registered} de {activeSummary.total} alumnos
                </span>
              </div>
              <div>
                <i style={{ width: activeSummary.percent + "%" }} />
              </div>
            </section>

            <section className="delivery-panel">
              <div className="delivery-list-toolbar">
                <div>
                  <strong>
                    {statusFilter === "all"
                      ? "Todos los alumnos"
                      : statusMeta[statusFilter].label}
                  </strong>
                  {statusFilter !== "all" && (
                    <button
                      className="delivery-clear-filter"
                      type="button"
                      onClick={() => setStatusFilter("all")}
                    >
                      Mostrar todos
                    </button>
                  )}
                </div>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar alumno"
                />
              </div>
              <div className="delivery-student-list">
                {filteredStudents.length ? (
                  filteredStudents.map((student) =>
                    renderStatus(activeWeek, student),
                  )
                ) : (
                  <div className="delivery-empty-week">
                    No hay alumnos con este filtro.
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {view === "scanner" && state.weeks.length > 0 && (
          <section className="delivery-scanner-page">
            <div className="delivery-scanner-head">
              <div>
                <span className="delivery-kicker">Escaneo continuo</span>
                <h2>Clasificación automática por semana</h2>
                <p>
                  Escanea en cualquier orden. En iPhone o iPad, toca Activar cámara
                  una vez y después pasa las bitácoras frente al lector.
                </p>
              </div>
              <div className="delivery-scan-counter">
                <strong>{scanQueue.length}</strong>
                <span>
                  {cameraState === "ready"
                    ? "cámara activa"
                    : cameraState === "starting"
                      ? "abriendo cámara"
                      : "detectados"}
                </span>
              </div>
            </div>

            <div className={"delivery-camera-shell camera-" + cameraState}>
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                aria-label="Vista de la cámara para escanear Data Matrix"
              />
              {cameraState !== "ready" && (
                <div className="delivery-camera-permission">
                  <div className="delivery-camera-permission-icon">
                    <Camera size={30} weight="fill" />
                  </div>
                  <strong>
                    {cameraState === "starting"
                      ? "Abriendo cámara…"
                      : cameraState === "error"
                        ? "Cámara detenida"
                        : "Usar cámara trasera"}
                  </strong>
                  <span>
                    Safari debe mostrar la vista de cámara inmediatamente después del permiso.
                  </span>
                  <button
                    className="btn primary"
                    type="button"
                    disabled={cameraState === "starting"}
                    onClick={startCamera}
                  >
                    <Camera size={18} />
                    {cameraState === "error" ? "Reintentar" : "Activar cámara"}
                  </button>
                </div>
              )}
              <div className="delivery-industrial-frame" aria-hidden="true">
                <i className="corner tl" />
                <i className="corner tr" />
                <i className="corner bl" />
                <i className="corner br" />
                <i className="scan-line" />
              </div>
              {scanBox && (
                <div
                  className={
                    "delivery-detection-box " + (scanBox.tone || "ok")
                  }
                  style={{
                    left: scanBox.left + "%",
                    top: scanBox.top + "%",
                    width: scanBox.width + "%",
                    height: scanBox.height + "%",
                  }}
                >
                  <span>
                    {scanBox.tone === "ok"
                      ? "OK"
                      : scanBox.tone === "seen"
                        ? "REPETIDO"
                        : "NO COINCIDE"}
                  </span>
                </div>
              )}
              <div className={"delivery-camera-hud " + (scanTone || "")}>
                {scannerError && (
                  <span className="delivery-camera-error-code">
                    <Bug size={14} />
                    {scannerError.code}
                  </span>
                )}
                <span className="delivery-camera-live">
                  {scanTone === "ok" ? (
                    <CheckCircle size={15} weight="fill" />
                  ) : scanTone === "error" ? (
                    <WarningCircle size={15} weight="fill" />
                  ) : scanTone === "seen" ? (
                    <Info size={15} weight="fill" />
                  ) : (
                    <Scan size={15} />
                  )}
                  {scanTone === "ok"
                    ? "REGISTRADO"
                    : scanTone === "error"
                      ? "NO COINCIDE"
                      : scanTone === "seen"
                        ? "REPETIDO"
                        : "LECTOR ACTIVO"}
                </span>
                <strong>{scanMessage}</strong>
              </div>
            </div>

            {scannerError && (
              <div className="delivery-scanner-error" role="alert">
                <WarningCircle size={22} weight="fill" aria-hidden="true" />
                <div>
                  <div className="delivery-error-heading">
                    <strong>{scannerError.title}</strong>
                    <code>{scannerError.code}</code>
                  </div>
                  <p>{scannerError.message}</p>
                  {scannerError.technical && (
                    <span className="delivery-error-technical">
                      {scannerError.errorName
                        ? scannerError.errorName + ": "
                        : ""}
                      {scannerError.technical}
                    </span>
                  )}
                  <span>
                    Etapa: {scannerError.stage || "sin identificar"} · Área:{" "}
                    {scannerError.area}
                  </span>
                  <div className="delivery-scanner-error-actions">
                    <button className="btn" type="button" onClick={startCamera}>
                      Reintentar
                    </button>
                    <button
                      className="btn"
                      type="button"
                      onClick={copyScannerDiagnostic}
                    >
                      <CopySimple size={16} />
                      Copiar diagnóstico
                    </button>
                    <label className="btn delivery-file-button">
                      Leer imagen
                      <input
                        hidden
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(event) => {
                          scanImageFile(event.target.files?.[0]);
                          event.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="delivery-scan-results">
              {scanQueue
                .slice(-6)
                .reverse()
                .map((item) => (
                  <div key={item.weekId + ":" + item.studentId}>
                    <Blobatar name={item.name} size={38} />
                    <span>
                      {item.name}
                      <small>
                        {item.weekLabel} · {formatPeriod(item.startDate, item.endDate)}
                      </small>
                    </span>
                    <strong>
                      {item.status === "entregado_tarde"
                        ? "A destiempo"
                        : new Date(item.at).toLocaleTimeString("es-MX", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                    </strong>
                  </div>
                ))}
            </div>

            <div className="delivery-scanner-actions">
              <button
                className="btn"
                type="button"
                onClick={() => {
                  stopCamera();
                  setView(activeWeek ? "week" : "home");
                }}
              >
                Cancelar
              </button>
              <label className="btn delivery-file-button">
                <FileArrowUp size={18} />
                Leer imagen
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(event) => {
                    scanImageFile(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
              </label>
              <button
                className="btn primary"
                type="button"
                onClick={finishScan}
              >
                Terminar registro
              </button>
            </div>
          </section>
        )}
      </main>

      {tutorialOpen && (
        <div
          className="delivery-tutorial-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Tutorial del registro de entrega"
        >
          <section className="delivery-tutorial-stage">
            <article className="delivery-tutorial-card">
              <div className="delivery-tutorial-top">
                <span>
                  Tutorial · {tutorialStep + 1} de {tutorialSteps.length}
                </span>
                <div className="delivery-tutorial-dots">
                  {tutorialSteps.map((_, index) => (
                    <i
                      key={index}
                      className={index <= tutorialStep ? "active" : ""}
                    />
                  ))}
                </div>
              </div>

              <div
                className={
                  "delivery-tutorial-demo " +
                  tutorialSteps[tutorialStep].visual
                }
              >
                {tutorialSteps[tutorialStep].visual === "school" && (
                  <>
                    <Users size={38} />
                    <div><strong>Plantel</strong></div>
                  </>
                )}
                {tutorialSteps[tutorialStep].visual === "students" && (
                  <>
                    <Users size={38} />
                    <div>
                      <strong>Nombre</strong>
                      <span>Especialidad · Empresa</span>
                    </div>
                  </>
                )}
                {tutorialSteps[tutorialStep].visual === "week" && (
                  <>
                    <Clock size={38} />
                    <div>
                      <strong>Semana</strong>
                      <span>Fecha y hora límite</span>
                    </div>
                  </>
                )}
                {tutorialSteps[tutorialStep].visual === "scan" && (
                  <>
                    <Scan size={42} />
                    <div className="delivery-tutorial-scanbox">DATA MATRIX</div>
                    <strong>LECTURA OK</strong>
                  </>
                )}
              </div>

              <h2>{tutorialSteps[tutorialStep].title}</h2>
              <p>{tutorialSteps[tutorialStep].text}</p>

              <div className="delivery-tutorial-actions">
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    if (tutorialStep === 0) setTutorialOpen(false);
                    else setTutorialStep((step) => step - 1);
                  }}
                >
                  <ArrowLeft size={17} />
                  {tutorialStep === 0 ? "Cerrar" : "Atrás"}
                </button>
                <button
                  className="btn primary"
                  type="button"
                  onClick={() => {
                    if (tutorialStep < tutorialSteps.length - 1) {
                      setTutorialStep((step) => step + 1);
                      return;
                    }
                    commit({
                      ...state,
                      settings: { ...state.settings, tutorialDone: true },
                    });
                    setTutorialOpen(false);
                    if (!started) startSetup();
                  }}
                >
                  {tutorialStep === tutorialSteps.length - 1
                    ? started
                      ? "Cerrar"
                      : "Ingresar"
                    : "Siguiente"}
                  <ArrowRight size={17} />
                </button>
              </div>
            </article>
          </section>
        </div>
      )}
    </div>
  );
}
