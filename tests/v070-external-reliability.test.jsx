import {describe,it,expect,vi,beforeEach,afterEach} from "vitest";
import {render,screen,fireEvent,waitFor,cleanup} from "@testing-library/react";
import {createStudent,createWeek,createDeliveryState,saveExternalDelivery,sanitizeDeliveryState} from "../src/services/delivery-registry.js";
import {extractExternalFields,suggestExternalStudent,alignExternalDaysToWeek,
  externalReviewMetadata,externalDaysToStatistics} from "../src/services/external-bitacora.js";
import {mergeExternalPageText,externalTextNeedsOcr,externalTranscriptQuality} from "../src/services/external-merge.js";
import {readExternalBitacora} from "../src/services/external-ocr.js";
import ExternalBitacoraDialog from "../src/components/ExternalBitacoraDialog.jsx";

vi.mock("../src/services/external-ocr.js",async()=>{
 const actual=await vi.importActual("../src/services/external-ocr.js");
 return {...actual,readExternalBitacora:vi.fn()};
});
vi.mock("../src/services/rare-notification.jsx",()=>({
 trackExternalPromise:vi.fn(async task=>task)
}));
const roster=[
 createStudent({id:"A",name:"María Guadalupe Rivera López",company:"Institución Uno"}),
 createStudent({id:"B",name:"María Guadalupe Rivera Loza",company:"Institución Dos"}),
 createStudent({id:"C",name:"Luis Arturo Pérez Morales",company:"Institución Tres"}),
];
const week=createWeek({id:"W",startDate:"2026-11-17",label:"Semana 12"});
const full=`Nombre del alumno: Luis Arturo Pérez Morales
Empresa: Institución Tres
Semana 12
Martes 17/11/2026
Entrada: 09:00
Salida: 15:00
Actividades: Archivo y organización documental
Miércoles 18/11/2026
Entrada: 09:00
Salida: 15:00
Actividades: Captura
Jueves 19/11/2026
Sin labores
Viernes 20/11/2026
Entrada: 09:00
Salida: 15:00
Actividades: Revisión de expedientes`;
const weak=`Nombre del alumno: Luis Arturo Pérez Morales
Empresa: Institución Tres
Semana 12
Martes 17/11/2026
Actividades: Archivo y organización documental
Miércoles 18/11/2026
Actividades: Captura
Jueves 19/11/2026
Sin labores
Viernes 20/11/2026
Actividades: Revisión de expedientes`;

beforeEach(()=>vi.stubGlobal("URL",Object.assign(URL,{
 createObjectURL:vi.fn(()=>"blob:externa"),revokeObjectURL:vi.fn()
})));
afterEach(()=>{cleanup();vi.clearAllMocks();vi.unstubAllGlobals();});

