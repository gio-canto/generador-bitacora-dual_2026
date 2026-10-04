import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./debug.css";
import "./calendar-easter-eggs.css";

import {
  VERSION,
  RELEASE,
  blankRecord,
  validDate,
  validTime,
  weekDates,
  generateEntries,
  validateRecord,
  withStatus,
  titleOf,
} from "./domain/records.js";
import { weekSetup } from "./domain/presentation.js";
import { defaultCatalogs, validateCatalogs } from "./domain/catalogs.js";
import {
  parseBackup,
  initialState,
  persist,
  mergeRecords,
  downloadJson,
} from "./services/storage.js";
import {
  createProfile,
  readActiveProfileId,
  readProfileData,
  rememberProfile,
  listProfiles,
  forgetProfile,
  listArchivedProfiles,
  restoreProfile,
} from "./services/profile.js";
import {
  createMatrixPayload,
  parseMatrixPayload,
  createDeliveryState,
  createStudent,
  createWeek,
  registerDelivery,
  setDeliveryStatus,
  weekSummary,
  findStudentByMatrixValue,
  findStudentSuggestionsByMatrixValue,
  matrixPeriodLabel,
} from "./services/delivery-registry.js";
import {
  SCANNER_ERROR_CATALOG,
  scannerCodeForCameraError,
  scannerDecoderErrorKind,
  createScannerIssue,
  scannerDiagnosticSnapshot,
  formatScannerDiagnostic,
} from "./services/scanner-diagnostics.js";
import {
  getCalendarState,
  startCalendarEasterEggs,
} from "./services/calendar-easter-eggs.js";
import { nextMisspelling, replaceSpelling } from "./services/spelling-core.js";
import { PROJECT_DICTIONARY_WORDS } from "./services/spelling-dictionary.js";
import { buildPageModel } from "./services/pdf.js";
import { makePdf, deliver } from "./services/delivery.js";
import {
  buildDeliveryReportModel,
  generateDeliveryReportPdf,
} from "./services/delivery-report.js";
import { notify } from "./services/rare-notification.jsx";

const CALENDAR_PRESETS = [
  ["2027-01-01", "Año nuevo"],
  ["2026-01-10", "Temporada de enero"],
  ["2026-01-23", "México × Alemania"],
  ["2026-05-15", "Día del Maestro"],
  ["2026-09-01", "BBiG"],
  ["2026-09-16", "Independencia"],
  ["2026-10-31", "Halloween"],
  ["2026-11-01", "Día de Muertos · 1"],
  ["2026-11-02", "Día de Muertos · 2"],
  ["2026-11-20", "Revolución"],
  ["2026-12-10", "Temporada de diciembre"],
  ["2026-12-24", "Nochebuena"],
  ["2026-12-25", "Navidad"],
];

const memoryStorage = () => {
  const data = new Map();
  return {
    get length() {
      return data.size;
    },
    key(index) {
      return [...data.keys()][index] ?? null;
    },
    getItem(key) {
      return data.has(String(key)) ? data.get(String(key)) : null;
    },
    setItem(key, value) {
      data.set(String(key), String(value));
    },
    removeItem(key) {
      data.delete(String(key));
    },
    clear() {
      data.clear();
    },
  };
};

function mexicoToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return map.year + "-" + map.month + "-" + map.day;
}

function dateFromInput(value) {
  return new Date(value + "T12:00:00-06:00");
}

function sampleRecord() {
  const record = blankRecord();
  const company = defaultCatalogs.companies[0]?.name || "Empresa de prueba";
  record.weekDate = "2026-10-06";
  record.defaultStart = "10:00";
  record.defaultEnd = "14:00";
  record.student = "Persona de prueba";
  record.company = company;
  record.authorities.autorizoName = "Responsable de prueba";
  record.authorities.autorizoRole = "Responsable autorizado";
  record.entries = generateEntries(record, "Área de pruebas").map((entry, index) => ({
    ...entry,
    activity:
      "Actividad de prueba completa número " +
      (index + 1) +
      " para verificar el funcionamiento.",
  }));
  return record;
}

function sampleDeliveryState() {
  const state = createDeliveryState();
  state.context = { school: "Plantel de prueba", generation: "2026" };
  const student = createStudent({
    id: "student-debug-1",
    name: "Persona de prueba",
    specialty: "Programación",
    company: defaultCatalogs.companies[0]?.name || "Empresa de prueba",
  });
  let week = createWeek({
    id: "week-debug-1",
    label: "Semana de prueba",
    startDate: "2026-10-06",
    endDate: "2026-10-09",
    dueAt: "2026-10-09T18:00:00-06:00",
  });
  week = registerDelivery(
    week,
    student.id,
    "2026-10-09T16:30:00-06:00",
    "manual",
  );
  return { ...state, students: [student], weeks: [week] };
}

