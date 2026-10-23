import {describe,it,expect} from "vitest";
import {buildStudentDossier} from "../src/services/student-dossier.js";
import {
  createStudent,createWeek,saveManualDelivery,setDeliveryStatus,markStudentDesisted,
} from "../src/services/delivery-registry.js";
import {buildManualStatistics} from "../src/services/manual-statistics.js";

const asOf=new Date("2026-10-23T15:00:00-06:00");
const student=createStudent({id:"first",name:"Alumna Ejemplo",specialty:"Programación",
  company:"Empresa 1",group:"B"});
const other=createStudent({id:"other",name:"Otro Alumno",specialty:"Contabilidad",
  company:"Empresa 2",group:"C"});
const w=(id,date,ending)=>createWeek({id,label:"Semana "+id,startDate:date,
  endDate:ending,createdAt:"2026-08-01T00:00:00Z"});
const stats=buildManualStatistics([
  {status:"laboral",hours:"4",reasonCode:"0"},
  {status:"falta",hours:"",reasonCode:"23"},
  {status:"laboral",hours:"6",reasonCode:"0"},
  {status:"inhabil",hours:"",reasonCode:"0"},
]);

describe("expediente individual histórico v0.55",()=>{
  function fixture(){
    let first=w("1","2026-09-01","2026-09-04");
    first=saveManualDelivery(first,student.id,"entregado",{statistics:stats,usageSource:"other",
      timestamp:"2026-09-05T12:00:00Z"});
    let second=w("2","2026-09-08","2026-09-11");
    second=saveManualDelivery(second,student.id,"no_entregado",{statistics:stats,
      usageSource:"unknown",timestamp:"2026-09-12T12:00:00Z"});
    const third=w("3","2026-10-20","2026-10-23");
    return {students:[student,other],weeks:[first,second,third]};
  }
  it("expone todas las semanas y la base verificable de su cumplimiento",()=>{
    const result=buildStudentDossier(fixture(),student.id,{asOf});
    expect(result).toMatchObject({
      id:"first",name:"Alumna Ejemplo",registeredWeeks:3,due:2,submitted:1,
      pending:1,upcoming:1,onTime:1,late:0,
      deliveryRate:50,onTimeRate:50,
      totalHours:20,averageHours:10,minHours:10,maxHours:10,
      absences:2,knownDays:8,weeksWithStats:2,attendanceRate:67,
    });
    expect(result.pendingWeeks).toHaveLength(1);
    expect(result.timeline.map(item=>item.id)).toEqual(["3","2","1"]);
    expect(result.timeline[0].state).toBe("en_plazo");
    expect(result.timeline[1].days[1].reason).toMatch(/Festival Académico/);
    expect(result.byCause).toHaveLength(1);
    expect(result.byCause[0].count).toBe(2);
    expect(result.monthly).toHaveLength(2);
  });
  it("no inventa horas o faltas si una entrega carece de jornadas",()=>{
    let week=w("1","2026-09-01","2026-09-04");
    week=saveManualDelivery(week,student.id,"entregado",{usageSource:"unknown"});
    const result=buildStudentDossier({students:[student],weeks:[week]},student.id,{asOf});
    expect(result.deliveryRate).toBe(100);
    expect(result.absences).toBe(0);
    expect(result.knownDays).toBe(0);
    expect(result.weeksWithStats).toBe(0);
    expect(result.averageHours).toBeNull();
    expect(result.minHours).toBeNull();
    expect(result.attendanceRate).toBeNull();
    expect(result.timeline[0].statsKnown).toBe(false);
  });
  it("No aplica sale del denominador y no se muestran estadísticas sobrantes",()=>{
    const state=fixture();
    const changed={...state,weeks:state.weeks.map(week=>week.id==="2"
      ?setDeliveryStatus(week,student.id,"no_aplica","","manual"):week)};
    const info=buildStudentDossier(changed,student.id,{asOf});
    expect(info.notApplicable).toBe(1);
    expect(info.due).toBe(1);
    expect(info.pending).toBe(0);
    expect(info.deliveryRate).toBe(100);
    expect(info.totalHours).toBe(10);
  });
  it("registra cuando una semana vence y cuando se pone al corriente",()=>{
    const original=fixture();
    expect(buildStudentDossier(original,student.id,{asOf}).pending).toBe(1);
    const delivered={...original,weeks:original.weeks.map(week=>week.id==="2"
      ?saveManualDelivery(week,student.id,"entregado_tarde",{statistics:stats,
        usageSource:"other"}):week)};
    const info=buildStudentDossier(delivered,student.id,{asOf});
    expect(info.pending).toBe(0);
    expect(info.late).toBe(1);
    expect(info.deliveryRate).toBe(100);
    expect(info.onTimeRate).toBe(50);
  });
  it("conserva historia registrada de alumnos que dejan de estar activos",()=>{
    const base=fixture();
    const state={...base,students:[markStudentDesisted(student),other]};
    const info=buildStudentDossier(state,student.id,{asOf});
    expect(info.active).toBe(false);
    expect(info.timeline.some(row=>row.id==="1")).toBe(true);
  });
  it("identifica con ID, no mezcla alumnos homónimos y deduplica semanas",()=>{
    const base=fixture();
    const duplicate=w("new","2026-09-01","2026-09-04");
    const sharedName=createStudent({...other,id:"shared",name:student.name});
    const state={students:[student,sharedName],weeks:[...base.weeks,duplicate]};
    const info=buildStudentDossier(state,student.id,{asOf});
    expect(info.registeredWeeks).toBe(3);
    expect(info.due).toBe(2);
    expect(buildStudentDossier(state,"shared",{asOf}).submitted).toBe(0);
    expect(buildStudentDossier(state,"not-exists",{asOf})).toBeNull();
  });
});
