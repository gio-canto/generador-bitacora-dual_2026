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
  const banner = document.createElement("div");
  banner.id = "updateNotice";
  banner.className = "update-notice";
  banner.append("Hay una nueva versión disponible. ");
  const button = document.createElement("button");
  button.className = "btn";
  button.textContent = "Actualizar";
  button.onclick = () => {
    window.dispatchEvent(new Event("pagehide"));
    button.disabled = true;
    button.textContent = "Actualizando…";
    const worker = pendingWorker;
    worker.addEventListener('statechange', () => {
      if (worker.state === 'activated') location.reload();
    });
    if (worker.state === 'activated') location.reload();
    else worker.postMessage({ type: "SKIP_WAITING" });
  };
  banner.append(button);
  const anchor = document.querySelector(".topbar, .delivery-topbar");
  if (anchor) anchor.after(banner);
  else document.body.prepend(banner);
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
