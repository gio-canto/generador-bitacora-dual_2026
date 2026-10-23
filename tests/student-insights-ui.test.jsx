import {afterEach,describe,expect,it} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import StudentInsights from "../src/components/StudentInsights.jsx";
import {createStudent,createWeek,saveManualDelivery} from "../src/services/delivery-registry.js";
import {buildManualStatistics} from "../src/services/manual-statistics.js";

const stats=buildManualStatistics([
  {status:"falta",reasonCode:"3",hours:""},
  {status:"laboral",reasonCode:"0",hours:"4"},
  {status:"laboral",reasonCode:"0",hours:"4"},
  {status:"inhabil",reasonCode:"0",hours:""},
]);
const one=createStudent({id:"one",name:"Alumna Alfa",company:"Empresa A",
  specialty:"Programación",group:"B"});
const two=createStudent({id:"two",name:"Alumno Beta",company:"Empresa B",
  specialty:"Contabilidad",group:"C"});
const rawWeek=createWeek({id:"old",label:"Semana antigua",startDate:"2026-08-04",
  endDate:"2026-08-07",dueAt:"2026-08-08T18:00:00-06:00"});
const w=saveManualDelivery(rawWeek,one.id,"entregado",{statistics:stats,usageSource:"other"});
const state={students:[one,two],weeks:[w]};
afterEach(cleanup);

describe("pantalla de seguimiento nominal 0.54",()=>{
  it("muestra nombres, cifras verificables y el historial solo en General",()=>{
    const {rerender}=render(<StudentInsights state={state} period="weekly"
      weekId="old" month="" specialty="" company=""/>);
    expect(screen.getByRole("heading",{name:"Estadísticas por alumno"})).toBeTruthy();
    expect(screen.getByRole("heading",{name:"Más faltas registradas"})).toBeTruthy();
    expect(screen.queryByRole("heading",{name:"Historial de entregas pendientes"})).toBeNull();
    rerender(<StudentInsights state={state} period="all"
      weekId="old" month="" specialty="" company=""/>);
    expect(screen.getByRole("heading",{name:"Historial de entregas pendientes"})).toBeTruthy();
    expect(screen.getAllByText("Alumno Beta").length).toBeGreaterThan(0);
    expect(screen.getByText(/Semana antigua.*2026-08-04/)).toBeTruthy();
  });
  it("filtra por grupo el seguimiento y las clasificaciones",()=>{
    render(<StudentInsights state={state} period="all"
      weekId="old" month="" specialty="" company=""/>);
    fireEvent.change(screen.getByLabelText("Grupo"),{target:{value:"B"}});
    expect(screen.getByText("No hay alumnos con pendientes que coincidan con los filtros.")).toBeTruthy();
    expect(screen.getByRole("heading",{name:"Menor cumplimiento de entrega"})).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Grupo"),{target:{value:"C"}});
    expect(screen.getAllByText("Alumno Beta").length).toBeGreaterThan(0);
  });
});
