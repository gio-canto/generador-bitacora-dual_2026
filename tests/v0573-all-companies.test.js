import {describe,it,expect} from "vitest";
import {createStudent,createWeek,saveManualDelivery} from "../src/services/delivery-registry.js";
import {buildManualStatistics} from "../src/services/manual-statistics.js";
import {calculateDeliveryStatistics} from "../src/services/statistics.js";
import {statisticsReportModel} from "../src/services/statistics-report.js";

const roster=[
 createStudent({id:"a",name:"A",company:"Empresa Alfa"}),
 createStudent({id:"b",name:"B",company:"Empresa Beta"}),
 createStudent({id:"c",name:"C",company:"Empresa Cero"}),
];
const daysA=buildManualStatistics([
 {status:"falta",hours:"",reasonCode:"0"},
 {status:"laboral",hours:"4",reasonCode:"0"},
 {status:"laboral",hours:"4",reasonCode:"0"},
 {status:"laboral",hours:"4",reasonCode:"0"},
]);
const daysC=buildManualStatistics([
 {status:"laboral",hours:"4",reasonCode:"0"},
 {status:"laboral",hours:"4",reasonCode:"0"},
 {status:"laboral",hours:"4",reasonCode:"0"},
 {status:"laboral",hours:"4",reasonCode:"0"},
]);
function state(){
 let w=createWeek({id:"w",label:"Semana 1",startDate:"2026-10-20"});
 w=saveManualDelivery(w,"a","entregado",{statistics:daysA});
 w=saveManualDelivery(w,"c","entregado",{statistics:daysC});
 return {context:{school:"Plantel de prueba",generation:"2025–2028"},students:roster,weeks:[w]};
}
describe("Listado completo de empresas — v0.57.3",()=>{
 it("incluye todas las empresas, cero faltas y sin captura de jornadas",()=>{
   const s=state();
   const stats=calculateDeliveryStatistics(s,{period:"weekly",weekId:"w"});
   expect(stats.byCompanyPerformance).toHaveLength(3);
   expect(stats.byCompany).toHaveLength(3);
   expect(stats.byCompany.map(x=>x.label).sort()).toEqual(roster.map(x=>x.company).sort());
   const alpha=stats.byCompanyPerformance.find(x=>x.label==="Empresa Alfa");
   const zero=stats.byCompanyPerformance.find(x=>x.label==="Empresa Cero");
   const empty=stats.byCompanyPerformance.find(x=>x.label==="Empresa Beta");
   expect(alpha.absences).toBe(1);
   expect(zero.absences).toBe(0);
   expect(zero.absenceRate).toBe(0);
   expect(empty.activeStudents).toBe(1);
   expect(empty.reports).toBe(0);
   expect(empty.absenceRate).toBeNull();
   const model=statisticsReportModel(s,{period:"weekly",weekId:"w"});
   expect(model.data.byCompanyPerformance.map(x=>x.label).sort()).toEqual(roster.map(x=>x.company).sort());
 });
 it("mantiene el filtro por empresa sin inventar faltas",()=>{
   const stats=calculateDeliveryStatistics(state(),{period:"weekly",weekId:"w",company:"Empresa Beta"});
   expect(stats.byCompanyPerformance.map(x=>x.label)).toEqual(["Empresa Beta"]);
   expect(stats.daily.falta).toBe(0);
   expect(stats.byCompanyPerformance[0].absenceRate).toBeNull();
 });
});
