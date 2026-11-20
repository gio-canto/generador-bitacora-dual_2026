import catalog from "../data/special-events.json";
import schools from "../data/schools.json";
export const EVENT_PHASE_LABELS = {no_aplica:"No aplica",local:"Local",regional:"Regional",estatal:"Estatal",nacional:"Nacional",internacional:"Internacional"};
export const EVENT_PHASE_CODES = Object.keys(EVENT_PHASE_LABELS);
export function schoolEventId(value) {
  const key=String(value||"").trim().toLocaleLowerCase("es-MX");
  return schools.find(x=>[x.id,x.name,x.shortName].some(y=>String(y||"").trim().toLocaleLowerCase("es-MX")===key))?.id||key;
}
export function eventsForSchool(school) {
  const id=schoolEventId(school);
  return catalog.filter(x=>x.enabled!==false &&
    (x.schools==="all"||(Array.isArray(x.schools)&&x.schools.includes(id))) &&
    !(x.excludeSchools||[]).includes(id));
}
export const specialEventByCode=code=>catalog.find(x=>x.code===Number(code))||null;
export const specialEventById=(id,school)=>eventsForSchool(school).find(x=>x.id===id)||null;
export const eventDisciplineCode=(eventId,name)=>{
  const e=catalog.find(x=>x.id===eventId);
  const i=e?.disciplines?.indexOf(name)??-1;
  return i>0&&i<=31?i:0;
};
export const eventDisciplineFromCode=(eventId,code)=>{
  const e=catalog.find(x=>x.id===eventId);
  return code>0?(e?.disciplines?.[code]||""):"";
};
export function specialEventText(event,phase="no_aplica",discipline="",customName="",eventResult="") {
  if(!event)return "";
  const title=event.id==="otros"?(String(customName||"").trim()||"un evento especial"):event.label;
  const base=String(event.phaseTexts?.[phase] || event.text || "")
    .replaceAll("{evento}",title)
    .replaceAll("{fase}",phase&&phase!=="no_aplica"?", fase "+(EVENT_PHASE_LABELS[phase]||phase).toLowerCase():"")
    .replaceAll("{disciplina}",discipline&&discipline!=="No aplica"?", disciplina "+discipline:"");
  const result=String(eventResult||"").trim().replace(/[.\s]+$/,"");
  return result ? base.trimEnd()+" Resultado obtenido: "+result+"." : base;
}
export function validSpecialEvent(entry,school) {
  const e=specialEventById(entry?.eventId,school);
  return Boolean(e&&e.phases.includes(entry.eventPhase||"no_aplica")&&
    (e.id!=="otros"||String(entry.eventName||"").trim())&&
    (!entry.eventDiscipline||e.disciplines.includes(entry.eventDiscipline)||
       (e.id==="otros"&&String(entry.eventDiscipline).length<=100))&&
    ["con","sin"].includes(entry.eventMode)&&
    (entry.eventResult===undefined || (typeof entry.eventResult==="string"&&entry.eventResult.length<=120)));
}
