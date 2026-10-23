import {describe,it,expect} from "vitest";
import {calculateStudentInsights} from "../src/services/student-insights.js";
import {calculateDeliveryStatistics} from "../src/services/statistics.js";
import {interpretStatistics} from "../src/services/statistics-interpretation.js";
import {abbreviateWeekLabel,DOSSIER_ROWS_PER_PAGE,interpretStudentDossier}
 from "../src/services/student-dossier-report.js";
import {createWeek,createStudent,saveManualDelivery} from "../src/services/delivery-registry.js";
import {buildStudentDossier} from "../src/services/student-dossier.js";
describe("v0.56 · semana real e interpretaciones",()=>{
 const s=createStudent({id:"a",name:"Ana",company:"Empresa",specialty:"Programación"});
 const asOf=new Date("2026-10-23T12:00:00Z");
 const week=(id,date)=>createWeek({id,label:"Semana "+id,startDate:date,endDate:date});
 const w1=saveManualDelivery(week("20","2026-09-15"),"a","entregado",{usageSource:"other"});
 const state={students:[s],weeks:[w1,week("21","2026-09-22"),week("22","2026-09-29")]};
 it("usa las semanas reales y nunca S1 como columna posicional",()=>{
  expect(abbreviateWeekLabel("Semana 20")).toBe("S20");
  expect(abbreviateWeekLabel("Semana 105")).toBe("S105");
  expect(abbreviateWeekLabel("Semana 9")).toBe("S9");
  expect(DOSSIER_ROWS_PER_PAGE).toBeGreaterThan(9);
 });
 it("distingue pendientes reales sin alterar los totales",()=>{
  const result=calculateStudentInsights(state,{asOf});
  expect(result.ledger[0].pending).toBe(2);
  expect(result.totalPending).toBe(2);
  const pdf=buildStudentDossier(state,"a",{asOf});
  expect(interpretStudentDossier(pdf)).toMatch(/2 pendientes/);
 });
 it("las interpretaciones explican totales, faltas y asistencia",()=>{
  const info=calculateDeliveryStatistics(state,{period:"all"});
  const insights=calculateStudentInsights(state,{period:"all",asOf});
  const notes=interpretStatistics(info,insights);
  expect(notes.deliveries).toMatch(/de 3 registros aplicables/);
  expect(notes.pending).toMatch(/2 de 3 entregas vencidas/);
  expect(notes.attendance).toMatch(/No hay jornadas/);
 });
});
