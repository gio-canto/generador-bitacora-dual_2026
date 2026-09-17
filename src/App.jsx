import { useLayoutEffect, useRef } from "react";
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
  useLayoutEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    recoverPreviousVersion();
    document.querySelectorAll('.field').forEach(field => {
      const label = field.querySelector('label');
      const input = field.querySelector('input, select, textarea');
      if (label && input?.id && !label.htmlFor) label.htmlFor = input.id;
    });
    startEditor();
    startGuide();
    startPeople();
    startSignatureFixes();
    startEasterEgg();
  }, []);
  return <div dangerouslySetInnerHTML={{ __html: shell }} />;
}
if (import.meta.hot) import.meta.hot.accept(() => location.reload());
