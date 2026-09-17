// Sileo is loaded only after an explicit, successful backup import.
let loaded;
export async function notifyImported() {
  try {
    loaded ??= import("./sileo-host.jsx");
    const { showImported } = await loaded;
    showImported();
  } catch {
    alert("Respaldo importado correctamente.");
  }
}
