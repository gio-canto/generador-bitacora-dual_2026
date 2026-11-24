import {describe,it,expect,vi,beforeEach,afterEach} from "vitest";
import {render,screen,fireEvent,waitFor,cleanup} from "@testing-library/react";
import {readFileSync} from "node:fs";
import {dateFromExternal,timesFromExternal,extractExternalFields,externalCompanyOptions,
  suggestExternalCompany,externalReviewMetadata} from "../src/services/external-bitacora.js";
import ExternalBitacoraDialog from "../src/components/ExternalBitacoraDialog.jsx";
import {createStudent,createWeek} from "../src/services/delivery-registry.js";
import {readExternalBitacora} from "../src/services/external-ocr.js";

vi.mock("../src/services/external-ocr.js",()=>({
  externalFileKind:()=> "image",
  readExternalBitacora:vi.fn(),
  createExternalWorker:vi.fn(),
}));

const student=createStudent({id:"p1",name:"María López García",company:"UAGro Virtual",specialty:"Programación"});
const other=createStudent({id:"p2",name:"Ana Ruiz",company:"Holiday Inn",specialty:"Contabilidad"});
const week=createWeek({id:"w1",label:"Semana 12",startDate:"2026-11-17"});
const text=`Nombre del alumno: MARIA LOPEZ GARCIA
NOMBRE DE LA EMPRESA : uágro VIRTUAL
Martes 17-11-26
7pm-11pm
Actividades: Captura
Miércoles 18-11-26
Entrada: 7:00PM
Salida: 11:00PM
Actividades: Registro
Jueves 19-11-26
17:00-23:00
Actividades: Archivo
Viernes 20-11-26
Suspensión de labores`;

beforeEach(()=>{
 vi.stubGlobal("URL",Object.assign(URL,{createObjectURL:vi.fn(()=>"blob:documento"),revokeObjectURL:vi.fn()}));
});
afterEach(()=>{cleanup();vi.clearAllMocks();vi.unstubAllGlobals();});

