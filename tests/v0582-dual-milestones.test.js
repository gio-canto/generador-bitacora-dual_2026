import {describe,it,expect} from "vitest";
import {createStudent,createWeek,saveManualDelivery,markStudentDesisted} from "../src/services/delivery-registry.js";
import {buildManualStatistics} from "../src/services/manual-statistics.js";
import {milestoneProgress,calculateDualMilestones} from "../src/services/dual-milestones.js";
import {statisticsReportModel} from "../src/services/statistics-report.js";

const MAX=(h)=>buildManualStatistics(Array.from({length:4},()=>({
  status:"laboral",hours:String(h/4),reasonCode:"0"
})));
function fixture(){
 const students=[
   createStudent({id:"a",name:"Ana",company:"Empresa A",specialty:"Programación"}),
   createStudent({id:"b",name:"Beto",company:"Empresa B",specialty:"Programación"}),
   createStudent({id:"c",name:"Carlos",company:"Empresa A",specialty:"Contabilidad"}),
   createStudent({id:"d",name:"Diana",company:"Empresa B",specialty:"Programación"}),
 ];
 const weeks=[];
 for(let n=0;n<11;n++){
   const day=new Date(Date.UTC(2026,8,1+7*n)).toISOString().slice(0,10);
   let week=createWeek({id:"w"+n,startDate:day,label:"Semana "+(n+1)});
   week=saveManualDelivery(week,"a","entregado",{statistics:MAX(n===10?40:80)});
   if(n<6)week=saveManualDelivery(week,"b","entregado",{statistics:MAX(80)});
   if(n<3)week=saveManualDelivery(week,"c","entregado",{statistics:MAX(40)});
   weeks.push(week);
 }
 return {students,weeks,context:{school:"Plantel",generation:"2025-2028"}};
}
describe("Hitos de horas v0.58.2",()=>{
 it("considera 480 h para servicio social y 480+360=840 h para prácticas",()=>{
   expect(milestoneProgress(479*60).socialReached).toBe(false);
   expect(milestoneProgress(480*60).socialReached).toBe(true);
   expect(milestoneProgress(480*60).professionalReached).toBe(false);
   expect(milestoneProgress(840*60-1).professionalReached).toBe(false);
   expect(milestoneProgress(840*60).professionalReached).toBe(true);
   expect(milestoneProgress(480*60).nextRemainingHours).toBe(360);
   expect(milestoneProgress(840*60).nextRemainingHours).toBe(0);
   expect(milestoneProgress(480*60).progressPercent).toBeCloseTo(480/840*100,5);
 });
 it("detecta alumnos que cumplen ambos hitos, solo el primero o ninguno",()=>{
   const data=calculateDualMilestones(fixture());
   expect(data.totalStudents).toBe(4);
   expect(data.socialReached).toBe(2);
   expect(data.professionalReached).toBe(1);
   expect(data.socialOnly).toBe(1);
   expect(data.studentsWithData).toBe(3);
   const a=data.students.find(x=>x.id==="a"),b=data.students.find(x=>x.id==="b");
   const c=data.students.find(x=>x.id==="c"),d=data.students.find(x=>x.id==="d");
   expect(a.hours).toBe(840);
   expect(a.weeksWithData).toBe(11);
   expect(a.professionalWeek.label).toBe("Semana 11");
   expect(a.socialWeek.label).toBe("Semana 6");
   expect(b.hours).toBe(480);
   expect(b.socialReached).toBe(true);
   expect(b.professionalRemainingHours).toBe(360);
   expect(c.hours).toBe(120);
   expect(c.socialRemainingHours).toBe(360);
   expect(d.hours).toBe(0);
   expect(d.hasData).toBe(false);
   expect(d.socialRemainingHours).toBe(480);
 });
 it("hitos son históricos, respetan especialidad y empresa y no suman duplicados",()=>{
   const state=fixture();
   const filtered=calculateDualMilestones(state,{company:"Empresa B",specialty:"Programación"});
   expect(filtered.totalStudents).toBe(2);
   expect(filtered.socialReached).toBe(1);
   expect(filtered.students.map(x=>x.id).sort()).toEqual(["b","d"]);
   state.students[1]=markStudentDesisted(state.students[1]);
   const archive=calculateDualMilestones(state);
   const former=archive.students.find(x=>x.id==="b");
   expect(former.hours).toBe(480);
   expect(former.active).toBe(false);
   expect(statisticsReportModel(state,{period:"weekly",weekId:"w0"}).milestones.professionalReached).toBe(1);
   expect(statisticsReportModel(state,{period:"monthly",month:"2026-09"}).milestones.socialReached).toBe(2);
 });
 it("no inventa horas por entregas sin jornadas ni semanas sin capturas",()=>{
   const state={students:[createStudent({id:"x",name:"Sin horas"})],
     weeks:[createWeek({id:"w",label:"Semana sin captura",startDate:"2026-10-20"})]};
   const result=calculateDualMilestones(state);
   expect(result.students[0].hasData).toBe(false);
   expect(result.students[0].hours).toBe(0);
   expect(result.professionalReached).toBe(0);
 });
});
