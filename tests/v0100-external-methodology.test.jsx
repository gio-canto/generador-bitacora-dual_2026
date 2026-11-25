import {describe,it,expect,vi,beforeEach,afterEach} from "vitest";
import {render,screen,fireEvent,waitFor,cleanup} from "@testing-library/react";
import lote01 from "../src/data/ocr-training-lote01.json";
import lote02 from "../src/data/ocr-training-lote02.json";
import {extractExternalFields,analyzeExternalDocument,suggestExternalWeek,
  timeTextFromExternalSegment} from "../src/services/external-bitacora.js";
import {createStudent,createWeek} from "../src/services/delivery-registry.js";
import {readExternalBitacora} from "../src/services/external-ocr.js";
import ExternalBitacoraDialog from "../src/components/ExternalBitacoraDialog.jsx";
vi.mock("../src/services/external-ocr.js",async()=>{
 const actual=await vi.importActual("../src/services/external-ocr.js");
 return {...actual,readExternalBitacora:vi.fn()};
});
vi.mock("../src/services/rare-notification.jsx",()=>({
 trackExternalPromise:vi.fn(async promise=>promise)
}));
const weeks=[
 createWeek({id:"w11",startDate:"2026-11-10",label:"Semana 11"}),
 createWeek({id:"w12",startDate:"2026-11-17",label:"Semana 12"}),
];
const students=[createStudent({id:"s1",name:"Persona Ejemplo",company:"UAGro Virtual",specialty:"Programación"})];
const withoutYear=[
 "Nombre del alumno: Persona Ejemplo",
 "Nombre de la empresa: UAGro Virtual",
 "BITÁCORA SEMANAL-12",
 "17-11","09:00-15:00","Actividades: Archivo",
 "18-11","Sin labores",
 "19-11","7am-1pm","Actividades: Captura",
 "20-11","09:00-15:00","Actividades: Documentación"
].join("\n");
beforeEach(()=>vi.stubGlobal("URL",Object.assign(URL,{
 createObjectURL:vi.fn(()=>"blob:bitacora"),revokeObjectURL:vi.fn()
})));
afterEach(()=>{cleanup();vi.clearAllMocks();vi.unstubAllGlobals()});

