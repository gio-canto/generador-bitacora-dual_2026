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
let updateReloading = false;

function activateUpdate(worker) {
  if (!worker) return;
  if (worker.state === "activated") {
    if (!updateReloading) {
      updateReloading = true;
      location.reload();
    }
    return;
  }
  worker.postMessage({ type: "SKIP_WAITING" });
}

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const serviceWorkerUrl = /\/registro-entrega\/?$/i.test(location.pathname)
      ? "../sw.js"
      : "./sw.js";

    navigator.serviceWorker
      .register(serviceWorkerUrl, { updateViaCache: "none" })
      .then(async (reg) => {
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (updateReloading) return;
          updateReloading = true;
          location.reload();
        });

        // Every page opening explicitly checks the network for a newer build.
        // If one is already waiting, activate it immediately.
        if (reg.waiting) activateUpdate(reg.waiting);

        reg.addEventListener("updatefound", () => {
          const worker = reg.installing;
          worker?.addEventListener("statechange", () => {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller
            )
              activateUpdate(worker);
          });
        });

        try {
          await reg.update();
          if (reg.waiting) activateUpdate(reg.waiting);
        } catch {
          // Offline users keep the currently cached version.
        }
      })
      .catch(() => {
        /* The app remains usable without offline support. */
      });
  });
}
