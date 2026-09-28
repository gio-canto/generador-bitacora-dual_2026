export const DELIVERY_KEY = "bitacora_dual_delivery_registry_v1";
export const DELIVERY_SCHEMA = 1;

const uid = () =>
  globalThis.crypto?.randomUUID?.() ||
  `delivery-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function normalizeName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("es-MX");
}

export function createDeliveryState() {
  return {
    schemaVersion: DELIVERY_SCHEMA,
    students: [],
    weeks: [],
    updatedAt: new Date().toISOString(),
  };
}

export function createStudent(data = {}) {
  return {
    id: uid(),
    name: String(data.name || "").replace(/\s+/g, " ").trim(),
    school: String(data.school || "").trim(),
    specialty: String(data.specialty || "").trim(),
    semester: String(data.semester || "").trim(),
    group: String(data.group || "").trim(),
    createdAt: new Date().toISOString(),
  };
}

export function createWeek(data = {}) {
  return {
    id: uid(),
    label: String(data.label || "").trim() || "Semana",
    startDate: String(data.startDate || "").trim(),
    dueAt: String(data.dueAt || "").trim(),
    createdAt: new Date().toISOString(),
    deliveries: {},
  };
}

function isStudent(value) {
  return (
    value &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    typeof value.name === "string"
  );
}

function isWeek(value) {
  return (
    value &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    value.deliveries &&
    typeof value.deliveries === "object" &&
    !Array.isArray(value.deliveries)
  );
}

export function sanitizeDeliveryState(raw) {
  const base = createDeliveryState();
  if (!raw || typeof raw !== "object") return base;
  const students = Array.isArray(raw.students)
    ? raw.students.filter(isStudent).map((student) => ({
        ...createStudent(student),
        ...student,
        name: String(student.name || "").replace(/\s+/g, " ").trim(),
      }))
    : [];
  const weeks = Array.isArray(raw.weeks)
    ? raw.weeks.filter(isWeek).map((week) => ({
        ...createWeek(week),
        ...week,
        deliveries: Object.fromEntries(
          Object.entries(week.deliveries || {}).filter(
            ([, delivery]) =>
              delivery &&
              typeof delivery === "object" &&
              typeof delivery.registeredAt === "string",
          ),
        ),
      }))
    : [];
  return {
    ...base,
    ...raw,
    schemaVersion: DELIVERY_SCHEMA,
    students,
    weeks,
    updatedAt: raw.updatedAt || base.updatedAt,
  };
}

export function readDeliveryState(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(DELIVERY_KEY);
    return raw ? sanitizeDeliveryState(JSON.parse(raw)) : createDeliveryState();
  } catch {
    return createDeliveryState();
  }
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
    schemaVersion: DELIVERY_SCHEMA,
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
    const name = String(item?.name || "").replace(/\s+/g, " ").trim();
    if (!name) {
      skipped++;
      continue;
    }
    const key = normalizeName(name);
    const index = result.findIndex((student) => normalizeName(student.name) === key);
    if (index >= 0) {
      result[index] = { ...result[index], ...item, id: result[index].id, name };
      updated++;
    } else {
      result.push(createStudent({ ...item, name }));
      added++;
    }
  }
  return { students: result, added, updated, skipped };
}

export function findStudentByMatrixValue(students, rawValue) {
  const key = normalizeName(rawValue);
  if (!key) return null;
  return (
    students.find((student) => normalizeName(student.name) === key) ||
    null
  );
}

export function exportDeliveryState(state) {
  const body = JSON.stringify(portableDeliveryFile(state), null, 2);
  const blob = new Blob([body], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `registro-entrega-bitacoras-${stamp}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
