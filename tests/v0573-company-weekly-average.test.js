import {describe,it,expect} from "vitest";
import {createStudent,createWeek,saveManualDelivery} from "../src/services/delivery-registry.js";
import {buildManualStatistics} from "../src/services/manual-statistics.js";
import {calculateDeliveryStatistics} from "../src/services/statistics.js";
import {statisticsReportModel} from "../src/services/statistics-report.js";

const a=createStudent({id:"a",name:"Ana",company:"Empresa Centro",specialty:"Programación"});
const b=createStudent({id:"b",name:"Beto",company:"Empresa Centro",specialty:"Programación"});
const c=createStudent({id:"c",name:"Clara",company:"Empresa Sin Capturas",specialty:"Programación"});
function stats(hours){
 return buildManualStatistics(Array.from({length:4},()=>({
   status:"laboral",hours:String(hours/4),reasonCode:"0",
 })));
}
function state(){
 let w1=createWeek({id:"w1",label:"Semana 1",startDate:"2026-09-08"});
 w1=saveManualDelivery(w1,"a","entregado",{statistics:stats(10)});
 w1=saveManualDelivery(w1,"b","entregado",{statistics:stats(20)});
 let w2=createWeek({id:"w2",label:"Semana 2",startDate:"2026-09-15"});
 w2=saveManualDelivery(w2,"a","entregado",{statistics:stats(40)});
 const w3=createWeek({id:"w3",label:"Semana 3",startDate:"2026-09-22"});
 return {context:{school:"Plantel prueba",generation:"2025–2028"},students:[a,b,c],weeks:[w1,w2,w3]};
}
describe("Promedio semanal acumulado y total histórico de horas por empresa",()=>{
 it("suma promedios de cada semana: (10+20)/2 + 40/1 = 55 h",()=>{
   const model=calculateDeliveryStatistics(state(),{period:"all"});
   const row=model.byCompanyPerformance.find(item=>item.label==="Empresa Centro");
   expect(row.hours).toBe(70); // Horas originales, intactas.
   expect(row.minutes).toBe(4200);
   expect(row.averageHours).toBe(35); // Promedio histórico preexistente.
   expect(row.weeklyAverageAccumulatedHours).toBe(55);
   expect(row.weeksWithData).toBe(2);
   const graph=model.byCompany.find(item=>item.label==="Empresa Centro");
   expect(graph.minutes/60).toBe(70);
   expect(graph.weeklyAverageAccumulatedHours).toBe(55);
   const pdf=statisticsReportModel(state(),{period:"all"});
   expect(pdf.data.byCompanyPerformance.find(item=>item.label==="Empresa Centro")
     .weeklyAverageAccumulatedHours).toBe(55);
 });
 it("en modo semanal muestra el promedio de esa sola semana",()=>{
   const first=calculateDeliveryStatistics(state(),{period:"weekly",weekId:"w1"});
   const second=calculateDeliveryStatistics(state(),{period:"weekly",weekId:"w2"});
   expect(first.byCompanyPerformance.find(item=>item.label==="Empresa Centro").hours).toBe(30);
   expect(first.byCompanyPerformance.find(item=>item.label==="Empresa Centro").weeklyAverageAccumulatedHours).toBe(15);
   expect(second.byCompanyPerformance.find(item=>item.label==="Empresa Centro").hours).toBe(40);
   expect(second.byCompanyPerformance.find(item=>item.label==="Empresa Centro").weeklyAverageAccumulatedHours).toBe(40);
 });
 it("no interpreta semanas o empresas sin registros como cero horas calculadas",()=>{
   const all=calculateDeliveryStatistics(state(),{period:"all"});
   const noData=all.byCompanyPerformance.find(item=>item.label==="Empresa Sin Capturas");
   expect(noData.hours).toBe(0);
   expect(noData.weeklyAverageAccumulatedHours).toBeNull();
   expect(noData.weeksWithData).toBe(0);
   const blank=calculateDeliveryStatistics(state(),{period:"weekly",weekId:"w3"});
   expect(blank.byCompanyPerformance.find(item=>item.label==="Empresa Centro")
     .weeklyAverageAccumulatedHours).toBeNull();
 });
 it("respeta los filtros por mes y empresa sin alterar el total",()=>{
   const month=calculateDeliveryStatistics(state(),{period:"monthly",month:"2026-09",company:"Empresa Centro"});
   expect(month.byCompanyPerformance).toHaveLength(1);
   expect(month.totalMinutes/60).toBe(70);
   expect(month.byCompanyPerformance[0].weeklyAverageAccumulatedHours).toBe(55);
 });
});
