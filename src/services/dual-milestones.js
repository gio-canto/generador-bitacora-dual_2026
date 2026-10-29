import {studentAppliesToWeek,deliveryStatus,studentIsActive} from "./delivery-registry.js";
import {summarizeWeekStatistics} from "./matrix-statistics.js";

export const DUAL_MILESTONES=Object.freeze({
  social:480,
  professionalAdditional:360,
  professionalTotal:840,
});

// Un alumno alcanza el segundo hito al completar 480 + otras 360 horas.
// Referencias de seguimiento del plantel: no acreditan trámites por sí solas.
export function milestoneProgress(minutes){
  const valid=Math.max(0,Math.round(Number.isFinite(minutes)?minutes:0));
  const hours=valid/60;
  const socialReached=valid>=DUAL_MILESTONES.social*60;
  const professionalReached=valid>=DUAL_MILESTONES.professionalTotal*60;
  const target=professionalReached?DUAL_MILESTONES.professionalTotal:
    socialReached?DUAL_MILESTONES.professionalTotal:DUAL_MILESTONES.social;
  return {
    minutes:valid,hours,
    socialReached,professionalReached,
    stage:professionalReached?"professional":socialReached?"social":"in-progress",
    socialRemainingHours:Math.max(0,(DUAL_MILESTONES.social*60-valid)/60),
    professionalRemainingHours:Math.max(0,(DUAL_MILESTONES.professionalTotal*60-valid)/60),
    nextTargetHours:target,
    nextRemainingHours:Math.max(0,(target*60-valid)/60),
    progressPercent:Math.min(100,100*valid/(target*60)),
  };
}

/**
 * Acumulado HISTÓRICO de jornadas documentadas, no el promedio de empresas.
 * Incluye estudiantes desistidos si conservaron bitácoras, sin contar semanas
 * sin estadísticas como cero capturado; un alumno solo aporta una vez por semana.
 * No cambia los datos guardados ni se atribuyen horas a entregas sin jornadas.
 */
export function calculateDualMilestones(state,{specialty="",company=""}={}){
  const roster=(state.students||[]).filter(student=>
    (!specialty||student.specialty===specialty)&&(!company||student.company===company));
  const weeks=[...(state.weeks||[])].sort((a,b)=>
    String(a.startDate||"").localeCompare(String(b.startDate||""))||
    String(a.id||"").localeCompare(String(b.id||"")));
  const students=roster.map(student=>{
    let minutes=0,weeksWithData=0,socialWeek=null,professionalWeek=null;
    for(const week of weeks){
      if(!studentAppliesToWeek(student,week))continue;
      if(deliveryStatus(week,student.id)==="no_aplica")continue;
      const delivery=week.deliveries?.[student.id];
      const summary=summarizeWeekStatistics(delivery?.statistics);
      if(!summary)continue;
      minutes+=summary.minutes;
      weeksWithData++;
      if(!socialWeek&&minutes>=480*60)
        socialWeek={id:week.id,label:week.label||"Semana",date:week.startDate||""};
      if(!professionalWeek&&minutes>=840*60)
        professionalWeek={id:week.id,label:week.label||"Semana",date:week.startDate||""};
    }
    return {
      id:student.id,name:student.name||"Sin nombre",
      specialty:student.specialty||"",company:student.company||"",
      active:studentIsActive(student),weeksWithData,
      hasData:weeksWithData>0,
      socialWeek,professionalWeek,
      ...milestoneProgress(minutes),
    };
  }).sort((a,b)=>b.minutes-a.minutes||a.name.localeCompare(b.name,"es"));
  return {
    socialTarget:DUAL_MILESTONES.social,
    additionalTarget:DUAL_MILESTONES.professionalAdditional,
    professionalTarget:DUAL_MILESTONES.professionalTotal,
    totalStudents:students.length,
    studentsWithData:students.filter(s=>s.hasData).length,
    socialReached:students.filter(s=>s.socialReached).length,
    professionalReached:students.filter(s=>s.professionalReached).length,
    socialOnly:students.filter(s=>s.socialReached&&!s.professionalReached).length,
    pendingSocial:students.filter(s=>!s.socialReached).length,
    students,
  };
}
