import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Blobatar } from "blobatar/react";
import { readProfileData } from "../services/profile.js";

// The same deterministic Blobatar and the same active profile as the desktop menu.
// This is visual-only; it never creates or changes user profiles.
export function GeneratorMobileAvatar() {
  const [name, setName] = useState(() => readProfileData().name);
  useEffect(() => {
    const sync = () => setName(readProfileData().name);
    window.addEventListener("bitacora-profile", sync);
    window.addEventListener("bitacora-apply-profile", sync);
    return () => {
      window.removeEventListener("bitacora-profile", sync);
      window.removeEventListener("bitacora-apply-profile", sync);
    };
  }, []);

  return <Blobatar name={name || "Alumno Dual"} size={38} alt="" />;
}

export function startGeneratorMobileAvatar() {
  const host = document.getElementById("gmAvatarArt");
  if (!host) return () => {};
  const root = createRoot(host);
  root.render(<GeneratorMobileAvatar />);
  return () => root.unmount();
}
