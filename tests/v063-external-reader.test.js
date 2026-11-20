import {describe,it,expect} from "vitest";
import {
  dateFromExternal,timesFromExternal,extractExternalFields,suggestExternalStudent,
  suggestExternalWeek,externalDaysToStatistics,externalReviewMetadata
} from "../src/services/external-bitacora.js";
import {readExternalBitacora,externalFileKind} from "../src/services/external-ocr.js";
import {createStudent,createWeek,saveExternalDelivery,sanitizeDeliveryState,deliveryStatus} from "../src/services/delivery-registry.js";
import {buildManualStatistics} from "../src/services/manual-statistics.js";
import {decodeWeekStatistics,encodeWeekStatistics} from "../src/services/matrix-statistics.js";

const sample=[
 "Nombre del alumno: María López García",
 "Empresa: Consejo Estatal de Ciencia y Tecnología",
 "Martes 17/11/2026",
 "Área: Archivo",
 "Entrada: 09:00",
 "Salida: 13:00",
 "Actividades: Clasificación de expedientes y ordenamiento de documentación institucional.",
 "Miércoles 18/11/2026",
 "Área: Archivo",
 "Entrada: 09:00",
 "Salida: 14:00",
 "Actividades: Digitalización de documentos e inventario de expedientes.",
 "Jueves 19/11/2026",
 "Área: Archivo",
 "Entrada: 10:00",
 "Salida: 13:00",
 "Actividades: Revisión de archivos, separadores y folios.",
 "Viernes 20/11/2026",
 "Área: Archivo",
 "Entrada: 09:30",
 "Salida: 12:30",
 "Actividades: Organización de actas institucionales y oficios."
].join("\n");
const student=createStudent({name:"María López García",specialty:"Programación",company:"COCYTIEG"});
const week=createWeek({startDate:"2026-11-17",label:"Semana de ejemplo"});

