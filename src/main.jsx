import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";
class ErrorBoundary extends React.Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main className="shell">
        <h1>No pudimos abrir la bitácora.</h1>
        <p>
          Tus datos guardados no se han eliminado. Prueba recargar la página.
        </p>
        <button onClick={() => location.reload()}>Volver a intentar</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
let pendingWorker;
window.addEventListener("bitacora-update", (event) => {
  pendingWorker = event.detail;
  if (document.getElementById("updateNotice")) return;

  const dialog = document.createElement("dialog");
  dialog.id = "updateNotice";
  dialog.className = "update-dialog";
  dialog.setAttribute("aria-labelledby", "updateNoticeTitle");
  dialog.setAttribute("aria-describedby", "updateNoticeDescription");

  const shell = document.createElement("div");
  shell.className = "update-dialog-shell";

  const mark = document.createElement("div");
  mark.className = "update-dialog-mark";
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = "↑";

  const copy = document.createElement("div");
  copy.className = "update-dialog-copy";

  const eyebrow = document.createElement("span");
  eyebrow.className = "update-dialog-eyebrow";
  eyebrow.textContent = "Actualización disponible";

  const title = document.createElement("h2");
  title.id = "updateNoticeTitle";
  title.textContent = "Hay una nueva versión";

  const description = document.createElement("p");
  description.id = "updateNoticeDescription";
  description.textContent =
    "Actualiza la página para cargar las mejoras y correcciones más recientes. Tus datos guardados se conservarán.";

  copy.append(eyebrow, title, description);

  const actions = document.createElement("div");
  actions.className = "update-dialog-actions";

  const laterButton = document.createElement("button");
  laterButton.className = "btn";
  laterButton.type = "button";
  laterButton.textContent = "Ahora no";
  laterButton.onclick = () => dialog.close();

  const button = document.createElement("button");
  button.className = "btn primary";
  button.type = "button";
  button.textContent = "Actualizar ahora";
  button.onclick = () => {
    window.dispatchEvent(new Event("pagehide"));
    button.disabled = true;
    laterButton.disabled = true;
    button.textContent = "Actualizando…";
    const worker = pendingWorker;
    worker.addEventListener("statechange", () => {
      if (worker.state === "activated") location.reload();
    });
    if (worker.state === "activated") location.reload();
    else worker.postMessage({ type: "SKIP_WAITING" });
  };

  actions.append(laterButton, button);
  shell.append(mark, copy, actions);
  dialog.append(shell);
  document.body.append(dialog);

  dialog.addEventListener("close", () => {
    dialog.remove();
  }, { once: true });

  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
});
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const serviceWorkerUrl = /\/registro-entrega\/?$/i.test(location.pathname)
      ? "../sw.js"
      : "./sw.js";
    navigator.serviceWorker
      .register(serviceWorkerUrl, { updateViaCache: "none" })
      .then((reg) => {
        const announce = () => {
          if (reg.waiting)
            window.dispatchEvent(
              new CustomEvent("bitacora-update", { detail: reg.waiting }),
            );
        };
        announce();
        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          worker?.addEventListener("statechange", () => {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller
            )
              announce();
          });
        });
        let reloading = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (!reloading) {
            reloading = true;
            location.reload();
          }
        });
      })
      .catch(() => {
        /* The app remains usable without offline support. */
      });
  });
}
