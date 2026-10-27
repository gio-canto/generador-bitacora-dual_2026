import {studentIsActive,studentAppliesToWeek,deliveryStatus} from "./delivery-registry.js";
import {summarizeWeekStatistics,causeLabel} from "./matrix-statistics.js";
export const percent = (value,total) => total ? Math.round(value/total*100) : 0;
const makeCounts=()=>({laboral:0,falta:0,sin_labores:0,inhabil:0});
const compareText=(a,b)=>a.localeCompare(b,"es",{sensitivity:"base"});
const groupLabel=student=>String(student.group||"").trim().toLocaleUpperCase("es-MX")||"Sin grupo";
const companyLabel=student=>String(student.company||"").trim()||"Sin especificar";
const blankComparison=label=>({
  label,activeStudents:0,studentIds:new Set(),reports:0,minutes:0,
  worked:0,absences:0,nonWorking:0,holidays:0,
});
function calculateComparisons(entries,activeTotal){
 return [...entries.values()].map(row=>{
   const applicableDays=row.worked+row.absences;
   return {
     label:row.label,activeStudents:row.activeStudents,
     share:activeTotal?100*row.activeStudents/activeTotal:0,
     studentsWithData:row.studentIds.size,reports:row.reports,
     minutes:row.minutes,hours:row.minutes/60,
     averageHours:row.studentIds.size?row.minutes/60/row.studentIds.size:null,
     worked:row.worked,absences:row.absences,nonWorking:row.nonWorking,
     holidays:row.holidays,knownDays:row.worked+row.absences+row.nonWorking+row.holidays,
     applicableDays,absenceRate:applicableDays?100*row.absences/applicableDays:null,
   };
 }).sort((a,b)=>compareText(a.label,b.label));
}
function comparisonLeaders(rows,missing){
 const valid=rows.filter(row=>row.reports>0&&row.label!==missing);
 const byHours=[...valid].sort((a,b)=>b.minutes-a.minutes||compareText(a.label,b.label));
 const byAbsences=[...valid].filter(row=>row.absences>0)
   .sort((a,b)=>b.absences-a.absences||compareText(a.label,b.label));
 // La tasa 0% es una tasa válida si hay jornadas trabajadas;
 // empresas sin jornadas computables se excluyen de ambas comparaciones.
 const byRate=[...valid].filter(row=>row.absenceRate!=null)
   .sort((a,b)=>b.absenceRate-a.absenceRate||
     b.applicableDays-a.applicableDays||compareText(a.label,b.label));
 const byLowestRate=[...byRate].sort((a,b)=>a.absenceRate-b.absenceRate||
   b.applicableDays-a.applicableDays||compareText(a.label,b.label));
 return {mostHours:byHours[0]||null,leastHours:byHours.at(-1)||null,
   mostAbsences:byAbsences[0]||null,highestAbsenceRate:byRate[0]||null,
   lowestAbsenceRate:byLowestRate[0]||null,
   comparable:valid.length,rateComparable:byRate.length};
}
export const genderLabels={
  male:"Hombres",female:"Mujeres",nonbinary:"No binario",
  other:"Otro",undisclosed:"Prefiero no responder","":"Sin dato",
};
function groupTotals(people, field) {
  const groups=new Map();
  for(const item of people){
    const key=item[field]||"Sin especificar";
    groups.set(key,(groups.get(key)||0)+1);
  }
  return [...groups.entries()].map(([label,count])=>({label,count})).sort((a,b)=>b.count-a.count);
}
export function calculateDeliveryStatistics(state,{period="weekly",weekId="",month="",specialty="",company=""}={}){
  const roster=(state.students||[]).filter(student=>(!specialty||student.specialty===specialty)&&(!company||student.company===company));
  const students=roster.filter(studentIsActive);
  const byId=new Map(roster.map(item=>[item.id,item]));
  const weeks=(state.weeks||[]).filter(w=>period==="all" || (period==="monthly" ? w.startDate?.startsWith(month) : w.id===weekId)).sort((a,b)=>(a.startDate||"").localeCompare(b.startDate||""));
  const daily=makeCounts(),causes={falta:new Map(),sin_labores:new Map()};
  const companyMap=new Map(),groupMap=new Map();
  const register=(map,name)=>{if(!map.has(name))map.set(name,blankComparison(name));return map.get(name);};
  for(const student of students){
    register(companyMap,companyLabel(student)).activeStudents++;
    register(groupMap,groupLabel(student)).activeStudents++;
  }
  const methods=new Map(), trend=[];
  let totalMinutes=0, weeksWithStatistics=0,delivered=0,late=0,notDelivered=0,notApplicable=0,applicable=0;
  let pendingWithStatistics=0, pendingMinutes=0;
  let reportCount=0;
  const dayTrend=[0,0,0,0];
  const receivedCompanies=[],receivedSpecialties=[];
  for(const week of weeks){
    let weekMinutes=0,weekReports=0;
    for(const student of roster){
      if(!studentAppliesToWeek(student,week))continue;
      const delivery=week.deliveries?.[student.id];
      const status=deliveryStatus(week,student.id);
      if(status==="no_aplica"){notApplicable++;continue;}
      applicable++;
      if(status==="no_entregado")notDelivered++;
      else if(status==="entregado_tarde")late++;
      else if(status==="entregado")delivered++;
      // Un alumno sin entrega sigue sin bitácora; solamente jornadas
      // capturadas explícitamente pueden aportar horas estadísticas.
      if(!delivery)continue;
      const scanned=delivery.source==="camera" && Number.isInteger(delivery.matrixVersion) && delivery.matrixVersion>0;
      const source=scanned||delivery.usageSource==="generator"||delivery.matrixVersion>0?"generator"
        :delivery.usageSource==="other"?"other":"unknown";
      const current=methods.get(student.id)||"unknown";
      methods.set(student.id,source==="generator"?"generator":current==="generator"?current:source==="other"?"other":current);
      const summary=summarizeWeekStatistics(delivery.statistics);
      if(!summary)continue;
      weeksWithStatistics++;reportCount++;weekReports++;
      totalMinutes+=summary.minutes;weekMinutes+=summary.minutes;
      for(const row of [register(companyMap,companyLabel(student)),register(groupMap,groupLabel(student))]){
        row.studentIds.add(student.id);
        row.reports++;
        row.minutes+=summary.minutes;
        row.worked+=summary.worked;
        row.absences+=summary.absent;
        row.nonWorking+=summary.nonWorking;
        row.holidays+=summary.holidays;
      }
      if(status==="no_entregado"){
        pendingWithStatistics++;
        pendingMinutes+=summary.minutes;
      }
      for(let index=0;index<4;index++){
        const day=delivery.statistics.entries[index];
        daily[day.status]++;
        dayTrend[index]+=day.minutes||0;
        if(day.status==="falta"||day.status==="sin_labores"){
          const map=causes[day.status], key=day.reasonCode;
          map.set(key,(map.get(key)||0)+1);
        }
      }
      receivedCompanies.push({company:student.company,minutes:summary.minutes});
      receivedSpecialties.push({specialty:student.specialty,minutes:summary.minutes});
    }
    trend.push({label:week.label,startDate:week.startDate,minutes:weekMinutes,reports:weekReports});
  }
  const used=students.filter(item=>methods.get(item.id)==="generator").length;
  const other=students.filter(item=>methods.get(item.id)==="other").length;
  const genderCounts=Object.fromEntries(Object.keys(genderLabels).map(x=>[x,students.filter(s=>(s.gender||"")===x).length]));
  const breakdown=(map,type)=>[...map.entries()].map(([code,count])=>({code,count,label:causeLabel(type,code)})).sort((a,b)=>b.count-a.count);
  const byCompanyPerformance=calculateComparisons(companyMap,students.length);
  const byGroupPerformance=calculateComparisons(groupMap,students.length);
  const groupMinutes=(field,entries)=>[...entries.reduce((acc,row)=>{
    const name=row[field]||"Sin especificar";acc.set(name,(acc.get(name)||0)+row.minutes);return acc;
  },new Map())].map(([label,minutes])=>({label,minutes})).sort((a,b)=>b.minutes-a.minutes);
  return {
    roster,students,weeks,trend,dayTrend,daily,totalMinutes,
    weeksWithStatistics,reportCount,applicable,delivered,late,notDelivered,notApplicable,
    pendingWithStatistics,pendingMinutes,
    usage:{used,other,unknown:students.length-used-other},
    genderCounts, causesAbsence:breakdown(causes.falta,"falta"),causesNonWorking:breakdown(causes.sin_labores,"sin_labores"),
    byCompanyPerformance,byGroupPerformance,
    companyLeaders:comparisonLeaders(byCompanyPerformance,"Sin especificar"),
    groupLeaders:comparisonLeaders(byGroupPerformance,"Sin grupo"),
    // Todas las empresas del padrón, aunque no tengan capturas o sus faltas sean cero.
    byCompany:[...companyMap.values()].map(row=>({label:row.label,minutes:row.minutes}))
      .sort((a,b)=>b.minutes-a.minutes||compareText(a.label,b.label)),
    bySpecialty:groupMinutes("specialty",receivedSpecialties),
    coverage:percent(weeksWithStatistics,applicable),
    onTimeRate:percent(delivered,applicable),
    deliveryRate:percent(delivered+late,applicable),
    attendanceRate:percent(daily.laboral,daily.laboral+daily.falta),
    avgHours:weeksWithStatistics?totalMinutes/60/weeksWithStatistics:0,
  };
}


