import {afterEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,within} from "@testing-library/react";
import DeliveryStatistics from "../src/components/DeliveryStatistics.jsx";
import {createStudent,createWeek,saveManualDelivery} from "../src/services/delivery-registry.js";
import {buildManualStatistics} from "../src/services/manual-statistics.js";

vi.mock("../src/components/StudentInsights.jsx",()=>({default:()=>null}));
vi.mock("../src/components/AnimatedValue.jsx",()=>({default:({value})=><>{value}</>}));
afterEach(cleanup);
const callbacks=()=>({onBack:vi.fn(),onReportStudent:vi.fn(),onReportStatistics:vi.fn()});
const fixture=()=>{
 const ana=createStudent({id:"a",name:"Ana",company:"Empresa Alfa",group:"A",specialty:"Programación"});
 const ben=createStudent({id:"b",name:"Ben",company:"Empresa Beta",group:"B",specialty:"Programación"});
 const days=buildManualStatistics([
   {status:"laboral",hours:"4",reasonCode:"0"},
   {status:"falta",hours:"",reasonCode:"0"},
   {status:"inhabil",hours:"",reasonCode:"0"},
   {status:"sin_labores",hours:"",reasonCode:"0"},
 ]);
 let week=createWeek({id:"w1",startDate:"2026-10-20",label:"Semana 42"});
 week=saveManualDelivery(week,ana.id,"entregado",{statistics:days});
 return {students:[ana,ben],weeks:[week]};
};
describe("Datos Editorial Glass v0.57.1",()=>{
 it("muestra logo Dual, estado real y gráfico proporcional con etiquetas accesibles",()=>{
   const spies=callbacks();
   render(<DeliveryStatistics state={fixture()} {...spies}/>);
   const hero=screen.getByRole("banner",{name:"Presentación de Datos"});
   expect(within(hero).getByRole("heading",{name:"Datos"})).toBeTruthy();
   expect(within(hero).queryByRole("img",{name:"Logotipo oficial Dual"})).toBeNull();
   expect(within(hero).getByText("1 de 2 registros aplicables recibidos")).toBeTruthy();
   expect(within(hero).getByText("1 a tiempo")).toBeTruthy();
   expect(within(hero).getByText("0 tardías")).toBeTruthy();
   expect(within(hero).getByText("1 pendientes")).toBeTruthy();
   expect(within(hero).getByRole("img",{name:"Entregas aplicables: 1 puntuales, 0 tardías y 1 pendientes"})).toBeTruthy();
   expect(within(hero).getAllByText("50%").length).toBeGreaterThan(0);
   expect(within(hero).getByText("Horas capturadas")).toBeTruthy();
   fireEvent.click(within(hero).getByRole("button",{name:"Reportes"}));
   expect(spies.onReportStatistics).toHaveBeenCalledOnce();
 });
 it("permite cambiar periodo y filtros desde las cápsulas con la misma fuente de estadísticas",()=>{
   render(<DeliveryStatistics state={fixture()} {...callbacks()}/>);
   const hero=screen.getByRole("banner",{name:"Presentación de Datos"});
   const monthly=within(hero).getByRole("button",{name:"Mensual"});
   fireEvent.click(monthly);
   expect(monthly.getAttribute("aria-pressed")).toBe("true");
   const filters=within(hero).getByRole("button",{name:"Filtros"});
   fireEvent.click(filters);
   expect(filters.getAttribute("aria-expanded")).toBe("true");
   fireEvent.change(screen.getByLabelText("Empresa"),{target:{value:"Empresa Beta"}});
   expect(within(hero).getByText("Empresa: Empresa Beta")).toBeTruthy();
   const all=within(hero).getByRole("button",{name:"General"});
   fireEvent.click(all);
   expect(all.getAttribute("aria-pressed")).toBe("true");
   fireEvent.click(screen.getByRole("button",{name:"Cerrar filtros"}));
   expect(filters.getAttribute("aria-expanded")).toBe("false");
 });
 it("abre secciones desde tarjetas editoriales sin duplicar todo el panel",()=>{
   render(<DeliveryStatistics state={fixture()} {...callbacks()}/>);
   const shortcuts=screen.getByRole("region",{name:"Explorar otras estadísticas"});
   fireEvent.click(within(shortcuts).getByRole("button",{name:/Empresas/}));
   expect(screen.getByRole("region",{name:"Estadísticas por empresa"})).toBeTruthy();
   expect(screen.queryByRole("region",{name:"Explorar otras estadísticas"})).toBeNull();
 });
 it("sin entregas o jornadas capturadas evita porcentajes y faltas inventados",()=>{
   render(<DeliveryStatistics state={{students:[],weeks:[]}} {...callbacks()}/>);
   const hero=screen.getByRole("banner",{name:"Presentación de Datos"});
   expect(within(hero).getByText("No hay entregas aplicables en este periodo.")).toBeTruthy();
   expect(within(hero).getByRole("img",{name:"Sin entregas aplicables en el periodo"})).toBeTruthy();
   expect(within(hero).getByText("Cumplimiento de entrega")).toBeTruthy();
   expect(within(hero).getByText("Asistencia")).toBeTruthy();
   expect(within(hero).getByText("Faltas")).toBeTruthy();
   expect(within(hero).queryByText("0%")).toBeNull();
 });
});
