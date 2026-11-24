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
function ensureHost(){
  if(root)return;
  const host=document.createElement("div");
  host.className="delivery-sileo-host";
  document.body.append(host);
  root=createRoot(host);
  window.addEventListener("bitacora-generator-layout",syncToaster);
}
export function showPromiseNotice(promise,options={}){
  ensureHost();
  syncToaster();
  return sileo.promise(promise,{
    loading:{title:options.loading||"Leyendo bitácoras"},
    success:result=>({title:result?.errors?"Lectura completada con observaciones":"Lectura terminada",
      description:result?.errors?result.errors+" archivo(s) por revisar.":"Puedes revisar los registros."}),
    error:error=>({title:"No se completó la lectura",
      description:String(error?.message||"Revisa el archivo.")}),
    position:"top-center"
  });
}
export function showNotice(kind, title, description) {
  ensureHost();
  syncToaster();
  const method = ["success", "error", "warning", "info"].includes(kind)
    ? kind
    : "info";
  sileo[method]({ title, description, duration: 4500 });
}
