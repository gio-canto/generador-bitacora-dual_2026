import { useEffect, useMemo, useRef, useState } from "react";
import { Blobatar } from "blobatar/react";
import schools from "../data/schools.json";
import companies from "../data/companies.json";
import {
  ArrowLeft,
  Camera,
  CheckCircle,
  Clock,
  DownloadSimple,
  FileArrowUp,
  FileXls,
  Plus,
  PencilSimple,
  Scan,
  Trash,
  UploadSimple,
  UserPlus,
  Users,
  XCircle,
} from "@phosphor-icons/react";
import {
  contextIsComplete,
  createRegistryContext,
  createStudent,
  createWeek,
  deliveryStatus,
  exportDeliveryState,
  exportWeekCsv,
  findStudentByMatrixValue,
  mergeStudents,
  parsePortableDeliveryFile,
  readDeliveryState,
  readGeneratorSnapshot,
  registerDelivery,
  removeDelivery,
  studentsFromGenerator,
  weekSummary,
  writeDeliveryState,
} from "../services/delivery-registry.js";
import "../delivery-registry.css";

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

const tutorialSteps = [
  {
    title: "Un registro para todo el grupo",
    text: "Primero eliges plantel, especialidad, semestre y grupo. Esos datos se guardan una sola vez para la base; no tienes que repetirlos alumno por alumno.",
    visual: "base",
  },
  {
    title: "La base se cruza con el generador",
    text: "El subsistema usa los mismos catálogos del generador y puede recuperar alumnos de las bitácoras que ya están guardadas en este navegador.",
    visual: "sync",
  },
  {
    title: "Cada semana tiene una hora límite",
    text: "Creas la semana y defines la fecha y hora de entrega. El sistema decide automáticamente si una entrega llegó a tiempo o a destiempo.",
    visual: "week",
  },
  {
    title: "Escanea todas las hojas en serie",
    text: "Abres la cámara una sola vez. Cada Data Matrix reconocido emite un sonido, se encuadra como lector industrial y agrega al alumno sin cerrar la cámara.",
    visual: "scan",
  },
  {
    title: "Revisa, corrige y conserva el archivo",
    text: "Al final puedes ver quién entregó, quién llegó tarde y quién falta; corregir registros, exportar CSV y guardar el archivo portátil JSON.",
    visual: "finish",
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
      return { name };
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
  const generatorSnapshot = useMemo(() => readGeneratorSnapshot(), []);
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
    createRegistryContext(
      contextIsComplete(initialState.context)
        ? initialState.context
        : generatorSnapshot.context,
    ),
  );
  const [setupStep, setSetupStep] = useState(0);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [studentForm, setStudentForm] = useState({ name: "" });
  const [weekForm, setWeekForm] = useState({
    label: "",
    startDate: "",
    dueAt: "",
  });
  const [editingStudentId, setEditingStudentId] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scanQueue, setScanQueue] = useState([]);
  const [scanMessage, setScanMessage] = useState("Apunta la cámara al Data Matrix.");
  const [scanTone, setScanTone] = useState("");
  const [scanBox, setScanBox] = useState(null);
  const [scannerError, setScannerError] = useState("");
  const videoRef = useRef(null);
  const scanControls = useRef(null);
  const pendingIds = useRef(new Set());
  const scanBoxTimer = useRef(null);

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
  const selectedSchool =
    schools.find((school) => school.name === contextForm.school) ||
    schools[0] ||
    {};
  const generatorCandidates = useMemo(
    () => studentsFromGenerator(generatorSnapshot, contextForm),
    [generatorSnapshot, contextForm],
  );

  const commit = (producer) => {
    const next =
      typeof producer === "function" ? producer(state) : producer;
    const saved = writeDeliveryState(next);
    setState(saved);
    return saved;
  };

  useEffect(() => {
    if (activeWeekId && !state.weeks.some((week) => week.id === activeWeekId))
      setActiveWeekId(state.weeks.at(-1)?.id || "");
  }, [state.weeks, activeWeekId]);

  useEffect(() => {
    if (view !== "scanner") return;
    let disposed = false;
    let nativeStream = null;
    let nativeFrame = 0;
    pendingIds.current = new Set();
    setScanQueue([]);
    setScannerError("");
    setScanMessage("Apunta la cámara al Data Matrix.");

    const showDetection = (kind, box) => {
      setScanTone("");
      requestAnimationFrame(() => setScanTone(kind));
      setScanBox({
        ...(box || { left: 31, top: 26, width: 38, height: 48 }),
        tone: kind,
      });
      clearTimeout(scanBoxTimer.current);
      scanBoxTimer.current = setTimeout(() => setScanBox(null), 720);
    };

    const processValue = (rawValue, points) => {
      const student = findStudentByMatrixValue(state.students, rawValue);
      if (!student) {
        setScanMessage("Código detectado, pero no pertenece a la base cargada.");
        showDetection("error");
        return;
      }
      if (activeWeek?.deliveries?.[student.id]) {
        setScanMessage(`${student.name} ya estaba registrado en esta semana.`);
        showDetection("seen");
        return;
      }
      if (pendingIds.current.has(student.id)) {
        setScanMessage(`${student.name} ya fue detectado en esta sesión.`);
        showDetection("seen");
        return;
      }

      pendingIds.current.add(student.id);
      const at = new Date().toISOString();
      setScanQueue((current) => [...current, { studentId: student.id, name: student.name, at }]);
      setScanMessage(`Detectado: ${student.name}`);

      const box = resultBoxFromPoints(videoRef.current, points);
      showDetection("ok", box);
    };

    async function start() {
      const video = videoRef.current;
      if (!video) return;
      try {
        if (window.ZXingBrowser?.BrowserDatamatrixCodeReader) {
          const reader = new window.ZXingBrowser.BrowserDatamatrixCodeReader();
          const controls = await reader.decodeFromConstraints(
            {
              audio: false,
              video: {
                facingMode: { ideal: "environment" },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
              },
            },
            video,
            (result) => {
              if (!result || disposed) return;
              processValue(
                result.getText?.() || result.text || "",
                result.getResultPoints?.() || [],
              );
            },
          );
          if (disposed) controls?.stop?.();
          else scanControls.current = controls;
          return;
        }

        if ("BarcodeDetector" in window) {
          nativeStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
          });
          video.srcObject = nativeStream;
          await video.play();
          const formats = await window.BarcodeDetector.getSupportedFormats?.();
          if (formats && !formats.includes("data_matrix"))
            throw new Error("Este navegador no admite Data Matrix con la cámara.");
          const detector = new window.BarcodeDetector({ formats: ["data_matrix"] });
          const loop = async () => {
            if (disposed) return;
            try {
              const results = await detector.detect(video);
              results.forEach((result) => {
                const b = result.boundingBox;
                processValue(
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
            nativeFrame = requestAnimationFrame(loop);
          };
          loop();
          return;
        }

        throw new Error("El navegador no dispone de un lector Data Matrix compatible.");
      } catch (error) {
        setScannerError(
          error?.message ||
            "No se pudo abrir la cámara. Revisa el permiso e inténtalo de nuevo.",
        );
      }
    }

    start();
    return () => {
      disposed = true;
      scanControls.current?.stop?.();
      scanControls.current = null;
      if (nativeFrame) cancelAnimationFrame(nativeFrame);
      nativeStream?.getTracks?.().forEach((track) => track.stop());
      clearTimeout(scanBoxTimer.current);
    };
  }, [view, activeWeekId]);

  const startSetup = () => {
    setContextForm(
      createRegistryContext(
        contextIsComplete(state.context)
          ? state.context
          : generatorSnapshot.context,
      ),
    );
    setSetupStep(0);
    setView("setup");
  };

  const saveContext = () => {
    const context = createRegistryContext(contextForm);
    if (!contextIsComplete(context)) {
      setNotice("Completa plantel, especialidad, semestre y grupo.");
      return false;
    }
    commit({ ...state, context });
    setContextForm(context);
    setNotice("");
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
      setNotice(
        "Archivo cargado: " +
          saved.students.length +
          " alumnos y " +
          saved.weeks.length +
          " semanas.",
      );
      setView(
        saved.weeks.length || saved.students.length || contextIsComplete(saved.context)
          ? "home"
          : "welcome",
      );
    } catch (error) {
      setNotice(error?.message || "No se pudo cargar el archivo.");
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
      setNotice(
        "Base actualizada: " +
          merged.added +
          " nuevos y " +
          merged.updated +
          " ya existentes.",
      );
    } catch (error) {
      setNotice(error?.message || "No se pudo leer el archivo de alumnos.");
    }
  };

  const syncGeneratorStudents = () => {
    const incoming = studentsFromGenerator(generatorSnapshot, contextForm);
    if (!incoming.length) {
      setNotice(
        "No encontré bitácoras guardadas de este mismo plantel, especialidad, semestre y grupo.",
      );
      return;
    }
    const merged = mergeStudents(state.students, incoming);
    commit({ ...state, students: merged.students });
    setNotice(
      "Se cruzó la base con el generador: " +
        merged.added +
        " alumnos agregados y " +
        merged.updated +
        " ya existentes.",
    );
  };

  const addStudent = (event) => {
    event.preventDefault();
    const name = String(studentForm.name || "").replace(/\s+/g, " ").trim();
    if (!name) return;

    if (editingStudentId) {
      const duplicate = state.students.some(
        (student) =>
          student.id !== editingStudentId &&
          student.name.localeCompare(name, "es", { sensitivity: "base" }) === 0,
      );
      if (duplicate) {
        setNotice("Ya existe otro alumno con ese nombre.");
        return;
      }
      commit({
        ...state,
        students: state.students.map((student) =>
          student.id === editingStudentId ? { ...student, name } : student,
        ),
      });
      setEditingStudentId("");
      setStudentForm({ name: "" });
      setNotice("Alumno actualizado.");
      return;
    }

    const merged = mergeStudents(state.students, [{ name }]);
    commit({ ...state, students: merged.students });
    setStudentForm({ name: "" });
    setNotice(
      merged.added ? "Alumno agregado." : "Ese alumno ya estaba en la base.",
    );
  };

  const editStudent = (student) => {
    setEditingStudentId(student.id);
    setStudentForm({ name: student.name || "" });
    setNotice("Editando a " + student.name + ".");
  };

  const deleteStudent = (studentId) => {
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
  };

  const addWeek = (event, downloadAfter = false) => {
    event?.preventDefault?.();
    if (!weekForm.dueAt) {
      setNotice(
        "Define la fecha y hora límite para distinguir entregas a tiempo y a destiempo.",
      );
      return;
    }
    if (!state.students.length) {
      setNotice("Agrega al menos un alumno antes de crear la semana.");
      return;
    }
    const week = createWeek({
      label: weekForm.label || "Semana " + (state.weeks.length + 1),
      startDate: weekForm.startDate,
      dueAt: new Date(weekForm.dueAt).toISOString(),
    });
    const saved = commit({ ...state, weeks: [...state.weeks, week] });
    setActiveWeekId(week.id);
    setWeekForm({ label: "", startDate: "", dueAt: "" });
    setNotice("");
    if (downloadAfter) exportDeliveryState(saved);
    setView("week");
  };

  const registerManual = (studentId) => {
    if (!activeWeek || activeWeek.closedAt) return;
    const weeks = state.weeks.map((week) =>
      week.id === activeWeek.id
        ? registerDelivery(week, studentId, new Date().toISOString(), "manual")
        : week,
    );
    commit({ ...state, weeks });
  };

  const undoDelivery = (studentId) => {
    if (!activeWeek || activeWeek.closedAt) return;
    commit({
      ...state,
      weeks: state.weeks.map((week) =>
        week.id === activeWeek.id ? removeDelivery(week, studentId) : week,
      ),
    });
  };

  const toggleWeekClosed = () => {
    if (!activeWeek) return;
    const closedAt = activeWeek.closedAt ? "" : new Date().toISOString();
    commit({
      ...state,
      weeks: state.weeks.map((week) =>
        week.id === activeWeek.id ? { ...week, closedAt } : week,
      ),
    });
  };

  const finishScan = () => {
    if (!activeWeek || activeWeek.closedAt) return;
    let updatedWeek = activeWeek;
    for (const item of scanQueue)
      updatedWeek = registerDelivery(
        updatedWeek,
        item.studentId,
        item.at,
        "camera",
      );
    const saved = commit({
      ...state,
      weeks: state.weeks.map((week) =>
        week.id === activeWeek.id ? updatedWeek : week,
      ),
    });
    if (scanQueue.length) exportDeliveryState(saved);
    setView("week");
  };

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("es-MX");
    let list = state.students.filter((student) =>
      student.name.toLocaleLowerCase("es-MX").includes(term),
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
            {[state.context.specialty, state.context.semester && state.context.semester + "°", state.context.group]
              .filter(Boolean)
              .join(" · ") || "Alumno"}
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
    <div className="delivery-app">
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
          {view !== "welcome" && (
            <button
              className="btn"
              type="button"
              onClick={() => {
                setTutorialStep(0);
                setView("tutorial");
              }}
            >
              Tutorial
            </button>
          )}
          <label className="btn delivery-file-button">
            <UploadSimple size={18} />
            Abrir archivo
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
              onClick={() => exportDeliveryState(state)}
            >
              <DownloadSimple size={18} />
              Guardar archivo
            </button>
          )}
        </div>
      </header>

      <main className="delivery-shell">
        {view === "welcome" && (
          <section className="delivery-welcome">
            <div className="delivery-welcome-copy">
              <span className="delivery-kicker">Registro de bitácoras</span>
              <h1>Subsistema de registro de entrega</h1>
              <p>
                Controla por semana quién entregó, quién llegó a destiempo y
                quién sigue pendiente, sin cuentas ni servidor.
              </p>
            </div>
            <div className="delivery-welcome-cards">
              <button
                className="delivery-entry-card"
                type="button"
                onClick={() => {
                  setTutorialStep(0);
                  setView("tutorial");
                }}
              >
                <div className="delivery-entry-icon">
                  <FileArrowUp size={42} />
                </div>
                <strong>Soy nuevo y quiero saber</strong>
                <span>Aprende el sistema tarjeta por tarjeta.</span>
                <b>Tutorial</b>
              </button>
              <button
                className="delivery-entry-card primary"
                type="button"
                onClick={startSetup}
              >
                <div className="delivery-entry-icon">
                  <Scan size={42} />
                </div>
                <strong>Iniciar registro</strong>
                <span>Crea la base y la primera semana.</span>
                <b>Ingresar</b>
              </button>
            </div>
          </section>
        )}

        {notice && view !== "scanner" && view !== "welcome" && (
          <div className="delivery-notice" role="status">
            {notice}
            <button type="button" onClick={() => setNotice("")}>
              Cerrar
            </button>
          </div>
        )}

        {view === "tutorial" && (
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
                {tutorialSteps[tutorialStep].visual === "base" && (
                  <>
                    <Users size={38} />
                    <div>
                      <strong>CBTis No. 134</strong>
                      <span>Programación · 4° B</span>
                    </div>
                  </>
                )}
                {tutorialSteps[tutorialStep].visual === "sync" && (
                  <>
                    <Database size={38} />
                    <ArrowRight size={26} />
                    <Users size={38} />
                  </>
                )}
                {tutorialSteps[tutorialStep].visual === "week" && (
                  <>
                    <Clock size={38} />
                    <div>
                      <strong>Semana 4</strong>
                      <span>Entrega límite · viernes 14:00</span>
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
                {tutorialSteps[tutorialStep].visual === "finish" && (
                  <div className="delivery-tutorial-mini-status">
                    <span>12 Entregados</span>
                    <span>2 A destiempo</span>
                    <span>4 Pendientes</span>
                  </div>
                )}
              </div>

              <h2>{tutorialSteps[tutorialStep].title}</h2>
              <p>{tutorialSteps[tutorialStep].text}</p>

              <div className="delivery-tutorial-actions">
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    if (tutorialStep === 0)
                      setView(started ? "home" : "welcome");
                    else setTutorialStep((step) => step - 1);
                  }}
                >
                  <ArrowLeft size={17} />
                  {tutorialStep === 0 ? "Salir" : "Atrás"}
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
                    if (started) setView("home");
                    else startSetup();
                  }}
                >
                  {tutorialStep === tutorialSteps.length - 1
                    ? started
                      ? "Terminar"
                      : "Crear registro"
                    : "Siguiente"}
                  <ArrowRight size={17} />
                </button>
              </div>
            </article>
          </section>
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
                    ? "¿Qué grupo vas a administrar?"
                    : setupStep === 1
                      ? "Carga a tus alumnos"
                      : "Crea la primera semana"}
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
                <p className="delivery-setup-note">
                  Estos datos salen de los mismos catálogos del generador de
                  bitácoras y se aplican a toda la base, no alumno por alumno.
                </p>
                <div className="delivery-form">
                  <label className="delivery-field delivery-field-wide">
                    <span>Plantel</span>
                    <select
                      value={contextForm.school}
                      onChange={(event) => {
                        const school =
                          schools.find(
                            (item) => item.name === event.target.value,
                          ) ||
                          schools[0] ||
                          {};
                        setContextForm(
                          createRegistryContext({
                            ...contextForm,
                            school: school.name || "",
                            specialty: school.specialties?.[0] || "",
                            semester: school.semesters?.[0] || "",
                            group: school.groups?.[0] || "",
                          }),
                        );
                      }}
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
                    <span>Especialidad</span>
                    <select
                      value={contextForm.specialty}
                      onChange={(event) =>
                        setContextForm({
                          ...contextForm,
                          specialty: event.target.value,
                        })
                      }
                    >
                      <option value="">Selecciona</option>
                      {(selectedSchool.specialties || []).map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                  </label>

                  <label className="delivery-field">
                    <span>Semestre</span>
                    <select
                      value={contextForm.semester}
                      onChange={(event) =>
                        setContextForm({
                          ...contextForm,
                          semester: event.target.value,
                        })
                      }
                    >
                      <option value="">Selecciona</option>
                      {(selectedSchool.semesters || []).map((value) => (
                        <option key={value} value={value}>
                          {value}°
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="delivery-field">
                    <span>Grupo</span>
                    <select
                      value={contextForm.group}
                      onChange={(event) =>
                        setContextForm({
                          ...contextForm,
                          group: event.target.value,
                        })
                      }
                    >
                      <option value="">Selecciona</option>
                      {(selectedSchool.groups || []).map((value) => (
                        <option key={value}>{value}</option>
                      ))}
                    </select>
                  </label>

                  <label className="delivery-field delivery-field-wide">
                    <span>Empresa u organismo de referencia</span>
                    <select
                      value={contextForm.company}
                      onChange={(event) =>
                        setContextForm({
                          ...contextForm,
                          company: event.target.value,
                        })
                      }
                    >
                      <option value="">Sin una empresa única</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.name}>
                          {company.shortName || company.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {contextIsComplete(generatorSnapshot.context) && (
                  <div className="delivery-cross-hint">
                    <Database size={21} />
                    <div>
                      <strong>Encontré datos del generador</strong>
                      <span>
                        {shortSchool(generatorSnapshot.context.school)} ·{" "}
                        {generatorSnapshot.context.specialty} ·{" "}
                        {generatorSnapshot.context.semester}°{" "}
                        {generatorSnapshot.context.group}
                      </span>
                    </div>
                  </div>
                )}

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
                      {state.context.specialty} · {state.context.semester}°{" "}
                      {state.context.group}
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

                <div className="delivery-import-grid">
                  <button
                    className="delivery-action-tile"
                    type="button"
                    onClick={syncGeneratorStudents}
                  >
                    <Database size={38} />
                    <strong>Traer del generador</strong>
                    <span>
                      {generatorCandidates.length
                        ? generatorCandidates.length +
                          " encontrados para este grupo"
                        : "Cruzar con bitácoras guardadas"}
                    </span>
                  </button>
                  <label className="delivery-action-tile">
                    <FileXls size={38} />
                    <strong>Cargar Excel o CSV</strong>
                    <span>Busca una columna de nombre o alumno</span>
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
                </div>

                <form className="delivery-inline-add" onSubmit={addStudent}>
                  <label>
                    <span>Agregar manualmente</span>
                    <input
                      value={studentForm.name}
                      onChange={(event) =>
                        setStudentForm({ name: event.target.value })
                      }
                      placeholder="Nombre completo del alumno"
                    />
                  </label>
                  <button className="btn primary" type="submit">
                    {editingStudentId ? (
                      <PencilSimple size={17} />
                    ) : (
                      <Plus size={17} />
                    )}
                    {editingStudentId ? "Actualizar" : "Agregar"}
                  </button>
                  {editingStudentId && (
                    <button
                      className="btn"
                      type="button"
                      onClick={() => {
                        setEditingStudentId("");
                        setStudentForm({ name: "" });
                      }}
                    >
                      Cancelar
                    </button>
                  )}
                </form>

                <div className="delivery-roster-head">
                  <strong>{state.students.length} alumnos en la base</strong>
                  <span>El contexto escolar se aplica a todos.</span>
                </div>
                <div className="delivery-student-list compact">
                  {state.students.map((student) => (
                    <div className="delivery-base-row" key={student.id}>
                      <Blobatar name={student.name} size={44} />
                      <div>
                        <strong>{student.name}</strong>
                        <span>
                          {state.context.specialty} · {state.context.semester}°{" "}
                          {state.context.group}
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
                <p className="delivery-setup-note">
                  La hora límite controla automáticamente el estado de cada
                  entrega.
                </p>
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
                {[
                  state.context.specialty,
                  state.context.semester &&
                    state.context.semester + "°",
                  state.context.group,
                  shortCompany(state.context.company),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
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
                <span>Registro rápido</span>
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
                    setView(week.closedAt ? "week" : "scanner");
                  }}
                >
                  {state.weeks.at(-1)?.closedAt ? "Ver cierre" : "Escanear"}
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
                            Límite: {formatDateTime(week.dueAt)}
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

            <section className="delivery-help-strip">
              <div>
                <span className="delivery-kicker">Base compartida</span>
                <h2>
                  Escuela, especialidad, semestre y grupo se guardan una sola
                  vez.
                </h2>
              </div>
              <button className="btn" type="button" onClick={startSetup}>
                Revisar configuración
              </button>
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
                <p>Fecha límite: {formatDateTime(activeWeek.dueAt)}</p>
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
                  disabled={
                    !state.students.length || Boolean(activeWeek.closedAt)
                  }
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

        {view === "scanner" && activeWeek && (
          <section className="delivery-scanner-page">
            <div className="delivery-scanner-head">
              <div>
                <span className="delivery-kicker">Escaneo continuo</span>
                <h2>{activeWeek.label}</h2>
                <p>
                  Mantén la cámara abierta y pasa una bitácora tras otra. No
                  tienes que tocar nada entre alumnos.
                </p>
              </div>
              <div className="delivery-scan-counter">
                <strong>{scanQueue.length}</strong>
                <span>detectados</span>
              </div>
            </div>

            <div className="delivery-camera-shell">
              <video ref={videoRef} playsInline muted />
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
                  <span>DATA MATRIX</span>
                </div>
              )}
              <div className="delivery-camera-hud">
                <span className="delivery-camera-live">LECTOR ACTIVO</span>
                <strong>{scanMessage}</strong>
              </div>
            </div>

            {scannerError && (
              <div className="delivery-scanner-error">
                <strong>No se pudo iniciar el lector.</strong>
                <p>{scannerError}</p>
                <p>
                  Puedes volver a la semana y registrar entregas manualmente.
                </p>
              </div>
            )}

            <div className="delivery-scan-results">
              {scanQueue
                .slice(-6)
                .reverse()
                .map((item) => (
                  <div key={item.studentId}>
                    <Blobatar name={item.name} size={38} />
                    <span>{item.name}</span>
                    <strong>
                      {new Date(item.at).toLocaleTimeString("es-MX", {
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
                onClick={() => setView("week")}
              >
                Cancelar
              </button>
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
    </div>
  );
}
