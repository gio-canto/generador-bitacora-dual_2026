import { useEffect, useRef, useState } from "react";
import { initialState, persist } from "../services/storage.js";
export default function useWorkspace() {
  const [state, setState] = useState(initialState);
  const [status, setStatus] = useState(
    state.storageError ? "Sin guardar" : "Guardando…",
  );
  const latest = useRef(state);
  latest.current = state;
  const blocked = !!state.storageError;
  useEffect(() => {
    if (blocked) return;
    const save = () => {
      try {
        persist(latest.current);
        setStatus("Borrador guardado");
      } catch {
        setStatus("No se pudo guardar. Exporta un respaldo.");
      }
    };
    setStatus("Guardando…");
    const timer = setTimeout(save, 250);
    return () => clearTimeout(timer);
  }, [state, blocked]);
  useEffect(() => {
    const flush = () => {
      if (latest.current.storageError) return;
      try {
        persist(latest.current);
      } catch {
        setStatus("No se pudo guardar. Exporta un respaldo.");
      }
    };
    const visibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      flush();
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  return [state, setState, status];
}