/**
 * Consolidado histórico del Dual: todas las semanas, incluso si el panel
 * está filtrado por una semana o mes. Respeta especialidad y empresa.
 *
 * La proporción de especialidades usa el padrón activo. Las horas incluyen
 * también entregas históricas válidas de alumnos posteriormente desistidos.
 * Sin estadísticas registradas significa "sin dato", nunca cero horas.
 */
export function calculateDualLifetimeStatistics(state, {specialty = "", company = ""} = {}) {
  const roster = (state.students || []).filter(student =>
    (!specialty || student.specialty === specialty) &&
    (!company || student.company === company)
  );
  const active = roster.filter(studentIsActive);
  const byId = new Map(roster.map(student => [student.id, student]));
  const enrolled = new Map();
  for (const student of active) {
    const key = student.specialty || "Sin especificar";
    enrolled.set(key, (enrolled.get(key) || 0) + 1);
  }

  // No contar dos veces un mismo alumno-periodo si hay semanas duplicadas.
  const uniquePeriods = new Map();
  for (const week of state.weeks || []) {
    for (const [studentId, delivery] of Object.entries(week.deliveries || {})) {
      if (!byId.has(studentId) || !delivery || delivery.status === "no_aplica" ||
          !["entregado", "entregado_tarde", "no_entregado"].includes(delivery.status)) continue;
      const stats = summarizeWeekStatistics(delivery.statistics);
      if (!stats) continue;
      const period = week.startDate || week.id;
      const key = studentId + "::" + period;
      const candidate = {
        studentId,
        minutes: stats.minutes,
        order: String(delivery.registeredAt || week.createdAt || ""),
      };
      const prior = uniquePeriods.get(key);
      if (!prior || candidate.order >= prior.order) uniquePeriods.set(key, candidate);
    }
  }

  const perStudent = new Map();
  const specialtyMinutes = new Map();
  let totalMinutes = 0;
  for (const record of uniquePeriods.values()) {
    totalMinutes += record.minutes;
    perStudent.set(record.studentId, (perStudent.get(record.studentId) || 0) + record.minutes);
    const name = byId.get(record.studentId)?.specialty || "Sin especificar";
    specialtyMinutes.set(name, (specialtyMinutes.get(name) || 0) + record.minutes);
  }
  const ordered = [...perStudent.values()].sort((a, b) => a - b);
  const sampleCount = ordered.length;
  const minMinutes = sampleCount ? ordered[0] : null;
  const maxMinutes = sampleCount ? ordered[sampleCount - 1] : null;
  const averageMinutes = sampleCount ? totalMinutes / sampleCount : null;
  const medianMinutes = sampleCount
    ? sampleCount % 2 ? ordered[Math.floor(sampleCount / 2)] :
      (ordered[sampleCount / 2 - 1] + ordered[sampleCount / 2]) / 2
    : null;
  const names = new Set([...enrolled.keys(), ...specialtyMinutes.keys()]);
  const bySpecialty = [...names].map(label => {
    const students = enrolled.get(label) || 0;
    const minutes = specialtyMinutes.get(label) || 0;
    return {
      label,
      students,
      proportion: active.length ? students / active.length * 100 : 0,
      minutes,
      hours: minutes / 60,
      hoursProportion: totalMinutes ? minutes / totalMinutes * 100 : 0,
    };
  }).sort((a, b) => b.students - a.students || b.minutes - a.minutes || a.label.localeCompare(b.label, "es"));
  return {
    activeStudents: active.length,
    studentsWithData: sampleCount,
    periodsWithData: uniquePeriods.size,
    studentsWithoutData: roster.length - sampleCount,
    totalMinutes,
    totalHours: totalMinutes / 60,
    averageHours: averageMinutes === null ? null : averageMinutes / 60,
    medianHours: medianMinutes === null ? null : medianMinutes / 60,
    minHours: minMinutes === null ? null : minMinutes / 60,
    maxHours: maxMinutes === null ? null : maxMinutes / 60,
    rangeHours: minMinutes === null ? null : (maxMinutes - minMinutes) / 60,
    bySpecialty,
  };
}
