import {eligibleMessages,hasSeenMessage,mexicoDate,validateMessageConfig,
  matchesSchoolTargets,matchesSpecialtyTargets} from "./generator-message-rules.js";

/** Inspección no destructiva: mismas reglas de elegibilidad que en producción. */
export function diagnoseMessageEvent(config,event,{
  trigger="on-open",date=mexicoDate(),profile={},profileId="",storage,sessionStorage
}={}){
  if(!event)return {eligible:false,reasons:["No hay un evento seleccionado."]};
  const reasons=[];
  const errors=validateMessageConfig({version:1,events:[event]});
  if(errors.length)reasons.push("Este evento tiene errores de validación.");
  if(config?.events?.find(item=>item?.id===event.id)!==event)
    reasons.push("Hay otro evento con el mismo identificador que tiene prioridad.");
  if(!event.enabled)reasons.push("El evento está desactivado.");
  if(!matchesSchoolTargets(event.audience?.schools??"all",profile.school))
    reasons.push("El plantel simulado no está entre los destinatarios.");
  if(!matchesSpecialtyTargets(event.audience?.specialties??"all",profile.specialty))
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
