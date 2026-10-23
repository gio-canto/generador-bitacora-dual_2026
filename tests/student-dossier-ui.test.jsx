import {afterEach,describe,it,expect} from "vitest";
import {render,fireEvent,screen,cleanup} from "@testing-library/react";
import StudentInsights from "../src/components/StudentInsights.jsx";
import {createStudent,createWeek,saveManualDelivery} from "../src/services/delivery-registry.js";
import {buildManualStatistics} from "../src/services/manual-statistics.js";
afterEach(cleanup);
const student=createStudent({id:"s1",name:"Alicia Pérez",specialty:"Programación",company:"Empresa 1",group:"B"});
const second=createStudent({id:"s2",name:"Beto López",specialty:"Contabilidad",company:"Empresa 2",group:"C"});
const week=createWeek({id:"w1",label:"Semana primera",startDate:"2026-09-01",endDate:"2026-09-04"});
const stats=buildManualStatistics([
  {status:"laboral",hours:"4",reasonCode:"0"},
  {status:"falta",hours:"",reasonCode:"23"},
  {status:"inhabil",hours:"",reasonCode:"0"},
  {status:"laboral",hours:"4",reasonCode:"0"},
]);
const delivered=saveManualDelivery(week,student.id,"entregado",
  {statistics:stats,usageSource:"other",timestamp:"2026-09-04T15:00:00Z"});
const state={students:[student,second],weeks:[delivered]};
const view=()=>render(<StudentInsights state={state}
  period="all" weekId="w1" month="" specialty="" company=""/>);

describe("expediente nominal en Estadísticas v0.55",()=>{
 it("permite seleccionar a un alumno y consultar sus semanas registradas",()=>{
   view();
   expect(screen.getByText(/Selecciona un alumno para consultar su historial/)).toBeTruthy();
   fireEvent.change(screen.getByLabelText("Seleccionar alumno"),{target:{value:"s1"}});
   expect(screen.getByRole("heading",{name:"Alicia Pérez"})).toBeTruthy();
   expect(screen.getByText("Semana primera")).toBeTruthy();
   expect(screen.getByText(/Cumplimiento de entrega/)).toBeTruthy();
   fireEvent.click(screen.getByText("Semana primera"));
   expect(screen.getByText(/Festival Académico/)).toBeTruthy();
 });
 it("abre fichas desde rankings y conserva la identidad por ID",()=>{
   view();
   fireEvent.click(screen.getByRole("button",{name:"Ver expediente de Alicia Pérez"}));
   expect(screen.getByLabelText("Seleccionar alumno").value).toBe("s1");
   fireEvent.change(screen.getByLabelText("Seleccionar alumno"),{target:{value:"s2"}});
   expect(screen.getByRole("heading",{name:"Beto López"})).toBeTruthy();
 });
 it("busca por nombre sin borrar la selección anterior",()=>{
   view();
   fireEvent.change(screen.getByLabelText("Seleccionar alumno"),{target:{value:"s1"}});
   fireEvent.change(screen.getByPlaceholderText("Nombre del alumno"),
     {target:{value:"Beto"}});
   expect(screen.getByRole("heading",{name:"Alicia Pérez"})).toBeTruthy();
   expect(screen.getByRole("option",{name:"Beto López"})).toBeTruthy();
 });
});
