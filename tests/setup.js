import { vi } from "vitest";
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import {existsSync} from "node:fs";

// Las métricas tipográficas del PDF deben ser estables en Linux CI.
// Alias de pruebas, sin cambiar las fuentes de la aplicación en producción.
for(const [file,family] of [
  ["/usr/share/fonts/truetype/liberation2/LiberationSerif-Regular.ttf","Times New Roman"],
  ["/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf","Segoe Script"],
]){
  if(existsSync(file))GlobalFonts.registerFromPath(file,family);
}
const canvases = new WeakMap();
HTMLCanvasElement.prototype.getContext = function () {
  let c = canvases.get(this);
  if (!c) {
    c = createCanvas(this.width || 300, this.height || 150);
    canvases.set(this, c);
  }
  if (c.width !== this.width) c.width = this.width;
  if (c.height !== this.height) c.height = this.height;
  return c.getContext("2d");
};
window.matchMedia = vi.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
}));
Element.prototype.scrollIntoView = vi.fn();
HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};
HTMLDialogElement.prototype.close = function () {
  this.open = false;
};
window.ResizeObserver = class {
  observe() {}
  disconnect() {}
  unobserve() {}
};
