import {describe,expect,it} from "vitest";
import {calculateDeliveryStatistics} from "../src/services/statistics.js";
import {createStudent,createWeek,registerDelivery,saveManualDelivery} from "../src/services/delivery-registry.js";
import {buildManualStatistics} from "../src/services/manual-statistics.js";
describe("estadísticas v0.52",()=>{
  const a=createStudent({name:"Alumno QR",gender:"male",company:"Empresa 1"});
  const b=createStudent({name:"Alumna manual",gender:"female",company:"Empresa 2"});
  const c=createStudent({name:"Otro método",company:"Empresa 2"});
  const week=createWeek({startDate:"2026-10-20"});
  const statistics=buildManualStatistics([
    {status:"laboral",hours:"4",reasonCode:"0"},
    {status:"laboral",hours:"4",reasonCode:"0"},
    {status:"falta",hours:"",reasonCode:"3"},
    {status:"inhabil",hours:"",reasonCode:"0"},
  ]);
  const w1=registerDelivery(week,a.id,"2026-10-24T10:00:00Z","camera",{matrixVersion:4,statistics});
  const w2=saveManualDelivery(w1,b.id,"entregado",{usageSource:"generator",statistics});
  const w3=saveManualDelivery(w2,c.id,"entregado",{usageSource:"other"});
  const state={students:[a,b,c],weeks:[w3]};
  it("cuenta uso por QR o confirmación manual y no deduce uso de otros campos",()=>{
    const r=calculateDeliveryStatistics(state,{period:"weekly",weekId:w3.id});
    expect(r.usage).toEqual({used:2,other:1,unknown:0});
    expect(r.weeksWithStatistics).toBe(2);
    expect(r.daily).toMatchObject({laboral:4,falta:2,inhabil:2});
    expect(r.totalMinutes).toBe(960);
    expect(r.byCompany.find(x=>x.label==="Empresa 1").minutes).toBe(480);
  });
  it("diferencia entregas y datos estadísticos ausentes",()=>{
    const result=calculateDeliveryStatistics(state,{period:"weekly",weekId:w3.id});
    expect(result.coverage).toBe(67);
    expect(result.applicable).toBe(3);
    expect(result.deliveryRate).toBe(100);
  });
  it("no asume que un alumno sin entrega no usa la herramienta",()=>{
    const result=calculateDeliveryStatistics({students:[...state.students,createStudent({name:"Sin entregar"})],weeks:[w3]},{period:"weekly",weekId:w3.id});
    expect(result.usage.unknown).toBe(1);
    expect(result.notDelivered).toBe(1);
  });
 it("compara empresas y grupos sin mezclar faltas con días sin labores",()=>{
   const a=createStudent({id:"a",name:"Alumna A",group:"A",company:"Empresa 1"});
   const b=createStudent({id:"b",name:"Alumno B",group:"A",company:"Empresa 1"});
   const c=createStudent({id:"c",name:"Alumna C",group:"B",company:"Empresa 2"});
   const d=createStudent({id:"d",name:"Alumno D",group:"B",company:"Empresa sin jornadas"});
   const manual=days=>buildManualStatistics(days.map(v=>v==="laboral"?
     {status:v,hours:"4",reasonCode:"0"}:
     {status:v,hours:"",reasonCode:"0"}));
   const first=manual(["laboral","falta","sin_labores","inhabil"]);
   const second=manual(["laboral","laboral","laboral","laboral"]);
   const third=manual(["laboral","laboral","falta","falta"]);
   let one=createWeek({startDate:"2026-10-20"});
   one=saveManualDelivery(one,a.id,"entregado",{statistics:first});
   one=saveManualDelivery(one,b.id,"entregado",{statistics:second});
   one=saveManualDelivery(one,c.id,"entregado",{statistics:third});
   const result=calculateDeliveryStatistics({students:[a,b,c,d],weeks:[one]},
     {period:"weekly",weekId:one.id});
   expect(result.daily).toMatchObject({laboral:7,falta:3,sin_labores:1,inhabil:1});
   expect(result.attendanceRate).toBe(70);
   expect(result.companyLeaders.mostHours.label).toBe("Empresa 1");
   expect(result.companyLeaders.leastHours.label).toBe("Empresa 2");
   expect(result.companyLeaders.mostAbsences.label).toBe("Empresa 2");
   expect(result.companyLeaders.comparable).toBe(2);
   expect(result.byCompanyPerformance.find(p=>p.label==="Empresa sin jornadas"))
     .toMatchObject({activeStudents:1,reports:0,absenceRate:null});
   expect(result.byCompanyPerformance.find(p=>p.label==="Empresa 1")).toMatchObject({
     hours:20,absences:1,nonWorking:1,holidays:1,studentsWithData:2,
     averageHours:10,worked:5,applicableDays:6});
   expect(result.byCompanyPerformance.find(p=>p.label==="Empresa 2")).toMatchObject({
     hours:8,absences:2,worked:2,nonWorking:0,holidays:0,absenceRate:50});
   const groups=Object.fromEntries(result.byGroupPerformance.map(p=>[p.label,p]));
   expect(groups.A).toMatchObject({activeStudents:2,share:50,absences:1,worked:5,
     nonWorking:1,holidays:1});
   expect(groups.B).toMatchObject({activeStudents:2,share:50,absences:2,worked:2,
     absenceRate:50});
 });
 it("no declara una empresa como la que menos trabajó por carecer de jornadas registradas",()=>{
   const a=createStudent({id:"a",name:"Sin capturas",company:"Empresa única",group:"A"});
   const result=calculateDeliveryStatistics({students:[a],weeks:[]},{period:"all"});
   expect(result.companyLeaders).toMatchObject({
     mostHours:null,leastHours:null,mostAbsences:null,comparable:0,
   });
   expect(result.byGroupPerformance[0]).toMatchObject({
     label:"A",activeStudents:1,share:100,reports:0,absenceRate:null,
   });
 });
});
