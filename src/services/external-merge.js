import {extractExternalFields} from "./external-bitacora.js";

const days=["Martes","Miércoles","Jueves","Viernes"];
const nonWork=new Set(["sin_labores","falta","inhabil"]);
function meaningfulActivity(value){
 const text=String(value||"").trim();
 return /^(?:\d|horarios|hora|fecha|firma del|nombre del|nombre de la|semana\b)/i.test(text)?"":text;
}
function comparableDates(a,b){
 return !a||!b||a===b;
}
export function externalTranscriptQuality(text){
 const parsed=extractExternalFields(text);
 return parsed.recognized*12+
   parsed.days.filter(d=>d.date).length*3+
   parsed.days.filter(d=>d.hours).length*9+
   parsed.days.filter(d=>nonWork.has(d.status)).length*7+
   parsed.days.filter(d=>meaningfulActivity(d.activity).length>=10).length*2+
   (parsed.name?7:0)+(parsed.company?4:0)-
   parsed.days.filter(d=>d.needsReview).length*5;
}
export function externalTextNeedsOcr(text){
 const parsed=extractExternalFields(text);
 if(parsed.recognized<4||!parsed.name)return true;
 return parsed.days.some(day=>day.detected&&
   !nonWork.has(day.status)&&(!day.hours||day.needsReview));
}
/** Combina campos de la misma página, nunca de semanas diferentes. */
export function mergeExternalPageText(primary,secondary){
 const base=String(primary||"").trim(),additional=String(secondary||"").trim();
 if(!base)return additional;
 if(!additional)return base;
 const first=extractExternalFields(base),second=extractExternalFields(additional);
 if(!second.recognized)return base;
 if(!first.recognized)return externalTranscriptQuality(additional)>externalTranscriptQuality(base)?additional:base;
 let conflicts=false;
 const rows=first.days.map((old,i)=>{
   const newer=second.days[i]||{};
   if(!comparableDates(old.date,newer.date)){conflicts=true;return old;}
   const oldNonwork=nonWork.has(old.status),newNonwork=nonWork.has(newer.status);
   // Una ausencia explícita tiene prioridad sobre el horario impreso por defecto.
   const selectedStatus=newNonwork?newer.status:oldNonwork?old.status:
     (old.status||newer.status||"");
   const preferredTime=old.hours&&!old.needsReview?old:
     newer.hours&&!newer.needsReview?newer:old;
   const oldActivity=meaningfulActivity(old.activity),
         newActivity=meaningfulActivity(newer.activity);
   const selectedActivity=newActivity.length>oldActivity.length+10?newActivity:oldActivity||newActivity;
   return {
     date:old.date||newer.date||"",
     detected:old.detected||newer.detected,
     start:nonWork.has(selectedStatus)?"":preferredTime.start,
     end:nonWork.has(selectedStatus)?"":preferredTime.end,
     status:selectedStatus,
     activity:selectedActivity,
   };
 });
 if(conflicts)return externalTranscriptQuality(additional)>externalTranscriptQuality(base)+20?additional:base;
 const lines=[];
 const name=first.name||second.name,company=first.company||second.company;
 if(name)lines.push("Nombre del alumno: "+name);
 if(company)lines.push("Empresa: "+company);
 const week=(base.match(/\bsemana\s*(?:n[uú]mero|n[úu]m\.?|no\.?)?\s*\d{1,3}\b/i)||
   additional.match(/\bsemana\s*(?:n[uú]mero|n[úu]m\.?|no\.?)?\s*\d{1,3}\b/i)||[])[0];
 if(week)lines.push(week);
 rows.forEach((day,i)=>{
   if(!day.detected)return;
   lines.push(day.date||days[i]);
   if(day.start&&day.end)lines.push("Entrada: "+day.start+"\nSalida: "+day.end);
   if(day.status==="sin_labores"&&!/sin labores|no se labor|sin actividades|suspens|no hubo|no se realiz|no trabaj/i.test(day.activity))
     lines.push("Sin labores");
   else if(day.status==="inhabil"&&!/inh[aá]bil|feriado|festivo|asueto/i.test(day.activity))
     lines.push("Día inhábil");
   else if(day.status==="falta"&&!/inasistencia|falta|no asist/i.test(day.activity))
     lines.push("Inasistencia");
   if(day.activity)lines.push("Actividades: "+day.activity);
 });
 const merged=lines.join("\n");
 return externalTranscriptQuality(merged)>=Math.max(
   externalTranscriptQuality(base),externalTranscriptQuality(additional))
   ?merged:externalTranscriptQuality(additional)>externalTranscriptQuality(base)?additional:base;
}
