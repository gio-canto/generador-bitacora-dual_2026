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

  const importPortable = async (file) => {
    if (!file) return;
    try {
      const imported = parsePortableDeliveryFile(await file.text());
      const saved = writeDeliveryState(imported);
      setState(saved);
      setActiveWeekId(saved.weeks.at(-1)?.id || "");
      setNotice(
        `Archivo cargado: ${saved.students.length} alumnos y ${saved.weeks.length} semanas.`,
      );
      setView("home");
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
        `Base actualizada: ${merged.added} nuevos, ${merged.updated} actualizados${merged.skipped ? `, ${merged.skipped} omitidos` : ""}.`,
      );
    } catch (error) {
      setNotice(error?.message || "No se pudo leer el archivo de alumnos.");
    }
  };

  const addStudent = (event) => {
    event.preventDefault();
    if (!studentForm.name.trim()) return;
    if (editingStudentId) {
      const students = state.students.map((student) =>
        student.id === editingStudentId
          ? {
              ...student,
              ...studentForm,
              name: studentForm.name.replace(/\s+/g, " ").trim(),
            }
          : student,
      );
      commit({ ...state, students });
      setEditingStudentId("");
      setStudentForm({ name: "", school: "", specialty: "", semester: "", group: "" });
      setNotice("Alumno actualizado.");
      return;
    }
    const merged = mergeStudents(state.students, [studentForm]);
    commit({ ...state, students: merged.students });
    setStudentForm({ name: "", school: "", specialty: "", semester: "", group: "" });
    setNotice(merged.added ? "Alumno agregado." : "Alumno actualizado.");
  };

  const editStudent = (student) => {
    setEditingStudentId(student.id);
    setStudentForm({
      name: student.name || "",
      school: student.school || "",
      specialty: student.specialty || "",
      semester: student.semester || "",
      group: student.group || "",
    });
    setNotice(`Editando a ${student.name}. Guarda los cambios para aplicarlos.`);
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

  const addWeek = (event) => {
    event.preventDefault();
    if (!weekForm.dueAt) {
      setNotice("Define la fecha y hora límite para poder detectar entregas a destiempo.");
      return;
    }
    const week = createWeek({
      label: weekForm.label || `Semana ${state.weeks.length + 1}`,
      startDate: weekForm.startDate,
      dueAt: new Date(weekForm.dueAt).toISOString(),
    });
    const saved = commit({ ...state, weeks: [...state.weeks, week] });
    setActiveWeekId(week.id);
    setWeekForm({ label: "", startDate: "", dueAt: "" });
    setNotice("");
    setView("week");
    return saved;
  };

  const registerManual = (studentId) => {
    if (!activeWeek) return;
    const weeks = state.weeks.map((week) =>
      week.id === activeWeek.id
        ? registerDelivery(week, studentId, new Date().toISOString(), "manual")
        : week,
    );
    commit({ ...state, weeks });
  };

  const undoDelivery = (studentId) => {
    if (!activeWeek) return;
    commit({
      ...state,
      weeks: state.weeks.map((week) =>
        week.id === activeWeek.id ? removeDelivery(week, studentId) : week,
      ),
    });
  };

  const finishScan = () => {
    if (!activeWeek) return;
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
    if (!term) return state.students;
    return state.students.filter((student) =>
      [student.name, student.school, student.specialty, student.group]
        .join(" ")
        .toLocaleLowerCase("es-MX")
        .includes(term),
    );
  }, [state.students, search]);

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
            {[student.specialty, student.semester && `${student.semester}°`, student.group]
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
            <button className="btn" type="button" onClick={() => registerManual(student.id)}>
              Registrar entrega
            </button>
          ) : (
            <button className="btn" type="button" onClick={() => undoDelivery(student.id)}>
              Quitar registro
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
          <img src="Assets/Edu.png" alt="Educación Dual" />
        </button>
        <div className="delivery-top-actions">
          <button className="btn" type="button" onClick={onClose}>
            <ArrowLeft size={18} />
            Generador
          </button>
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
          <button className="btn primary" type="button" onClick={() => exportDeliveryState(state)}>
            <DownloadSimple size={18} />
            Descargar archivo
          </button>
        </div>
      </header>

      <main className="delivery-shell">
        {view !== "scanner" && (
          <section className="delivery-hero">
            <span>Educación Dual · control local</span>
            <h1>Subsistema de registro de entrega</h1>
            <p>
              Administra la base de alumnos, crea semanas y registra bitácoras por cámara
              o de forma manual. Los datos se conservan en este navegador y en el archivo
              portátil que descargues.
            </p>
          </section>
        )}

        {notice && view !== "scanner" && (
          <div className="delivery-notice" role="status">
            {notice}
            <button type="button" onClick={() => setNotice("")}>Cerrar</button>
          </div>
        )}

        {view === "home" && (
          <>
            <section className="delivery-summary-grid">
              <article className="delivery-summary-card">
                <Users size={28} />
                <span>Base de alumnos</span>
                <strong>{state.students.length}</strong>
                <button className="btn" type="button" onClick={() => setView("students")}>
                  Administrar
                </button>
              </article>
              <article className="delivery-summary-card">
                <FileArrowUp size={28} />
                <span>Semanas registradas</span>
                <strong>{state.weeks.length}</strong>
                <button className="btn" type="button" onClick={() => setView("new-week")}>
                  Crear nueva semana
                </button>
              </article>
              <article className="delivery-summary-card">
                <Scan size={28} />
                <span>Registro rápido</span>
                <strong>{activeWeek ? activeWeek.label : "Sin semana"}</strong>
                <button
                  className="btn primary"
                  type="button"
                  disabled={!activeWeek || !state.students.length}
                  onClick={() => setView("scanner")}
                >
                  Escanear bitácoras
                </button>
              </article>
            </section>

            {!state.students.length && (
              <section className="delivery-empty-start">
                <div>
                  <span className="delivery-kicker">Primer uso</span>
                  <h2>Carga tu base de alumnos</h2>
                  <p>
                    Puedes capturar nombres manualmente o importar la primera hoja de un
                    archivo Excel/CSV. El nombre completo es el dato que se compara contra
                    el Data Matrix de cada bitácora.
                  </p>
                </div>
                <button className="btn primary" type="button" onClick={() => setView("students")}>
                  <UserPlus size={18} />
                  Crear base
                </button>
              </section>
            )}

            {!!state.weeks.length && (
              <section className="delivery-panel">
                <div className="delivery-panel-head">
                  <div>
                    <span className="delivery-kicker">Historial</span>
                    <h2>Semanas</h2>
                  </div>
                  <button className="btn" type="button" onClick={() => setView("new-week")}>
                    <Plus size={18} />
                    Nueva semana
                  </button>
                </div>
                <div className="delivery-week-list">
                  {[...state.weeks].reverse().map((week) => {
                    const delivered = state.students.filter(
                      (student) => deliveryStatus(week, student.id) !== "no_entregado",
                    ).length;
                    return (
                      <button
                        className="delivery-week-row"
                        key={week.id}
                        type="button"
                        onClick={() => {
                          setActiveWeekId(week.id);
                          setView("week");
                        }}
                      >
                        <div>
                          <strong>{week.label}</strong>
                          <span>
                            Límite: {formatDateTime(week.dueAt)}
                          </span>
                        </div>
                        <b>{delivered}/{state.students.length}</b>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="delivery-help-strip">
              <div>
                <span className="delivery-kicker">¿Es tu primera vez?</span>
                <h2>Ve el flujo completo antes de registrar.</h2>
              </div>
              <button className="btn" type="button" onClick={() => setView("tutorial")}>
                Ver tutorial
              </button>
            </section>
          </>
        )}

        {view === "tutorial" && (
          <section className="delivery-panel">
            <div className="delivery-panel-head">
              <div>
                <span className="delivery-kicker">Tutorial</span>
                <h2>Registro de entrega en tres pasos</h2>
              </div>
              <button className="btn" type="button" onClick={() => setView("home")}>
                Volver
              </button>
            </div>
            <div className="delivery-tutorial-grid">
              <article><b>1</b><h3>Carga la base</h3><p>Agrega alumnos manualmente o importa Excel/CSV. Los nombres deben coincidir con los impresos en sus bitácoras.</p></article>
              <article><b>2</b><h3>Crea la semana</h3><p>Define la fecha y hora límite. Antes del límite será Entregado; después, Entregado a destiempo.</p></article>
              <article><b>3</b><h3>Escanea en serie</h3><p>Mantén la cámara abierta y pasa cada hoja. Cada lectura emite un sonido y marca visualmente el código detectado. Termina la sesión para guardar y descargar el archivo actualizado.</p></article>
            </div>
          </section>
        )}

        {view === "students" && (
          <section className="delivery-panel">
            <div className="delivery-panel-head">
              <div>
                <span className="delivery-kicker">Base local</span>
                <h2>Alumnos</h2>
              </div>
              <button className="btn" type="button" onClick={() => setView("home")}>
                Volver
              </button>
            </div>

            <div className="delivery-import-grid">
              <label className="delivery-action-tile">
                <FileXls size={42} />
                <strong>Carga masiva</strong>
                <span>Excel, XLSX, XLS o CSV</span>
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
              <div className="delivery-action-tile">
                <UserPlus size={42} />
                <strong>Carga manual</strong>
                <span>Agrega o actualiza un alumno abajo</span>
              </div>
            </div>

            <form className="delivery-form" onSubmit={addStudent}>
              <label className="delivery-field delivery-field-wide">
                <span>Nombre completo</span>
                <input
                  required
                  value={studentForm.name}
                  onChange={(event) => setStudentForm({ ...studentForm, name: event.target.value })}
                  placeholder="Nombre y apellidos"
                />
              </label>
              <label className="delivery-field delivery-field-wide">
                <span>Plantel</span>
                <input
                  value={studentForm.school}
                  onChange={(event) => setStudentForm({ ...studentForm, school: event.target.value })}
                  placeholder="Opcional"
                />
              </label>
              <label className="delivery-field">
                <span>Especialidad</span>
                <input
                  value={studentForm.specialty}
                  onChange={(event) => setStudentForm({ ...studentForm, specialty: event.target.value })}
                  placeholder="Opcional"
                />
              </label>
              <label className="delivery-field">
                <span>Semestre</span>
                <input
                  value={studentForm.semester}
                  onChange={(event) => setStudentForm({ ...studentForm, semester: event.target.value })}
                  placeholder="Ej. 4"
                />
              </label>
              <label className="delivery-field">
                <span>Grupo</span>
                <input
                  value={studentForm.group}
                  onChange={(event) => setStudentForm({ ...studentForm, group: event.target.value })}
                  placeholder="Ej. B"
                />
              </label>
              <button className="btn primary delivery-form-submit" type="submit">
                {editingStudentId ? <PencilSimple size={18} /> : <Plus size={18} />}
                {editingStudentId ? "Actualizar alumno" : "Guardar alumno"}
              </button>
              {editingStudentId && (
                <button
                  className="btn delivery-form-submit"
                  type="button"
                  onClick={() => {
                    setEditingStudentId("");
                    setStudentForm({ name: "", school: "", specialty: "", semester: "", group: "" });
                    setNotice("");
                  }}
                >
                  Cancelar edición
                </button>
              )}
            </form>

            <div className="delivery-list-toolbar">
              <strong>{state.students.length} alumnos</strong>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar alumno"
              />
            </div>
            <div className="delivery-student-list compact">
              {filteredStudents.map((student) => (
                <div className="delivery-base-row" key={student.id}>
                  <Blobatar name={student.name || "Alumno"} size={44} />
                  <div>
                    <strong>{student.name}</strong>
                    <span>
                      {[student.specialty, student.semester && `${student.semester}°`, student.group]
                        .filter(Boolean)
                        .join(" · ") || student.school || "Sin datos adicionales"}
                    </span>
                  </div>
                  <div className="delivery-base-actions">
                    <button
                      className="btn"
                      type="button"
                      aria-label={`Editar ${student.name}`}
                      onClick={() => editStudent(student)}
                    >
                      <PencilSimple size={18} />
                    </button>
                    <button
                      className="btn delivery-danger"
                      type="button"
                      aria-label={`Eliminar ${student.name}`}
                      onClick={() => deleteStudent(student.id)}
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {view === "new-week" && (
          <section className="delivery-panel delivery-narrow-panel">
            <div className="delivery-panel-head">
              <div>
                <span className="delivery-kicker">Nueva semana</span>
                <h2>Configura el periodo de entrega</h2>
              </div>
              <button className="btn" type="button" onClick={() => setView("home")}>
                Volver
              </button>
            </div>
            <form className="delivery-form delivery-week-form" onSubmit={addWeek}>
              <label className="delivery-field delivery-field-wide">
                <span>Nombre de la semana</span>
                <input
                  value={weekForm.label}
                  onChange={(event) => setWeekForm({ ...weekForm, label: event.target.value })}
                  placeholder={`Semana ${state.weeks.length + 1}`}
                />
              </label>
              <label className="delivery-field">
                <span>Fecha inicial</span>
                <input
                  type="date"
                  value={weekForm.startDate}
                  onChange={(event) => setWeekForm({ ...weekForm, startDate: event.target.value })}
                />
              </label>
              <label className="delivery-field">
                <span>Fecha y hora límite</span>
                <input
                  required
                  type="datetime-local"
                  value={weekForm.dueAt}
                  onChange={(event) => setWeekForm({ ...weekForm, dueAt: event.target.value })}
                />
              </label>
              <button className="btn primary delivery-form-submit" type="submit">
                Crear semana
              </button>
            </form>
          </section>
        )}

        {view === "week" && activeWeek && (
          <>
            <section className="delivery-week-head">
              <button className="btn" type="button" onClick={() => setView("home")}>
                <ArrowLeft size={18} />
                Semanas
              </button>
              <div>
                <span className="delivery-kicker">Registro activo</span>
                <h2>{activeWeek.label}</h2>
                <p>Fecha límite: {formatDateTime(activeWeek.dueAt)}</p>
              </div>
              <button
                className="btn primary"
                type="button"
                disabled={!state.students.length}
                onClick={() => setView("scanner")}
              >
                <Camera size={18} />
                Escanear con cámara
              </button>
            </section>

            <section className="delivery-stat-row">
              {["entregado", "entregado_tarde", "no_entregado"].map((status) => {
                const meta = statusMeta[status];
                const count = state.students.filter(
                  (student) => deliveryStatus(activeWeek, student.id) === status,
                ).length;
                return (
                  <article key={status}>
                    <span>{meta.label}</span>
                    <strong>{count}</strong>
                  </article>
                );
              })}
            </section>

            <section className="delivery-panel">
              <div className="delivery-list-toolbar">
                <strong>Alumnos</strong>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar alumno"
                />
              </div>
              <div className="delivery-student-list">
                {filteredStudents.map((student) => renderStatus(activeWeek, student))}
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
                <p>No cierres la cámara entre alumnos. Pasa una bitácora tras otra.</p>
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
                  className={`delivery-detection-box ${scanBox.tone || "ok"}`}
                  style={{
                    left: `${scanBox.left}%`,
                    top: `${scanBox.top}%`,
                    width: `${scanBox.width}%`,
                    height: `${scanBox.height}%`,
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
                <p>Puedes volver a la semana y registrar entregas manualmente.</p>
              </div>
            )}

            <div className="delivery-scan-results">
              {scanQueue.slice(-5).reverse().map((item) => (
                <div key={item.studentId}>
                  <Blobatar name={item.name} size={38} />
                  <span>{item.name}</span>
                  <strong>{new Date(item.at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</strong>
                </div>
              ))}
            </div>

            <div className="delivery-scanner-actions">
              <button className="btn" type="button" onClick={() => setView("week")}>
                Cancelar
              </button>
              <button className="btn primary" type="button" onClick={finishScan}>
                Terminar registro
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
