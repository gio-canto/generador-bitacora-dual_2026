import {afterEach,beforeEach,describe,it,expect,vi} from "vitest";
import {render,fireEvent,screen,cleanup,waitFor} from "@testing-library/react";
import StudentInsights from "../src/components/StudentInsights.jsx";
import {generateStudentDossierPdf} from "../src/services/student-dossier-report.js";
import {createStudent,createWeek,saveManualDelivery} from "../src/services/delivery-registry.js";
import {buildManualStatistics} from "../src/services/manual-statistics.js";

vi.mock("../src/services/student-dossier-report.js",()=>({
  generateStudentDossierPdf:vi.fn(async()=>({filename:"expediente.pdf",pages:2})),
}));
const first=createStudent({id:"s1",name:"Alicia Pérez",specialty:"Programación",company:"Empresa 1",group:"B"});
const second=createStudent({id:"s2",name:"Beto López",specialty:"Contabilidad",company:"Empresa 2",group:"C"});
const raw=createWeek({id:"w1",label:"Semana primera",startDate:"2026-09-01",endDate:"2026-09-04"});
const stats=buildManualStatistics([
  {status:"laboral",hours:"4",reasonCode:"0"},
  {status:"falta",hours:"",reasonCode:"23"},
  {status:"inhabil",hours:"",reasonCode:"0"},
  {status:"laboral",hours:"4",reasonCode:"0"},
]);
const week=saveManualDelivery(raw,first.id,"entregado",{statistics:stats,usageSource:"other"});
const state={students:[first,second],weeks:[week]};
const view=()=>render(<StudentInsights state={state}
  period="all" weekId="w1" month="" specialty="" company=""/>);
beforeEach(()=>vi.clearAllMocks());
afterEach(cleanup);

describe("PDF individual desde Estadísticas v0.55.1",()=>{
  it("descarga al seleccionar alumno sin mostrar el expediente largo en pantalla",async()=>{
    view();
    const selector=screen.getByLabelText("Descargar PDF del alumno");
    fireEvent.change(selector,{target:{value:"s1"}});
    await waitFor(()=>expect(generateStudentDossierPdf).toHaveBeenCalledWith(state,"s1"));
    expect(screen.getByRole("heading",{name:"Expediente por alumno"})).toBeTruthy();
    expect(screen.queryByRole("heading",{name:"Alicia Pérez"})).toBeNull();
    expect(screen.queryByText("Semana primera")).toBeNull();
  });
  it("descarga PDF al pulsar el nombre de una clasificación",async()=>{
    view();
    fireEvent.click(screen.getAllByRole("button",{name:"Descargar PDF de Alicia Pérez"})[0]);
    await waitFor(()=>expect(generateStudentDossierPdf).toHaveBeenCalledWith(state,"s1"));
  });
  it("mantiene disponibles los historiales de alumnos con distinto nombre",async()=>{
    view();
    fireEvent.change(screen.getByPlaceholderText("Nombre del alumno"),
      {target:{value:"Beto"}});
    expect(screen.getByRole("option",{name:"Beto López"})).toBeTruthy();
    expect(screen.queryByRole("option",{name:"Alicia Pérez"})).toBeNull();
    fireEvent.change(screen.getByLabelText("Descargar PDF del alumno"),
      {target:{value:"s2"}});
    await waitFor(()=>expect(generateStudentDossierPdf).toHaveBeenCalledWith(state,"s2"));
  });
  it("avisa si falla la descarga",async()=>{
    vi.mocked(generateStudentDossierPdf).mockRejectedValueOnce(new Error("No se pudo crear el archivo"));
    view();
    fireEvent.change(screen.getByLabelText("Descargar PDF del alumno"),
      {target:{value:"s2"}});
    await waitFor(()=>expect(screen.getByRole("alert").textContent)
      .toContain("No se pudo crear el archivo"));
  });
});
