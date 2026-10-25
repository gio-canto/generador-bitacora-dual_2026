import {afterEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import DeliveryRegistry from "../src/components/DeliveryRegistry.jsx";
import {createDeliveryState,createStudent,createWeek,writeDeliveryState}
 from "../src/services/delivery-registry.js";
const originalMatchMedia=window.matchMedia;
afterEach(()=>{
 cleanup();localStorage.clear();
 Object.defineProperty(window,"matchMedia",{configurable:true,writable:true,value:originalMatchMedia});
});
function mobile(){
 Object.defineProperty(window,"matchMedia",{configurable:true,writable:true,value:vi.fn(query=>({
  matches:query.includes("max-width: 760px"),media:query,
  addEventListener:vi.fn(),removeEventListener:vi.fn(),
 }))});
 const state=createDeliveryState();
 state.context={school:"CBTIS 134",generation:"2024-2027"};
 state.students=[createStudent({id:"a",name:"Alumna A",specialty:"Programación"})];
 state.weeks=[createWeek({id:"w",label:"Semana 42",startDate:"2026-10-20"})];
 writeDeliveryState(state);
}
describe("v0.57 experiencia Registro Dual A+E",()=>{
 it("ofrece pestañas exclusivas de móvil y pantallas Semanas y Más",()=>{
  mobile();
  const {container}=render(<DeliveryRegistry onClose={vi.fn()}/>);
  expect(container.querySelector(".delivery-layout-mobile")).toBeTruthy();
  const nav=screen.getByRole("navigation",{name:"Navegación móvil"});
  expect(nav).toBeTruthy();
  fireEvent.click(screen.getByRole("button",{name:"Semanas"}));
  expect(screen.getByRole("region",{name:"Listado de semanas"})).toBeTruthy();
  expect(screen.getByText("Semana 42")).toBeTruthy();
  fireEvent.click(screen.getByRole("button",{name:"Más"}));
  expect(screen.getByRole("region",{name:"Herramientas del registro"})).toBeTruthy();
  expect(screen.getByRole("group",{name:"Presentación del Registro Dual"})).toBeTruthy();
 });
 it("permite escoger escritorio y retornar a móvil guardando la preferencia",()=>{
  mobile();
  const {container}=render(<DeliveryRegistry onClose={vi.fn()}/>);
  fireEvent.click(screen.getByRole("button",{name:"Más"}));
  fireEvent.click(screen.getByRole("button",{name:"Escritorio"}));
  expect(localStorage.getItem("registro-dual-layout")).toBe("desktop");
  expect(container.querySelector(".delivery-layout-desktop")).toBeTruthy();
  expect(screen.queryByRole("navigation",{name:"Navegación móvil"})).toBeNull();
  fireEvent.click(screen.getByRole("button",{name:"Móvil"}));
  expect(localStorage.getItem("registro-dual-layout")).toBe("mobile");
  expect(screen.getByRole("navigation",{name:"Navegación móvil"})).toBeTruthy();
 });
});
