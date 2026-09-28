export const DELIVERY_KEY = "bitacora_dual_delivery_registry_v3";
export const PREVIOUS_DELIVERY_KEY = "bitacora_dual_delivery_registry_v2";
export const LEGACY_DELIVERY_KEY = "bitacora_dual_delivery_registry_v1";
export const DELIVERY_SCHEMA = 3;

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

export function createRegistryContext(data = {}) {
  return {
    school: clean(data.school),
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
  return {
    id: typeof data.id === "string" && data.id ? data.id : uid(),
    label: clean(data.label, 100) || "Semana",
    startDate: clean(data.startDate, 10),
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
      LEGACY_DELIVERY_KEY,
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

export function matrixValueToName(rawValue) {
  const raw = clean(rawValue, 300);
  if (!raw) return "";
  if (/^BD26\|/i.test(raw)) return clean(raw.slice(5), 180);
  return raw;
}

export function findStudentByMatrixValue(students, rawValue) {
  const key = normalizeName(matrixValueToName(rawValue));
  if (!key) return null;
  return (
    students.find((student) => normalizeName(student.name) === key) || null
  );
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
