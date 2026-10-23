import {afterEach,describe,it,expect,vi} from "vitest";
import {render,fireEvent,screen,cleanup} from "@testing-library/react";
import StudentInsights from "../src/components/StudentInsights.jsx";
import {createStudent,createWeek,saveManualDelivery} from "../src/services/delivery-registry.js";

const first=createStudent({id:"s1",name:"Alicia Pérez",specialty:"Programación",company:"Empresa 1",group:"B"});
const second=createStudent({id:"s2",name:"Beto López",specialty:"Contabilidad",company:"Empresa 2",group:"C"});
const weeks=[
  saveManualDelivery(createWeek({id:"w1",label:"Semana 1",startDate:"2026-09-01",endDate:"2026-09-04"}),"s1","entregado",{usageSource:"other"}),
  createWeek({id:"w2",label:"Semana 2",startDate:"2026-09-08",endDate:"2026-09-11"}),
  createWeek({id:"w3",label:"Semana 3",startDate:"2026-09-15",endDate:"2026-09-18"}),
];
const state={students:[first,second],weeks};
const view=cb=>render(<StudentInsights state={state} period="all" weekId="w1"
  month="" specialty="" company="" onReportStudent={cb}/>);
afterEach(cleanup);
describe("v0.56 · acceso a reportes desde estadísticas",()=>{
 it("no muestra un selector de PDF individual dentro de Estadísticas",()=>{
  view(vi.fn());
  expect(screen.queryByLabelText("Descargar PDF del alumno")).toBeNull();
  expect(screen.queryByRole("heading",{name:"Expediente por alumno"})).toBeNull();
 });
 it("abre Reportes con el alumno desde rankings",()=>{
  const onReportStudent=vi.fn();
  view(onReportStudent);
  fireEvent.click(screen.getAllByRole("button",{name:"Abrir reporte de Alicia Pérez"})[0]);
  expect(onReportStudent).toHaveBeenCalledWith("s1");
 });
 it("abre Reportes con alumno desde historial con dos o más pendientes",()=>{
  const onReportStudent=vi.fn();
  view(onReportStudent);
  fireEvent.click(screen.getByRole("button",{name:"Beto López"}));
  expect(onReportStudent).toHaveBeenCalledWith("s2");
  expect(screen.getByText("2")).toBeTruthy();
 });
});