describe("0.63.0 · lectura de bitácoras externas",()=>{
 it("identifica fechas escritas en distintos formatos sin inventarlas",()=>{
   expect(dateFromExternal("17/11/2026")).toBe("2026-11-17");
   expect(dateFromExternal("2026-11-17")).toBe("2026-11-17");
   expect(dateFromExternal("17 de noviembre de 2026")).toBe("2026-11-17");
   expect(dateFromExternal("31/02/2026")).toBe("");
   expect(dateFromExternal("17/11")).toBe("");
 });
 it("reconoce entrada, salida y duración de la jornada",()=>{
   expect(timesFromExternal("Entrada: 09:30 Salida: 13:30"))
     .toMatchObject({start:"09:30",end:"13:30",hours:"4"});
   expect(timesFromExternal("09:00 - 13:00").hours).toBe("4");
   expect(timesFromExternal("14:00 a 10:00").hours).toBe("");
 });
 it("separa las cuatro jornadas y conserva actividades originales",()=>{
   const result=extractExternalFields(sample);
   expect(result).toMatchObject({name:"María López García",
     company:"Consejo Estatal de Ciencia y Tecnología",recognized:4});
   expect(result.days.map(x=>x.date)).toEqual([
     "2026-11-17","2026-11-18","2026-11-19","2026-11-20"]);
   expect(result.days.map(x=>x.hours)).toEqual(["4","5","3","3"]);
   expect(result.days[0].area).toBe("Archivo");
   expect(result.days[0].activity).toContain("Clasificación de expedientes");
   expect(result.days.every(x=>x.status==="laboral")).toBe(true);
 });
 it("solo asigna automáticamente alumnos y semanas sin ambigüedades",()=>{
   const parsed=extractExternalFields(sample);
   expect(suggestExternalStudent(parsed,[student])).toBe(student.id);
   expect(suggestExternalStudent(parsed,[student,{...student,id:"duplicado"}])).toBe("");
   expect(suggestExternalWeek(parsed,[week])).toBe(week.id);
   expect(suggestExternalWeek(parsed,[week,{...week,id:"duplicado"}])).toBe("");
 });
 it("deja campos vacíos si el documento está incompleto",()=>{
   const r=extractExternalFields("Empresa: Archivo\nMartes\nActividades: Clasifiqué documentos y expedientes.");
   expect(r.name).toBe("");
   expect(r.days[0].status).toBe("");
   expect(r.days[0].hours).toBe("");
   expect(r.days[1].detected).toBe(false);
   expect(externalDaysToStatistics(r.days)).toBeNull();
   expect(r.warnings.length).toBeGreaterThan(0);
 });
 it("construye estadísticas sólo con las cuatro jornadas confirmadas",()=>{
   const parsed=extractExternalFields(sample);
   const input=externalDaysToStatistics(parsed.days);
   expect(input).toHaveLength(4);
   const stats=buildManualStatistics(input);
   expect(stats.version).toBe(5);
   expect(stats.entries.reduce((n,e)=>n+e.minutes,0)).toBe(900);
   expect(externalDaysToStatistics([parsed.days[0],{...parsed.days[1],status:""},...parsed.days.slice(2)])).toBeNull();
 });
 it("conserva anotaciones revisadas y método en JSON sin guardar el PDF",()=>{
   const parsed=extractExternalFields(sample);
   const metadata=externalReviewMetadata({...parsed,filename:"bitacora.docx",method:"docx-text",pages:1},parsed.days);
   const stats=buildManualStatistics(externalDaysToStatistics(parsed.days));
   const saved=saveExternalDelivery(week,student.id,{statistics:stats,metadata,
     timestamp:"2026-11-20T12:00:00Z"});
   expect(saved.deliveries[student.id]).toMatchObject({
     source:"import",usageSource:"other",
     externalReview:{filename:"bitacora.docx",method:"docx-text"}
   });
   expect(saved.deliveries[student.id].externalReview.days).toHaveLength(4);
   expect(saved.deliveries[student.id].externalReview.days[0].activity)
     .toContain("Clasificación");
   const restored=sanitizeDeliveryState({schemaVersion:9,students:[student],weeks:[saved]});
   expect(restored.weeks[0].deliveries[student.id].externalReview.filename).toBe("bitacora.docx");
   expect(restored.weeks[0].deliveries[student.id]).not.toHaveProperty("originalFile");
   expect(deliveryStatus(restored.weeks[0],student.id)).toMatch(/entregado/);
 });
 it("respeta las semanas cerradas",()=>{
   const metadata=externalReviewMetadata({filename:"ejemplo.pdf",method:"ocr",pages:1},extractExternalFields(sample).days);
   expect(()=>saveExternalDelivery({...week,closedAt:"2026-11-21"},student.id,{metadata})).toThrow(/Reabre/);
 });
 it("no modifica el protocolo Data Matrix de las jornadas",()=>{
   const stats=buildManualStatistics(externalDaysToStatistics(extractExternalFields(sample).days));
   const days=stats.entries.map(day=>({status:"laboral",start:"09:00",end:"13:00"}));
   expect(encodeWeekStatistics(days)).toMatch(/^S5:/);
   expect(decodeWeekStatistics(encodeWeekStatistics(days)).entries).toHaveLength(4);
 });
 it("lee PDF digital sin iniciar OCR",async()=>{
   const text=sample;
   const page={getTextContent:async()=>({items:text.split("\n").map((str,i)=>({str,transform:[1,0,0,1,0,500-i*16],hasEOL:true}))}),cleanup:()=>{}};
   const doc={numPages:1,getPage:async()=>page,destroy:async()=>{}};
   const pdfjs={getDocument:()=>({promise:Promise.resolve(doc)})};
   let ocrCalled=false;
   const file={name:"original.pdf",type:"application/pdf",size:100,arrayBuffer:async()=>new ArrayBuffer(4)};
   const result=await readExternalBitacora(file,{loadPdfJs:async()=>pdfjs,getWorker:async()=>{ocrCalled=true;}});
   expect(result.method).toBe("pdf-text");
   expect(result.text).toContain("Nombre del alumno");
   expect(ocrCalled).toBe(false);
 });
 it("admite Word DOCX y conserva su texto sin OCR",async()=>{
   const old=globalThis.mammoth;
   globalThis.mammoth={extractRawText:async()=>({value:sample})};
   try{
     const file={name:"externa.docx",size:100,arrayBuffer:async()=>new ArrayBuffer(1)};
     expect(externalFileKind(file)).toBe("docx");
     const result=await readExternalBitacora(file);
     expect(result.method).toBe("docx-text");
     expect(result.text).toContain("María López García");
   }finally{if(old===undefined)delete globalThis.mammoth;else globalThis.mammoth=old;}
 });
});
