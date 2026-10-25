import {afterEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,within} from "@testing-library/react";
import {readFile} from "node:fs/promises";
import {join} from "node:path";
import DeliveryStatistics from "../src/components/DeliveryStatistics.jsx";
import {createStudent,createWeek} from "../src/services/delivery-registry.js";

vi.mock("../src/components/StudentInsights.jsx",()=>({default:()=>null}));
vi.mock("../src/components/AnimatedValue.jsx",()=>({default:({value})=><>{value}</>}));
afterEach(cleanup);
const state=()=>({
  students:[
    createStudent({id:"a",name:"Ana",group:"A",company:"Empresa A",specialty:"Programación"}),
    createStudent({id:"b",name:"Beto",group:"B",company:"Empresa B",specialty:"Contabilidad"}),
  ],
  weeks:[createWeek({id:"w1",label:"Semana 1",startDate:"2026-10-19"})],
});
const props=()=>({state:state(),onBack:vi.fn(),onReportStudent:vi.fn(),onReportStatistics:vi.fn()});

describe("Datos: subnavegación estable en móvil y escritorio",()=>{
 it("en móvil muestra las seis secciones en una barra horizontal sin drawer flotante",()=>{
   const {container}=render(<DeliveryStatistics {...props()} mobileView/>);
   const nav=screen.getByRole("navigation",{name:"Secciones de Datos"});
   const labels=["Resumen","Asistencia","Empresas","Grupos","Alumnos","Histórico"];
   expect(within(nav).getAllByRole("button")).toHaveLength(6);
   for(const label of labels)expect(within(nav).getByRole("button",{name:label})).toBeTruthy();
   expect(within(nav).getByRole("button",{name:"Resumen"}).getAttribute("aria-current")).toBe("page");
   expect(container.querySelector(".ds-sidebar")).toBeNull();
   expect(container.querySelector(".ds-sidebar-scrim")).toBeNull();
   expect(container.querySelector(".ds-mobile-toolbar")).toBeNull();
 });
 it("cambia las secciones, mantiene filtros aplicados y no crea barras duplicadas",()=>{
   const {container}=render(<DeliveryStatistics {...props()} mobileView/>);
   const nav=screen.getByRole("navigation",{name:"Secciones de Datos"});
   fireEvent.click(within(nav).getByRole("button",{name:"Empresas"}));
   expect(within(nav).getByRole("button",{name:"Empresas"}).getAttribute("aria-current")).toBe("page");
   expect(container.querySelector('[data-section="companies"]')).toBeTruthy();
   fireEvent.click(within(nav).getByRole("button",{name:"Grupos"}));
   expect(container.querySelector('[data-section="groups"]')).toBeTruthy();
   const filters=screen.getByRole("button",{name:"Filtros"});
   fireEvent.click(filters);
   fireEvent.change(screen.getByLabelText("Especialidad"),{target:{value:"Programación"}});
   fireEvent.click(within(nav).getByRole("button",{name:"Asistencia"}));
   expect(container.querySelector('[data-section="attendance"]')).toBeTruthy();
   fireEvent.click(filters);
   expect(screen.getByLabelText("Especialidad").value).toBe("Programación");
   expect(container.querySelectorAll(".ds-mobile-sections")).toHaveLength(1);
 });
 it("en escritorio conserva sus seis opciones y no muestra la subbarra móvil",()=>{
   const {container}=render(<DeliveryStatistics {...props()} mobileView={false}/>);
   expect(screen.queryByRole("navigation",{name:"Secciones de Datos"})).toBeNull();
   const nav=screen.getByRole("navigation",{name:"Secciones de estadísticas"});
   expect(within(nav).getAllByRole("button")).toHaveLength(6);
   fireEvent.click(within(nav).getByRole("button",{name:/^03Empresas$/}));
   expect(container.querySelector('[data-section="companies"]')).toBeTruthy();
   expect(container.querySelector(".ds-sidebar-scrim")).toBeNull();
 });
 it("los estilos no posicionan la subbarra móvil fuera de su contenedor ni tapan gráficos",async()=>{
   const css=await readFile(join(process.cwd(),"src","delivery-mobile-polish.css"),"utf8");
   const desktop=await readFile(join(process.cwd(),"src","delivery-desktop-restoration.css"),"utf8");
   expect(css).toContain(".delivery-app.delivery-layout-mobile .ds-mobile-sections");
   expect(css).toContain("overflow-x:auto");
   expect(css).toContain("scrollbar-width:none");
   expect(css).toContain("min-height:44px");
   expect(desktop).toContain(".delivery-app.delivery-layout-desktop .ds-sidebar:not(.ds-sidebar-open)");
   expect(desktop).toContain("visibility:visible");
 });
});
