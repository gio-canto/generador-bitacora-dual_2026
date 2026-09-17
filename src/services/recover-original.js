import { parseBackup } from "./storage.js";
const marker = "bitacora_original_restored_v1";
export function recoverPreviousVersion(storage = localStorage) {
  if (storage.getItem(marker)) return;
  const raw = storage.getItem("bitacora_dual_react_v1");
  if (!raw) return;
  // Keep the complete React envelope as recovery data, including old catalogs.
  // Validate everything before writing any of the original keys.
  const restored = parseBackup(raw);
  const oldRaw = storage.getItem("bitacora_dual_clean_v3");
  const previous = oldRaw ? parseBackup(oldRaw).records : [];
  const records = new Map(previous.map((record) => [record.id, record]));
  for (const record of restored.records) {
    const previousRecord = records.get(record.id);
    if (
      !previousRecord ||
      String(record.updatedAt || "") >= String(previousRecord.updatedAt || "")
    )
      records.set(record.id, record);
  }
  const draft = restored.draft;
  if (draft) parseBackup(JSON.stringify([draft]));
  storage.setItem(
    "bitacora_dual_clean_v3",
    JSON.stringify([...records.values()]),
  );
  storage.setItem("bitacora_dual_clean_v3_seeded", "1");
  if (draft)
    storage.setItem(
      "bitacora_dual_draft_v1",
      JSON.stringify({
        version: 1,
        currentId: draft.id || null,
        identity: draft,
        entries: draft.entries,
        markdown: draft.markdown,
        weekDate: draft.weekDate,
        defaultStart: draft.defaultStart,
        defaultEnd: draft.defaultEnd,
        savedAt: new Date().toISOString(),
      }),
    );
  storage.setItem(marker, "1");
}
