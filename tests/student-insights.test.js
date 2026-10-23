import {describe,it,expect} from "vitest";
import {calculateStudentInsights,isWeekDue} from "../src/services/student-insights.js";
import {
  createStudent,createWeek,saveManualDelivery,setDeliveryStatus,
  markStudentDesisted,
} from "../src/services/delivery-registry.js";
import {buildManualStatistics} from "../src/services/manual-statistics.js";

const asOf=new Date("2026-10-23T18:00:00-06:00");
const student=(id,name,company="Empresa A",specialty="Programación",group="B")=>
  createStudent({id,name,company,specialty,group});
const people=[
  student("a","Ana"),student("b","Berta"),
  student("c","Carlos","Empresa B","Contabilidad","C"),
  student("d","Diego","Empresa B","Contabilidad","C"),
  student("e","Eva"),
];
const complete=(absenceCount=0)=>buildManualStatistics(
  Array.from({length:4},(_,i)=>i<absenceCount
    ? {status:"falta",reasonCode:"3",hours:""}
    : {status:"laboral",reasonCode:"0",hours:"4"}));
const week=(id,date)=>createWeek({id,label:"Semana "+id,startDate:date,
  endDate:new Date(Date.parse(date+"T12:00:00Z")+3*86400000).toISOString().slice(0,10),
  createdAt:"2026-09-01T08:00:00Z"});
const w1=week("1","2026-09-01");
const w2=week("2","2026-09-08");
const w3=week("3","2026-09-15");
const w4=week("4","2026-11-03");
const deliver=(w,s,status,days)=>saveManualDelivery(w,s,status,{
  usageSource:"other",statistics:days,timestamp:"2026-10-22T17:00:00Z",
});
function fixture(){
  let a=w1,b=w2,c=w3;
  a=deliver(a,"a","entregado",complete(0));
  a=deliver(a,"b","entregado",complete(0));
  a=deliver(a,"c","entregado",complete(2));
  a=deliver(a,"d","entregado",complete(0));
  a=deliver(a,"e","entregado",complete(0));
  b=deliver(b,"a","entregado_tarde",complete(0));
  b=deliver(b,"b","entregado",complete(0));
  b=deliver(b,"c","no_entregado",complete(1));
  b=deliver(b,"d","entregado",complete(0));
  b=deliver(b,"e","entregado",complete(0));
  c=deliver(c,"b","entregado",complete(0));
  c=deliver(c,"c","no_entregado",complete(3));
  c=deliver(c,"d","entregado",complete(0));
  c=deliver(c,"e","entregado",complete(0));
  return {students:people,weeks:[a,b,c,w4]};
}

describe("estadísticas personales de Educación Dual 0.54",()=>{
  it("no marca como vencida una semana futura ni una cuyo plazo no vence",()=>{
    expect(isWeekDue(w4,asOf)).toBe(false);
    expect(isWeekDue(w1,asOf)).toBe(true);
    expect(isWeekDue(createWeek({id:"future",startDate:"2026-10-20",
      endDate:"2026-10-23",dueAt:"2026-10-24T20:00:00-06:00"}),asOf)).toBe(false);
    expect(isWeekDue({...w4,closedAt:"2026-10-20T10:00:00Z"},asOf)).toBe(true);
  });
  it("encuentra menor cumplimiento, pendientes y causas sin contar semanas futuras",()=>{
    const stats=calculateStudentInsights(fixture(),{asOf});
    expect(stats.totalDue).toBe(15);
    expect(stats.totalPending).toBe(3);
    expect(stats.pendingStudents).toBe(2);
    expect(stats.leastCompliant[0]).toMatchObject({
      name:"Ana",due:3,submitted:2,pending:1,fulfillmentRate:67,
    });
    expect(stats.ledger[0]).toMatchObject({
      name:"Carlos",pending:2,fulfillmentRate:33,
    });
    expect(stats.ledger[0].overdue.map(w=>w.startDate)).toEqual([
      "2026-09-08","2026-09-15"]);
    expect(stats.mostAbsences[0]).toMatchObject({name:"Carlos",absences:6});
  });
  it("no confunde jornadas desconocidas con cero y avisa sobre empates de más de tres",()=>{
    const stats=calculateStudentInsights(fixture(),{asOf});
    expect(stats.fewestAbsences.slice(0,3).map(p=>p.name)).toEqual([
      "Berta","Diego","Eva"]);
    expect(stats.fewestTiedCount).toBe(4);
    expect(stats.people.find(p=>p.id==="a").absences).toBe(0);
    expect(stats.people.find(p=>p.id==="a").knownDays).toBe(8);
    const unknown=calculateStudentInsights({students:[student("x","Sin estadísticas")],
      weeks:[w1]}, {asOf});
    expect(unknown.people[0].knownDays).toBe(0);
    expect(unknown.fewestAbsences).toHaveLength(0);
    expect(unknown.mostAbsences).toHaveLength(0);
  });
  it("filtra correctamente por empresa, especialidad, grupo y periodo",()=>{
    const filter={company:"Empresa B",specialty:"Contabilidad",group:"C",asOf};
    const r=calculateStudentInsights(fixture(),filter);
    expect(r.people).toHaveLength(2);
    expect(r.totalPending).toBe(2);
    expect(r.byCompany).toMatchObject([{label:"Empresa B",students:2,
      pending:2,fulfillmentRate:67}]);
    expect(r.bySpecialty[0].label).toBe("Contabilidad");
    const monthly=calculateStudentInsights(fixture(),{period:"monthly",month:"2026-11",asOf});
    expect(monthly.totalDue).toBe(0);
    expect(monthly.ledger).toHaveLength(0);
    const weekly=calculateStudentInsights(fixture(),{period:"weekly",weekId:"2",asOf});
    expect(weekly.people.find(p=>p.id==="c")).toMatchObject({due:1,pending:1});
  });
  it("una entrega posterior elimina el pendiente y No aplica excluye su obligación",()=>{
    const base=fixture();
    const paid={...base,weeks:base.weeks.map((w)=>w.id==="3"
      ? deliver(w,"a","entregado",complete(0)) : w)};
    expect(calculateStudentInsights(paid,{asOf}).people.find(p=>p.id==="a").pending).toBe(0);
    const excluded={...base,weeks:base.weeks.map((w)=>w.id==="2"
      ? setDeliveryStatus(w,"c","no_aplica","","manual") : w)};
    const info=calculateStudentInsights(excluded,{asOf}).people.find(p=>p.id==="c");
    expect(info.due).toBe(2);
    expect(info.pending).toBe(1);
  });
  it("no añade alumnos desistidos al historial de pendientes activos",()=>{
    const base=fixture();
    const data={...base,students:base.students.map(p=>p.id==="c"?markStudentDesisted(p):p)};
    const stats=calculateStudentInsights(data,{asOf});
    expect(stats.people.some(p=>p.id==="c")).toBe(false);
    expect(stats.ledger.every(p=>p.id!=="c")).toBe(true);
  });
  it("no duplica un periodo si dos registros semanales tienen la misma fecha",()=>{
    const base=fixture();
    const double=week("copy","2026-09-01");
    const stats=calculateStudentInsights({...base,weeks:[...base.weeks,double]},{asOf});
    expect(stats.totalDue).toBe(15);
    expect(stats.totalPending).toBe(3);
  });
});
