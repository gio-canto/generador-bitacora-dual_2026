import absenceReasons from "../data/absence-reasons.json";
import nonWorkingReasons from "../data/non-working-reasons.json";

// Reglas locales, deterministas y editables. No se envía ningún texto a un servidor.
export const reasonsForClassification = status => status === "falta"
  ? absenceReasons : status === "sin_labores" ? nonWorkingReasons : [];

export function normalizeReasonText(value) {
  return String(value || "").toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ñ]+/g, " ").replace(/\s+/g, " ").trim();
}
const hasPhrase = (text, phrase) => {
  const value = normalizeReasonText(phrase);
  return Boolean(value && (" " + text + " ").includes(" " + value + " "));
};
const NEGATIONS = new Set(["no","nunca","sin","ninguna","ningun","cancelaron","cancelo"]);
function isNegated(text, phrase) {
  const target = normalizeReasonText(phrase);
  const at = (" " + text + " ").indexOf(" " + target + " ");
  if (at < 0) return false;
  const before = text.slice(0, at).trim().split(/\s+/).slice(-3);
  return before.some(word => NEGATIONS.has(word));
}
export function classifyReason(status, source, catalog = reasonsForClassification(status)) {
  if (!["falta", "sin_labores"].includes(status)) return null;
  const text = normalizeReasonText(source);
  if (!text || text.split(" ").length < 3) return null;
  const matches = [];
  for (const reason of catalog) {
    const phrases = Array.isArray(reason.keywords) ? reason.keywords : [];
    const excluded = (reason.excludeKeywords || []).some(phrase => hasPhrase(text, phrase));
    if (excluded) continue;
    const found = phrases.filter(phrase => hasPhrase(text, phrase) && !isNegated(text, phrase));
    if (!found.length) continue;
    if ((reason.requiresAny || []).length &&
      !reason.requiresAny.some(phrase => hasPhrase(text, phrase))) continue;
    const specificity = Math.max(...found.map(phrase => normalizeReasonText(phrase).length));
    matches.push({reason, score:(reason.priority || 0) * 1000 + specificity});
  }
  matches.sort((a,b)=>b.score-a.score || a.reason.code-b.reason.code);
  if (!matches.length) return null;
  // Un empate real entre categorías no debe convertirse en una afirmación de hecho.
  if (matches[1] && matches[0].score === matches[1].score) return null;
  return matches[0].reason;
}
