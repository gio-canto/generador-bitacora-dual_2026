import { DEFAULTS, INHABIL_JUSTIFICATION } from "../data/defaults.js";
export const VERSION = "0.48.0-beta.2";
export const RELEASE = "Anti-fool upgrate";
export const MAX_DAYS = 4;
export const uid = () => crypto.randomUUID();
export function blankRecord() {
  return {
    ...structuredClone(DEFAULTS),
    id: uid(),
    entries: [],
    markdown: true,
    weekDate: "",
    defaultStart: "10:00",
    defaultEnd: "14:00",
  };
}
export function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(+d) && d.toISOString().slice(0, 10) === value;
}
export const validTime = (v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
export function weekDates(value) {
  if (!validDate(value)) return [];
  const d = new Date(`${value}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return [1, 2, 3, 4].map((i) => {
    const day = new Date(d);
    day.setUTCDate(day.getUTCDate() + i);
    return day.toISOString().slice(0, 10);
  });
}
export function generateEntries(record, area) {
  return weekDates(record.weekDate).map((date) => ({
    date,
    status: "laboral",
    start: record.defaultStart,
    end: record.defaultEnd,
    area: area || "Área de Informática",
    activity: "",
  }));
}
export function titleOf(record) {
  const dates = record.entries
    .map((e) => e.date)
    .filter(validDate)
    .sort();
  return dates.length
    ? `Semana del ${dates[0]} al ${dates.at(-1)}`
    : "Bitácora sin fechas";
}
export function normalizeRecord(raw) {
  const base = blankRecord();
  return {
    ...base,
    ...raw,
    semester: String(raw.semester ?? base.semester),
    company:
      raw.company === "100% Natural Aeropuerto S.A. de C.V. (100% Natural)"
        ? "El Buen Tzin S.A. de C.V. (100% Natural)"
        : raw.company || "",
    id: typeof raw.id === "string" ? raw.id : base.id,
    authorities: {
      ...base.authorities,
      ...raw.authorities,
      elaboroName: raw.student || "",
    },
    instructor: { ...base.instructor, ...raw.instructor },
    entries: (raw.entries || []).map((e) => ({
      ...e,
      status: e.status || "laboral",
    })),
  };
}
export function validateRecord(r, step) {
  const errors = {};
  const required = (key, v, label, max = 180) => {
    if (typeof v !== "string" || !v.trim()) errors[key] = `Escribe ${label}.`;
    else if (v.length > max)
      errors[key] = `Reduce ${label} a ${max} caracteres.`;
  };
  if (step === undefined || step === 0) {
    required("school", r.school, "el plantel");
    required("specialty", r.specialty, "la especialidad");
    required("semester", r.semester, "el semestre", 2);
    required("group", r.group, "el grupo", 12);
  }
  if (step === undefined || step === 1) {
    required("student", r.student, "tu nombre completo", 100);
    required("company", r.company, "la empresa");
  }
  if (step === undefined || step === 2) {
    if (r.entries.length !== MAX_DAYS)
      errors.entries = "Genera las cuatro jornadas de la semana.";
    const seen = new Set();
    r.entries.forEach((e, i) => {
      const k = `entries.${i}.`;
      if (!validDate(e.date)) errors[k + "date"] = "Elige una fecha válida.";
      else if (seen.has(e.date))
        errors[k + "date"] = "Esta fecha ya está en otra jornada.";
      seen.add(e.date);
      if (!["laboral", "falta", "sin_labores", "inhabil"].includes(e.status))
        errors[k + "status"] = "Selecciona un estado válido.";
      if (e.status === "laboral") {
        if (!validTime(e.start)) errors[k + "start"] = "Indica la entrada.";
        if (!validTime(e.end) || e.end <= e.start)
          errors[k + "end"] = "La salida debe ser posterior a la entrada.";
        required(k + "area", e.area, "el área", 150);
      }
      if (e.status !== "inhabil") {
        required(
          k + "activity",
          e.activity,
          e.status === "laboral" ? "las actividades" : "la justificación",
          900,
        );
        const words = (e.activity || "").match(/\p{L}{2,}/gu) || [];
        if (
          words.length < 4 ||
          new Set(words.map((w) => w.toLowerCase())).size < 3 ||
          /(?:asdf|qwerty|lorem ipsum)/i.test(e.activity)
        )
          errors[k + "activity"] =
            "Describe lo ocurrido con al menos cuatro palabras.";
      }
    });
    const dates = r.entries.map((e) => e.date);
    if (
      dates.every(validDate) &&
      dates.length &&
      dates.some((d) => !weekDates(dates[0]).includes(d))
    )
      errors.entries =
        "Las cuatro jornadas deben corresponder a martes, miércoles, jueves y viernes de la misma semana.";
  }
  if (step === undefined || step === 3) {
    for (const [key, label] of [
      ["voboName", "el nombre de quien da el visto bueno"],
      ["voboRole", "el cargo de quien da el visto bueno"],
      ["autorizoName", "el nombre de quien autoriza"],
      ["autorizoRole", "el cargo de quien autoriza"],
    ])
      required(
        "authorities." + key,
        r.authorities[key],
        label,
        key.endsWith("Name") ? 100 : 180,
      );
    if (r.instructor.enabled) {
      required(
        "instructor.name",
        r.instructor.name,
        "el nombre del instructor",
        100,
      );
      required(
        "instructor.roleMain",
        r.instructor.roleMain,
        "el cargo del instructor",
        140,
      );
    }
  }
  return errors;
}
export function recordShape(r) {
  const string = (v, max = 200) => typeof v === "string" && v.length <= max;
  return (
    r &&
    typeof r === "object" &&
    string(r.student, 100) &&
    string(r.company) &&
    Array.isArray(r.entries) &&
    r.entries.length <= 4 &&
    ["school", "specialty", "semester", "group"].every(
      (k) =>
        r[k] === undefined ||
        string(r[k]) ||
        (k === "semester" && Number.isInteger(r[k])),
    ) &&
    ["authorities", "instructor"].every(
      (k) =>
        r[k] === undefined ||
        (r[k] &&
          typeof r[k] === "object" &&
          !Array.isArray(r[k]) &&
          Object.entries(r[k]).every(([field, v]) =>
            k === "instructor" && field === "enabled"
              ? typeof v === "boolean"
              : string(v, 300),
          )),
    ) &&
    r.entries.every(
      (e) =>
        e &&
        ["date", "start", "end", "area", "activity"].every((k) =>
          string(e[k], k === "activity" ? 900 : 180),
        ) &&
        (e.date === "" || validDate(e.date)) &&
        ["laboral", "falta", "sin_labores", "inhabil", undefined].includes(
          e.status,
        ),
    )
  );
}
export function withStatus(entry, status) {
  return {
    ...entry,
    status,
    activity:
      status === "inhabil"
        ? INHABIL_JUSTIFICATION
        : entry.status === "inhabil"
          ? ""
          : entry.activity,
  };
}
