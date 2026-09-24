import { isSecretName } from "../domain/presentation.js";

const KEY = "bitacora_profile_v1";
const EMPTY_PROFILE = Object.freeze({
  name: "",
  school: "",
  specialty: "",
  semester: "",
  group: "",
  company: "",
  defaultStart: "",
  defaultEnd: "",
  area: "",
  markdown: true,
  studentGenericSignature: false,
  authorities: Object.freeze({
    voboName: "",
    voboRole: "",
    autorizoName: "",
    autorizoRole: "",
  }),
  instructor: Object.freeze({
    enabled: null,
    preset: "",
    name: "",
    roleMain: "",
    note: "",
  }),
});

const cleanText = (value, max = 180) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, max);

const cleanMultiline = (value, max = 300) =>
  String(value || "")
    .trim()
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .slice(0, max);

const cleanTime = (value) => {
  const time = cleanText(value, 5);
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : "";
};

const has = (object, key) =>
  Object.prototype.hasOwnProperty.call(object || {}, key);

function emitProfileChange() {
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event("bitacora-profile"));
}

export function readProfileData(storage = localStorage) {
  try {
    const raw = JSON.parse(storage.getItem(KEY) || "null");
    if (!raw || typeof raw !== "object" || Array.isArray(raw))
      return structuredClone(EMPTY_PROFILE);

    const name = cleanText(raw.name, 160);
    const authorities =
      raw.authorities &&
      typeof raw.authorities === "object" &&
      !Array.isArray(raw.authorities)
        ? raw.authorities
        : {};
    const instructor =
      raw.instructor &&
      typeof raw.instructor === "object" &&
      !Array.isArray(raw.instructor)
        ? raw.instructor
        : {};

    return {
      name: name && !isSecretName(name) ? name : "",
      school: cleanText(raw.school),
      specialty: cleanText(raw.specialty, 120),
      semester: cleanText(raw.semester, 12),
      group: cleanText(raw.group, 20).toUpperCase(),
      company: cleanText(raw.company),
      defaultStart: cleanTime(raw.defaultStart),
      defaultEnd: cleanTime(raw.defaultEnd),
      area: cleanText(raw.area, 150),
      markdown: raw.markdown !== false,
      studentGenericSignature: raw.studentGenericSignature === true,
      authorities: {
        voboName: cleanText(authorities.voboName, 160),
        voboRole: cleanMultiline(authorities.voboRole, 300),
        autorizoName: cleanText(authorities.autorizoName, 160),
        autorizoRole: cleanMultiline(authorities.autorizoRole, 300),
      },
      instructor: {
        enabled:
          typeof instructor.enabled === "boolean" ? instructor.enabled : null,
        preset: cleanText(instructor.preset, 160),
        name: cleanText(instructor.name, 160),
        roleMain: cleanText(instructor.roleMain, 180),
        note: cleanText(instructor.note, 180),
      },
    };
  } catch {
    return structuredClone(EMPTY_PROFILE);
  }
}

export function readProfile(storage = localStorage) {
  return readProfileData(storage).name;
}

export function rememberProfile(value, storage = localStorage) {
  const patch = value && typeof value === "object" ? value : {};
  const current = readProfileData(storage);

  let name = current.name;
  if (has(patch, "name")) {
    const candidate = cleanText(patch.name, 160);
    if (candidate && !isSecretName(candidate)) name = candidate;
  }

  const authorityPatch =
    patch.authorities &&
    typeof patch.authorities === "object" &&
    !Array.isArray(patch.authorities)
      ? patch.authorities
      : {};
  const instructorPatch =
    patch.instructor &&
    typeof patch.instructor === "object" &&
    !Array.isArray(patch.instructor)
      ? patch.instructor
      : {};

  const next = {
    name,
    school: has(patch, "school")
      ? cleanText(patch.school)
      : current.school,
    specialty: has(patch, "specialty")
      ? cleanText(patch.specialty, 120)
      : current.specialty,
    semester: has(patch, "semester")
      ? cleanText(patch.semester, 12)
      : current.semester,
    group: has(patch, "group")
      ? cleanText(patch.group, 20).toUpperCase()
      : current.group,
    company: has(patch, "company")
      ? cleanText(patch.company)
      : current.company,
    defaultStart: has(patch, "defaultStart")
      ? cleanTime(patch.defaultStart)
      : current.defaultStart,
    defaultEnd: has(patch, "defaultEnd")
      ? cleanTime(patch.defaultEnd)
      : current.defaultEnd,
    area: has(patch, "area")
      ? cleanText(patch.area, 150)
      : current.area,
    markdown: has(patch, "markdown")
      ? patch.markdown !== false
      : current.markdown,
    studentGenericSignature: has(patch, "studentGenericSignature")
      ? patch.studentGenericSignature === true
      : current.studentGenericSignature,
    authorities: {
      voboName: has(authorityPatch, "voboName")
        ? cleanText(authorityPatch.voboName, 160)
        : current.authorities.voboName,
      voboRole: has(authorityPatch, "voboRole")
        ? cleanMultiline(authorityPatch.voboRole, 300)
        : current.authorities.voboRole,
      autorizoName: has(authorityPatch, "autorizoName")
        ? cleanText(authorityPatch.autorizoName, 160)
        : current.authorities.autorizoName,
      autorizoRole: has(authorityPatch, "autorizoRole")
        ? cleanMultiline(authorityPatch.autorizoRole, 300)
        : current.authorities.autorizoRole,
    },
    instructor: {
      enabled: has(instructorPatch, "enabled")
        ? typeof instructorPatch.enabled === "boolean"
          ? instructorPatch.enabled
          : null
        : current.instructor.enabled,
      preset: has(instructorPatch, "preset")
        ? cleanText(instructorPatch.preset, 160)
        : current.instructor.preset,
      name: has(instructorPatch, "name")
        ? cleanText(instructorPatch.name, 160)
        : current.instructor.name,
      roleMain: has(instructorPatch, "roleMain")
        ? cleanText(instructorPatch.roleMain, 180)
        : current.instructor.roleMain,
      note: has(instructorPatch, "note")
        ? cleanText(instructorPatch.note, 180)
        : current.instructor.note,
    },
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
