import {studentAppliesToWeek,deliveryStatus} from "./delivery-registry.js";
import {summarizeWeekStatistics,causeLabel} from "./matrix-statistics.js";
import {isWeekDue} from "./student-insights.js";

const sum=(records,key)=>records.reduce((n,r)=>n+(r[key]||0),0);
const dateLabel=d=>String(d||"");
const validStatuses=new Set(["laboral","falta","sin_labores","inhabil"]);
const percent=(n,d)=>d ? Math.round(n/d*100) : null;
const sortDesc=(a,b)=>String(b.startDate).localeCompare(String(a.startDate));

/**
 * Expediente académico descriptivo, no evaluación crediticia ni puntuación
 * personal. El denominador distingue periodos vencidos de futuros.
 * Los detalles diarios aparecen solo cuando existen estadísticas.
 */
export function buildStudentDossier(state,studentId,{asOf=new Date()}={}){
  const student=(state.students||[]).find(s=>s.id===studentId);
  if(!student)return null;
  const grouped=new Map();
  for(const week of state.weeks||[]){
    if(!studentAppliesToWeek(student,week))continue;
    const actual=week.deliveries?.[studentId];
    const key=week.startDate||week.id;
    const previous=grouped.get(key);
    const stamp=String(actual?.registeredAt||week.createdAt||"");
    if(!previous||Number(Boolean(actual))>Number(Boolean(previous.actual))||
      (Boolean(actual)===Boolean(previous.actual)&&stamp>=previous.stamp)){
      grouped.set(key,{week,actual,stamp});
    }
  }
  const detail=[...grouped.values()].map(({week,actual})=>{
    const status=deliveryStatus(week,studentId);
    const due=isWeekDue(week,asOf);
    const stats=status==="no_aplica"?null:summarizeWeekStatistics(actual?.statistics);
    const days=stats ? actual.statistics.entries
      .filter(d=>d&&validStatuses.has(d.status))
      .map((d,i)=>({
        index:i,status:d.status,minutes:d.minutes||0,
        reasonCode:d.reasonCode||0,
        reason:d.status==="falta"||d.status==="sin_labores"
          ?causeLabel(d.status,d.reasonCode):"",
      })) : [];
    return {
      id:week.id,label:week.label,
      startDate:week.startDate,endDate:week.endDate,
      dueAt:week.dueAt,closedAt:week.closedAt,
      status,expired:due,
      state:status==="no_aplica"?"no_aplica":
        status==="no_entregado"?(due?"vencida":"en_plazo"):
        status==="entregado_tarde"?"tarde":"a_tiempo",
      statsKnown:Boolean(stats),
      minutes:stats?.minutes??null,
      hours:stats ? stats.minutes/60:null,
      absenceCount:days.filter(day=>day.status==="falta").length,
      workCount:days.filter(day=>day.status==="laboral").length,
      nonWorkingCount:days.filter(day=>day.status==="sin_labores").length,
      offCount:days.filter(day=>day.status==="inhabil").length,
      days,
      registeredAt:actual?.registeredAt||"",
      method:actual?.source==="camera"?"Lectura Data Matrix":
        actual?.source==="manual"?"Captura manual":"Sin dato",
    };
  }).sort(sortDesc);
  const dueRows=detail.filter(w=>w.expired&&w.status!=="no_aplica");
  const submitted=dueRows.filter(w=>["entregado","entregado_tarde"].includes(w.status));
  const pending=dueRows.filter(w=>w.status==="no_entregado");
  const checked=detail.filter(w=>w.statsKnown);
  const allDays=checked.flatMap(w=>w.days);
  const causesMap=new Map();
  for(const day of allDays){
    if(day.status!=="falta")continue;
    const name=day.reason||"Sin motivo especificado";
    causesMap.set(name,(causesMap.get(name)||0)+1);
  }
  const hours=checked.map(w=>w.hours);
  const countedDays=allDays.filter(d=>["falta","laboral"].includes(d.status));
  const totalMinutes=checked.reduce((total,w)=>total+(w.minutes||0),0);
  const byCause=[...causesMap.entries()].map(([label,count])=>({label,count}))
    .sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label,"es"));
  const monthsMap=new Map();
  for(const row of detail){
    if(!row.startDate)continue;
    const month=row.startDate.slice(0,7);
    const prev=monthsMap.get(month)||{month,minutes:0,worked:0,absences:0,pending:0,due:0,submitted:0};
    if(row.statsKnown){
      prev.minutes+=row.minutes||0;
      prev.worked+=row.workCount;
      prev.absences+=row.absenceCount;
    }
    if(row.expired&&row.status!=="no_aplica"){
      prev.due++;
      if(row.status==="no_entregado")prev.pending++;
      else prev.submitted++;
    }
    monthsMap.set(month,prev);
  }
  return {
    id:student.id,name:student.name,
    group:student.group||"Sin especificar",company:student.company||"Sin especificar",
    specialty:student.specialty||"Sin especificar",
    active:student.dualStatus!=="desisted",
    dateFrom:detail.at(-1)?.startDate||"",
    dateTo:detail[0]?.endDate||"",
    registeredWeeks:detail.length,
    due:dueRows.length,submitted:submitted.length,
    onTime:submitted.filter(w=>w.status==="entregado").length,
    late:submitted.filter(w=>w.status==="entregado_tarde").length,
    pending:pending.length,
    pendingWeeks:pending,
    upcoming:detail.filter(w=>!w.expired&&w.status==="no_entregado").length,
    notApplicable:detail.filter(w=>w.status==="no_aplica").length,
    deliveryRate:percent(submitted.length,dueRows.length),
    onTimeRate:percent(submitted.filter(w=>w.status==="entregado").length,dueRows.length),
    attendanceRate:percent(allDays.filter(d=>d.status==="laboral").length,countedDays.length),
    totalHours:totalMinutes/60,
    averageHours:hours.length?totalMinutes/60/hours.length:null,
    minHours:hours.length?Math.min(...hours):null,
    maxHours:hours.length?Math.max(...hours):null,
    absences:allDays.filter(d=>d.status==="falta").length,
    workDays:allDays.filter(d=>d.status==="laboral").length,
    nonWorkingDays:allDays.filter(d=>d.status==="sin_labores").length,
    offDays:allDays.filter(d=>d.status==="inhabil").length,
    knownDays:allDays.length,
    weeksWithStats:checked.length,
    byCause,
    monthly:[...monthsMap.values()].sort((a,b)=>a.month.localeCompare(b.month)),
    timeline:detail,
  };
}
