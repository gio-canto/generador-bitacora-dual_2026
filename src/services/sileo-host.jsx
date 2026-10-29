import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { Toaster, sileo } from "sileo";
import "sileo/styles.css";
let root;
let position = "";
function syncToaster() {
  if (!root) return;
  const next = document.body.classList.contains("generator-mobile-active")
    ? "top-center"
    : "bottom-center";
  if (next !== position) {
    position = next;
    flushSync(() => root.render(<Toaster position={position} />));
  }
}
export function showNotice(kind, title, description) {
  if (!root) {
    const host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    window.addEventListener("bitacora-generator-layout", syncToaster);
  }
  syncToaster();
  const method = ["success", "error", "warning", "info"].includes(kind)
    ? kind
    : "info";
  sileo[method]({ title, description, duration: 4500 });
}
