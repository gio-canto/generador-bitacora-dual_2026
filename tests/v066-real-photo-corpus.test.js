import {describe,it,expect} from "vitest";
import corpus from "../src/data/ocr-training-lote02.json";
import {dateFromExternal,timesFromExternal,timeBlocksFromExternal,extractExternalFields,
  suggestExternalWeekPeriod,externalDaysToStatistics,externalReviewMetadata} from "../src/services/external-bitacora.js";
import {createDeliveryState,createStudent,createWeek,saveExternalDelivery,sanitizeDeliveryState} from "../src/services/delivery-registry.js";

describe("v0.66.0 · lote 02, diez fotografías verificadas por estructura",()=>{
 it("catalogó diez fotografías, seis manuscritas y cuatro impresas sin nombres ni firmas",()=>{
   expect(corpus.samples).toHaveLength(10);
   expect(new Set(corpus.samples.map(sample=>sample.photo)).size).toBe(10);
   expect(corpus.samples.filter(sample=>sample.writing==="manuscrito")).toHaveLength(6);
   expect(corpus.samples.filter(sample=>sample.writing==="impreso")).toHaveLength(4);
   expect(corpus.samples.every(sample=>sample.text.includes("PERSONA DE PRUEBA"))).toBe(true);
   expect(corpus.samples.every(sample=>!sample.text.includes("FIRMA DEL ALUMNO"))).toBe(true);
 });
 for(const sample of corpus.samples){
   it(sample.id+" · "+sample.layout,()=>{
     const fields=extractExternalFields(sample.text);
     expect(fields.name).toBe("PERSONA DE PRUEBA");
     expect(fields.company).toBe("EMPRESA DE EJEMPLO");
     if(sample.expectMissingYear){
       expect(fields.recognized).toBe(0);
       expect(fields.dates).toHaveLength(0);
       expect(suggestExternalWeekPeriod(fields)).toBeNull();
       expect(fields.warnings.join(" ")).toMatch(/fechas abreviadas sin año/i);
       return;
     }
     expect(fields.recognized).toBe(4);
     expect(fields.days.map(day=>day.date)).toEqual(sample.expectedDates);
     expect(suggestExternalWeekPeriod(fields)?.startDate).toBe(sample.expectedPeriod);
     if(sample.expectedHours)expect(fields.days.map(day=>day.hours)).toEqual(sample.expectedHours);
     if(sample.expectedStatus)expect(fields.days.map(day=>day.status)).toEqual(sample.expectedStatus);
     if(sample.expectAmbiguousBlocks){
       expect(fields.days[0].timeBlocks.length).toBeGreaterThan(1);
       expect(fields.days[0].needsReview).toBe(true);
       expect(fields.days[0].hours).toBe("");
     }
   });
 }
 it("respeta fechas abreviadas con año ausente y contexto verificable",()=>{
   expect(dateFromExternal("10-11")).toBe("");
   expect(dateFromExternal("10-11",2026)).toBe("2026-11-10");
   expect(dateFromExternal("17°11°26")).toBe("2026-11-17");
   expect(dateFromExternal("Martes, 17 de Noviembre del 2026")).toBe("2026-11-17");
   const contextual=extractExternalFields("NOMBRE DEL ALUMNO: PERSONA DE PRUEBA\n10/11/2026\n09:00-15:00\n11-11\n09:00-15:00");
   expect(contextual.days[0].date).toBe("2026-11-10");
   expect(contextual.days[1].date).toBe("2026-11-11");
   expect(extractExternalFields("10-11\n09:00-15:00").recognized).toBe(0);
 });
 it("desglosa múltiples periodos y suma únicamente tramos independientes",()=>{
   const text="09:00-11:30\n11:30-12:30\n13:00-14:00";
   const ranges=timeBlocksFromExternal(text);
   expect(ranges).toHaveLength(3);
   expect(timesFromExternal(text)).toMatchObject({start:"09:00",end:"14:00",hours:"4.5",ambiguous:false});
   expect(timesFromExternal("09:00-11:30\n11:30-12:30\n1:00-2:00")).toMatchObject({hours:"",ambiguous:true});
   expect(timesFromExternal("09:00-12:00\n11:00-14:00").hours).toBe("");
   expect(timesFromExternal("10:00AM-03:00PM").hours).toBe("5");
 });
 it("distingue jornadas sin labores de tareas no realizadas con horario",()=>{
   const susp=extractExternalFields("17/11/26\n09:00-15:00\nActividades: Suspensión de labores");
   expect(susp.days[0].status).toBe("sin_labores");
   const meeting=extractExternalFields("17/11/26\n10:00AM-03:00PM\nActividades: No se realizaron actividades por asamblea general");
   expect(meeting.days[0].status).toBe("");
   expect(meeting.days[0].needsReview).toBe(true);
   expect(externalDaysToStatistics([meeting.days[0],...meeting.days.slice(1)])).toBeNull();
 });
 it("guarda tramos en respaldo, sin imágenes originales",()=>{
   const entry=extractExternalFields("17/11/26\n09:00-11:00\n11:00-13:00\nActividades: Archivo");
   const student=createStudent({name:"Alumno Ejemplo",company:"Empresa de ejemplo",specialty:"Programación"});
   const week=createWeek({startDate:"2026-11-17"});
   const reviewed=externalReviewMetadata({filename:"foto.jpg",method:"ocr",pages:1},entry.days);
   const stored=saveExternalDelivery(week,student.id,{statistics:null,metadata:reviewed});
   const persisted=sanitizeDeliveryState({...createDeliveryState(),students:[student],weeks:[stored]});
   expect(persisted.weeks[0].deliveries[student.id].externalReview.days[0].timeBlocks).toHaveLength(2);
   expect(JSON.stringify(persisted)).not.toMatch(/data:image/);
 });
});