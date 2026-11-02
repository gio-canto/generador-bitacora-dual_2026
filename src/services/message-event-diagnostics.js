import {eligibleMessages,hasSeenMessage,mexicoDate,validateMessageConfig} from "./generator-message-rules.js";
import schools from "../data/schools.json";

const normal=value=>String(value||"").trim().toLocaleLowerCase("es-MX")
  .normalize("NFD").replace(/[\u0300-\u036f]/g,"");
const identities=value=>{
  const school=schools.find(item=>[item.id,item.name,item.shortName].some(x=>normal(x)===normal(value)));
  return [value,school?.id,school?.name,school?.shortName].filter(Boolean).map(normal);
};
const audienceMatch=(values,value,school=false)=>
  values==="all" || Array.isArray(values)&&values.some(item=>
    school?identities(item).some(v=>identities(value).includes(v)):normal(item)===normal(value));

/** Inspección no destructiva: mismas reglas de elegibilidad que en producción. */
export function diagnoseMessageEvent(config,event,{
  trigger="on-open",date=mexicoDate(),profile={},profileId="",storage,sessionStorage
}={}){
  if(!event)return {eligible:false,reasons:["No hay un evento seleccionado."]};
  const reasons=[];
  const errors=validateMessageConfig(config);
  if(errors.length)reasons.push("El JSON tiene errores de validación.");
  if(!event.enabled)reasons.push("El evento está desactivado.");
  if(!audienceMatch(event.audience?.schools||"all",profile.school,true))
    reasons.push("El plantel simulado no está entre los destinatarios.");
  if(!audienceMatch(event.audience?.specialties||"all",profile.specialty))
    reasons.push("La especialidad simulada no está entre los destinatarios.");
  const spec=event.trigger||{};
  const expected=spec.type==="graduation"&&spec.showOn==="final-bitacora"
    ?"final-bitacora":spec.type;
  if(expected!==trigger)reasons.push("No se ha activado el disparador requerido: "+expected+".");
  if(spec.startDate&&date<spec.startDate || spec.endDate&&date>spec.endDate)
    reasons.push("La fecha está fuera de la vigencia del evento.");
  if(spec.type==="date" && spec.date!==date && spec.annualDate!==date.slice(5))
    reasons.push("La fecha simulada no coincide con la programada.");
  if(spec.type==="graduation"&&!spec.videoDates?.includes(date))
    reasons.push("La fecha no corresponde a un día de video de graduación.");
  if(hasSeenMessage(event,{storage,sessionStorage,profileId,date}))
    reasons.push("Este perfil ya vio el mensaje según su frecuencia.");
  const eligible=reasons.length===0&&eligibleMessages(config,{
    trigger,date,profile,profileId,storage,sessionStorage
  }).some(item=>item.id===event.id);
  if(!eligible&&!reasons.length)reasons.push("Otro evento con contenido idéntico tiene prioridad.");
  return {eligible,reasons};
}
