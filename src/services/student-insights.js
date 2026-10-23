import {
  studentIsActive,studentAppliesToWeek,deliveryStatus,
} from "./delivery-registry.js";
import {summarizeWeekStatistics} from "./matrix-statistics.js";

const round = (value,total)=>total ? Math.round(value/total*100) : null;
const compareNames = (a,b)=>a.name.localeCompare(b.name,"es",{sensitivity:"base"});
const serial=(value)=>String(value||"");
const fallback=(value)=>String(value||"").trim() || "Sin especificar";

/**
 * Una semana solo se considera vencida si el plazo ha transcurrido o fue
 * cerrada manualmente. Nunca atribuir incumplimiento a semanas futuras.
 */
export function isWeekDue(week,asOf=new Date()) {
  if (week.closedAt) return true;
  const time = asOf instanceof Date ? asOf : new Date(asOf);
  if (!Number.isFinite(time.getTime())) return false;
  if (week.dueAt) {
    const due = new Date(week.dueAt);
    if (Number.isFinite(due.getTime())) return due.getTime() < time.getTime();
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(week.endDate||"")) return false;
  const today=[time.getFullYear(),String(time.getMonth()+1).padStart(2,"0"),
    String(time.getDate()).padStart(2,"0")].join("-");
  return week.endDate < today;
}

function periodWeeks(state,{period,weekId,month}) {
  const result=(state.weeks||[]).filter(w=>
    period==="all" || (period==="monthly" ?
      Boolean(month)&&w.startDate?.startsWith(month) : w.id===weekId));
  return result.sort((a,b)=>
    serial(a.startDate).localeCompare(serial(b.startDate))||
    serial(a.createdAt).localeCompare(serial(b.createdAt)));
}

/**
 * Analítica nominal para seguimiento interno.
 *
 * - La tasa de entrega solo usa semanas cuyo plazo venció.
 * - "No aplica" se excluye de los denominadores.
 * - Faltas y horas se miden únicamente en jornadas registradas (sin
 *   estadísticas no es equivalente a cero faltas).
 * - Para semanas duplicadas del mismo periodo, se conserva la entrega
 *   existente más reciente, evitando acusar dos veces a un alumno.
 */
export function calculateStudentInsights(state,{
  period="all",weekId="",month="",specialty="",company="",group="",
  asOf=new Date(),
}={}) {
  const weeks=periodWeeks(state,{period,weekId,month});
  const roster=(state.students||[]).filter(student=>
    studentIsActive(student) &&
    (!specialty||student.specialty===specialty) &&
    (!company||student.company===company) &&
    (!group||student.group===group));
  const people=roster.map(student=>{
    const unique=new Map();
    for(const week of weeks){
      if(!studentAppliesToWeek(student,week))continue;
      const status=deliveryStatus(week,student.id);
      const actual=week.deliveries?.[student.id];
      const key=week.startDate||week.id;
      const previous=unique.get(key);
      const candidate={week,status,actual,
        stamp:serial(actual?.registeredAt||week.createdAt)};
      if(!previous ||
        Number(Boolean(actual))>Number(Boolean(previous.actual))||
        (Boolean(actual)===Boolean(previous.actual)&&candidate.stamp>=previous.stamp))
        unique.set(key,candidate);
    }
    let due=0,submitted=0,onTime=0,late=0,pending=0,absences=0,
      workDays=0,knownDays=0,minutes=0,periodsWithStats=0;
    const overdue=[];
    for(const {week,status,actual} of unique.values()){
      if(status==="no_aplica")continue;
      if(isWeekDue(week,asOf)){
        due++;
        if(status==="no_entregado"){
          pending++;
          overdue.push({id:week.id,label:week.label,startDate:week.startDate,
            dueAt:week.dueAt,endDate:week.endDate});
        } else if(status==="entregado"){submitted++;onTime++;}
        else if(status==="entregado_tarde"){submitted++;late++;}
      }
      const summary=summarizeWeekStatistics(actual?.statistics);
      if(!summary)continue;
      periodsWithStats++;
      minutes+=summary.minutes;
      for(const day of actual.statistics.entries){
        if(!day || !["laboral","falta","sin_labores","inhabil"].includes(day.status))continue;
        knownDays++;
        if(day.status==="falta")absences++;
        if(day.status==="laboral")workDays++;
      }
    }
    overdue.sort((a,b)=>serial(a.startDate).localeCompare(serial(b.startDate)));
    return {
      id:student.id,name:student.name,
      specialty:fallback(student.specialty),company:fallback(student.company),
      group:fallback(student.group),
      due,submitted,onTime,late,pending,
      fulfillmentRate:round(submitted,due),
      onTimeRate:round(onTime,due),
      absences,workDays,knownDays,periodsWithStats,
      absenceRate:round(absences,absences+workDays),
      hours:minutes/60,
      overdue,
    };
  });

  const byLeastCompliant=[...people].filter(p=>p.due>0).sort((a,b)=>
    a.fulfillmentRate-b.fulfillmentRate||
    b.pending-a.pending||b.due-a.due||compareNames(a,b));
  const mostAbsences=[...people].filter(p=>p.knownDays>0&&p.absences>0).sort((a,b)=>
    b.absences-a.absences||b.absenceRate-a.absenceRate||
    b.knownDays-a.knownDays||compareNames(a,b));
  const fewestAbsences=[...people].filter(p=>p.knownDays>0).sort((a,b)=>
    a.absences-b.absences||b.knownDays-a.knownDays||compareNames(a,b));
  const mostPunctual=[...people].filter(p=>p.due>0&&p.submitted>0).sort((a,b)=>
    b.onTimeRate-a.onTimeRate||b.onTime-a.onTime||compareNames(a,b));
  const mostHours=[...people].filter(p=>p.periodsWithStats>0).sort((a,b)=>
    b.hours-a.hours||compareNames(a,b));
  const ledger=[...people].filter(p=>p.pending>0).sort((a,b)=>
    b.pending-a.pending||a.fulfillmentRate-b.fulfillmentRate||compareNames(a,b));

  function groupBreakdown(key){
    const result=new Map();
    for(const person of people){
      const label=person[key];
      const row=result.get(label)||{label,students:0,due:0,submitted:0,
        pending:0,late:0,absences:0,knownDays:0};
      row.students++;
      for(const attr of ["due","submitted","pending","late","absences","knownDays"])
        row[attr]+=person[attr];
      result.set(label,row);
    }
    return [...result.values()].map(row=>({
      ...row,fulfillmentRate:round(row.submitted,row.due),
    })).sort((a,b)=>b.pending-a.pending||b.due-a.due||
      a.label.localeCompare(b.label,"es"));
  }

  const min=fewestAbsences[0]?.absences;
  const tiedFewest=fewestAbsences.filter(p=>p.absences===min);
  return {
    people,periodWeeks:weeks.length,coveredStudents:roster.length,
    totalDue:people.reduce((v,p)=>v+p.due,0),
    totalPending:people.reduce((v,p)=>v+p.pending,0),
    pendingStudents:ledger.length,
    withAttendanceData:people.filter(p=>p.knownDays>0).length,
    leastCompliant:byLeastCompliant,
    mostAbsences,
    fewestAbsences,
    fewestTiedCount:tiedFewest.length,
    mostPunctual,mostHours,ledger,
    byCompany:groupBreakdown("company"),
    bySpecialty:groupBreakdown("specialty"),
    byGroup:groupBreakdown("group"),
  };
}
