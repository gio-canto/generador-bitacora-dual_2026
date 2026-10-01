import { parseBackup } from "./storage.js";
import { readActiveProfileId, readProfileData } from "./profile.js";
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
  if (draft) {
    const activeProfileId = readActiveProfileId(storage);
    const activeName = readProfileData(storage).name.trim().toLowerCase();
    const draftName = String(draft.student || "").trim().toLowerCase();
    const key =
      activeProfileId && activeName && draftName === activeName
        ? `bitacora_dual_draft_v1:${activeProfileId}`
        : "bitacora_dual_draft_v1";
    storage.setItem(
      key,
      JSON.stringify({
        version: activeProfileId && key !== "bitacora_dual_draft_v1" ? 2 : 1,
        profileId: key === "bitacora_dual_draft_v1" ? "" : activeProfileId,
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
  }
  storage.setItem(marker, "1");
}
