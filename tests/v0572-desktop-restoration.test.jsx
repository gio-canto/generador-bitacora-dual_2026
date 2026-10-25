import {afterEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import {readFile} from "node:fs/promises";
import {join} from "node:path";
import DeliveryRegistry from "../src/components/DeliveryRegistry.jsx";
import {createDeliveryState,createStudent,createWeek,writeDeliveryState}
 from "../src/services/delivery-registry.js";

const oldMatchMedia=window.matchMedia;
afterEach(()=>{
 cleanup();localStorage.clear();
 Object.defineProperty(window,"matchMedia",{configurable:true,writable:true,value:oldMatchMedia});
});
function desktop(){
 Object.defineProperty(window,"matchMedia",{configurable:true,writable:true,value:vi.fn(query=>({
  matches:false,media:query,addEventListener:vi.fn(),removeEventListener:vi.fn(),
 }))});
 const state=createDeliveryState();
 state.context={school:"CBTIS 134",generation:"2024-2027"};
 state.students=[createStudent({id:"a",name:"Ana",specialty:"Programación"})];
 state.weeks=Array.from({length:5},(_,i)=>createWeek({
  id:"w"+i,label:"Semana "+(i+1),startDate:"2026-10-"+String(i+1).padStart(2,"0"),
 }));
 writeDeliveryState(state);
}
describe("Restauración web de escritorio sin afectar la app móvil",()=>{
 it("recupera las cinco tarjetas originales y el historial completo de Inicio",()=>{
  desktop();
  const {container}=render(<DeliveryRegistry onClose={vi.fn()}/>);
  expect(container.querySelector(".delivery-layout-desktop")).toBeTruthy();
  expect(container.querySelector(".delivery-desktop-home-cards .delivery-summary-grid")
    ?.querySelectorAll(".delivery-summary-card")).toHaveLength(5);
  expect(container.querySelectorAll(".delivery-home-history .delivery-week-row")).toHaveLength(5);
  expect(container.querySelector(".delivery-app-home-cards .delivery-home-metrics")).toBeTruthy();
  expect(container.querySelector(".delivery-bottom-navigation")).toBeNull();
  expect(screen.getByRole("button",{name:"Abrir accesos rápidos"})).toBeTruthy();
 });
 it("las Estadísticas de escritorio vuelven a tener título, KPIs y filtros originales",()=>{
  desktop();
  const {container}=render(<DeliveryRegistry onClose={vi.fn()}/>);
  fireEvent.click(screen.getByRole("button",{name:"Estadísticas"}));
  expect(screen.getByRole("heading",{name:"Estadísticas"})).toBeTruthy();
  expect(container.querySelector(".ds-desktop-header")).toBeTruthy();
  expect(container.querySelector(".ds-kpis")?.querySelectorAll(".ds-kpi")).toHaveLength(6);
  expect(container.querySelector(".ds-premium-hero")).toBeNull();
  expect(screen.getByRole("group",{name:"Periodo"})).toBeTruthy();
  expect(container.querySelector(".ds-shortcuts")).toBeNull();
 });
 it("el menú rápido de escritorio no modifica el ancho y se abre por demanda",async()=>{
  desktop();
  const css=await readFile(join(process.cwd(),"src","delivery-desktop-restoration.css"),"utf8");
  const navCss=await readFile(join(process.cwd(),"src","delivery-quick-sidebar.css"),"utf8");
  const glassCss=await readFile(join(process.cwd(),"src","delivery-unified-glass.css"),"utf8");
  expect(css).toContain("width:min(1180px,calc(100% - 28px))");
  expect(css).toContain("margin-inline:auto");
  expect(navCss).toContain("visibility:hidden");
  expect(navCss).toContain("delivery-quick-open");
  expect(glassCss).toContain(".delivery-app.delivery-layout-mobile .delivery-hero.compact");
  expect(glassCss).not.toContain(".delivery-app .delivery-summary-grid");
  const {container}=render(<DeliveryRegistry onClose={vi.fn()}/>);
  fireEvent.click(screen.getByRole("button",{name:"Abrir accesos rápidos"}));
  expect(container.querySelector(".delivery-quick-sidebar.delivery-quick-open")).toBeTruthy();
  fireEvent.click(screen.getByRole("button",{name:"Cerrar barra lateral"}));
  expect(container.querySelector(".delivery-quick-sidebar.delivery-quick-open")).toBeNull();
 });
});