describe("0.10.0 · auditoría de la metodología",()=>{
 it("conserva expectativas de los 20 casos anonimizados de los dos lotes",()=>{
   expect(lote01.samples.length+lote02.samples.length).toBe(20);
   for(const sample of [...lote01.samples,...lote02.samples]){
     const fields=extractExternalFields(sample.text);
     if(sample.expectedHours)expect(fields.days.map(x=>x.hours),sample.id).toEqual(sample.expectedHours);
     if(sample.expectedStatus)expect(fields.days.map(x=>x.status),sample.id).toEqual(sample.expectedStatus);
     if(sample.expectedDates)expect(fields.days.map(x=>x.date),sample.id).toEqual(sample.expectedDates);
     if(sample.expectMissingYear)expect(fields.recognized,sample.id).toBe(0);
   }
 });
 it("primero no presupone año y luego recupera fechas breves mediante semana única",()=>{
   expect(extractExternalFields(withoutYear).recognized).toBe(0);
   const {extracted,weekId}=analyzeExternalDocument(withoutYear,weeks);
   expect(weekId).toBe("w12");
   expect(extracted.recognized).toBe(4);
   expect(extracted.days.map(day=>day.date)).toEqual([
     "2026-11-17","2026-11-18","2026-11-19","2026-11-20",
   ]);
   expect(extracted.days.map(day=>day.hours)).toEqual(["6","","6","6"]);
 });
 it("admite encabezado BITÁCORA SEMANAL-12 aunque no existan fechas",()=>{
   const fields=extractExternalFields("BITÁCORA SEMANAL-12\nNombre del alumno: Persona Ejemplo");
   expect(suggestExternalWeek(fields,weeks)).toBe("w12");
 });
 it("no elige una semana cuando las fechas breves son contradictorias",()=>{
   const document="17-11\n09:00-15:00\n11-11\n09:00-15:00";
   expect(analyzeExternalDocument(document,weeks).weekId).toBe("");
   expect(analyzeExternalDocument(document,weeks).extracted.recognized).toBe(0);
 });
 it("ignora horas mencionadas en actividades, no las convierte en jornada",()=>{
   const parsed=extractExternalFields(
     "Martes 17/11/2026\nActividades: Grabación de un video de 09:00-13:00.\n"+
     "Miércoles 18/11/2026\nEntrada 09:00\nSalida 15:00\nActividades: Registro de entradas");
   expect(parsed.days[0].hours).toBe("");
   expect(parsed.days[1].hours).toBe("6");
 });
 it("lee varios tramos desde líneas de horario sin sumar pausas",()=>{
   const parsed=extractExternalFields(
     "Martes 17/11/2026\n09:00-11:00\n13:00-15:00\nActividades: Inventario");
   expect(parsed.days[0].hours).toBe("4");
   expect(parsed.days[0].timeBlocks).toHaveLength(2);
 });
});
describe("0.10.0 · interfaz del lector externo",()=>{
 it("presenta advertencia de desarrollo y recupera la semana con fechas abreviadas",async()=>{
   readExternalBitacora.mockResolvedValueOnce({text:withoutYear,pages:1,method:"ocr"});
   render(<ExternalBitacoraDialog students={students} weeks={weeks} school="CBTIS 134"
     onClose={vi.fn()} onSave={vi.fn()} onCreateWeek={vi.fn()} loadPdfJs={vi.fn()}/>);
   expect(screen.getByText(/El lector de bitácoras externas sigue en proceso de mejora/)).toBeTruthy();
   fireEvent.change(screen.getByLabelText("Cargar PDF, Word o fotografías"),{
     target:{files:[new File(["x"],"manuscrita.jpg",{type:"image/jpeg"})]}
   });
   expect(await screen.findByText("Datos por confirmar")).toBeTruthy();
   expect(screen.getByLabelText("Semana del registro *").value).toBe("w12");
   expect(screen.getByLabelText("Martes · fecha externa").value).toBe("2026-11-17");
   expect(screen.getByLabelText("Martes · horas externas").value).toBe("6");
 });
 it("al seleccionar una semana manualmente, recupera jornadas que solo tienen día y mes",async()=>{
   const text="Nombre del alumno: Persona Ejemplo\n10-11\n09:00-15:00\n11-11\n09:00-15:00";
   readExternalBitacora.mockResolvedValueOnce({text,pages:1,method:"ocr"});
   render(<ExternalBitacoraDialog students={students} weeks={[]} school="CBTIS 134"
     onClose={vi.fn()} onSave={vi.fn()} onCreateWeek={vi.fn()} loadPdfJs={vi.fn()}/>);
   fireEvent.change(screen.getByLabelText("Cargar PDF, Word o fotografías"),{
     target:{files:[new File(["x"],"manuscrita.jpg",{type:"image/jpeg"})]}
   });
   expect(await screen.findByText("Datos por confirmar")).toBeTruthy();
   // Con una semana añadida al padrón vuelve a reconstruir la jornada.
   cleanup();
   readExternalBitacora.mockResolvedValueOnce({text,pages:1,method:"ocr"});
   render(<ExternalBitacoraDialog students={students} weeks={weeks} school="CBTIS 134"
     onClose={vi.fn()} onSave={vi.fn()} onCreateWeek={vi.fn()} loadPdfJs={vi.fn()}/>);
   fireEvent.change(screen.getByLabelText("Cargar PDF, Word o fotografías"),{
     target:{files:[new File(["x"],"manuscrita.jpg",{type:"image/jpeg"})]}
   });
   expect(await screen.findByText("Datos por confirmar")).toBeTruthy();
   expect(screen.getByLabelText("Semana del registro *").value).toBe("w11");
   expect(screen.getByLabelText("Martes · entrada externa").value).toBe("09:00");
 });
});
