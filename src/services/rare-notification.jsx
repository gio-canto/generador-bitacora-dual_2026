// Only explicit actions and short system notices use Sileo, never typing/autosave.
let loaded;
let last = "",
  lastAt = 0;
export async function notify(kind, title, description = "") {
  const key = kind + title + description;
  if (key === last && Date.now() - lastAt < 1500) return;
  last = key;
  lastAt = Date.now();
  try {
    loaded ??= import("./sileo-host.jsx");
    const { showNotice } = await loaded;
    showNotice(kind, title, description);
  } catch {
    let el = document.getElementById("notificationFallback");
    if (!el) {
      el = document.createElement("div");
      el.id = "notificationFallback";
      el.className = "notice-fallback";
      el.setAttribute("role", "status");
      document.body.append(el);
    }
    el.textContent = title + (description ? ". " + description : "");
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => el.remove(), 6000);
  }
}
export const notifyImported = () =>
  notify(
    "success",
    "Respaldo importado",
    "Tus registros anteriores se conservaron.",
  );
