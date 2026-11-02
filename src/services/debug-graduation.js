import {activeGraduation} from "./generator-message-rules.js";

/** Probar graduaciones futuras (incluso borradores) sin tocar perfiles reales. */
export function graduationPreviewForDate(config,eventId,date,profile=null){
  const selected=config?.events?.find(event=>event.id===eventId && event.trigger?.type==="graduation");
  if(!selected)return null;
  const isolated={version:1,events:[{...selected,enabled:true,
    audience:profile===null?{schools:"all",specialties:"all"}:selected.audience}]};
  return activeGraduation(isolated,{date,profile:profile||{}});
}

export function graduationPreviewDates(event){
  if(event?.trigger?.type!=="graduation")return [];
  return [...new Set([event.trigger.startDate,...(event.trigger.videoDates||[])])]
    .filter(Boolean).sort();
}
