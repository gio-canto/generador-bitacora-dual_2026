import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { Toaster, sileo } from "sileo";
import "sileo/styles.css";
let root;
export function showImported() {
  if (!root) {
    const host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    flushSync(() => root.render(<Toaster position="bottom-center" />));
  }
  sileo.success({
    title: "Respaldo importado",
    description: "Tus registros anteriores se conservaron.",
  });
}