function environmentSnapshot() {
  let storage = false;
  let storageBytes = 0;
  let storageKeys = [];
  try {
    localStorage.setItem("__bitacora_debug_probe__", "1");
    localStorage.removeItem("__bitacora_debug_probe__");
    storage = true;
    storageKeys = Object.keys(localStorage)
      .filter((key) => key.startsWith("bitacora"))
      .sort();
    storageBytes = storageKeys.reduce(
      (sum, key) => sum + key.length + String(localStorage.getItem(key) || "").length,
      0,
    );
  } catch {}
  return {
    version: VERSION,
    release: RELEASE,
    online: navigator.onLine,
    secureContext: window.isSecureContext,
    serviceWorker: "serviceWorker" in navigator,
    camera: Boolean(navigator.mediaDevices?.getUserMedia),
    barcodeDetector: "BarcodeDetector" in window,
    shareFiles: Boolean(navigator.share && navigator.canShare),
    localStorage: storage,
    storageKeys,
    storageBytes,
    userAgent: navigator.userAgent,
    url: location.href,
  };
}

function runSmokeTests() {
  const results = [];
  const add = (name, test) => {
    try {
      const detail = test();
      results.push({
        name,
        pass: detail !== false,
        detail:
          typeof detail === "string"
            ? detail
            : detail === undefined || detail === true
              ? "OK"
              : JSON.stringify(detail),
      });
    } catch (error) {
      results.push({
        name,
        pass: false,
        detail: error?.message || String(error),
      });
    }
  };

  const record = sampleRecord();

  add("Fechas y horarios", () =>
    validDate("2026-10-06") &&
    validTime("10:00") &&
    weekDates("2026-10-06").length === 4,
  );
  add("Configuración semanal", () => {
    const result = weekSetup("2026-10-06", "10:00", "14:00");
    return result.dates?.length === 4 ? result.dates.join(", ") : false;
  });
  add("Generación y validación de bitácora", () => {
    const errors = validateRecord(record);
    return Object.keys(errors).length === 0
      ? titleOf(record)
      : "Errores: " + JSON.stringify(errors);
  });
  add("Estado inhábil", () => {
    const updated = withStatus(record.entries[0], "inhabil");
    return updated.status === "inhabil" && updated.activity.length > 10;
  });
  add("Maquetación PDF", () => {
    const model = buildPageModel(record);
    return model.fits ? "El contenido cabe en la hoja." : false;
  });
  add("Catálogos", () => {
    validateCatalogs(defaultCatalogs);
    return (
      defaultCatalogs.schools.length +
      " plantel(es), " +
      defaultCatalogs.companies.length +
      " empresa(s)"
    );
  });
  add("Almacenamiento y respaldo", () => {
    const storage = memoryStorage();
    const state = initialState(storage);
    state.draft = record;
    persist(state, storage);
    const loaded = initialState(storage);
    const parsed = parseBackup(JSON.stringify({ records: [record] }));
    const merged = mergeRecords([], parsed.records);
    return loaded.draft.student === record.student && merged.added === 1;
  });
  add("Perfiles aislados", () => {
    const storage = memoryStorage();
    const id = createProfile({ name: "Perfil Debug", group: "A" }, storage);
    rememberProfile({ specialty: "Programación" }, storage);
    const active = readActiveProfileId(storage);
    const data = readProfileData(storage);
    const listed = listProfiles(storage);
    forgetProfile(storage);
    const archived = listArchivedProfiles(storage);
    const restored = restoreProfile(id, storage);
    return (
      active === id &&
      data.specialty === "Programación" &&
      listed.length === 1 &&
      archived.some((item) => item.id === id) &&
      restored
    );
  });
  add("Corrector ortográfico básico", () => {
    const fakeSpell = {
      correct: (word) => word.toLocaleLowerCase("es") !== "holaa",
      suggest: () => ["hola"],
    };
    const issue = nextMisspelling("Holaa mundo", fakeSpell);
    const fixed = replaceSpelling("Holaa mundo", issue, "Hola");
    return fixed === "Hola mundo" && PROJECT_DICTIONARY_WORDS.length > 100;
  });
  add("Data Matrix y coincidencia", () => {
    const state = sampleDeliveryState();
    const student = state.students[0];
    const week = state.weeks[0];
    const payload = createMatrixPayload({
      name: student.name,
      specialty: student.specialty,
      company: student.company,
      startDate: week.startDate,
      endDate: week.endDate,
    });
    const parsed = parseMatrixPayload(payload);
    const match = findStudentByMatrixValue(state.students, payload);
    return match?.id === student.id && parsed.version === 4
      ? matrixPeriodLabel(payload)
      : false;
  });
  add("Sugerencias de coincidencia", () => {
    const state = sampleDeliveryState();
    const student = state.students[0];
    const payload = createMatrixPayload({
      name: "Persona de prueva",
      specialty: student.specialty,
      company: student.company,
      startDate: state.weeks[0].startDate,
      endDate: state.weeks[0].endDate,
    });
    return findStudentSuggestionsByMatrixValue(state.students, payload).length >= 1;
  });
  add("Estados y resumen de entregas", () => {
    const state = sampleDeliveryState();
    const week = setDeliveryStatus(
      state.weeks[0],
      state.students[0].id,
      "no_aplica",
    );
    const summary = weekSummary(week, state.students);
    return summary.no_aplica === 1 && summary.percent === 100;
  });
  add("Modelo de reporte de entregas", () => {
    const model = buildDeliveryReportModel(sampleDeliveryState(), {
      mode: "simple",
    });
    return model.students === 1 || model.students?.length === 1;
  });
  add("Diagnóstico de escáner", () => {
    const code = scannerCodeForCameraError({ name: "NotAllowedError" });
    const kind = scannerDecoderErrorKind({ name: "NotFoundException" });
    const issue = createScannerIssue(code, { name: "NotAllowedError" }, {
      stage: "debug",
      source: "simulado",
    });
    const snapshot = scannerDiagnosticSnapshot({
      issue,
      cameraState: "debug",
      video: null,
      stream: null,
      version: VERSION,
    });
    const text = formatScannerDiagnostic(snapshot);
    return code === "CAM-003" && kind === "miss" && text.includes("CAM-003");
  });
  add("Motor de efemérides", () => {
    const state = getCalendarState(dateFromInput("2026-11-02"));
    return state.event?.id === "day-of-the-dead-2" ? state.event.title : false;
  });

  return results;
}

