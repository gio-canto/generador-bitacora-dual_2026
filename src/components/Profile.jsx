import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Blobatar } from "blobatar/react";
import { readProfile, forgetProfile } from "../services/profile.js";
import { notify } from "../services/rare-notification.jsx";
export function Profile() {
  const [name, setName] = useState(readProfile);
  useEffect(() => {
    const sync = () => setName(readProfile());
    window.addEventListener("bitacora-profile", sync);
    return () => window.removeEventListener("bitacora-profile", sync);
  }, []);
  if (!name) return null;
  return (
    <details className="profile-menu">
      <summary>
        <Blobatar name={name} size={38} alt="" />
        <span>
          <small>Tu nombre en este navegador</small>
          <strong>{name}</strong>
        </span>
      </summary>
      <div className="profile-actions">
        <p>Lo completaremos al crear tu próxima bitácora.</p>
        <button
          className="btn"
          onClick={() => {
            window.dispatchEvent(new Event("bitacora-edit-name"));
          }}
        >
          Cambiar nombre
        </button>
        <button
          className="btn"
          onClick={() => {
            if (forgetProfile())
              notify(
                "info",
                "Nombre olvidado",
                "Tus bitácoras guardadas siguen aquí.",
              );
            else
              notify(
                "error",
                "No se pudo olvidar el nombre",
                "Revisa el almacenamiento del navegador.",
              );
          }}
        >
          Olvidar este nombre
        </button>
      </div>
    </details>
  );
}
export function startProfile() {
  const host = document.getElementById("profileSlot");
  if (host) createRoot(host).render(<Profile />);
}