describe("v0.68 · fechas, horas y estados",()=>{
 it("acepta fechas dd-mm-aa, dd-mm-aaaa, aaaa-mm-dd, barras, puntos y símbolos",()=>{
   for(const value of ["17-11-26","17-11-2026","2026-11-17","17/11/26",
     "17.11.2026","2026/11/17","2026.11.17","17°11°26"])
     expect(dateFromExternal(value),value).toBe("2026-11-17");
   expect(dateFromExternal("31-02-2026")).toBe("");
   expect(dateFromExternal("17-11")).toBe("");
 });
 it("acepta reloj 24 horas y notaciones compactas de 12 horas",()=>{
   const cases=[
     ["7pm-11pm","19:00","23:00","4"],
     ["7:00PM-11:00PM","19:00","23:00","4"],
     ["7 p.m. - 11 p.m.","19:00","23:00","4"],
     ["Entrada: 7pm\nSalida: 11pm","19:00","23:00","4"],
     ["17:00-23:00","17:00","23:00","6"],
     ["07:00-15:00","07:00","15:00","8"],
     ["7am-1pm","07:00","13:00","6"],
   ];
   for(const [raw,start,end,hours] of cases)
     expect(timesFromExternal(raw),raw).toMatchObject({start,end,hours});
   expect(timesFromExternal("7:00-3:00").hours).toBe("");
 });
 it("reconoce estados sin asignar faltas por suspensiones",()=>{
   const extracted=extractExternalFields(text);
   expect(extracted.recognized).toBe(4);
   expect(extracted.days.map(day=>day.status)).toEqual(["laboral","laboral","laboral","sin_labores"]);
   expect(extracted.days.map(day=>day.hours)).toEqual(["4","4","6",""]);
   expect(extracted.company).toBe("uágro VIRTUAL");
   expect(extractExternalFields("17/11/2026\nDía inhábil").days[0].status).toBe("inhabil");
   expect(extractExternalFields("17/11/2026\nNo asistí por motivos personales").days[0].status).toBe("falta");
   expect(extractExternalFields("17/11/2026\nNo se realizaron actividades en el laboratorio por asamblea").days[0].status).toBe("");
 });
 it("normaliza nombres de empresas y no requiere el área en la metadata",()=>{
   const companies=externalCompanyOptions([student,other,
     createStudent({name:"Tercero",company:"uAgRo vírtuál"})]);
   expect(companies).toHaveLength(2);
   expect(suggestExternalCompany({company:"UAGRO VIRTUAL"},[student,other])).toBe("UAGro Virtual");
   expect(suggestExternalCompany({company:""},[student,other],student.id)).toBe("UAGro Virtual");
   expect(suggestExternalCompany({company:"Empresa desconocida"},[student,other])).toBe("Empresa desconocida");
   const metadata=externalReviewMetadata({name:"Persona",company:"Empresa",filename:"foto.jpg"},[
     {area:"Archivo",activity:"Captura",date:"2026-11-17"},
     {area:"Archivo"},{area:"Archivo"},{area:"Archivo"}
   ]);
   expect(metadata.days[0]).not.toHaveProperty("area");
 });
});
describe("v0.68 · interacción del lector externo",()=>{
 it("muestra progreso mientras una lectura asíncrona está pendiente",async()=>{
   let finish;
   readExternalBitacora.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));
   render(<ExternalBitacoraDialog students={[student]} weeks={[week]}
     onClose={vi.fn()} onSave={vi.fn()} loadPdfJs={vi.fn()} school="CBTIS 134"/>);
   fireEvent.change(screen.getByLabelText("Cargar PDF, Word o fotografías"),{
     target:{files:[new File(["foto"],"foto.jpg",{type:"image/jpeg"})]}
   });
   expect(screen.getByRole("status",{name:"Leyendo bitácoras externas"})).toBeTruthy();
   await waitFor(()=>expect(readExternalBitacora).toHaveBeenCalledTimes(1));
   finish({text,documents:[{page:1,text,method:"ocr"}],method:"ocr",pages:1});
   expect(await screen.findByText("Datos por confirmar")).toBeTruthy();
   await waitFor(()=>expect(screen.queryByRole("status",{name:"Leyendo bitácoras externas"})).toBeNull());
 });
 it("permite seleccionar la empresa o escribir otra y omite el campo área",async()=>{
   readExternalBitacora.mockResolvedValueOnce({text,method:"ocr",pages:1});
   render(<ExternalBitacoraDialog students={[student,other]} weeks={[week]}
     onClose={vi.fn()} onSave={vi.fn()} loadPdfJs={vi.fn()} school="CBTIS 134"/>);
   fireEvent.change(screen.getByLabelText("Cargar PDF, Word o fotografías"),{
     target:{files:[new File(["foto"],"foto.jpg",{type:"image/jpeg"})]}
   });
   expect(await screen.findByText("Datos por confirmar")).toBeTruthy();
   const select=screen.getByLabelText("Empresa de la bitácora");
   expect(select.value).toBe("UAGro Virtual");
   fireEvent.change(select,{target:{value:"Holiday Inn"}});
   expect(select.value).toBe("Holiday Inn");
   fireEvent.change(select,{target:{value:"__manual"}});
   const manual=screen.getByLabelText("Escribir empresa");
   fireEvent.change(manual,{target:{value:"Organización nueva"}});
   expect(manual.value).toBe("Organización nueva");
   expect(screen.queryByText("Aprender de esta lectura confirmada")).toBeNull();
   expect(screen.queryByLabelText("Área")).toBeNull();
 });
 it("mantiene espacio superior móvil, campos antes del original y días plegables",()=>{
   const css=readFileSync("src/external-bitacora.css","utf8");
   expect(css).toContain("safe-area-inset-top");
   expect(css).toContain(".external-data{order:0");
   expect(css).toContain(".external-original{order:1");
   expect(css).toContain(".external-loading-layer");
   expect(css).toContain("prefers-reduced-motion");
 });
});