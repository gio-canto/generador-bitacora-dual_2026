import companies from "../data/companies.json";

export const DELIVERY_KEY = "bitacora_dual_delivery_registry_v5";
export const PREVIOUS_DELIVERY_KEY = "bitacora_dual_delivery_registry_v4";
export const LEGACY_DELIVERY_KEYS = [
  "bitacora_dual_delivery_registry_v3",
  "bitacora_dual_delivery_registry_v2",
  "bitacora_dual_delivery_registry_v1",
];
export const DELIVERY_SCHEMA = 5;

const uid = () =>
  globalThis.crypto?.randomUUID?.() ||
  `delivery-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const clean = (value, max = 220) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

export function normalizeName(value) {
  return clean(value, 180)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-MX");
}

function normalizeMatrixText(value, max = 180) {
  return clean(value, max)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\|/g, "/")
    .toLocaleLowerCase("es-MX");
}

function encodeMatrixField(value) {
  const bytes = new TextEncoder().encode(clean(value));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return globalThis
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeMatrixField(value) {
  const base64 = String(value || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = globalThis.atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return clean(new TextDecoder().decode(bytes));
}

function validIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function datePlusDays(value, days) {
  if (!validIsoDate(value)) return "";
  const date = new Date(`${value}T12:00:00Z`);
  if (!Number.isFinite(+date)) return "";
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function compactDate(value) {
  return validIsoDate(value) ? value.replaceAll("-", "") : "";
}

function expandCompactDate(value) {
  const raw = String(value || "");
  if (!/^\d{8}$/.test(raw)) return "";
  const iso = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  return validIsoDate(iso) ? iso : "";
}

export function companyMatrixValue(value) {
  const name = clean(value, 220);
  const preset = companies.find((company) => company.name === name);
  return normalizeMatrixText(preset?.shortName || name, 80);
}

export function matrixPeriodFromData(data = {}) {
  const dates = Array.isArray(data.entries)
    ? data.entries
        .map((entry) => clean(entry?.date, 10))
        .filter(validIsoDate)
        .sort()
    : [];
  const startDate =
    clean(data.startDate, 10) ||
    dates[0] ||
    (validIsoDate(data.weekDate) ? clean(data.weekDate, 10) : "");
  const endDate =
    clean(data.endDate, 10) ||
    dates.at(-1) ||
    (startDate ? datePlusDays(startDate, 3) : "");
  return {
    startDate: validIsoDate(startDate) ? startDate : "",
    endDate: validIsoDate(endDate) ? endDate : "",
  };
}

export function createMatrixPayload(data = {}) {
  const name = normalizeMatrixText(data.name ?? data.student, 180);
  if (!name) return "";
  const { startDate, endDate } = matrixPeriodFromData(data);
  return [
    "BD26",
    "4",
    name,
    normalizeMatrixText(data.specialty, 120),
    companyMatrixValue(data.company),
    compactDate(startDate),
    compactDate(endDate),
  ].join("|");
}

export function parseMatrixPayload(rawValue) {
  const raw = clean(rawValue, 900);
  const empty = {
    version: 0,
    name: "",
    specialty: "",
    company: "",
    startDate: "",
    endDate: "",
  };
  if (!raw) return empty;

  const parts = raw.split("|");
  if (
    parts[0]?.toUpperCase() === "BD26" &&
    parts[1] === "4" &&
    parts.length >= 7
  ) {
    return {
      version: 4,
      name: clean(parts[2], 180),
      specialty: clean(parts[3], 120),
      company: clean(parts[4], 80),
      startDate: expandCompactDate(parts[5]),
      endDate: expandCompactDate(parts[6]),
    };
  }

  if (
    parts[0]?.toUpperCase() === "BD26" &&
    parts[1] === "3" &&
    parts.length >= 5
  ) {
    try {
      return {
        version: 3,
        name: decodeMatrixField(parts[2]),
        specialty: decodeMatrixField(parts[3]),
        company: decodeMatrixField(parts.slice(4).join("|")),
        startDate: "",
        endDate: "",
      };
    } catch {
      return empty;
    }
  }

  if (/^BD26\|/i.test(raw)) {
    return {
      ...empty,
      version: 1,
      name: clean(raw.slice(5), 180),
    };
  }

  return {
    ...empty,
    name: clean(raw, 180),
  };
}

export function createRegistryContext(data = {}) {
  return {
    school: clean(data.school),
    generation: clean(data.generation, 100),
  };
}

export function contextIsComplete(context) {
  return Boolean(clean(context?.school));
}

export function createDeliveryState() {
  return {
    schemaVersion: DELIVERY_SCHEMA,
    context: createRegistryContext(),
    students: [],
    weeks: [],
    settings: {
      tutorialDone: false,
    },
    updatedAt: new Date().toISOString(),
  };
}

export function createStudent(data = {}) {
  return {
    id: typeof data.id === "string" && data.id ? data.id : uid(),
    name: clean(data.name, 180),
    specialty: clean(data.specialty, 120),
    company: clean(data.company, 220),
    createdAt:
      typeof data.createdAt === "string"
        ? data.createdAt
        : new Date().toISOString(),
  };
}

export function createWeek(data = {}) {
  const startDate = clean(data.startDate, 10);
  const endDate =
    clean(data.endDate, 10) || (startDate ? datePlusDays(startDate, 3) : "");
  return {
    id: typeof data.id === "string" && data.id ? data.id : uid(),
    label: clean(data.label, 100) || "Semana",
    startDate: validIsoDate(startDate) ? startDate : "",
    endDate: validIsoDate(endDate) ? endDate : "",
    dueAt: clean(data.dueAt, 40),
    createdAt:
      typeof data.createdAt === "string"
        ? data.createdAt
        : new Date().toISOString(),
    closedAt: typeof data.closedAt === "string" ? data.closedAt : "",
    deliveries:
      data.deliveries && typeof data.deliveries === "object"
        ? { ...data.deliveries }
        : {},
  };
}

function normalizeStudent(value, fallback = {}) {
  if (!value || typeof value !== "object") return null;
  const name = clean(value.name, 180);
  if (!name) return null;
  return createStudent({
    ...value,
    name,
    specialty: value.specialty || fallback.specialty,
    company: value.company || fallback.company,
  });
}

function normalizeDelivery(value) {
  if (!value || typeof value !== "object") return null;
  const registeredAt = clean(value.registeredAt, 40);
  if (!registeredAt) return null;
  return {
    status:
      value.status === "entregado_tarde" ? "entregado_tarde" : "entregado",
    registeredAt,
    source: ["camera", "manual", "import"].includes(value.source)
      ? value.source
      : "manual",
  };
}

function normalizeWeek(value) {
  if (!value || typeof value !== "object") return null;
  const week = createWeek(value);
  week.deliveries = Object.fromEntries(
    Object.entries(value.deliveries || {})
      .map(([studentId, delivery]) => [
        studentId,
        normalizeDelivery(delivery),
      ])
      .filter(([, delivery]) => delivery),
  );
  return week;
}

function inferLegacyContext(raw) {
  const first =
    (Array.isArray(raw?.students) &&
      raw.students.find((student) => student?.school)) ||
    {};
  return createRegistryContext({
    school: raw?.context?.school || first.school,
    generation: raw?.context?.generation || "",
  });
}

export function sanitizeDeliveryState(raw) {
  const base = createDeliveryState();
  if (!raw || typeof raw !== "object") return base;

  const legacyDefaults = {
    specialty: clean(raw?.context?.specialty, 120),
    company: clean(raw?.context?.company, 220),
  };
  const students = Array.isArray(raw.students)
    ? raw.students
        .map((student) => normalizeStudent(student, legacyDefaults))
        .filter(Boolean)
    : [];
  const weeks = Array.isArray(raw.weeks)
    ? raw.weeks.map(normalizeWeek).filter(Boolean)
    : [];

  return {
    ...base,
    ...raw,
    schemaVersion: DELIVERY_SCHEMA,
    context: createRegistryContext(
      raw.context && typeof raw.context === "object"
        ? raw.context
        : inferLegacyContext(raw),
    ),
    students,
    weeks,
    settings: {
      ...base.settings,
      ...(raw.settings && typeof raw.settings === "object"
        ? raw.settings
        : {}),
    },
    updatedAt: clean(raw.updatedAt, 40) || base.updatedAt,
  };
}

export function readDeliveryState(storage = globalThis.localStorage) {
  try {
    for (const key of [
      DELIVERY_KEY,
      PREVIOUS_DELIVERY_KEY,
      ...LEGACY_DELIVERY_KEYS,
    ]) {
      const raw = storage?.getItem(key);
      if (!raw) continue;
      const migrated = sanitizeDeliveryState(JSON.parse(raw));
      if (key !== DELIVERY_KEY)
        storage?.setItem(DELIVERY_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch {
    // Un archivo local dañado no debe bloquear el subsistema.
  }
  return createDeliveryState();
}

export function writeDeliveryState(state, storage = globalThis.localStorage) {
  const next = {
    ...sanitizeDeliveryState(state),
    updatedAt: new Date().toISOString(),
  };
  storage?.setItem(DELIVERY_KEY, JSON.stringify(next));
  return next;
}

export function parsePortableDeliveryFile(text) {
  if (String(text || "").length > 8_000_000)
    throw new Error("El archivo supera el límite de 8 MB.");
  const parsed = JSON.parse(text);
  if (
    !parsed ||
    typeof parsed !== "object" ||
    !Array.isArray(parsed.students) ||
    !Array.isArray(parsed.weeks)
  )
    throw new Error("El archivo no contiene un registro de entregas compatible.");
  return sanitizeDeliveryState(parsed);
}

export function portableDeliveryFile(state) {
  return {
    kind: "bitacora-dual-delivery-registry",
    exportedAt: new Date().toISOString(),
    ...sanitizeDeliveryState(state),
  };
}

export function deliveryStatus(week, studentId) {
  const delivery = week?.deliveries?.[studentId];
  if (!delivery) return "no_entregado";
  return delivery.status === "entregado_tarde"
    ? "entregado_tarde"
    : "entregado";
}

export function statusFromTimestamp(week, timestamp) {
  if (!week?.dueAt) return "entregado";
  const due = new Date(week.dueAt);
  const delivered = new Date(timestamp);
  if (!Number.isFinite(+due) || !Number.isFinite(+delivered))
    return "entregado";
  return delivered > due ? "entregado_tarde" : "entregado";
}

export function registerDelivery(week, studentId, timestamp, source = "manual") {
  const registeredAt = timestamp || new Date().toISOString();
  return {
    ...week,
    deliveries: {
      ...week.deliveries,
      [studentId]: {
        status: statusFromTimestamp(week, registeredAt),
        registeredAt,
        source,
      },
    },
  };
}

export function setDeliveryStatus(
  week,
  studentId,
  status,
  timestamp = "",
  source = "manual",
) {
  if (status === "no_entregado") return removeDelivery(week, studentId);
  if (!["entregado", "entregado_tarde"].includes(status)) return week;

  const previous = week?.deliveries?.[studentId];
  const registeredAt =
    timestamp || previous?.registeredAt || new Date().toISOString();

  return {
    ...week,
    deliveries: {
      ...week.deliveries,
      [studentId]: {
        status,
        registeredAt,
        source,
      },
    },
  };
}

export function removeDelivery(week, studentId) {
  const deliveries = { ...(week?.deliveries || {}) };
  delete deliveries[studentId];
  return { ...week, deliveries };
}

export function mergeStudents(current, incoming) {
  const result = [...current];
  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of incoming) {
    const name = clean(item?.name, 180);
    if (!name) {
      skipped++;
      continue;
    }

    const key = normalizeName(name);
    const index = result.findIndex(
      (student) => normalizeName(student.name) === key,
    );
    if (index >= 0) {
      result[index] = {
        ...result[index],
        name,
        specialty:
          clean(item?.specialty, 120) || result[index].specialty || "",
        company: clean(item?.company, 220) || result[index].company || "",
      };
      updated++;
    } else {
      result.push(createStudent(item));
      added++;
    }
  }

  return { students: result, added, updated, skipped };
}

function matrixMetadataMatchesStudent(student, payload) {
  if (payload.version >= 4) {
    return (
      normalizeName(student.specialty) === normalizeName(payload.specialty) &&
      companyMatrixValue(student.company) ===
        normalizeMatrixText(payload.company, 80)
    );
  }

  if (payload.version === 3) {
    return (
      normalizeName(student.specialty) === normalizeName(payload.specialty) &&
      normalizeName(student.company) === normalizeName(payload.company)
    );
  }

  return true;
}

function editDistance(left, right) {
  const a = String(left || "");
  const b = String(right || "");
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let row = 1; row <= a.length; row++) {
    const current = [row];
    for (let column = 1; column <= b.length; column++) {
      const cost = a[row - 1] === b[column - 1] ? 0 : 1;
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + cost,
      );
    }
    previous = current;
  }
  return previous[b.length];
}

function allowedNameDistance(length) {
  if (length <= 6) return 1;
  if (length <= 12) return 2;
  return Math.max(2, Math.floor(length * 0.16));
}

export function findStudentSuggestionsByMatrixValue(
  students,
  rawValue,
  limit = 3,
) {
  const payload = parseMatrixPayload(rawValue);
  const scannedName = normalizeName(payload.name);
  if (!scannedName) return [];

  const safeLimit = Math.max(1, Math.min(5, Number(limit) || 3));
  return students
    .map((student) => {
      const storedName = normalizeName(student?.name);
      if (!storedName || storedName === scannedName) return null;
      if (!matrixMetadataMatchesStudent(student, payload)) return null;

      const distance = editDistance(scannedName, storedName);
      const longest = Math.max(scannedName.length, storedName.length);
      const similarity = longest ? 1 - distance / longest : 0;
      if (distance > allowedNameDistance(longest) || similarity < 0.72)
        return null;

      return { student, distance, similarity };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        a.distance - b.distance ||
        b.similarity - a.similarity ||
        a.student.name.localeCompare(b.student.name, "es", {
          sensitivity: "base",
        }),
    )
    .slice(0, safeLimit);
}

export function matrixValueToName(rawValue) {
  return parseMatrixPayload(rawValue).name;
}

export function findStudentByMatrixValue(students, rawValue) {
  const payload = parseMatrixPayload(rawValue);
  const nameKey = normalizeName(payload.name);
  if (!nameKey) return null;

  const byName = students.filter(
    (student) => normalizeName(student.name) === nameKey,
  );

  if (payload.version >= 4) {
    const specialtyKey = normalizeName(payload.specialty);
    const companyKey = normalizeMatrixText(payload.company, 80);
    return (
      byName.find(
        (student) =>
          normalizeName(student.specialty) === specialtyKey &&
          companyMatrixValue(student.company) === companyKey,
      ) || null
    );
  }

  if (payload.version === 3) {
    const specialtyKey = normalizeName(payload.specialty);
    const companyKey = normalizeName(payload.company);
    return (
      byName.find(
        (student) =>
          normalizeName(student.specialty) === specialtyKey &&
          normalizeName(student.company) === companyKey,
      ) || null
    );
  }

  // Los códigos anteriores sólo tenían el nombre. Se aceptan únicamente
  // cuando ese nombre identifica a una sola persona en la base.
  return byName.length === 1 ? byName[0] : null;
}

export function findWeekByMatrixValue(weeks, rawValue, fallbackWeekId = "") {
  const payload = parseMatrixPayload(rawValue);
  if (payload.startDate && payload.endDate) {
    return (
      weeks.find(
        (week) =>
          week.startDate === payload.startDate &&
          week.endDate === payload.endDate,
      ) || null
    );
  }
  if (fallbackWeekId)
    return weeks.find((week) => week.id === fallbackWeekId) || null;
  return weeks.length === 1 ? weeks[0] : null;
}

export function matrixPeriodLabel(rawValue) {
  const { startDate, endDate } = parseMatrixPayload(rawValue);
  if (!startDate || !endDate) return "";
  return `${startDate} → ${endDate}`;
}

export function weekSummary(week, students) {
  const summary = {
    entregado: 0,
    entregado_tarde: 0,
    no_entregado: 0,
    total: students.length,
  };
  students.forEach((student) => {
    summary[deliveryStatus(week, student.id)]++;
  });
  summary.registered = summary.entregado + summary.entregado_tarde;
  summary.percent = summary.total
    ? Math.round((summary.registered / summary.total) * 100)
    : 0;
  return summary;
}

export function exportDeliveryState(state) {
  const body = JSON.stringify(portableDeliveryFile(state), null, 2);
  downloadText(
    body,
    `registro-entrega-bitacoras-${new Date().toISOString().slice(0, 10)}.json`,
    "application/json",
  );
}

export function exportWeekCsv(state, weekId) {
  const week = state.weeks.find((item) => item.id === weekId);
  if (!week) return;
  const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  const rows = [
    ["Alumno", "Especialidad", "Empresa", "Estado", "Fecha y hora", "Origen"],
    ...state.students.map((student) => {
      const delivery = week.deliveries?.[student.id];
      const status = deliveryStatus(week, student.id);
      return [
        student.name,
        student.specialty,
        student.company,
        status === "entregado_tarde"
          ? "Entregado a destiempo"
          : status === "entregado"
            ? "Entregado"
            : "No entregado",
        delivery?.registeredAt || "",
        delivery?.source || "",
      ];
    }),
  ];
  const csv =
    "\ufeff" + rows.map((row) => row.map(escape).join(",")).join("\r\n");
  downloadText(
    csv,
    `${week.label.replace(/[^a-z0-9áéíóúñü _-]/gi, "").replace(/\s+/g, "-") || "semana"}-entregas.csv`,
    "text/csv;charset=utf-8",
  );
}

function downloadText(text, filename, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
