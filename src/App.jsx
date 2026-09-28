import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { startProfile } from "./components/Profile.jsx";
import DeliveryRegistry from "./components/DeliveryRegistry.jsx";
import { startSpelling } from "./services/spelling.js";
import shell from "./legacy/shell.html?raw";
import { startEditor } from "./legacy/editor.js";
import { startGuide } from "./legacy/guide.js";
import { startPeople } from "./legacy/people.js";
import { startSignatureFixes } from "./legacy/signatures.js";
import { startEasterEgg } from "./legacy/easter-egg.js";
import { recoverPreviousVersion } from "./services/recover-original.js";

// React owns the stable boundary; the original controller owns its descendants.
// Do not render React children inside it or remount this single-page controller.
export default function App() {
  const initialized = useRef(false);
  const [deliveryMode, setDeliveryMode] = useState(
    () => location.hash === "#registro-entrega",
  );

  useEffect(() => {
    const onHashChange = () =>
      setDeliveryMode(location.hash === "#registro-entrega");
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useLayoutEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    recoverPreviousVersion();
    document.querySelectorAll(".field").forEach((field) => {
      const label = field.querySelector("label");
      const input = field.querySelector("input, select, textarea");
      if (label && input?.id && !label.htmlFor) label.htmlFor = input.id;
    });
    startEditor();
    startGuide();
    startPeople();
    startSignatureFixes();
    startEasterEgg();
    startProfile();
    startSpelling();
  }, []);

  return (
    <>
      <div hidden={deliveryMode} dangerouslySetInnerHTML={{ __html: shell }} />
      {deliveryMode && (
        <DeliveryRegistry
          onClose={() => {
            location.hash = "inicio";
          }}
        />
      )}
    </>
  );
}
if (import.meta.hot) import.meta.hot.accept(() => location.reload());
