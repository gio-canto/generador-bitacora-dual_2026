import { isSecretName } from "../domain/presentation.js";

const KEY = "bitacora_profile_v1";
const EMPTY_PROFILE = Object.freeze({
  name: "",
  school: "",
  specialty: "",
  semester: "",
  group: "",
  defaultStart: "",
  defaultEnd: "",
  area: "",
});

const cleanText = (value, max = 180) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, max);

const cleanTime = (value) => {
  const time = cleanText(value, 5);
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : "";
};

function emitProfileChange() {
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event("bitacora-profile"));
}

export function readProfileData(storage = localStorage) {
  try {
    const raw = JSON.parse(storage.getItem(KEY) || "null");
    if (!raw || typeof raw !== "object" || Array.isArray(raw))
      return { ...EMPTY_PROFILE };
    const name = cleanText(raw.name, 160);
    return {
      name: name && !isSecretName(name) ? name : "",
      school: cleanText(raw.school),
      specialty: cleanText(raw.specialty, 120),
      semester: cleanText(raw.semester, 12),
      group: cleanText(raw.group, 20).toUpperCase(),
      defaultStart: cleanTime(raw.defaultStart),
      defaultEnd: cleanTime(raw.defaultEnd),
      area: cleanText(raw.area, 150),
    };
  } catch {
    return { ...EMPTY_PROFILE };
  }
}

export function readProfile(storage = localStorage) {
  return readProfileData(storage).name;
}

export function rememberProfile(value, storage = localStorage) {
  const patch = value && typeof value === "object" ? value : {};
  const current = readProfileData(storage);
  let name = current.name;
  if (Object.prototype.hasOwnProperty.call(patch, "name")) {
    const candidate = cleanText(patch.name, 160);
    if (candidate && !isSecretName(candidate)) name = candidate;
  }
  const next = {
    name,
    school: Object.prototype.hasOwnProperty.call(patch, "school")
      ? cleanText(patch.school)
      : current.school,
    specialty: Object.prototype.hasOwnProperty.call(patch, "specialty")
      ? cleanText(patch.specialty, 120)
      : current.specialty,
    semester: Object.prototype.hasOwnProperty.call(patch, "semester")
      ? cleanText(patch.semester, 12)
      : current.semester,
    group: Object.prototype.hasOwnProperty.call(patch, "group")
      ? cleanText(patch.group, 20).toUpperCase()
      : current.group,
    defaultStart: Object.prototype.hasOwnProperty.call(patch, "defaultStart")
      ? cleanTime(patch.defaultStart)
      : current.defaultStart,
    defaultEnd: Object.prototype.hasOwnProperty.call(patch, "defaultEnd")
      ? cleanTime(patch.defaultEnd)
      : current.defaultEnd,
    area: Object.prototype.hasOwnProperty.call(patch, "area")
      ? cleanText(patch.area, 150)
      : current.area,
  };
  try {
    storage.setItem(KEY, JSON.stringify(next));
    emitProfileChange();
    return true;
  } catch {
    return false;
  }
}

export function rememberName(value, storage = localStorage) {
  const name = cleanText(value, 160);
  if (!name || isSecretName(name)) return false;
  return rememberProfile({ name }, storage);
}

export function forgetProfile(storage = localStorage) {
  try {
    storage.setItem(KEY, JSON.stringify(EMPTY_PROFILE));
    emitProfileChange();
    return true;
  } catch {
    return false;
  }
}

export function initializeProfile(name, storage = localStorage) {
  try {
    if (storage.getItem(KEY) === null) rememberName(name, storage);
  } catch {}
}
