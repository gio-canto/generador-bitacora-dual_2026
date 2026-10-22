import {describe,expect,it} from "vitest";
import {calculateDualLifetimeStatistics} from "../src/services/statistics.js";
import {createStudent,createWeek,saveManualDelivery} from "../src/services/delivery-registry.js";
import {buildManualStatistics} from "../src/services/manual-statistics.js";

const a=createStudent({id:"a",name:"Prog A",specialty:"Programación",company:"Emp 1"});
const b=createStudent({id:"b",name:"Prog B",specialty:"Programación",company:"Emp 1"});
const c=createStudent({id:"c",name:"Cont C",specialty:"Contabilidad",company:"Emp 2"});
const withoutData=createStudent({id:"z",name:"Sin bitácora",specialty:"Ofimática",company:"Emp 2"});
const desisted=createStudent({id:"d",name:"Desistió",specialty:"Programación",company:"Emp 1",dualStatus:"desisted"});
const hours=n=>buildManualStatistics([
  {status:"laboral",hours:String(n),reasonCode:"0"},
  {status:"inhabil",hours:"",reasonCode:"0"},
  {status:"inhabil",hours:"",reasonCode:"0"},
  {status:"inhabil",hours:"",reasonCode:"0"},
]);
const zero=buildManualStatistics(Array.from({length:4},()=>({status:"inhabil",hours:"",reasonCode:"0"})));

function buildState(){
  let w1=createWeek({id:"w1",startDate:"2026-10-20"});
  w1=saveManualDelivery(w1,a.id,"entregado",{statistics:hours(4),usageSource:"generator",timestamp:"2026-10-24T10:00:00Z"});
  w1=saveManualDelivery(w1,b.id,"entregado",{statistics:zero,usageSource:"other",timestamp:"2026-10-24T10:00:00Z"});
  w1=saveManualDelivery(w1,desisted.id,"entregado",{statistics:hours(8),usageSource:"other",timestamp:"2026-10-24T10:00:00Z"});
  let w2=createWeek({id:"w2",startDate:"2026-10-27"});
  w2=saveManualDelivery(w2,a.id,"entregado",{statistics:hours(6),usageSource:"generator",timestamp:"2026-10-31T10:00:00Z"});
  w2=saveManualDelivery(w2,c.id,"entregado",{statistics:hours(2),usageSource:"other",timestamp:"2026-10-31T10:00:00Z"});
  const duplicate=createWeek({id:"duplicate",startDate:"2026-10-20"});
  const dup=saveManualDelivery(duplicate,a.id,"entregado",{statistics:hours(4),usageSource:"generator",timestamp:"2026-10-24T12:00:00Z"});
  return {students:[a,b,c,withoutData,desisted],weeks:[w1,w2,dup]};
}

describe("consolidado histórico del Dual",()=>{
  it("calcula total, promedio, mínimo, máximo, rango y mediana por alumno con horas",()=>{
    const result=calculateDualLifetimeStatistics(buildState());
    expect(result.totalHours).toBe(20);
    expect(result.activeStudents).toBe(4);
    expect(result.studentsWithData).toBe(4);
    expect(result.periodsWithData).toBe(5);
    expect(result.averageHours).toBe(5);
    expect(result.medianHours).toBe(5);
    expect(result.minHours).toBe(0);
    expect(result.maxHours).toBe(10);
    expect(result.rangeHours).toBe(10);
  });
  it("separa proporción del padrón activo de horas históricas de desistidos",()=>{
    const result=calculateDualLifetimeStatistics(buildState());
    const prog=result.bySpecialty.find(x=>x.label==="Programación");
    expect(prog.students).toBe(2);
    expect(prog.proportion).toBe(50);
    expect(prog.hours).toBe(18);
    expect(prog.hoursProportion).toBe(90);
    expect(result.bySpecialty.find(x=>x.label==="Contabilidad").proportion).toBe(25);
    expect(result.bySpecialty.find(x=>x.label==="Ofimática").proportion).toBe(25);
  });
  it("respeta empresa y especialidad sin imponer filtros de fecha",()=>{
    const result=calculateDualLifetimeStatistics(buildState(),{specialty:"Programación",company:"Emp 1",period:"weekly",weekId:"w2"});
    expect(result.totalHours).toBe(18);
    expect(result.averageHours).toBe(6);
    expect(result.activeStudents).toBe(2);
    expect(result.bySpecialty[0].proportion).toBe(100);
  });
  it("distingue cero horas confirmado de un código sin estadísticas",()=>{
    let w=createWeek({id:"empty",startDate:"2026-10-20"});
    w=saveManualDelivery(w,a.id,"entregado",{usageSource:"other"});
    const empty=calculateDualLifetimeStatistics({students:[a],weeks:[w]});
    expect(empty.totalHours).toBe(0);
    expect(empty.averageHours).toBeNull();
    expect(empty.minHours).toBeNull();
    expect(empty.maxHours).toBeNull();
    expect(empty.rangeHours).toBeNull();
    w=saveManualDelivery(w,a.id,"entregado",{usageSource:"other",statistics:zero});
    const confirmed=calculateDualLifetimeStatistics({students:[a],weeks:[w]});
    expect(confirmed.averageHours).toBe(0);
    expect(confirmed.maxHours).toBe(0);
    expect(confirmed.minHours).toBe(0);
  });
});
