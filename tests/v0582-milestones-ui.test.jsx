import {afterEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,within} from "@testing-library/react";
import DeliveryStatistics from "../src/components/DeliveryStatistics.jsx";
import {createStudent,createWeek,saveManualDelivery} from "../src/services/delivery-registry.js";
import {buildManualStatistics} from "../src/services/manual-statistics.js";

vi.mock("../src/components/StudentInsights.jsx",()=>({default:()=>null}));
vi.mock("../src/components/AnimatedValue.jsx",()=>({default:({value})=><>{value}</>}));
afterEach(cleanup);
function fixture(){
 const student=createStudent({id:"alumno-hito",name:"Alumno de prueba",
   company:"Empresa A",specialty:"Programación"});
 const other=createStudent({id:"alumno-sin-horas",name:"Sin horas",
   company:"Empresa B",specialty:"Contabilidad"});
 const stats=buildManualStatistics(Array.from({length:4},()=>({
   status:"laboral",hours:"10",reasonCode:"0"
 })));
 let week=createWeek({id:"semana",startDate:"2026-10-20",label:"Semana 1"});
 week=saveManualDelivery(week,student.id,"entregado",{statistics:stats});
 return {students:[student,other],weeks:[week]};
}
describe("v0.58.2 · vista Hitos de Registro Dual",()=>{
 it("la subbarra móvil muestra Hitos, ambos umbrales y avance por alumno",()=>{
   const onReportStudent=vi.fn();
   render(<DeliveryStatistics state={fixture()} mobileView onBack={vi.fn()}
     onReportStudent={onReportStudent} onReportStatistics={vi.fn()}/>);
   const nav=screen.getByRole("navigation",{name:"Secciones de Datos"});
   fireEvent.click(within(nav).getByRole("button",{name:"Hitos"}));
   const region=screen.getByRole("region",{name:"Hitos de horas de Educación Dual"});
   expect(within(region).getByText("480 horas acumuladas")).toBeTruthy();
   expect(within(region).getByText("840 horas en total · 480 + 360 adicionales")).toBeTruthy();
   expect(within(region).getByText("Alumno de prueba")).toBeTruthy();
   expect(within(region).getByText("Sin horas")).toBeTruthy();
   expect(within(region).getByText("440 h para el primer hito")).toBeTruthy();
   expect(within(region).getByRole("progressbar",{name:/Avance de Alumno de prueba/})).toBeTruthy();
   fireEvent.click(within(region).getByRole("button",{name:"Alumno de prueba"}));
   expect(onReportStudent).toHaveBeenCalledWith("alumno-hito");
 });
 it("la sección Hitos permanece disponible en la web de escritorio",()=>{
   render(<DeliveryStatistics state={fixture()} mobileView={false}
     onBack={vi.fn()} onReportStudent={vi.fn()} onReportStatistics={vi.fn()}/>);
   const nav=screen.getByRole("navigation",{name:"Secciones de estadísticas"});
   fireEvent.click(within(nav).getByRole("button",{name:/Hitos$/}));
   expect(screen.getByRole("region",{name:"Hitos de horas de Educación Dual"})).toBeTruthy();
   expect(screen.getByText(/reconocimiento oficial depende/)).toBeTruthy();
 });
});
