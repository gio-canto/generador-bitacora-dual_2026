import {afterEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import {readFile} from "node:fs/promises";
import {join} from "node:path";
import DeliveryRegistry from "../src/components/DeliveryRegistry.jsx";
import {createDeliveryState,createStudent,createWeek,writeDeliveryState} from "../src/services/delivery-registry.js";

const cssPath=join(process.cwd(),"src","delivery-unified-glass.css");
const jsxPath=join(process.cwd(),"src","components","DeliveryRegistry.jsx");
const originalMatch=window.matchMedia;
afterEach(()=>{
  cleanup();localStorage.clear();
  Object.defineProperty(window,"matchMedia",{configurable:true,writable:true,value:originalMatch});
});
function setup(mobile=false){
  Object.defineProperty(window,"matchMedia",{configurable:true,writable:true,value:vi.fn(query=>({
    matches:mobile && query.includes("max-width: 760px"),media:query,
    addEventListener:vi.fn(),removeEventListener:vi.fn(),
  }))});
  const state=createDeliveryState();
  state.context={school:"CBTIS 134",generation:"2024-2027"};
  state.students=[createStudent({id:"a",name:"Ana",specialty:"Programación"})];
  state.weeks=[createWeek({id:"w",label:"Semana 42",startDate:"2026-10-20"})];
  writeDeliveryState(state);
}
describe("v0.57.1 · sistema visual compartido en todo Registro Dual",()=>{
  it("aplica una sola hoja de tema delimitada a la app y sin afectar el generador principal",async()=>{
    const style=await readFile(cssPath,"utf8");
    const registry=await readFile(jsxPath,"utf8");
    expect(registry).toContain('import "../delivery-unified-glass.css"');
    expect(style).toContain(".delivery-app");
    for(const name of ["delivery-summary-card","delivery-week-row","delivery-setup-card",
      "delivery-report-card","delivery-manual-card","delivery-announcement-area",
      "delivery-png-preview","ds-panel","ds-premium-hero","delivery-camera-shell",
      "delivery-bottom-navigation"]){
      expect(style).toContain(name);
    }
    expect(style).toContain("prefers-reduced-motion");
    expect(style).toContain("prefers-reduced-transparency");
    expect(style).toContain("prefers-contrast");
    expect(style).not.toContain("#app >");
  });
  it("muestra el símbolo oficial Dual en el encabezado de escritorio y permite navegar al inicio",()=>{
    setup(false);
    const {container}=render(<DeliveryRegistry onClose={vi.fn()}/>);
    const header=container.querySelector(".delivery-topbar");
    expect(container.querySelector(".delivery-layout-desktop")).toBeTruthy();
    expect(header?.querySelector(".delivery-brand-logo-desktop")?.getAttribute("src"))
      .toContain("registro-dual-icon-192.png");
    expect(header?.textContent).toContain("Registro Dual");
    fireEvent.click(screen.getByRole("button",{name:/Estadísticas/}));
    expect(container.querySelector('[data-view="statistics"]')).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Volver al generador de Bitácora Dual"}));
  });
  it("conserva el mismo contenedor en Inicio, Semanas y Herramientas móviles",()=>{
    setup(true);
    const {container}=render(<DeliveryRegistry onClose={vi.fn()}/>);
    expect(container.querySelector('[data-view="home"].delivery-layout-mobile')).toBeTruthy();
    expect(container.querySelector(".delivery-mobile-welcome")).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Semanas"}));
    expect(container.querySelector('[data-view="weeks"].delivery-layout-mobile')).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Más"}));
    expect(container.querySelector('[data-view="more"].delivery-layout-mobile')).toBeTruthy();
    expect(container.querySelector(".delivery-bottom-navigation")).toBeTruthy();
  });
});
