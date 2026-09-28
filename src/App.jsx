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

const isDeliveryPage = () =>
  /\/registro-entrega\/?$/i.test(location.pathname) ||
  location.hash === "#registro-entrega";

// React owns the stable boundary; the original controller owns its descendants.
// Do not render React children inside it or remount this single-page controller.
export default function App() {
  const initialized = useRef(false);
  const [deliveryMode, setDeliveryMode] = useState(isDeliveryPage);

  useEffect(() => {
    const syncRoute = () => setDeliveryMode(isDeliveryPage());
    window.addEventListener("hashchange", syncRoute);
    window.addEventListener("popstate", syncRoute);
    return () => {
      window.removeEventListener("hashchange", syncRoute);
      window.removeEventListener("popstate", syncRoute);
    };
  }, []);

  useLayoutEffect(() => {
    if (initialized.current || deliveryMode) return;
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
  }, [deliveryMode]);

  if (deliveryMode) {
    return (
      <DeliveryRegistry
        onClose={() => {
          if (/\/registro-entrega\/?$/i.test(location.pathname))
            location.href = "../";
          else location.hash = "inicio";
        }}
      />
    );
  }

  return <div dangerouslySetInnerHTML={{ __html: shell }} />;
}
if (import.meta.hot) import.meta.hot.accept(() => location.reload());
