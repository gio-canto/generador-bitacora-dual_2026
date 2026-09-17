import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { Toaster, sileo } from "sileo";
import "sileo/styles.css";
let root;
export function showNotice(kind, title, description) {
  if (!root) {
    const host = document.createElement("div");
    document.body.append(host);
    root = createRoot(host);
    flushSync(() => root.render(<Toaster position="bottom-center" />));
  }
  const method = ["success", "error", "warning", "info"].includes(kind)
    ? kind
    : "info";
  sileo[method]({ title, description, duration: 4500 });
}