function Card({ title, description, wide = false, children }) {
  return (
    <section className={"debug-card" + (wide ? " wide" : "")}>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {children}
    </section>
  );
}

function DebugPage() {
  const [tests, setTests] = useState(() => runSmokeTests());
  const [calendarDate, setCalendarDate] = useState(mexicoToday);
  const [calendarState, setCalendarState] = useState(() =>
    getCalendarState(dateFromInput(mexicoToday())),
  );
  const [cameraOutput, setCameraOutput] = useState("Sin prueba manual.");
  const [iframeWidth, setIframeWidth] = useState("390");
  const [iframePage, setIframePage] = useState("../");
  const [actionOutput, setActionOutput] = useState("");
  const calendarStop = useRef(null);
  const env = useMemo(environmentSnapshot, []);
  const passed = tests.filter((item) => item.pass).length;

  useEffect(
    () => () => {
      calendarStop.current?.();
    },
    [],
  );

  const previewCalendar = (value = calendarDate) => {
    calendarStop.current?.();
    const date = dateFromInput(value);
    const state = getCalendarState(date);
    setCalendarState(state);
    calendarStop.current = startCalendarEasterEggs({
      now: date,
      storage: {
        getItem: () => null,
        setItem: () => {},
      },
    });
  };

  const resetCalendar = () => {
    calendarStop.current?.();
    calendarStop.current = null;
    document
      .querySelectorAll("[class*='calendar-season-'],[class*='calendar-event-']")
      .forEach(() => {});
    setCalendarState(getCalendarState(dateFromInput(calendarDate)));
  };

  const testCamera = async () => {
    if (!window.isSecureContext) {
      setCameraOutput("CAM-001 · La página no está en un contexto seguro.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraOutput("CAM-002 · getUserMedia no está disponible.");
      return;
    }
    setCameraOutput("Solicitando acceso a la cámara…");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const track = stream.getVideoTracks()[0];
      const settings = track?.getSettings?.() || {};
      stream.getTracks().forEach((item) => item.stop());
      setCameraOutput(
        "OK · Cámara disponible. " +
          (settings.width && settings.height
            ? settings.width + "×" + settings.height
            : "El navegador no reportó resolución."),
      );
    } catch (error) {
      const code = scannerCodeForCameraError(error);
      const issue = createScannerIssue(code, error, {
        stage: "debug-camera",
        source: "getUserMedia",
      });
      setCameraOutput(formatScannerDiagnostic(scannerDiagnosticSnapshot({
        issue,
        cameraState: "error",
        video: null,
        stream: null,
        version: VERSION,
      })));
    }
  };

  const makeTestPdf = async () => {
    try {
      setActionOutput("Generando PDF de prueba…");
      const file = await makePdf(sampleRecord());
      await deliver(file);
      setActionOutput("PDF generado: " + file.name);
    } catch (error) {
      setActionOutput("Error PDF: " + (error?.message || error));
    }
  };

  const makeRegistryPdf = async () => {
    try {
      setActionOutput("Generando reporte de entregas…");
      const result = await generateDeliveryReportPdf(sampleDeliveryState(), {
        mode: "simple",
      });
      setActionOutput(
        "Reporte generado: " + result.filename + " · " + result.pages + " página(s).",
      );
    } catch (error) {
      setActionOutput("Error reporte: " + (error?.message || error));
    }
  };

  const exportReport = () => {
    downloadJson(
      {
        createdAt: new Date().toISOString(),
        environment: env,
        tests,
        calendar: calendarState,
      },
      "bitacora-debug-report.json",
    );
  };

  return (
    <main className="debug-shell">
      <nav className="debug-topbar">
        <div className="debug-brand">
          <strong>Bitácora Dual</strong>
          <span>/</span>
          <span>Debug</span>
          <span className="debug-version">{VERSION}</span>
        </div>
        <a className="debug-link" href="../">Salir</a>
      </nav>

      <header className="debug-hero">
        <h1>Debug</h1>
        <p>Pruebas internas del sistema. Las pruebas automáticas usan memoria aislada.</p>
      </header>

      <div className="debug-grid">
        <Card
          title="Pruebas automáticas"
          description="Verifica los módulos principales sin modificar datos reales."
          wide
        >
          <div className="debug-row">
            <button className="debug-button primary" onClick={() => setTests(runSmokeTests())}>
              Ejecutar pruebas
            </button>
            <button className="debug-button" onClick={exportReport}>
              Descargar reporte JSON
            </button>
          </div>
          <div className="debug-kpis">
            <div className="debug-kpi"><small>Correctas</small><strong>{passed}</strong></div>
            <div className="debug-kpi"><small>Fallidas</small><strong>{tests.length - passed}</strong></div>
            <div className="debug-kpi"><small>Total</small><strong>{tests.length}</strong></div>
            <div className="debug-kpi"><small>Diccionario</small><strong>{PROJECT_DICTIONARY_WORDS.length}</strong></div>
          </div>
          <div className="debug-test-list">
            {tests.map((test) => (
              <div className={"debug-test " + (test.pass ? "pass" : "fail")} key={test.name}>
                <strong>{test.pass ? "PASS · " : "FAIL · "}{test.name}</strong>
                <span>{test.detail}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Efemérides"
          description="Simula una fecha y ejecuta el motor real. Sólo incluye activadores por fecha."
          wide
        >
          <div className="debug-row">
            <div className="debug-field">
              <label htmlFor="debug-date">Fecha simulada</label>
              <input
                id="debug-date"
                type="date"
                value={calendarDate}
                onChange={(event) => setCalendarDate(event.target.value)}
              />
            </div>
            <button className="debug-button primary" onClick={() => previewCalendar()}>
              Mostrar
            </button>
            <button className="debug-button" onClick={resetCalendar}>
              Limpiar visual
            </button>
          </div>
          <div className="debug-presets">
            {CALENDAR_PRESETS.map(([date, label]) => (
              <button
                className="debug-preset"
                key={date}
                onClick={() => {
                  setCalendarDate(date);
                  previewCalendar(date);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <pre className="debug-output">{JSON.stringify(calendarState, null, 2)}</pre>
        </Card>

        <Card
          title="Notificaciones"
          description="Ejecuta cada tipo de aviso."
        >
          <div className="debug-row">
            <button className="debug-button" onClick={() => notify("success", "Prueba correcta", "Notificación success.")}>Success</button>
            <button className="debug-button" onClick={() => notify("info", "Información", "Notificación info.")}>Info</button>
            <button className="debug-button" onClick={() => notify("warning", "Advertencia", "Notificación warning.")}>Warning</button>
            <button className="debug-button" onClick={() => notify("error", "Error de prueba", "Notificación error.")}>Error</button>
          </div>
        </Card>

        <Card
          title="PDF"
          description="Genera archivos con datos de prueba."
        >
          <div className="debug-row">
            <button className="debug-button primary" onClick={makeTestPdf}>
              PDF de bitácora
            </button>
            <button className="debug-button" onClick={makeRegistryPdf}>
              PDF de entregas
            </button>
          </div>
          {actionOutput ? <div className="debug-output">{actionOutput}</div> : null}
        </Card>

        <Card
          title="Escáner y cámara"
          description="Comprueba acceso a cámara y diagnóstico del lector."
        >
          <div className="debug-row">
            <button className="debug-button primary" onClick={testCamera}>
              Probar cámara
            </button>
          </div>
          <div className="debug-output">{cameraOutput}</div>
          <div className="debug-note">
            Códigos disponibles: {Object.keys(SCANNER_ERROR_CATALOG).join(", ")}
          </div>
        </Card>

        <Card
          title="Entorno"
          description="Capacidades del navegador y estado local."
        >
          <ul className="debug-storage-list">
            <li>Versión: {env.version} · {env.release}</li>
            <li>En línea: {String(env.online)}</li>
            <li>Contexto seguro: {String(env.secureContext)}</li>
            <li>Service Worker: {String(env.serviceWorker)}</li>
            <li>Cámara: {String(env.camera)}</li>
            <li>BarcodeDetector: {String(env.barcodeDetector)}</li>
            <li>Compartir archivos: {String(env.shareFiles)}</li>
            <li>localStorage: {String(env.localStorage)} · {env.storageBytes} caracteres aprox.</li>
            <li>Claves Bitácora: {env.storageKeys.length ? env.storageKeys.join(", ") : "ninguna"}</li>
          </ul>
        </Card>

        <Card
          title="Módulos"
          description="Abre directamente cada área publicada."
          wide
        >
          <div className="debug-row">
            <a className="debug-link" href="../" target="_blank" rel="noreferrer">Generador</a>
            <a className="debug-link" href="../registro-entrega/" target="_blank" rel="noreferrer">Registro de entregas</a>
            <a className="debug-link" href="../faq/" target="_blank" rel="noreferrer">FAQ</a>
            <a className="debug-link" href="../presentacion/" target="_blank" rel="noreferrer">Presentación</a>
            <a className="debug-link" href="../accessibility/" target="_blank" rel="noreferrer">Accesibilidad</a>
            <a className="debug-link" href="../privacy/" target="_blank" rel="noreferrer">Privacidad</a>
            <a className="debug-link" href="../cookies/" target="_blank" rel="noreferrer">Cookies</a>
            <a className="debug-link" href="../terms/" target="_blank" rel="noreferrer">Términos</a>
            <a className="debug-link" href="../acknowledgements/" target="_blank" rel="noreferrer">Agradecimientos</a>
          </div>
        </Card>

        <Card
          title="Vista adaptable"
          description="Carga una página real a un ancho fijo."
          wide
        >
          <div className="debug-row">
            <div className="debug-field">
              <label htmlFor="frame-width">Ancho</label>
              <select id="frame-width" value={iframeWidth} onChange={(event) => setIframeWidth(event.target.value)}>
                <option value="390">Teléfono · 390 px</option>
                <option value="768">Tableta · 768 px</option>
                <option value="1024">Horizontal · 1024 px</option>
                <option value="1280">Escritorio · 1280 px</option>
              </select>
            </div>
            <div className="debug-field">
              <label htmlFor="frame-page">Página</label>
              <select id="frame-page" value={iframePage} onChange={(event) => setIframePage(event.target.value)}>
                <option value="../">Generador</option>
                <option value="../registro-entrega/">Registro de entregas</option>
                <option value="../faq/">FAQ</option>
                <option value="../presentacion/">Presentación</option>
              </select>
            </div>
          </div>
          <div className="debug-frame-wrap">
            <iframe
              className="debug-frame"
              title="Vista adaptable de prueba"
              src={iframePage + "?debug-preview=1"}
              style={{ width: iframeWidth + "px" }}
            />
          </div>
          <div className="debug-note">
            El iframe usa el almacenamiento normal del navegador.
          </div>
        </Card>
      </div>
    </main>
  );
}

createRoot(document.getElementById("debug-root")).render(<DebugPage />);
