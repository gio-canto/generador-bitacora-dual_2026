import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import {readFileSync} from "node:fs";
import {createStudent,createWeek} from "../src/services/delivery-registry.js";
import {extractExternalFields,suggestExternalWeek,inferExternalStatus} from "../src/services/external-bitacora.js";
import ExternalBitacoraDialog from "../src/components/ExternalBitacoraDialog.jsx";
import {readExternalBitacora} from "../src/services/external-ocr.js";
import {trackExternalPromise} from "../src/services/rare-notification.jsx";

vi.mock("../src/services/external-ocr.js",()=>({
 externalFileKind:()=> "image",
 readExternalBitacora:vi.fn(),
 createExternalWorker:vi.fn(),
}));
vi.mock("../src/services/rare-notification.jsx",()=>({
 trackExternalPromise:vi.fn(promise=>promise),
}));

const weeks=[
 createWeek({id:"s11",startDate:"2026-11-10",label:"Semana 11 · noviembre"}),
 createWeek({id:"s12",startDate:"2026-11-17",label:"Semana 12"}),
];
const student=createStudent({id:"al1",name:"Persona Ejemplo",company:"UAGro Virtual",specialty:"Programación"});
const documentText=[
 "Nombre del alumno: Persona Ejemplo",
 "Empresa: UAGro Virtual",
 "Semana 12",
 "Martes 17/11/2026",
 "09:00-15:00",
 "Actividades: Orden de materiales",
 "Miércoles 18/11/2026","Sin labores por suspensión del servicio",
 "Jueves 19/11/2026","No se laboró",
 "Viernes 20/11/2026","No hubo actividades por calendario",
].join("\n");

beforeEach(()=>{
 vi.stubGlobal("URL",Object.assign(URL,{
   createObjectURL:vi.fn(()=>"blob:lote"),revokeObjectURL:vi.fn()
 }));
});
afterEach(()=>{cleanup();vi.clearAllMocks();vi.unstubAllGlobals();delete window.matchMedia;});

