import Authorities from "./components/Authorities.jsx";
import { useEffect, useMemo, useRef, useState, lazy, Suspense } from "react";
import { Toaster, sileo } from "sileo";
import {
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  BookOpenIcon,
  SlidersHorizontalIcon,
  ClockCounterClockwiseIcon,
} from "@phosphor-icons/react";
import Field, { ValidationDisplay } from "./components/Field.jsx";
import Modal from "./components/Modal.jsx";
import Days from "./components/Days.jsx";
import Preview from "./components/Preview.jsx";
import History from "./components/History.jsx";
import Credits, { eggNames } from "./components/Credits.jsx";
import useWorkspace from "./hooks/useWorkspace.js";
import {
  blankRecord,
  generateEntries,
  validateRecord,
  validDate,
  validTime,
  VERSION,
  RELEASE,
  uid,
  normalizeRecord,
  recordShape,
} from "./domain/records.js";
import { defaultCatalogs, validateCatalogs } from "./domain/catalogs.js";
import {
  downloadJson,
  parseBackup,
  mergeRecords,
  persist,
} from "./services/storage.js";
import { buildPageModel } from "./services/pdf.js";
import { makePdf, deliver } from "./services/delivery.js";
const CatalogEditor = lazy(() => import("./components/CatalogEditor.jsx"));
const steps = [
  "Escuela",
  "Alumno y empresa",
  "Jornadas",
  "Responsables",
  "Revisar y guardar",
];
const descriptions = [
  "Selecciona tus datos escolares.",
  "Tu nombre y la empresa que te recibe.",
  "Describe lo que realizaste cada día.",
  "Confirma los nombres y cargos de quienes firman.",
  "Revisa el documento antes de descargarlo.",
];
const tips = [
  "Elige el plantel y revisa especialidad, semestre y grupo. Si falta un plantel, agrégalo en Catálogos.",
  "Escribe tu nombre como debe aparecer en el documento. Elegir una empresa prepara sus horarios y responsables.",
  "Elige una fecha de la semana y genera las cuatro jornadas. Puedes ajustar cada horario. Una falta o un día sin labores necesita justificación.",
  "El nombre del alumno se sincroniza solo. Revisa el visto bueno del plantel y selecciona o escribe a quien autoriza.",
  "Amplía la vista previa para comprobar los datos. Guarda la bitácora y descarga el PDF. Exporta un respaldo para proteger tu historial.",
];
export default function App() {
  const [state, setState, saveStatus] = useWorkspace(),
    record = state.draft;
  const [step, setStep] = useState(0),
    [attempted, setAttempted] = useState(false),
    [modal, setModal] = useState(null),
    [confirmation, setConfirmation] = useState(null),
    [logo, setLogo] = useState(null),
    [logoError, setLogoError] = useState(false),
    [busy, setBusy] = useState(false),
    [help, setHelp] = useState(() => {
      try {
        return !localStorage.getItem("bitacora_dual_onboarding_v3");
      } catch {
        return true;
      }
    }),
    [online, setOnline] = useState(navigator.onLine),
    [update, setUpdate] = useState(null),
    [importError, setImportError] = useState("");
  const heading = useRef(),
    lastEgg = useRef("");
  const catalogs = useMemo(() => {
    try {
      return validateCatalogs(state.catalogs || defaultCatalogs);
    } catch {
      return defaultCatalogs;
    }
  }, [state.catalogs]);
  const school = catalogs.schools.find((s) => s.name === record.school),
    company = catalogs.companies.find((c) => c.name === record.company);
  const errors = validateRecord(record),
    visible = validateRecord(record, step),
    model = buildPageModel(record);
  const setRecord = (r) =>
    setState((s) => ({
      ...s,
      draft: typeof r === "function" ? r(s.draft) : r,
    }));
  const patch = (key, value) =>
    setRecord((r) => ({
      ...r,
      [key]: value,
      ...(key === "student"
        ? { authorities: { ...r.authorities, elaboroName: value } }
        : {}),
    }));
  const auth = (key, value) =>
    setRecord((r) => ({
      ...r,
      authorities: { ...r.authorities, [key]: value },
    }));
  const instructor = (key, value) =>
    setRecord((r) => ({ ...r, instructor: { ...r.instructor, [key]: value } }));
  const notify = (title, description) => sileo.success({ title, description });
  const ask = (title, text, action) => setConfirmation({ title, text, action });
  const go = (i) => {
    setStep(i);
    setAttempted(false);
    requestAnimationFrame(() => {
      heading.current?.focus();
      heading.current?.scrollIntoView({ block: "start", behavior: "instant" });
    });
  };
  useEffect(() => {
    const img = new Image();
    img.onload = () => setLogo(img);
    img.onerror = () => setLogoError(true);
    img.src = "./Assets/Edu.png";
    const on = () => setOnline(navigator.onLine),
      onUpdate = (e) => setUpdate(e.detail);
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    window.addEventListener("bitacora-update", onUpdate);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
      window.removeEventListener("bitacora-update", onUpdate);
    };
  }, []);
  useEffect(() => {
    const name = record.student.trim().toLowerCase().replace(/\s+/g, " "),
      virtual = record.entries.some((e) =>
        e.activity.toLowerCase().includes("virtual insanity"),
      );
    const key = eggNames.has(name) ? name : virtual ? "virtual insanity" : "";
    if (key && lastEgg.current !== key)
      setModal(
        key === "jamiroquai" || key === "virtual insanity"
          ? "virtual"
          : "credits",
      );
    lastEgg.current = key;
  }, [record.student, record.entries]);
  const save = () => {
    setAttempted(true);
    if (Object.keys(errors).length || !model.fits) {
      sileo.warning({
        title: "Falta revisar algunos datos",
        description: "Los campos pendientes aparecen en la revisión.",
      });
      go(4);
      setAttempted(true);
      return false;
    }
    const r = { ...record, updatedAt: new Date().toISOString() };
    const next = {
      ...state,
      draft: r,
      records: [r, ...state.records.filter((x) => x.id !== r.id)],
    };
    try {
      if (state.storageError)
        throw new Error("Primero exporta la recuperación.");
      persist(next);
      setState(next);
      notify("Bitácora guardada");
      return true;
    } catch (e) {
      sileo.error({
        title: "No se pudo guardar",
        description: "Exporta un respaldo para conservar tu trabajo.",
      });
      return false;
    }
  };
  const exportAll = () =>
    downloadJson(
      {
        schemaVersion: 1,
        version: VERSION,
        records: state.records,
        draft: record,
        catalogs,
      },
      "respaldo_bitacoras_dual.json",
    );
  async function importFile(file) {
    try {
      if (file.size > 5_000_000) throw new Error("El archivo supera 5 MB.");
      const parsed = parseBackup(await file.text());
      if (parsed.catalogs) validateCatalogs(parsed.catalogs);
      if (parsed.draft && !recordShape(parsed.draft))
        throw new Error("El borrador del respaldo no es compatible.");
      setImportError("");
      setModal(null);
      ask(
        "Importar respaldo",
        `Se agregarán hasta ${parsed.records.length} bitácoras sin borrar las actuales.${parsed.catalogs ? " También se restaurarán los catálogos." : ""}${parsed.draft ? " El borrador actual se conservará como copia en el historial y se abrirá el importado." : ""}`,
        () => {
          setState((s) => {
            let records = mergeRecords(s.records, parsed.records).records;
            if (parsed.draft && (s.draft.student || s.draft.entries.length))
              records = mergeRecords(records, [s.draft]).records;
            return {
              ...s,
              records,
              catalogs: parsed.catalogs || s.catalogs,
              draft: parsed.draft ? normalizeRecord(parsed.draft) : s.draft,
            };
          });
          notify("Respaldo importado");
        },
      );
    } catch (e) {
      setImportError(e.message);
      sileo.error({
        title: "No se importó el archivo",
        description: e.message,
      });
    }
  }
  async function pdf() {
    setBusy(true);
    try {
      if (!logo)
        throw new Error(
          "No se ha cargado el encabezado. Revisa tu conexión y vuelve a abrir la aplicación.",
        );
      const file = await makePdf(record, logo);
      if (await deliver(file)) setModal("delivery");
    } catch (e) {
      sileo.error({
        title: "No se pudo generar el PDF",
        description: e.message,
      });
    } finally {
      setBusy(false);
    }
  }
  function chooseSchool(name) {
    const s = catalogs.schools.find((x) => x.name === name);
    if (!s) {
      patch("school", name);
      return;
    }
    setRecord((r) => ({
      ...r,
      school: name,
      specialty: s.specialties[0],
      semester: s.semesters[0],
      group: s.groups[0],
      authorities: {
        ...r.authorities,
        elaboroRole: `Alumno de Educación Dual\n${s.shortName}`,
        voboName: s.voboName,
        voboRole: s.voboRole,
      },
    }));
  }
  function chooseCompany(name) {
    const c = catalogs.companies.find((x) => x.name === name);
    setRecord((r) => ({
      ...r,
      company: name,
      defaultStart: c?.start || "09:00",
      defaultEnd: c?.end || "14:00",
      authorities: {
        ...r.authorities,
        autorizoName:
          c?.representatives.length === 1 ? c.representatives[0].name : "",
        autorizoRole:
          c?.representatives.length === 1 ? c.representatives[0].role : "",
      },
      instructor: {
        enabled: false,
        name: "",
        roleMain: "",
        note: "Instructor Formador",
      },
    }));
    if (record.entries.length)
      sileo.info({
        title: "Empresa actualizada",
        description:
          "Los horarios de las jornadas existentes se conservan. Revísalos si es necesario.",
      });
  }
  const next = () => {
    if (
      Object.keys(validateRecord(record, step)).length ||
      (step === 2 && !model.fits)
    ) {
      setAttempted(true);
      requestAnimationFrame(() =>
        document.querySelector('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
    go(step + 1);
  };
  const generate = () => {
    if (
      !validDate(record.weekDate) ||
      !validTime(record.defaultStart) ||
      !validTime(record.defaultEnd) ||
      record.defaultEnd <= record.defaultStart
    ) {
      sileo.warning({
        title: "Revisa la fecha y el horario",
        description: "La salida debe ser posterior a la entrada.",
      });
      return;
    }
    const action = () => {
      patch("entries", generateEntries(record, company?.area));
      notify("Cuatro jornadas preparadas");
    };
    if (record.entries.some((e) => e.activity.trim()))
      ask(
        "Cambiar semana",
        "Se reemplazarán las jornadas y sus actividades. Exporta un respaldo si deseas conservarlas.",
        action,
      );
    else action();
  };
  function openRecord(r, duplicate = false) {
    setModal(null);
    ask(
      duplicate ? "Duplicar bitácora" : "Abrir bitácora",
      "El borrador actual se conservará como copia en el historial.",
      () => {
        setState((s) => ({
          ...s,
          records:
            s.draft.student || s.draft.entries.length
              ? mergeRecords(s.records, [s.draft]).records
              : s.records,
          draft: normalizeRecord({ ...r, id: duplicate ? uid() : r.id }),
        }));
        go(0);
      },
    );
  }
  return (
    <ValidationDisplay value={attempted}>
      <Toaster
        position="top-center"
        theme="light"
        options={{ duration: 4500 }}
      />
      <a className="skip" href="#main">
        Ir al formulario
      </a>
      <div className="shell">
        <header className="topbar">
          <a className="brand" href="./">
            <img src="./Assets/Edu.png" alt="Educación" />
            <span>Bitácora Dual</span>
          </a>
          <div className="actions">
            <button onClick={() => setModal("history")}>
              <ClockCounterClockwiseIcon size={19} />
              <span>Historial</span>
            </button>
            <button onClick={() => setModal("catalogs")}>
              <SlidersHorizontalIcon size={19} />
              <span>Catálogos</span>
            </button>
            <button onClick={() => setHelp(!help)} aria-pressed={help}>
              <BookOpenIcon size={19} />
              <span>Ayuda</span>
            </button>
          </div>
        </header>
        <div className="intro">
          <div>
            <p className="version">
              Beta {VERSION} · {RELEASE}
            </p>
            <h1>Tu semana, en orden.</h1>
            <p>Completa tu bitácora paso a paso y llévala lista para firmar.</p>
          </div>
          <span className="save-state" role="status">
            {online ? saveStatus : "Sin conexión · " + saveStatus}
          </span>
        </div>
        {state.storageError && (
          <div className="warning" role="alert">
            {state.storageError}
            <button
              onClick={() =>
                downloadJson(
                  state.recoveryRaw || state,
                  "recuperacion_bitacora.json",
                )
              }
            >
              Exportar recuperación
            </button>
            <button
              onClick={() =>
                ask(
                  "Habilitar guardado",
                  "Continúa solo si ya descargaste el archivo de recuperación. Se reemplazará el almacenamiento incompatible.",
                  () =>
                    setState((s) => ({
                      ...s,
                      storageError: undefined,
                      recoveryRaw: undefined,
                    })),
                )
              }
            >
              Ya tengo una copia
            </button>
          </div>
        )}
        {update && (
          <div className="note">
            Hay una nueva versión lista. Tu borrador se conserva.
            <button
              onClick={() => {
                try {
                  persist(state);
                  update.postMessage({ type: "SKIP_WAITING" });
                } catch {
                  sileo.error({
                    title: "Exporta un respaldo antes de actualizar",
                  });
                }
              }}
            >
              Actualizar ahora
            </button>
          </div>
        )}
        <div className="workspace">
          <nav className="steps" aria-label="Etapas de la bitácora">
            <p>Paso {step + 1} de 5</p>
            {steps.map((label, i) => (
              <button
                key={label}
                className={step === i ? "current" : ""}
                aria-current={step === i ? "step" : undefined}
                onClick={() => go(i)}
              >
                <b>
                  {i < step &&
                  !Object.keys(validateRecord(record, i)).length ? (
                    <CheckCircleIcon size={21} />
                  ) : (
                    i + 1
                  )}
                </b>
                <span>{label}</span>
              </button>
            ))}
            <div className="privacy">
              Tus datos se guardan en este navegador. Exporta un respaldo para
              llevarlos a otro dispositivo.
            </div>
            <button
              className="new-button"
              onClick={() =>
                ask(
                  "Nueva bitácora",
                  "Tu borrador actual se conservará en el historial.",
                  () => {
                    setState((s) => ({
                      ...s,
                      records:
                        s.draft.student || s.draft.entries.length
                          ? mergeRecords(s.records, [s.draft]).records
                          : s.records,
                      draft: blankRecord(),
                    }));
                    go(0);
                  },
                )
              }
            >
              Nueva bitácora
            </button>
            <a href="./faq/" target="_blank" rel="noreferrer">
              Preguntas frecuentes
            </a>
          </nav>
          <main id="main" className="panel">
            <div className="panel-head">
              <p className="step-count">Paso {step + 1}</p>
              <h2 ref={heading} tabIndex={-1}>
                {steps[step]}
              </h2>
              <p>{descriptions[step]}</p>
            </div>
            {help && (
              <aside className="help">
                <strong>Cómo completar este paso</strong>
                <p>{tips[step]}</p>
                <button
                  onClick={() => {
                    setHelp(false);
                    try {
                      localStorage.setItem(
                        "bitacora_dual_onboarding_v3",
                        "completed",
                      );
                    } catch {}
                  }}
                >
                  Entendido
                </button>
              </aside>
            )}
            <div className="panel-body">
              {step === 0 && (
                <div className="fields">
                  <Field
                    className="full"
                    label="Plantel"
                    value={record.school}
                    options={[
                      ...catalogs.schools.map((s) => ({
                        value: s.name,
                        label: s.shortName || s.name,
                      })),
                      ...(!school
                        ? [
                            {
                              value: record.school,
                              label: record.school || "Elige un plantel",
                            },
                          ]
                        : []),
                    ]}
                    onChange={chooseSchool}
                    error={visible.school}
                  />
                  <Field
                    className="full"
                    label="Especialidad"
                    value={record.specialty}
                    options={[
                      ...new Set([
                        ...(school?.specialties || []),
                        record.specialty,
                      ]),
                    ]}
                    onChange={(v) => patch("specialty", v)}
                    error={visible.specialty}
                  />
                  <Field
                    label="Semestre"
                    value={record.semester}
                    options={[
                      ...new Set([
                        ...(school?.semesters || ["4", "5", "6"]),
                        record.semester,
                      ]),
                    ]}
                    onChange={(v) => patch("semester", v)}
                    error={visible.semester}
                  />
                  <Field
                    label="Grupo"
                    value={record.group}
                    options={[
                      ...new Set([
                        ...(school?.groups || ["A", "B", "C", "D"]),
                        record.group,
                      ]),
                    ]}
                    onChange={(v) => patch("group", v)}
                    error={visible.group}
                  />
                  <p className="note full">
                    ¿No aparece tu escuela? Puedes agregarla desde Catálogos sin
                    salir de tu bitácora.
                  </p>
                </div>
              )}
              {step === 1 && (
                <div className="fields">
                  <Field
                    className="full"
                    label="Nombre completo del alumno"
                    autoComplete="name"
                    value={record.student}
                    onChange={(v) => patch("student", v)}
                    maxLength={100}
                    error={visible.student}
                    hint="Escríbelo tal como debe aparecer en la bitácora."
                  />
                  {record.student.trim() &&
                    record.student.trim().split(/\s+/).length < 3 && (
                      <p className="note full">
                        Comprueba que tu nombre esté completo. Puedes continuar
                        si tu nombre legal tiene menos palabras.
                      </p>
                    )}
                  <Field
                    className="full"
                    label="Empresa receptora"
                    value={record.company}
                    options={[
                      { value: "", label: "Selecciona una empresa" },
                      ...catalogs.companies.map((c) => ({
                        value: c.name,
                        label: c.name,
                      })),
                      ...(!company && record.company
                        ? [{ value: record.company, label: record.company }]
                        : []),
                    ]}
                    onChange={chooseCompany}
                    error={visible.company}
                  />
                  {company && (
                    <p className="note full">
                      Horario sugerido:{" "}
                      <strong>
                        {company.start} a {company.end}
                      </strong>
                      . Podrás ajustarlo en cada jornada.
                    </p>
                  )}
                </div>
              )}
              {step === 2 && (
                <Days
                  record={record}
                  patch={patch}
                  errors={visible}
                  generate={generate}
                />
              )}
              {step === 3 && (
                <Authorities
                  record={record}
                  company={company}
                  visible={visible}
                  auth={auth}
                  instructor={instructor}
                  setRecord={setRecord}
                />
              )}
              {step === 4 && (
                <>
                  <div
                    className={Object.keys(errors).length ? "warning" : "note"}
                  >
                    <strong>
                      {Object.keys(errors).length
                        ? "Revisa antes de descargar"
                        : "Datos completos"}
                    </strong>
                    {Object.keys(errors).length ? (
                      <ul>
                        {Object.entries(errors).map(([k, v]) => (
                          <li key={k}>
                            <button
                              className="text-button"
                              onClick={() => {
                                go(
                                  k.startsWith("entries")
                                    ? 2
                                    : k.startsWith("authorities") ||
                                        k.startsWith("instructor")
                                      ? 3
                                      : ["student", "company"].includes(k)
                                        ? 1
                                        : 0,
                                );
                                setAttempted(true);
                              }}
                            >
                              {v}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>
                        Comprueba nombres, horarios y cargos en la vista previa.
                      </p>
                    )}
                  </div>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={record.markdown}
                      onChange={(e) => patch("markdown", e.target.checked)}
                    />{" "}
                    Usar negritas, cursivas y listas Markdown
                  </label>
                  <Preview record={record} logo={logo} />
                  {logoError && (
                    <p className="error">
                      No se pudo cargar el encabezado institucional. Revisa la
                      conexión antes de descargar.
                    </p>
                  )}
                  <p className="note">
                    Las firmas deben ser autógrafas; no se permiten firmas
                    digitales. Imprime el documento y reúne las firmas
                    correspondientes.
                  </p>
                </>
              )}
              {!model.fits && (
                <div className="warning" role="alert">
                  El contenido excede el espacio del formato. Revisa
                  actividades, nombres y cargos; usa hasta cuatro líneas por
                  cargo. Tu texto se conserva completo.
                </div>
              )}
            </div>
            <footer className="step-actions">
              <button onClick={() => go(step - 1)} disabled={step === 0}>
                <ArrowLeftIcon size={18} /> Atrás
              </button>
              {step < 4 ? (
                <button className="primary" onClick={next}>
                  Continuar <ArrowRightIcon size={18} />
                </button>
              ) : (
                <div className="actions">
                  <button onClick={save}>Guardar bitácora</button>
                  <button
                    className="primary"
                    disabled={
                      busy ||
                      !!Object.keys(errors).length ||
                      !model.fits ||
                      !logo
                    }
                    onClick={pdf}
                  >
                    {busy ? "Generando…" : "Descargar PDF"}
                  </button>
                </div>
              )}
            </footer>
          </main>
        </div>
        <footer className="site-footer">
          Creado por Gio Antonio Canto Gómez ·{" "}
          <a href="https://github.com/gio-canto/generador-bitacora-dual_2026">
            Código y notas de versión
          </a>
        </footer>
      </div>
      {confirmation && (
        <Modal title={confirmation.title} onClose={() => setConfirmation(null)}>
          <p>{confirmation.text}</p>
          <div className="modal-actions">
            <button onClick={() => setConfirmation(null)}>Cancelar</button>
            <button
              className="primary"
              onClick={() => {
                confirmation.action();
                setConfirmation(null);
              }}
            >
              Continuar
            </button>
          </div>
        </Modal>
      )}
      {modal && (
        <Modal
          title={
            {
              catalogs: "Catálogos",
              history: "Tus bitácoras",
              credits: "Créditos",
              virtual: "Créditos",
              delivery: "Tu PDF está listo",
            }[modal]
          }
          onClose={() => setModal(null)}
        >
          {modal === "catalogs" && (
            <Suspense fallback={<p>Cargando catálogos…</p>}>
              <CatalogEditor
                catalogs={catalogs}
                onSave={(c) => {
                  try {
                    if (state.storageError) throw new Error();
                    const next = { ...state, catalogs: c };
                    persist(next);
                    setState(next);
                    setModal(null);
                    notify("Catálogos guardados");
                  } catch {
                    sileo.error({
                      title: "No se pudieron guardar los catálogos",
                      description:
                        "Revisa el almacenamiento del navegador antes de cerrar esta ventana.",
                    });
                  }
                }}
              />
            </Suspense>
          )}
          {modal === "history" && (
            <>
              {importError && (
                <p className="error" role="alert">
                  {importError}
                </p>
              )}
              <History
                records={state.records}
                onOpen={(r) => openRecord(r)}
                onDuplicate={(r) => openRecord(r, true)}
                onDelete={(r) => {
                  setState((s) => ({
                    ...s,
                    records: s.records.filter((x) => x.id !== r.id),
                  }));
                  sileo.action({
                    title: "Bitácora eliminada",
                    button: {
                      title: "Deshacer",
                      onClick: () =>
                        setState((s) => ({
                          ...s,
                          records: mergeRecords(s.records, [r]).records,
                        })),
                    },
                    duration: 10000,
                  });
                }}
                onImport={importFile}
                onExport={exportAll}
              />
            </>
          )}
          {(modal === "credits" || modal === "virtual") && (
            <Credits virtual={modal === "virtual"} />
          )}{" "}
          {modal === "delivery" && (
            <>
              <p>
                Imprime en A4 horizontal, al 100 %, y revisa que todos los datos
                sean correctos.
              </p>
              <p>
                Recomendación: imprime 3 copias, reúne las firmas y utiliza
                preferentemente tinta azul. Las firmas deben ser autógrafas. Si
                aún no tienes una firma definida, puedes escribir tu nombre
                completo.
              </p>
              <button className="primary" onClick={() => setModal(null)}>
                Entendido
              </button>
            </>
          )}
        </Modal>
      )}
    </ValidationDisplay>
  );
}