describe("v0.70 · campos OCR y copias de seguridad",()=>{
 it("solo propone un alumno parecido si existe una coincidencia única",()=>{
   expect(suggestExternalStudent({name:"Luis Arturo Peres Morales"},roster)).toBe("C");
   expect(suggestExternalStudent({name:"Maria Guadalupe Rivera Lope"},roster)).toBe("");
   expect(suggestExternalStudent({name:"Nombre Incompleto",text:"Luis Arturo Pérez Morales realizó una actividad"},roster)).toBe("");
   expect(suggestExternalStudent({name:"",text:"Alumno Luis Arturo Pérez Morales"},roster)).toBe("C");
 });
 it("rellena fechas vacías sin reemplazar las del documento",()=>{
   const days=extractExternalFields(`Martes
9am-3pm
Miércoles
No hubo labores`).days;
   const fixed=alignExternalDaysToWeek(days,week);
   expect(fixed.map(d=>d.date)).toEqual(["2026-11-17","2026-11-18","2026-11-19","2026-11-20"]);
   expect(fixed[0].hours).toBe("6");
   const divergent=alignExternalDaysToWeek([{...days[0],date:"2026-11-10"},...days.slice(1)],week);
   expect(divergent[0].date).toBe("2026-11-10");
   expect(alignExternalDaysToWeek(divergent,week,{replace:true})[0].date).toBe("2026-11-17");
 });
 it("conserva horas revisadas aunque falte una jornada y se exporte el respaldo",()=>{
   const parsed=extractExternalFields(full);
   const partial=parsed.days.map((d,i)=>i===3?{...d,status:"",hours:""}:d);
   expect(externalDaysToStatistics(partial)).toBeNull();
   const metadata=externalReviewMetadata({...parsed,filename:"prueba.jpg",method:"ocr",pages:1},partial);
   expect(metadata.days[0].hours).toBe("6");
   const saved=saveExternalDelivery(week,roster[2].id,{metadata});
   const restored=sanitizeDeliveryState({...createDeliveryState(),students:roster,weeks:[saved]});
   expect(restored.weeks[0].deliveries.C.externalReview.days[0].hours).toBe("6");
   expect(restored.weeks[0].deliveries.C.externalReview.days[2].hours).toBe("");
 });
 it("reintenta PDFs con datos extensos pero horas incompletas",()=>{
   expect(externalTextNeedsOcr(weak)).toBe(true);
   expect(externalTextNeedsOcr(full)).toBe(false);
 });
 it("fusiona horas rescatadas sin perder alumno, empresa ni suspensión de labores",()=>{
   const hoursOnly=`Martes 17/11/2026
09:00-15:00
Miércoles 18/11/2026
09:00-15:00
Jueves 19/11/2026
Sin labores
Viernes 20/11/2026
09:00-15:00`;
   const result=mergeExternalPageText(weak,hoursOnly);
   const parsed=extractExternalFields(result);
   expect(parsed.name).toBe("Luis Arturo Pérez Morales");
   expect(parsed.company).toBe("Institución Tres");
   expect(parsed.days.map(d=>d.hours)).toEqual(["6","6","","6"]);
   expect(parsed.days[2].status).toBe("sin_labores");
   expect(externalTranscriptQuality(result)).toBeGreaterThan(externalTranscriptQuality(weak));
 });
 it("conserva intervalos separados y no suma la pausa entre tramos",()=>{
   const base=[
     "Nombre del alumno: Luis Arturo Pérez Morales",
     "Martes 17/11/2026",
     "09:00-11:00",
     "13:00-15:00",
     "Actividades: Clasificación de documentos",
   ].join("\n");
   const extra="Martes 17/11/2026\n09:00-11:00\n13:00-15:00\nActividades: Archivo";
   const merged=mergeExternalPageText(base,extra);
   const day=extractExternalFields(merged).days[0];
   expect(day.hours).toBe("4");
   expect(day.timeBlocks).toHaveLength(2);
 });
 it("no une datos de semanas contradictorias",()=>{
   const other=full.replaceAll("17/11/2026","10/11/2026")
     .replaceAll("18/11/2026","11/11/2026")
     .replaceAll("19/11/2026","12/11/2026").replaceAll("20/11/2026","13/11/2026");
   const merged=mergeExternalPageText(full,other);
   const parsed=extractExternalFields(merged);
   expect(parsed.dates).not.toEqual(expect.arrayContaining(["2026-11-10","2026-11-17"]));
 });
});
describe("v0.70 · revisión UI y permisos de estados",()=>{
 it("seleccionar sin labores elimina horas y conserva el documento editable",async()=>{
   readExternalBitacora.mockResolvedValueOnce({text:full,method:"ocr",pages:1});
   render(<ExternalBitacoraDialog students={roster} weeks={[week]} school="CBTIS 134"
     onClose={vi.fn()} onSave={vi.fn()} onCreateWeek={vi.fn()} loadPdfJs={vi.fn()}/>);
   fireEvent.change(screen.getByLabelText("Cargar PDF, Word o fotografías"),{
     target:{files:[new File(["foto"],"alumno.jpg",{type:"image/jpeg"})]}
   });
   expect(await screen.findByText("Datos por confirmar")).toBeTruthy();
   const status=screen.getByLabelText("Martes · estado externo");
   expect(status.value).toBe("laboral");
   fireEvent.change(status,{target:{value:"sin_labores"}});
   expect(status.value).toBe("sin_labores");
   expect(screen.getByText("Martes")).toBeTruthy();
   expect(screen.queryByLabelText("Martes · horas externas")).toBeNull();
   expect(screen.getByLabelText("Semana del registro *").value).toBe("W");
 });
 it("muestra advertencia y permite corregir fechas sin eliminar jornadas",async()=>{
   const text=full.replaceAll("17/11/2026","10/11/2026")
     .replaceAll("18/11/2026","11/11/2026")
     .replaceAll("19/11/2026","12/11/2026").replaceAll("20/11/2026","13/11/2026");
   readExternalBitacora.mockResolvedValueOnce({text,method:"ocr",pages:1});
   render(<ExternalBitacoraDialog students={roster} weeks={[week]} school="CBTIS 134"
     onClose={vi.fn()} onSave={vi.fn()} onCreateWeek={vi.fn()} loadPdfJs={vi.fn()}/>);
   fireEvent.change(screen.getByLabelText("Cargar PDF, Word o fotografías"),{
     target:{files:[new File(["foto"],"alumno.jpg",{type:"image/jpeg"})]}
   });
   expect(await screen.findByText("Datos por confirmar")).toBeTruthy();
   fireEvent.change(screen.getByLabelText("Semana del registro *"),{target:{value:"W"}});
   expect(screen.getByRole("button",{name:"Usar fechas de esta semana"})).toBeTruthy();
   fireEvent.click(screen.getByRole("button",{name:"Usar fechas de esta semana"}));
   expect(screen.getByLabelText("Martes · fecha externa").value).toBe("2026-11-17");
 });
});
