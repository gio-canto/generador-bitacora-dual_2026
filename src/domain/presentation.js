import { validDate, validTime, weekDates } from "./records.js";
export const CREDIT_NAMES = [
  "uwu",
  "legoshi",
  "jack",
  "haru",
  "louis",
  "furry",
  "xd",
  "lol",
  "anton",
  "mark scout",
  "helly riggs",
  "dylan george",
  "hatsune miku",
];
export const normalizeName = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
export const isVirtualName = (value) =>
  ["jamiroquai", "virtual insanity"].includes(normalizeName(value));
export const isSecretName = (value) =>
  CREDIT_NAMES.includes(normalizeName(value)) || isVirtualName(value);
export const signatureName = (entity) =>
  entity?.shortName?.trim() || entity?.name?.trim() || "";
export function weekSetup(date, start, end) {
  if (!validDate(date))
    return {
      error: "Elige el martes con el que empieza tu bitácora.",
      field: "weekDate",
    };
  const dates = weekDates(date);
  if (date !== dates[0])
    return {
      error: `El primer día debe ser martes. Para esa semana, elige el ${dates[0].split("-").reverse().join("/")}.`,
      field: "weekDate",
    };
  if (!validTime(start) || !validTime(end))
    return {
      error: "Completa la hora de entrada y la hora de salida.",
      field: !validTime(start) ? "defaultStart" : "defaultEnd",
    };
  if (end <= start)
    return {
      error: "La salida debe ser después de la entrada.",
      field: "defaultEnd",
    };
  return { dates };
}
export function schoolSignatureRole(role, school) {
  const lines = String(role || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const aliases = [school?.name, school?.shortName].filter(Boolean);
  const kept = lines.filter((line) => !aliases.includes(line));
  const label = signatureName(school);
  return [...kept, ...(label ? [label] : [])];
}