describe("v0.69 · semanas de registro automáticas",()=>{
 it("prioriza fechas legibles frente a encabezados de semana incorrectos",()=>{
   const extracted=extractExternalFields(documentText.replace("Semana 12","Semana 11"));
   expect(suggestExternalWeek(extracted,weeks)).toBe("s12");
 });
 it("recupera el periodo mediante una sola fecha válida",()=>{
   const extracted=extractExternalFields("Martes 10/11/2026\n09:00-15:00");
   expect(suggestExternalWeek(extracted,weeks)).toBe("s11");
 });
 it("usa el número de semana solo si las fechas faltan y el rótulo es único",()=>{
   expect(suggestExternalWeek(extractExternalFields("SEMANA No. 11"),weeks)).toBe("s11");
   expect(suggestExternalWeek(extractExternalFields("SEMANA 12"),weeks)).toBe("s12");
   expect(suggestExternalWeek(extractExternalFields("SEMANA 99"),weeks)).toBe("");
   expect(suggestExternalWeek(extractExternalFields("SEMANA 11"),[...weeks,createWeek({
     id:"duplicada",startDate:"2026-12-01",label:"Semana 11"
   })])).toBe("");
 });
 it("no inventa semana con fechas de periodos distintos",()=>{
   const extracted=extractExternalFields("Semana 11\n10/11/2026\n17/11/2026");
   expect(suggestExternalWeek(extracted,weeks)).toBe("");
 });
});
describe("v0.69 · equivalentes de sin labores",()=>{
 it("reconoce frases frecuentes sin mayúsculas ni acentos",()=>{
   for(const phrase of [
     "SIN LABORES","No hubo labores","no hay labores","No se laboró",
     "No laboramos","No se trabajó","No trabajamos",
     "No hubo actividades","No se realizaron actividades","Sin actividades asignadas",
     "Se suspendieron las labores","Suspensión de actividades",
     "Actividades suspendidas","Se cancelaron las actividades",
     "No se llevó a cabo actividad alguna","No se realizó ninguna actividad",
   ])expect(inferExternalStatus(phrase),phrase).toBe("sin_labores");
 });
 it("conserva como pendiente una suspensión localizada con jornada registrada",()=>{
   expect(inferExternalStatus("No se realizaron actividades en el laboratorio",
     {hours:"6"})).toBe("");
   expect(inferExternalStatus("Falta de material",{hours:""})).toBe("");
   expect(inferExternalStatus("Falta injustificada",{hours:""})).toBe("falta");
 });
 it("el estado sin labores no acumula horas aunque se hayan leído horarios",()=>{
   const data=extractExternalFields("17/11/2026\n9am-3pm\nSIN LABORES");
   expect(data.days[0]).toMatchObject({status:"sin_labores",hours:"",start:"",end:"",needsReview:false});
 });
});
describe("v0.69 · lector sin desbordes y con cargas según dispositivo",()=>{
 function viewport(desktop){
   window.matchMedia=vi.fn(()=>({
     matches:desktop,media:"(min-width: 901px)",addEventListener:vi.fn(),
     removeEventListener:vi.fn(),
   }));
 }
 it("en computadora usa Sileo Promise sin mostrar la capa móvil",async()=>{
   viewport(true);
   let resolve;
   readExternalBitacora.mockImplementationOnce(()=>new Promise(r=>{resolve=r;}));
   render(<ExternalBitacoraDialog students={[student]} weeks={weeks} school="CBTIS 134"
     onClose={vi.fn()} onSave={vi.fn()} onCreateWeek={vi.fn()} loadPdfJs={vi.fn()}/>);
   fireEvent.change(screen.getByLabelText("Cargar PDF, Word o fotografías"),{
     target:{files:[new File(["x"],"bitacora.jpg",{type:"image/jpeg"})]}
   });
   await waitFor(()=>expect(trackExternalPromise).toHaveBeenCalledTimes(1));
   expect(screen.queryByRole("status",{name:"Leyendo bitácoras externas"})).toBeNull();
   resolve({text:documentText,method:"ocr",pages:1});
   expect(await screen.findByText("Datos por confirmar")).toBeTruthy();
   expect(screen.getByLabelText("Semana del registro *").value).toBe("s12");
   expect(screen.getByLabelText("Miércoles · estado externo").value).toBe("sin_labores");
   expect(screen.getByRole("button",{name:"Terminar todo"})).toBeTruthy();
 });
 it("en móvil mantiene el indicador local y no llama a Sileo",async()=>{
   viewport(false);
   let resolve;
   readExternalBitacora.mockImplementationOnce(()=>new Promise(r=>{resolve=r;}));
   render(<ExternalBitacoraDialog students={[student]} weeks={weeks} school="CBTIS 134"
     onClose={vi.fn()} onSave={vi.fn()} onCreateWeek={vi.fn()} loadPdfJs={vi.fn()}/>);
   fireEvent.change(screen.getByLabelText("Cargar PDF, Word o fotografías"),{
     target:{files:[new File(["x"],"bitacora.jpg",{type:"image/jpeg"})]}
   });
   expect(screen.getByRole("status",{name:"Leyendo bitácoras externas"})).toBeTruthy();
   expect(trackExternalPromise).not.toHaveBeenCalled();
   resolve({text:documentText,method:"ocr",pages:1});
   expect(await screen.findByText("Datos por confirmar")).toBeTruthy();
   await waitFor(()=>expect(screen.queryByRole("status",{name:"Leyendo bitácoras externas"})).toBeNull());
 });
 it("estilos mantienen el panel dentro del viewport y centran los botones",()=>{
   const css=readFileSync("src/external-bitacora.css","utf8");
   const scanner=readFileSync("src/delivery-registry.css","utf8");
   expect(css).toContain("height:100dvh;overflow:hidden");
   expect(css).toContain("box-sizing:border-box");
   expect(css).toContain(".external-complete{display:flex;justify-content:center");
   expect(css).toContain(".external-upload,.external-save{justify-content:center");
   expect(scanner).toContain("grid-template-columns:repeat(2,minmax(0,1fr))");
   expect(scanner).toContain(".scanner-active .delivery-scanner-actions>.btn");
 });
});
