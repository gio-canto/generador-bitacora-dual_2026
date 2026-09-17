import { isSecretName } from "../domain/presentation.js";
const KEY = "bitacora_profile_v1";
export function readProfile(storage = localStorage) {
  try {
    const name = JSON.parse(storage.getItem(KEY) || "null")?.name;
    return typeof name === "string" && !isSecretName(name) ? name : "";
  } catch {
    return "";
  }
}
export function rememberName(value, storage = localStorage) {
  const name = String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 160);
  if (!name || isSecretName(name)) return false;
  try {
    storage.setItem(KEY, JSON.stringify({ name }));
    window.dispatchEvent(new Event("bitacora-profile"));
    return true;
  } catch {
    return false;
  }
}
export function forgetProfile(storage = localStorage) {
  try {
    storage.setItem(KEY, JSON.stringify({ name: "" }));
    window.dispatchEvent(new Event("bitacora-profile"));
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
