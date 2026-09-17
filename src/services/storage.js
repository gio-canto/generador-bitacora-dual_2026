import {
  blankRecord,
  normalizeRecord,
  recordShape,
  VERSION,
} from "../domain/records.js";
export const KEY = "bitacora_dual_react_v1";
export function parseBackup(text) {
  if (text.length > 5_000_000) throw new Error("El respaldo supera 5 MB.");
  const data = JSON.parse(text);
  const records = Array.isArray(data) ? data : data?.records;
  if (
    !Array.isArray(records) ||
    records.length > 1000 ||
    !records.every(recordShape)
  )
    throw new Error(
      "El respaldo contiene registros incompatibles. No se cambió tu historial.",
    );
  return {
    records: records.map(normalizeRecord),
    catalogs: data?.catalogs,
    draft: data?.draft,
  };
}
export function initialState(storage) {
  const empty = {
    schemaVersion: 1,
    version: VERSION,
    draft: blankRecord(),
    records: [],
    catalogs: null,
  };
  try {
    storage ??= globalThis.localStorage;
    const raw = storage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed.schemaVersion !== 1 ||
        !Array.isArray(parsed.records) ||
        !parsed.records.every(recordShape) ||
        !recordShape(parsed.draft)
      )
        return {
          ...empty,
          storageError:
            "Los datos guardados no son compatibles. Exporta el archivo de recuperación antes de continuar.",
          recoveryRaw: raw,
        };
      return { ...empty, ...parsed, draft: normalizeRecord(parsed.draft) };
    }
    const old = storage.getItem("bitacora_dual_clean_v3"),
      draft = storage.getItem("bitacora_dual_draft_v1");
    const records = old ? parseBackup(old).records : [];
    let restored = empty.draft;
    if (draft) {
      const d = JSON.parse(draft),
        candidate = {
          ...d.identity,
          ...d,
          id: d.currentId || undefined,
          entries: d.entries,
        };
      if (!recordShape(candidate))
        throw new Error("El borrador anterior requiere recuperación.");
      restored = normalizeRecord(candidate);
    }
    return { ...empty, records, draft: restored, migrated: !!(old || draft) };
  } catch {
    return {
      ...empty,
      storageError:
        "No se pudo leer el almacenamiento. No se sobrescribirán tus datos.",
      recoveryRaw: safeRecovery(storage),
    };
  }
}
export function persist(state, storage = localStorage) {
  storage.setItem(
    KEY,
    JSON.stringify({
      ...state,
      version: VERSION,
      schemaVersion: 1,
      updatedAt: new Date().toISOString(),
    }),
  );
}
export function downloadJson(value, name) {
  const url = URL.createObjectURL(
    new Blob(
      [typeof value === "string" ? value : JSON.stringify(value, null, 2)],
      { type: "application/json" },
    ),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export function mergeRecords(current, incoming) {
  const result = [...current];
  let added = 0;
  for (const r of incoming) {
    const identical = result.some(
      (x) =>
        JSON.stringify({ ...x, id: null, updatedAt: null }) ===
        JSON.stringify({ ...r, id: null, updatedAt: null }),
    );
    if (identical) continue;
    result.push({
      ...r,
      id: result.some((x) => x.id === r.id) ? crypto.randomUUID() : r.id,
    });
    added++;
  }
  return { records: result, added };
}

function safeRecovery(storage) {
  try {
    return JSON.stringify({
      current: storage?.getItem(KEY),
      legacyDraft: storage?.getItem("bitacora_dual_draft_v1"),
      legacyRecords: storage?.getItem("bitacora_dual_clean_v3"),
    });
  } catch {
    return "";
  }
}
