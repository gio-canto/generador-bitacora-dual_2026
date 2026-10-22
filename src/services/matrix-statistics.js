import absenceReasons from "../data/absence-reasons.json";
import nonWorkingReasons from "../data/non-working-reasons.json";

// 4 jornadas, 19 bits por jornada y 4 bits de comprobación (10 bytes).
// La codificación no contiene actividades, justificaciones ni datos personales.
const STATUS_TO_NUMBER = { laboral: 0, falta: 1, sin_labores: 2, inhabil: 3 };
const NUMBER_TO_STATUS = ["laboral", "falta", "sin_labores", "inhabil"];
const MAX_MINUTES = 2046;
const CUSTOM_REASON = 63;
const catalogFor = (status) =>
  status === "falta" ? absenceReasons :
  status === "sin_labores" ? nonWorkingReasons : [];

function minutesBetween(start, end) {
  const valid = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!valid.test(start || "") || !valid.test(end || "")) return null;
  const [h1, m1] = start.split(":").map(Number);
  const [h2, m2] = end.split(":").map(Number);
  const minutes = h2 * 60 + m2 - h1 * 60 - m1;
  return minutes > 0 && minutes <= MAX_MINUTES ? minutes : null;
}

export function reasonFromEntry(entry) {
  const catalog = catalogFor(entry?.status);
  if (!catalog.length) return 0;
  const selected = catalog.find((item) => item.id === entry?.reasonId);
  if (selected) return selected.code;
  const matching = catalog.find(
    (item) => item.text.trim() === String(entry?.activity || "").trim(),
  );
  return matching?.code || CUSTOM_REASON;
}

export function encodeWeekStatistics(entries) {
  if (!Array.isArray(entries) || entries.length !== 4) return "";
  let bits = 0n;
  for (const entry of entries) {
    const kind = STATUS_TO_NUMBER[entry?.status];
    if (kind === undefined) return "";
    const minutes = kind === 0 ? minutesBetween(entry.start, entry.end) : 0;
    if (minutes === null) return "";
    const reason = reasonFromEntry(entry);
    const value = (kind << 17) | (minutes << 6) | reason;
    bits = (bits << 19n) | BigInt(value);
  }
  let crc = 0;
  for (let n = 0; n < 19; n++) crc ^= Number((bits >> BigInt(n * 4)) & 15n);
  const packed = (bits << 4n) | BigInt(crc);
  let binary = "";
  for (let n = 9; n >= 0; n--) {
    binary += String.fromCharCode(Number((packed >> BigInt(n * 8)) & 255n));
  }
  const encoded = globalThis.btoa(binary)
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  return "S5:" + encoded;
}

export function decodeWeekStatistics(value) {
  if (typeof value !== "string" || !/^S5:[A-Za-z0-9_-]{14}$/.test(value))
    return null;
  try {
    const raw = value.slice(3).replace(/-/g, "+").replace(/_/g, "/");
    const data = globalThis.atob(raw + "==".slice(0, (4 - raw.length % 4) % 4));
    if (data.length !== 10) return null;
    let packed = 0n;
    for (let n = 0; n < data.length; n++)
      packed = (packed << 8n) | BigInt(data.charCodeAt(n));
    const check = Number(packed & 15n);
    const bits = packed >> 4n;
    let crc = 0;
    for (let n = 0; n < 19; n++) crc ^= Number((bits >> BigInt(n * 4)) & 15n);
    if (check !== crc) return null;
    const entries = [];
    for (let n = 3; n >= 0; n--) {
      const word = Number((bits >> BigInt(n * 19)) & 0x7ffffn);
      const status = NUMBER_TO_STATUS[word >> 17];
      const minutes = (word >> 6) & 2047;
      const reasonCode = word & 63;
      const catalog = catalogFor(status);
      if (!status || (status !== "laboral" && minutes !== 0) ||
        (status === "laboral" && (!minutes || minutes > MAX_MINUTES || reasonCode)) ||
        ((status === "inhabil") && reasonCode) ||
        (reasonCode && reasonCode !== CUSTOM_REASON &&
          !catalog.some((item) => item.code === reasonCode)))
        return null;
      const reason = catalog.find((item) => item.code === reasonCode);
      entries.push({
        status, minutes, reasonCode,
        reasonId: reason?.id || "",
      });
    }
    return { version: 5, entries };
  } catch {
    return null;
  }
}

export function summarizeWeekStatistics(stats) {
  if (!stats || !Array.isArray(stats.entries) || stats.entries.length !== 4)
    return null;
  const summary = { minutes: 0, worked: 0, absent: 0, nonWorking: 0, holidays: 0 };
  for (const day of stats.entries) {
    if (day.status === "laboral") {
      summary.worked++;
      summary.minutes += day.minutes || 0;
    } else if (day.status === "falta") summary.absent++;
    else if (day.status === "sin_labores") summary.nonWorking++;
    else if (day.status === "inhabil") summary.holidays++;
  }
  return summary;
}

export function causeLabel(status, code) {
  if (code === CUSTOM_REASON) return "Otro motivo";
  return catalogFor(status).find((item) => item.code === code)?.label ||
    "Sin clasificar";
}
