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
  FilePdf,
  FileXls,
  Plus,
  PencilSimple,
  Scan,
  Trash,
  UploadSimple,
  Users,
  Info,
  MinusCircle,
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
  findStudentSuggestionsByMatrixValue,
  findWeekByMatrixValue,
  markStudentDesisted,
  matrixPeriodLabel,
  mergeStudents,
  parseMatrixPayload,
  parsePortableDeliveryFile,
  readDeliveryState,
  reactivateStudent,
  registerDelivery,
  removeDelivery,
  setDeliveryStatus,
  statusFromTimestamp,
  studentAppliesToWeek,
  studentIsActive,
  updateWeekDueAt,
  weekSummary,
  writeDeliveryState,
} from "../services/delivery-registry.js";
import { VERSION } from "../domain/records.js";
import { generateDeliveryReportPdf } from "../services/delivery-report.js";
import {
  createScannerIssue,
  formatScannerDiagnostic,
  scannerCodeForCameraError,
  scannerDecoderErrorKind,
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
  entregado: { label: "Entregado a tiempo", icon: CheckCircle },
  entregado_tarde: { label: "Entregado a destiempo", icon: Clock },
  no_entregado: { label: "No entregado", icon: XCircle },
  no_aplica: { label: "No aplica", icon: MinusCircle },
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

function toDateTimeLocalValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(+date)) return "";
  const pad = (number) => String(number).padStart(2, "0");
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes())
  );
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
  const chimeRef = useRef(null);

  useEffect(() => {
    const src = location.pathname.includes("/registro-entrega/")
      ? "../Assets/asset_chime.mp3"
      : "Assets/asset_chime.mp3";
    const audio = new Audio(src);
    audio.preload = "auto";
    audio.volume = 0.9;
    chimeRef.current = audio;
    return () => {
      audio.pause();
      chimeRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!tone) return;

    if (tone === "ok") {
      const audio = chimeRef.current;
      if (!audio) return;
      try {
        audio.currentTime = 0;
        const played = audio.play();
        played?.catch?.(() => {});
      } catch {
        // El registro no depende del audio.
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "square";
      oscillator.frequency.value = tone === "seen" ? 760 : 420;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.16);
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
  const [dueAtEditing, setDueAtEditing] = useState(false);
  const [dueAtValue, setDueAtValue] = useState("");
  const [editingStudentId, setEditingStudentId] = useState("");
  const [studentActionId, setStudentActionId] = useState("");
  const [notice, setNotice] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [groupBy, setGroupBy] = useState("none");
  const [reportOpen, setReportOpen] = useState(false);
  const [reportMode, setReportMode] = useState("simple");
  const [reportWeekId, setReportWeekId] = useState(
    initialState.weeks.at(-1)?.id || "",
  );
  const [reportBusy, setReportBusy] = useState(false);
  const [scanQueue, setScanQueue] = useState([]);
  const [fuzzyPrompt, setFuzzyPrompt] = useState(null);
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
  const fuzzyPromptRef = useRef(null);
  const fuzzyStudentAliases = useRef(new Map());
  const rejectedFuzzyScans = useRef(new Map());

  const activeWeek = useMemo(
    () => state.weeks.find((week) => week.id === activeWeekId) || null,
    [state.weeks, activeWeekId],
  );
  const activeStudents = useMemo(
    () => state.students.filter(studentIsActive),
    [state.students],
  );
  const desistedStudents = useMemo(
    () => state.students.filter((student) => !studentIsActive(student)),
    [state.students],
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
  const fuzzySuggestion =
    fuzzyPrompt?.suggestions?.[fuzzyPrompt.index] || null;
  const fuzzyCandidate = fuzzySuggestion?.student || null;

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
    setDueAtEditing(false);
    setDueAtValue("");
  }, [activeWeekId]);

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

  const completeScanForStudent = (
    student,
    rawValue,
    payload,
    rawKey,
    points,
  ) => {
    if (!student || !studentIsActive(student)) return;

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
    if (rawKey) fuzzyStudentAliases.current.set(rawKey, student.id);
    setScanMessage(
      student.name +
        " → " +
        targetWeek.label +
        (status === "entregado_tarde" ? " · A destiempo" : ""),
    );

    const box = resultBoxFromPoints(videoRef.current, points);
    showDetection("ok", box);
  };

  const closeFuzzyPrompt = () => {
    fuzzyPromptRef.current = null;
    setFuzzyPrompt(null);
  };

  const confirmFuzzyStudent = () => {
    const prompt = fuzzyPromptRef.current || fuzzyPrompt;
    const suggestion = prompt?.suggestions?.[prompt.index];
    const candidate = suggestion?.student;
    if (!prompt || !candidate) {
      closeFuzzyPrompt();
      return;
    }

    closeFuzzyPrompt();
    completeScanForStudent(
      candidate,
      prompt.rawValue,
      prompt.payload,
      prompt.rawKey,
      prompt.points,
    );
  };

  const rejectFuzzyStudent = () => {
    const prompt = fuzzyPromptRef.current || fuzzyPrompt;
    if (!prompt) return;
    const nextIndex = prompt.index + 1;

    if (nextIndex < prompt.suggestions.length) {
      const nextPrompt = { ...prompt, index: nextIndex };
      fuzzyPromptRef.current = nextPrompt;
      setFuzzyPrompt(nextPrompt);
      setScanMessage("Revisa la siguiente coincidencia posible.");
      return;
    }

    if (prompt.rawKey)
      rejectedFuzzyScans.current.set(prompt.rawKey, Date.now() + 4000);
    closeFuzzyPrompt();
    setScanMessage(
      "Código leído, pero no se confirmó ninguna coincidencia sugerida.",
    );
    showDetection("error");
  };

  const processScanValue = (rawValue, points) => {
    if (tutorialOpenRef.current || fuzzyPromptRef.current) return;
    const payload = parseMatrixPayload(rawValue);
    const rawKey = String(rawValue || "").trim();
    let student = findStudentByMatrixValue(state.students, rawValue);

    if (student && !studentIsActive(student)) {
      setScanMessage(
        student.name +
          " está marcado como Desistido de Dual y no admite nuevas entregas.",
      );
      showDetection("error");
      return;
    }

    if (!student && rawKey) {
      const rememberedId = fuzzyStudentAliases.current.get(rawKey);
      if (rememberedId)
        student =
          state.students.find(
            (item) => item.id === rememberedId && studentIsActive(item),
          ) || null;
    }

    if (!student) {
      const rejectedUntil = rejectedFuzzyScans.current.get(rawKey) || 0;
      if (rawKey && rejectedUntil > Date.now()) return;

      const suggestions = findStudentSuggestionsByMatrixValue(
        activeStudents,
        rawValue,
        3,
      );

      if (suggestions.length) {
        const prompt = {
          rawValue,
          payload,
          rawKey,
          points: Array.isArray(points) ? points : [],
          suggestions,
          index: 0,
        };
        fuzzyPromptRef.current = prompt;
        setFuzzyPrompt(prompt);
        setScanMessage("Coincidencia aproximada encontrada. Confirma la persona.");
        showDetection(
          "seen",
          resultBoxFromPoints(videoRef.current, points),
        );
        return;
      }
    }

    if (!student) {
      setScanMessage("Código leído, pero el alumno no coincide con la base.");
      showDetection("error");
      return;
    }

    completeScanForStudent(student, rawValue, payload, rawKey, points);
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
        let stopped = false;
        let timer = 0;
        let consecutiveFatal = 0;
        let consecutiveFrame = 0;

        const schedule = (delay) => {
          if (stopped) return;
          clearTimeout(timer);
          timer = window.setTimeout(loop, delay);
        };

        const loop = () => {
          if (
            stopped ||
            !cameraStreamRef.current ||
            video.srcObject !== cameraStreamRef.current
          )
            return;

          if (
            video.readyState < 2 ||
            video.videoWidth < 2 ||
            video.videoHeight < 2
          ) {
            schedule(120);
            return;
          }

          try {
            const result = reader.decode(video);
            consecutiveFatal = 0;
            consecutiveFrame = 0;
            if (result) {
              clearScannerIssue();
              scanProcessorRef.current?.(
                result.getText?.() || result.text || "",
                result.getResultPoints?.() || [],
              );
            }
            schedule(220);
          } catch (error) {
            const kind = scannerDecoderErrorKind(error);

            // No encontrar un código, checksum incompleto o formato parcial es
            // el estado normal entre fotogramas y nunca debe mostrarse como fallo.
            if (kind === "miss") {
              consecutiveFatal = 0;
              consecutiveFrame = 0;
              schedule(90);
              return;
            }

            // Safari puede fallar de forma transitoria al copiar un fotograma
            // del video al canvas. Damos margen amplio antes de informar.
            if (kind === "frame") {
              consecutiveFrame += 1;
              consecutiveFatal = 0;
              if (consecutiveFrame < 24) {
                schedule(110);
                return;
              }
              reportScannerIssue("ZX-207", error, {
                stage: "capture-frame",
                source: "ZXing Browser / Safari canvas",
                message:
                  "La cámara sigue activa, pero Safari no pudo entregar fotogramas al lector de forma estable.",
              });
              consecutiveFrame = 0;
              schedule(350);
              return;
            }

            // Un error genérico aislado no debe matar el lector. Sólo se
            // reporta después de repetirse varias veces consecutivas.
            consecutiveFatal += 1;
            consecutiveFrame = 0;
            if (consecutiveFatal < 3) {
              schedule(140);
              return;
            }

            reportScannerIssue("ZX-205", error, {
              stage: "decode-loop",
              source: "ZXing Browser",
              message:
                "La cámara sigue activa, pero el decodificador repitió un error durante la lectura.",
            });
            consecutiveFatal = 0;
            schedule(400);
          }
        };

        scanControls.current = {
          stop() {
            stopped = true;
            clearTimeout(timer);
          },
        };

        loop();
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
      fuzzyPromptRef.current = null;
      setFuzzyPrompt(null);
      stopCamera();
      setCameraState("idle");
      return;
    }

    pendingIds.current = new Set();
    fuzzyPromptRef.current = null;
    setFuzzyPrompt(null);
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


  const openReport = (weekId = "") => {
    const selectedWeekId =
      weekId || activeWeekId || state.weeks.at(-1)?.id || "";
    setReportWeekId(selectedWeekId);
    setReportMode(weekId ? "simple" : "weekly");
    setReportOpen(true);
  };

  const downloadReport = async () => {
    if (!state.weeks.length) {
      showNotice(
        "warning",
        "No hay semanas para reportar",
        "Crea al menos una semana antes de generar el PDF.",
      );
      setReportOpen(false);
      return;
    }
    if (reportMode === "simple" && !reportWeekId) {
      showNotice(
        "warning",
        "Selecciona una semana",
        "El listado simplificado necesita una semana.",
      );
      return;
    }

    setReportBusy(true);
    try {
      const result = await generateDeliveryReportPdf(state, {
        mode: reportMode,
        weekId: reportWeekId,
      });
      notify(
        "success",
        "Reporte PDF generado",
        result.pages + (result.pages === 1 ? " página" : " páginas"),
      );
      setReportOpen(false);
    } catch (error) {
      showNotice(
        "error",
        "No se pudo generar el reporte",
        error?.message || "Inténtalo nuevamente.",
      );
      setReportOpen(false);
    } finally {
      setReportBusy(false);
    }
  };

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
    setContextForm(state.context);
    setSetupStep(1);
    setView("setup");
    clearNotice();
  };

  const markStudentAsDesisted = (studentId) => {
    const student = state.students.find((item) => item.id === studentId);
    if (!student) return;
    commit({
      ...state,
      students: state.students.map((item) =>
        item.id === studentId ? markStudentDesisted(item) : item,
      ),
    });
    setStudentActionId("");
    if (editingStudentId === studentId) {
      setEditingStudentId("");
      setStudentForm({ name: "", specialty: "", company: "" });
    }
    clearNotice();
    notify(
      "info",
      "Desistido de Dual",
      student.name + " conserva sus entregas anteriores.",
    );
  };

  const reactivateDualStudent = (studentId) => {
    const student = state.students.find((item) => item.id === studentId);
    if (!student) return;
    commit({
      ...state,
      students: state.students.map((item) =>
        item.id === studentId ? reactivateStudent(item) : item,
      ),
    });
    setStudentActionId("");
    clearNotice();
    notify("success", "Alumno reactivado", student.name);
  };

  const deleteStudent = (studentId) => {
    const studentName =
      state.students.find((student) => student.id === studentId)?.name ||
      "Alumno";
    const confirmed = window.confirm(
      "¿Eliminar definitivamente a " +
        studentName +
        "?\n\nEsta acción también eliminará todas sus entregas históricas del Registro de entrega y no se puede deshacer.",
    );
    if (!confirmed) return;
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
    setStudentActionId("");
    if (editingStudentId === studentId) {
      setEditingStudentId("");
      setStudentForm({ name: "", specialty: "", company: "" });
    }
    clearNotice();
    notify("info", "Alumno eliminado definitivamente", studentName);
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
    if (!activeStudents.length) {
      showNotice(
        "warning",
        "No hay alumnos activos",
        "Agrega o reactiva al menos un alumno antes de crear la semana.",
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

  const setManualStatus = (studentId, status) => {
    if (!activeWeek || activeWeek.closedAt) return;
    const student = state.students.find((item) => item.id === studentId);
    commit({
      ...state,
      weeks: state.weeks.map((week) =>
        week.id === activeWeek.id
          ? setDeliveryStatus(
              week,
              studentId,
              status,
              status === "no_entregado" ? "" : new Date().toISOString(),
              "manual",
            )
          : week,
      ),
    });

    const label = statusMeta[status]?.label || "Estado actualizado";
    notify(
      ["no_entregado", "no_aplica"].includes(status) ? "info" : "success",
      label,
      student?.name || "",
    );
  };

  const startDueAtEdit = () => {
    if (!activeWeek) return;
    if (activeWeek.closedAt) {
      showNotice(
        "info",
        "La semana está cerrada",
        "Reabre la semana antes de modificar su fecha límite.",
      );
      return;
    }
    setDueAtValue(toDateTimeLocalValue(activeWeek.dueAt));
    setDueAtEditing(true);
    clearNotice();
  };

  const saveDueAt = (event) => {
    event?.preventDefault?.();
    if (!activeWeek || activeWeek.closedAt) return;
    if (!dueAtValue) {
      showNotice(
        "warning",
        "Falta la fecha límite",
        "Selecciona una fecha y hora antes de guardar.",
      );
      return;
    }

    const parsed = new Date(dueAtValue);
    if (!Number.isFinite(+parsed)) {
      showNotice(
        "warning",
        "Fecha límite inválida",
        "Revisa la fecha y hora seleccionadas.",
      );
      return;
    }

    const nextDueAt = parsed.toISOString();
    const beforeDeliveries = activeWeek.deliveries || {};
    const updatedWeek = updateWeekDueAt(activeWeek, nextDueAt);
    const reclassified = Object.keys(updatedWeek.deliveries || {}).filter(
      (studentId) =>
        beforeDeliveries[studentId]?.status !==
        updatedWeek.deliveries[studentId]?.status,
    ).length;

    commit({
      ...state,
      weeks: state.weeks.map((week) =>
        week.id === activeWeek.id ? updatedWeek : week,
      ),
    });
    setDueAtEditing(false);
    setDueAtValue("");
    clearNotice();
    notify(
      "success",
      "Fecha límite actualizada",
      activeWeek.label +
        (reclassified
          ? " · " + reclassified + " entrega" + (reclassified === 1 ? "" : "s") + " reclasificada" + (reclassified === 1 ? "" : "s")
          : ""),
    );
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

  const specialtyOptions = useMemo(
    () =>
      [...new Set(state.students.map((student) => student.specialty).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, "es")),
    [state.students],
  );

  const companyOptions = useMemo(
    () =>
      [...new Set(state.students.map((student) => student.company).filter(Boolean))]
        .sort((a, b) => shortCompany(a).localeCompare(shortCompany(b), "es")),
    [state.students],
  );

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es-MX");
    let list = state.students
      .filter((student) => !activeWeek || studentAppliesToWeek(student, activeWeek))
      .filter((student) =>
        [student.name, student.specialty, student.company]
          .join(" ")
          .toLocaleLowerCase("es-MX")
          .includes(term),
      );

    if (specialtyFilter !== "all")
      list = list.filter((student) => student.specialty === specialtyFilter);

    if (companyFilter !== "all")
      list = list.filter((student) => student.company === companyFilter);

    if (activeWeek && statusFilter !== "all")
      list = list.filter(
        (student) => deliveryStatus(activeWeek, student.id) === statusFilter,
      );

    if (activeWeek) {
      const order = {
        no_entregado: 0,
        entregado_tarde: 1,
        entregado: 2,
        no_aplica: 3,
      };
      list = [...list].sort((a, b) => {
        const difference =
          order[deliveryStatus(activeWeek, a.id)] -
          order[deliveryStatus(activeWeek, b.id)];
        return difference || a.name.localeCompare(b.name, "es");
      });
    }

    return list;
  }, [
    state.students,
    search,
    activeWeek,
    statusFilter,
    specialtyFilter,
    companyFilter,
  ]);

  const groupedStudents = useMemo(() => {
    if (groupBy === "none")
      return [{ key: "all", label: "", students: filteredStudents }];

    const groups = new Map();
    for (const student of filteredStudents) {
      const raw =
        groupBy === "specialty" ? student.specialty : student.company;
      const key = raw || "";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(student);
    }

    return [...groups.entries()]
      .sort(([a], [b]) => {
        const aLabel =
          groupBy === "company"
            ? shortCompany(a || "Sin empresa")
            : a || "Sin especialidad";
        const bLabel =
          groupBy === "company"
            ? shortCompany(b || "Sin empresa")
            : b || "Sin especialidad";
        return aLabel.localeCompare(bLabel, "es");
      })
      .map(([key, students]) => ({
        key: key || "empty",
        label:
          groupBy === "company"
            ? shortCompany(key) || "Sin empresa"
            : key || "Sin especialidad",
        students,
      }));
  }, [filteredStudents, groupBy]);

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
          {!studentIsActive(student) && (
            <span className="delivery-dual-status">Desistido de Dual</span>
          )}
          <div className={`delivery-status delivery-status-${status}`}>
            <Icon size={17} weight="fill" />
            {meta.label}
          </div>
        </div>
        <div className="delivery-student-time">
          <span>Registro</span>
          <strong>{formatDateTime(delivery?.registeredAt)}</strong>
          {delivery?.source && (
            <small>
              {delivery.source === "camera"
                ? "Cámara"
                : delivery.source === "import"
                  ? "Importado"
                  : "Manual"}
            </small>
          )}
        </div>
        <div className="delivery-row-actions">
          <button
            className="btn"
            type="button"
            aria-label={"Editar " + student.name}
            title="Editar alumno"
            onClick={() => editStudent(student)}
          >
            <PencilSimple size={18} />
          </button>
          <label className="delivery-manual-status">
            <span>Estado manual</span>
            <select
              value={status}
              disabled={Boolean(week.closedAt)}
              onChange={(event) =>
                setManualStatus(student.id, event.target.value)
              }
              aria-label={"Cambiar estado de " + student.name}
            >
              <option value="entregado">Entregado a tiempo</option>
              <option value="entregado_tarde">Entregado a destiempo</option>
              <option value="no_entregado">No entregado</option>
              <option value="no_aplica">No aplica</option>
            </select>
          </label>
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
                ? "../Assets/Asset_logo.png"
                : "Assets/Asset_logo.png"
            }
            alt="Generador de Bitácora Dual"
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
                          createRegistryContext({
                            ...contextForm,
                            school: event.target.value,
                          }),
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
                  <label className="delivery-field">
                    <span>Generación dual</span>
                    <input
                      value={contextForm.generation || ""}
                      onChange={(event) =>
                        setContextForm(
                          createRegistryContext({
                            ...contextForm,
                            generation: event.target.value,
                          }),
                        )
                      }
                      placeholder="Ej. 2025-2028"
                      maxLength={100}
                    />
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
                  <div>
                    <strong>{shortSchool(state.context.school)}</strong>
                    <span>
                      Generación dual: {state.context.generation || "No especificada"}
                    </span>
                  </div>
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
                  <strong>{activeStudents.length} activos</strong>
                  <span>
                    {desistedStudents.length
                      ? desistedStudents.length +
                        " desistido" +
                        (desistedStudents.length === 1 ? "" : "s") +
                        " de Dual"
                      : "Sin alumnos desistidos"}
                  </span>
                </div>
                <div className="delivery-student-list compact">
                  {state.students.map((student) => (
                    <div
                      className={
                        "delivery-base-row" +
                        (studentIsActive(student) ? "" : " is-desisted")
                      }
                      key={student.id}
                    >
                      <Blobatar name={student.name} size={44} />
                      <div>
                        <strong>{student.name}</strong>
                        <span>
                          {[student.specialty, shortCompany(student.company)]
                            .filter(Boolean)
                            .join(" · ") || "Sin datos"}
                        </span>
                        {!studentIsActive(student) && (
                          <span className="delivery-dual-status">
                            Desistido de Dual
                          </span>
                        )}
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
                          className="btn"
                          type="button"
                          aria-label={"Opciones de baja de " + student.name}
                          onClick={() =>
                            setStudentActionId((current) =>
                              current === student.id ? "" : student.id,
                            )
                          }
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                      {studentActionId === student.id && (
                        <div className="delivery-student-actions-panel">
                          <div>
                            <strong>Situación en Educación Dual</strong>
                            <span>
                              Desistir conserva sus entregas históricas. Eliminar
                              definitivamente también borra ese historial.
                            </span>
                          </div>
                          <div className="delivery-student-action-buttons">
                            {studentIsActive(student) ? (
                              <button
                                className="btn"
                                type="button"
                                onClick={() => markStudentAsDesisted(student.id)}
                              >
                                Desistido de Dual
                              </button>
                            ) : (
                              <button
                                className="btn"
                                type="button"
                                onClick={() => reactivateDualStudent(student.id)}
                              >
                                Reactivar
                              </button>
                            )}
                            <button
                              className="btn delivery-danger"
                              type="button"
                              onClick={() => deleteStudent(student.id)}
                            >
                              Eliminar definitivamente
                            </button>
                            <button
                              className="btn"
                              type="button"
                              onClick={() => setStudentActionId("")}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
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
                    disabled={!activeStudents.length}
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
              <p>
                Generación dual: {state.context.generation || "No especificada"}
              </p>
            </section>

            <section className="delivery-summary-grid">
              <article className="delivery-summary-card">
                <Users size={28} />
                <span>Alumnos</span>
                <strong>{activeStudents.length}</strong>
                <small>
                  {desistedStudents.length
                    ? desistedStudents.length + " desistido" + (desistedStudents.length === 1 ? "" : "s")
                    : "Activos"}
                </small>
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
                  disabled={!state.weeks.length || !activeStudents.length}
                  onClick={() => {
                    const week = state.weeks.at(-1);
                    setActiveWeekId(week.id);
                    setView("scanner");
                  }}
                >
                  Escanear entregas
                </button>
              </article>
              <article className="delivery-summary-card">
                <FilePdf size={28} />
                <span>Reporte</span>
                <strong className="delivery-summary-text">PDF</strong>
                <button
                  className="btn"
                  type="button"
                  disabled={!state.weeks.length}
                  onClick={() => openReport()}
                >
                  Crear reporte
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
                          {summary.registered}/{summary.applicable}
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
                className="btn delivery-nav-button"
                type="button"
                aria-label="Volver a semanas"
                title="Semanas"
                onClick={() => setView("home")}
              >
                <ArrowLeft size={18} />
                <span>Semanas</span>
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
                  className="btn delivery-nav-button"
                  type="button"
                  aria-label="Editar fecha límite"
                  title={
                    activeWeek.closedAt
                      ? "Reabre la semana para editar la fecha límite"
                      : "Editar fecha límite"
                  }
                  disabled={Boolean(activeWeek.closedAt)}
                  onClick={startDueAtEdit}
                >
                  <PencilSimple size={18} />
                  <span>Editar límite</span>
                </button>
                <button
                  className="btn delivery-nav-button"
                  type="button"
                  aria-label="Descargar reporte PDF"
                  title="Reporte PDF"
                  onClick={() => openReport(activeWeek.id)}
                >
                  <FilePdf size={18} />
                  <span>PDF</span>
                </button>
                <button
                  className="btn delivery-nav-button"
                  type="button"
                  aria-label="Descargar CSV"
                  title="CSV"
                  onClick={() => exportWeekCsv(state, activeWeek.id)}
                >
                  <DownloadSimple size={18} />
                  <span>CSV</span>
                </button>
                <button
                  className="btn delivery-nav-button"
                  type="button"
                  aria-label={activeWeek.closedAt ? "Reabrir semana" : "Cerrar semana"}
                  title={activeWeek.closedAt ? "Reabrir semana" : "Cerrar semana"}
                  onClick={toggleWeekClosed}
                >
                  {activeWeek.closedAt ? (
                    <CheckCircle size={18} />
                  ) : (
                    <XCircle size={18} />
                  )}
                  <span>{activeWeek.closedAt ? "Reabrir" : "Cerrar"}</span>
                </button>
                <button
                  className="btn primary delivery-nav-button"
                  type="button"
                  aria-label="Escanear entregas"
                  title="Escanear"
                  disabled={!activeStudents.length}
                  onClick={() => setView("scanner")}
                >
                  <Camera size={18} />
                  <span>Escanear</span>
                </button>
              </div>
            </section>

            {dueAtEditing && (
              <section className="delivery-deadline-editor">
                <form onSubmit={saveDueAt}>
                  <label className="delivery-field">
                    <span>Nueva fecha y hora límite</span>
                    <input
                      required
                      autoFocus
                      type="datetime-local"
                      value={dueAtValue}
                      onChange={(event) => setDueAtValue(event.target.value)}
                    />
                  </label>
                  <div className="delivery-deadline-actions">
                    <button
                      className="btn"
                      type="button"
                      onClick={() => {
                        setDueAtEditing(false);
                        setDueAtValue("");
                      }}
                    >
                      Cancelar
                    </button>
                    <button className="btn primary" type="submit">
                      Guardar límite
                    </button>
                  </div>
                </form>
                <p>
                  Las entregas registradas por cámara se vuelven a calcular con
                  la nueva fecha. Los estados corregidos manualmente y
                  <strong> No aplica</strong> se conservan.
                </p>
              </section>
            )}

            <section className="delivery-stat-row">
              {["entregado", "entregado_tarde", "no_entregado", "no_aplica"].map(
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
                  {activeSummary.registered} de {activeSummary.applicable} alumnos que aplican
                  {activeSummary.no_aplica
                    ? " · " + activeSummary.no_aplica + " no aplica"
                    : ""}
                </span>
              </div>
              <div>
                <i style={{ width: activeSummary.percent + "%" }} />
              </div>
            </section>

            <section className="delivery-panel">
              <div className="delivery-list-toolbar">
                <div className="delivery-list-title">
                  <strong>
                    {statusFilter === "all"
                      ? "Alumnos"
                      : statusMeta[statusFilter].label}
                  </strong>
                  {(statusFilter !== "all" ||
                    specialtyFilter !== "all" ||
                    companyFilter !== "all") && (
                    <button
                      className="delivery-clear-filter"
                      type="button"
                      onClick={() => {
                        setStatusFilter("all");
                        setSpecialtyFilter("all");
                        setCompanyFilter("all");
                      }}
                    >
                      Limpiar filtros
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

              <div className="delivery-roster-controls">
                <label>
                  <span>Entrega</span>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                  >
                    <option value="all">Todos</option>
                    <option value="entregado">Entregados a tiempo</option>
                    <option value="entregado_tarde">A destiempo</option>
                    <option value="no_entregado">No entregados</option>
                    <option value="no_aplica">No aplica</option>
                  </select>
                </label>
                <label>
                  <span>Especialidad</span>
                  <select
                    value={specialtyFilter}
                    onChange={(event) => setSpecialtyFilter(event.target.value)}
                  >
                    <option value="all">Todas</option>
                    {specialtyOptions.map((specialty) => (
                      <option key={specialty} value={specialty}>
                        {specialty}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Empresa</span>
                  <select
                    value={companyFilter}
                    onChange={(event) => setCompanyFilter(event.target.value)}
                  >
                    <option value="all">Todas</option>
                    {companyOptions.map((company) => (
                      <option key={company} value={company}>
                        {shortCompany(company)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Agrupar</span>
                  <select
                    value={groupBy}
                    onChange={(event) => setGroupBy(event.target.value)}
                  >
                    <option value="none">Sin agrupar</option>
                    <option value="specialty">Por especialidad</option>
                    <option value="company">Por empresa</option>
                  </select>
                </label>
              </div>

              <div className="delivery-student-list">
                {filteredStudents.length ? (
                  groupedStudents.map((group) => (
                    <section className="delivery-student-group" key={group.key}>
                      {groupBy !== "none" && (
                        <div className="delivery-student-group-head">
                          <strong>{group.label}</strong>
                          <span>{group.students.length}</span>
                        </div>
                      )}
                      <div className="delivery-student-group-list">
                        {group.students.map((student) =>
                          renderStatus(activeWeek, student),
                        )}
                      </div>
                    </section>
                  ))
                ) : (
                  <div className="delivery-empty-week">
                    No hay alumnos con estos filtros.
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
                  <details className="delivery-error-details">
                    <summary>Detalles técnicos</summary>
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
                  </details>
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
                <ArrowLeft size={18} />
                Salir
              </button>
              <label className="btn delivery-file-button">
                <FileArrowUp size={18} />
                Foto
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
                <CheckCircle size={18} />
                Terminar
              </button>
            </div>
          </section>
        )}
      </main>

      {fuzzyPrompt && fuzzyCandidate && (
        <div
          className="delivery-match-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delivery-match-title"
        >
          <div className="delivery-match-stage">
            <article className="delivery-match-card">
              <div className="delivery-match-mark" aria-hidden="true">
                <WarningCircle size={24} weight="fill" />
              </div>
              <span className="delivery-kicker">Lector Data Matrix</span>
              <h2 id="delivery-match-title">¿Es esta persona?</h2>
              <p>
                No encontré una coincidencia exacta. Revisa la sugerencia antes
                de registrar la entrega.
              </p>

              <div className="delivery-match-read">
                <span>Nombre leído</span>
                <strong>
                  {fuzzyPrompt.payload?.name || "Nombre no disponible"}
                </strong>
              </div>

              <div className="delivery-match-candidate">
                <Blobatar name={fuzzyCandidate.name || "Alumno"} size={58} />
                <div>
                  <span>
                    Posible coincidencia · {fuzzyPrompt.index + 1} de{" "}
                    {fuzzyPrompt.suggestions.length}
                  </span>
                  <strong>{fuzzyCandidate.name}</strong>
                  <small>
                    {[
                      fuzzyCandidate.specialty,
                      shortCompany(fuzzyCandidate.company),
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Sin datos"}
                  </small>
                </div>
                <b>
                  {Math.round((fuzzySuggestion?.similarity || 0) * 100)}%
                </b>
              </div>

              <div className="delivery-match-actions">
                <button className="btn" type="button" onClick={rejectFuzzyStudent}>
                  {fuzzyPrompt.index < fuzzyPrompt.suggestions.length - 1
                    ? "No, siguiente"
                    : "No corresponde"}
                </button>
                <button
                  className="btn primary"
                  type="button"
                  onClick={confirmFuzzyStudent}
                >
                  <CheckCircle size={18} />
                  Sí, registrar
                </button>
              </div>
            </article>
          </div>
        </div>
      )}

      {reportOpen && (
        <div
          className="delivery-report-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Generar reporte de entregas"
        >
          <div className="delivery-report-stage">
            <article className="delivery-report-card">
              <div className="delivery-report-head">
                <div>
                  <span className="delivery-kicker">Documento institucional</span>
                  <h2>Reporte de entregas</h2>
                  <p>
                    {shortSchool(state.context.school)} · Generación dual:{" "}
                    {state.context.generation || "No especificada"}
                  </p>
                </div>
                <FilePdf size={34} />
              </div>

              <div className="delivery-report-options">
                <button
                  className={
                    reportMode === "simple"
                      ? "delivery-report-option active"
                      : "delivery-report-option"
                  }
                  type="button"
                  onClick={() => setReportMode("simple")}
                >
                  <strong>Listado simplificado</strong>
                  <span>
                    Una semana, con alumnos, Blobatar, estado y fecha de registro.
                  </span>
                </button>
                <button
                  className={
                    reportMode === "weekly"
                      ? "delivery-report-option active"
                      : "delivery-report-option"
                  }
                  type="button"
                  onClick={() => setReportMode("weekly")}
                >
                  <strong>Semana por semana</strong>
                  <span>
                    Historial completo con resumen y listado de cada periodo.
                  </span>
                </button>
                <button
                  className={
                    reportMode === "global"
                      ? "delivery-report-option active"
                      : "delivery-report-option"
                  }
                  type="button"
                  onClick={() => setReportMode("global")}
                >
                  <strong>Global de todas</strong>
                  <span>
                    Tabla general por alumno y semana, con mini Blobatar y estado de cada entrega.
                  </span>
                </button>
              </div>

              {reportMode === "simple" && (
                <label className="delivery-field delivery-report-week">
                  <span>Semana del reporte</span>
                  <select
                    value={reportWeekId}
                    onChange={(event) => setReportWeekId(event.target.value)}
                  >
                    {[...state.weeks].reverse().map((week) => (
                      <option key={week.id} value={week.id}>
                        {week.label} · {formatPeriod(week.startDate, week.endDate)}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <div className="delivery-report-preview">
                <div>
                  <strong>Incluye</strong>
                  <span>
                    {reportMode === "global"
                      ? "Plantel, generación, fecha de creación y una matriz alumno × semana con mini Blobatar y estado por cada periodo."
                      : "Plantel, generación, fecha de creación, periodo, límite, resumen de estados, alumnos y origen del registro."}
                  </span>
                </div>
                <span>{state.students.length} alumnos</span>
              </div>

              <div className="delivery-report-actions">
                <button
                  className="btn"
                  type="button"
                  disabled={reportBusy}
                  onClick={() => setReportOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  className="btn primary"
                  type="button"
                  disabled={reportBusy || !state.weeks.length}
                  onClick={downloadReport}
                >
                  <DownloadSimple size={18} />
                  {reportBusy ? "Generando…" : "Descargar PDF"}
                </button>
              </div>
            </article>
          </div>
        </div>
      )}

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
