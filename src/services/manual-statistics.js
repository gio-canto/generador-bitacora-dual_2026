import absenceReasons from "../data/absence-reasons.json";
import nonWorkingReasons from "../data/non-working-reasons.json";
import {EVENT_PHASE_CODES,specialEventByCode} from "./special-events.js";
const VALID=["laboral","falta","sin_labores","inhabil","evento"];
export const MANUAL_DAYS=["Martes","Miércoles","Jueves","Viernes"];
export const blankManualDays=()=>MANUAL_DAYS.map(()=>({status:"",hours:"",reasonCode:"0",eventPhase:"no_aplica",eventDiscipline:"No aplica",eventMode:"sin",eventResult:""}));
export const manualDaysFromStatistics=statistics=>statistics?.entries?.length===4
 ?statistics.entries.map(day=>({status:day.status,
    hours:["laboral","evento"].includes(day.status)&&day.minutes?String(day.minutes/60):"",
    reasonCode:String(day.reasonCode||0),eventPhase:day.eventPhase||"no_aplica",
    eventDiscipline:day.eventDiscipline||"No aplica",eventMode:day.eventMode||"sin",
    eventResult:day.eventResult||""})):blankManualDays();
export const reasonsForStatus=status=>status==="falta"?absenceReasons:status==="sin_labores"?nonWorkingReasons:[];
export function buildManualStatistics(days){
 if(!Array.isArray(days)||days.length!==4)throw Error("Se requieren cuatro jornadas.");
 if(days.every(day=>!day.status))return null;
 if(days.some(day=>!VALID.includes(day.status)))throw Error("Completa los estados de martes a viernes o déjalos todos vacíos.");
 const entries=days.map((day,index)=>{
   const status=day.status;let minutes=0,reasonCode=0, extra={};
   if(status==="laboral"||(status==="evento"&&day.eventMode==="con")){
     const hours=Number(day.hours);
     if(String(day.hours??"").trim()===""||!Number.isFinite(hours)||hours<=0||hours>24||
        Math.abs(hours*60-Math.round(hours*60))>1e-6)
       throw Error("Revisa las horas de "+MANUAL_DAYS[index].toLowerCase()+".");
     minutes=Math.round(hours*60);
     if(minutes>2046)throw Error("Las horas superan el límite de la jornada.");
   }
   if(status==="falta"||status==="sin_labores"){
     reasonCode=Number(day.reasonCode);
     if(!Number.isInteger(reasonCode)||reasonCode<0||reasonCode>63||
       (reasonCode!==0&&reasonCode!==63&&!(status==="falta"?absenceReasons:nonWorkingReasons).some(reason=>reason.code===reasonCode)))
       throw Error("Revisa la causa de "+MANUAL_DAYS[index].toLowerCase()+".");
   } else if(status==="evento"){
     reasonCode=Number(day.reasonCode);const ev=specialEventByCode(reasonCode);
     if(!ev)throw Error("Selecciona el evento de "+MANUAL_DAYS[index].toLowerCase()+".");
     const phase=day.eventPhase||"no_aplica";
     if(!EVENT_PHASE_CODES.includes(phase)||!ev.phases.includes(phase))
       throw Error("Revisa la fase del evento.");
     if(day.eventDiscipline&&!ev.disciplines.includes(day.eventDiscipline)&&ev.id!=="otros")
       throw Error("Revisa la disciplina del evento.");
     if(!["con","sin"].includes(day.eventMode))throw Error("Selecciona la modalidad del evento.");
     const result=String(day.eventResult||"").trim();
     if(result.length>120)throw Error("El resultado no debe superar 120 caracteres.");
     extra={eventPhase:phase,eventDiscipline:day.eventDiscipline||"",eventMode:day.eventMode,
       ...(result?{eventResult:result}:{})};
   }
   const catalog=status==="falta"?absenceReasons:reasonsForStatus(status);
   return {status,minutes,reasonCode,reasonId:status==="evento"?(specialEventByCode(reasonCode)?.id||""):(catalog.find(x=>x.code===reasonCode)?.id||""),...extra};
 });
 return {version:days.some(day=>day.status==="evento")?6:5,entries};
}
