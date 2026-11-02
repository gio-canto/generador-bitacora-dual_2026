import schools from "../data/schools.json";
import defaultMessages from "../data/generator-messages.json";

export const MESSAGE_SEEN_KEY = "bitacora-generator-messages-seen-v1";
export const MESSAGE_SESSION_KEY = "bitacora-generator-messages-session-v1";
export const MESSAGE_PRESENTATIONS = ["tab", "medium", "fullscreen"];
export const MESSAGE_FREQUENCIES = ["once", "once-per-device", "once-per-year", "once-per-day", "once-per-session", "always"];
const TRIGGERS = ["on-open", "date", "final-bitacora", "graduation"];
const iso = value => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value + "T12:00:00Z")) &&
  new Date(value + "T12:00:00Z").toISOString().slice(0,10) === value;
export const mexicoDate = (at = new Date()) => {
  const parts=new Intl.DateTimeFormat("en-US",{timeZone:"America/Mexico_City",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(at);
  const data=Object.fromEntries(parts.filter(x=>x.type!=="literal").map(x=>[x.type,x.value]));
  return data.year+"-"+data.month+"-"+data.day;
};
const normalized = value => String(value || "").trim().toLocaleLowerCase("es-MX")
  .normalize("NFD").replace(/[\u0300-\u036f]/g,"");
const listValid = input => input === "all" || Array.isArray(input) &&
  input.length > 0 && input.every(x=>typeof x==="string" && x.trim()) &&
  new Set(input.map(normalized)).size===input.length;
const annualDateValid=value=>/^(0[1-9]|1[0-2])-([0-2][0-9]|3[01])$/.test(value||"") &&
  iso("2000-"+value);
const priorityOrder=(a,b)=>(b.priority||0)-(a.priority||0) || a.id.localeCompare(b.id);
const contentKey=event=>[normalized(event.content?.title),normalized(event.content?.body),
  event.content?.youtubeId||"",event.content?.action?.url||""].join("|");
function uniqueContents(events){
  const seen=new Set();
  return events.filter(event=>{
    const key=contentKey(event);
    if(seen.has(key))return false;
    seen.add(key);
    return true;
  });
}
export const validSurveyUrl = value => {
  try {const url=new URL(value);return url.protocol==="https:" && !!url.hostname && !url.username && !url.password;}
  catch{return false;}
};
export const validYoutubeId = value => value == null || value === "" ||
  typeof value === "string" && /^[A-Za-z0-9_-]{11}$/.test(value);
export function validateMessageConfig(config) {
  const errors=[];
  if (!config || config.version !== 1 || !Array.isArray(config.events)) return ["El JSON requiere version: 1 y events: []."];
  const ids=new Set();
  config.events.forEach((event,index)=>{
    const at = "Evento " + (index+1) + ": ";
    if (!event || !/^[a-z0-9][a-z0-9_-]{1,63}$/.test(event.id || "")) errors.push(at+"ID inválido.");
    else if(ids.has(event.id)) errors.push(at+"ID duplicado.");
    else ids.add(event.id);
    if (!Number.isInteger(event?.revision) || event.revision < 1) errors.push(at+"Revisión inválida.");
    if(typeof event?.enabled!=="boolean")errors.push(at+"Estado de activación inválido.");
    if(!Number.isInteger(event?.priority)||event.priority<0)errors.push(at+"Prioridad inválida.");
    if (!MESSAGE_PRESENTATIONS.includes(event?.presentation)) errors.push(at+"Presentación no válida.");
    if (!TRIGGERS.includes(event?.trigger?.type)) errors.push(at+"Activador no válido.");
    if (!MESSAGE_FREQUENCIES.includes(event?.frequency)) errors.push(at+"Frecuencia no válida.");
    if (event?.dismissible !== true) errors.push(at+"Los mensajes deben permitir cerrarse.");
    if (!listValid(event?.audience?.schools) || !listValid(event?.audience?.specialties)) errors.push(at+"Público no válido.");
    // Ausencia del filtro mantiene compatibilidad con mensajes históricos.
    if(event?.audience?.generations!=null &&
       (!listValid(event.audience.generations) ||
        (Array.isArray(event.audience.generations) &&
         event.audience.generations.some(id=>!/^[a-z0-9][a-z0-9_-]{1,79}$/.test(id)))))
      errors.push(at+"Generación destinataria no válida.");
    if (!String(event?.content?.title || "").trim() || !String(event?.content?.body || "").trim()) errors.push(at+"Faltan título o texto.");
    if (!validYoutubeId(event?.content?.youtubeId)) errors.push(at+"ID de YouTube incorrecto.");
    if (event?.content?.action?.url && !validSurveyUrl(event.content.action.url)) errors.push(at+"Enlace no seguro.");
    const trigger=event?.trigger || {};
    if(trigger.type==="date" &&
      ((!iso(trigger.date) && !annualDateValid(trigger.annualDate)) ||
       (trigger.date!=null && trigger.annualDate!=null)))
      errors.push(at+"Fecha del evento inválida.");
    if(trigger.type==="graduation"){
      if(trigger.showOn!=null && !["final-bitacora","date"].includes(trigger.showOn))
        errors.push(at+"Momento de felicitación inválido.");
      if(!iso(trigger.startDate)||!iso(trigger.endDate)||trigger.startDate>trigger.endDate)
        errors.push(at+"Periodo de graduación inválido.");
      if(!Array.isArray(trigger.videoDates)||!trigger.videoDates.length||
        trigger.videoDates.some(d=>!iso(d)||d<trigger.startDate||d>trigger.endDate)||
        new Set(trigger.videoDates).size!==trigger.videoDates.length)
        errors.push(at+"Selecciona fechas de video únicas dentro del periodo.");
      if(event.presentation!=="fullscreen" && event.presentation!=="medium")
        errors.push(at+"La graduación requiere ventana mediana o completa.");
    }
    if (trigger.startDate && !iso(trigger.startDate)) errors.push(at+"Inicio inválido.");
    if (trigger.endDate && !iso(trigger.endDate)) errors.push(at+"Fin inválido.");
    if (trigger.startDate && trigger.endDate && trigger.startDate > trigger.endDate) errors.push(at+"Periodo invertido.");
  });
  return errors;
}
export const getDefaultMessageConfig = () => structuredClone(defaultMessages);
function schoolNames(value){
  const found=schools.find(x=>x.id===value || normalized(x.name)===normalized(value) || normalized(x.shortName)===normalized(value));
  return [value,found?.id,found?.name,found?.shortName].filter(Boolean).map(normalized);
}
function matchesAudience(event,profile={}){
  const {schools:targetSchools="all",specialties="all",generations="all"}=event.audience || {};
  const identities=schoolNames(profile.school);
  return (targetSchools==="all" || targetSchools.some(s=>schoolNames(s).some(candidate=>identities.includes(candidate)))) &&
    (specialties==="all" || specialties.some(s=>normalized(s)===normalized(profile.specialty))) &&
    (generations==="all" || generations.some(id=>
      Boolean(profile.generation)&&normalized(id)===normalized(profile.generation)));
}
function matchesTrigger(event,trigger,date){
  const spec=event.trigger || {};
  // Compatibilidad: graduaciones anteriores, sin showOn, se mostraban en la
  // fecha al abrir. Las nuevas sólo aparecen tras confirmar y generar el PDF.
  const expected=spec.type==="graduation" && spec.showOn==="final-bitacora"
    ? "final-bitacora" : spec.type;
  if(expected !== trigger) return false;
  if(spec.startDate && date < spec.startDate || spec.endDate && date > spec.endDate) return false;
  if(spec.type==="date") return spec.date === date || spec.annualDate===date.slice(5);
  if(spec.type==="graduation") return spec.videoDates?.includes(date)===true;
  return true;
}
export const messageSeenToken = (event,profileId="",date="") => {
  const scope=event.frequency==="once-per-device" ? "device" : profileId || "unassigned";
  const year=event.frequency==="once-per-year" ? ":"+date.slice(0,4) : event.frequency==="once-per-day" ? ":"+date : "";
  return event.id + ":" + event.revision + ":" + scope + year;
};
function readBag(storage,key){
  try {const raw=JSON.parse(storage?.getItem(key)||"{}"); return raw && typeof raw==="object" && !Array.isArray(raw) ? raw : {};}
  catch{return {};}
}
export function hasSeenMessage(event,{storage,sessionStorage,profileId="",date=""}={}){
  if(event.frequency==="always") return false;
  const key=messageSeenToken(event,profileId,date);
  return Boolean(readBag(event.frequency==="once-per-session"?sessionStorage:storage,
    event.frequency==="once-per-session"?MESSAGE_SESSION_KEY:MESSAGE_SEEN_KEY)[key]);
}
export function markMessageSeen(event,{storage,sessionStorage,profileId="",date=""}={}){
  const target=event.frequency==="once-per-session"?sessionStorage:storage;
  const key=event.frequency==="once-per-session"?MESSAGE_SESSION_KEY:MESSAGE_SEEN_KEY;
  try {target?.setItem(key,JSON.stringify({...readBag(target,key),[messageSeenToken(event,profileId,date)]:Date.now()}));}
  catch{/* usable without storage */}
}
export function eligibleMessages(config,{trigger="on-open",profile={},profileId="",date=mexicoDate(),storage,sessionStorage,ignoreSeen=false}={}){
  if(validateMessageConfig(config).length)return [];
  return uniqueContents(config.events.filter(event=>event.enabled && matchesAudience(event,profile) &&
    matchesTrigger(event,trigger,date) &&
    (ignoreSeen || !hasSeenMessage(event,{storage,sessionStorage,profileId,date})))
    .sort(priorityOrder));
}

/** Configuración visual independiente de la lectura: activa el tema durante todo
 * el intervalo, aunque la felicitación con video aparezca sólo en las fechas elegidas. */
export function activeGraduation(config,{profile={},date=mexicoDate()}={}){
  if(validateMessageConfig(config).length)return null;
  return config.events.filter(e=>e.enabled&&e.trigger?.type==="graduation"&&
    date>=e.trigger.startDate&&date<=e.trigger.endDate&&matchesAudience(e,profile))
    .sort(priorityOrder)[0]||null;
}

/** Prioriza la despedida programada sobre la genérica al terminar la última
 * bitácora. Nunca se presentan dos despedidas para un mismo PDF. */
export function finalBitacoraMessages(config,options={}){
  const graduation=eligibleMessages(config,{...options,trigger:"final-bitacora"})
    .filter(event=>event.trigger?.type==="graduation");
  if(graduation.length)return graduation.slice(0,1);
  // Si la graduación aplicable ya fue vista hoy, tampoco mostrar una despedida
  // genérica al volver a descargar el mismo PDF.
  const scheduled=eligibleMessages(config,{...options,trigger:"final-bitacora",ignoreSeen:true})
    .some(event=>event.trigger?.type==="graduation");
  if(scheduled)return [];
  // Compatibilidad con graduaciones antiguas cuyo video se abrió por fecha:
  // no mostrar después una despedida adicional tras ese mismo PDF.
  const legacyScheduled=eligibleMessages(config,{...options,trigger:"graduation",ignoreSeen:true})
    .some(event=>event.trigger?.type==="graduation");
  if(legacyScheduled)return [];
  return eligibleMessages(config,{...options,trigger:"final-bitacora"})
    .filter(event=>event.trigger?.type!=="graduation").slice(0,1);
}

/** No publicar en el historial despedidas finales todavía no presentadas. */
export function historyMessages(config,ctx={}){
  if(validateMessageConfig(config).length)return [];
  const date=ctx.date||mexicoDate();
  return uniqueContents(config.events.filter(event=>{
    if(!event.enabled || !matchesAudience(event,ctx.profile))return false;
    const finalEvent=event.trigger?.type==="final-bitacora" ||
      (event.trigger?.type==="graduation"&&event.trigger.showOn==="final-bitacora");
    return finalEvent?hasSeenMessage(event,{...ctx,date}):
      matchesTrigger(event,event.trigger?.type,date);
  }).sort(priorityOrder));
}
const overlaps=(a,b)=>a==="all"||b==="all"||
  a.some(value=>b.some(other=>normalized(value)===normalized(other)));
const sharedPublic=(a,b)=>overlaps(a.audience.schools,b.audience.schools)&&
  overlaps(a.audience.specialties,b.audience.specialties)&&
  overlaps(a.audience.generations??"all",b.audience.generations??"all");

/** Advertencias no destructivas para el editor y los eventos antiguos. */
export function messageEventWarnings(config){
  if(!Array.isArray(config?.events))return [];
  const warnings=[];
  for(let i=0;i<config.events.length;i++){
    const a=config.events[i];
    if(!a?.enabled||!a.audience)continue;
    for(let j=i+1;j<config.events.length;j++){
      const b=config.events[j];
      if(!b?.enabled||!b.audience||!sharedPublic(a,b))continue;
      const matchingTrigger=a.trigger?.type===b.trigger?.type &&
        (a.trigger?.type==="date"
          ? (a.trigger.date&&a.trigger.date===b.trigger?.date)||
            (a.trigger.annualDate&&a.trigger.annualDate===b.trigger?.annualDate)
          : a.trigger?.type==="on-open"||a.trigger?.type==="final-bitacora");
      const sharedGraduation=a.trigger?.type==="graduation"&&b.trigger?.type==="graduation"&&
        a.trigger.showOn===b.trigger.showOn &&
        a.trigger.videoDates?.some(date=>b.trigger.videoDates?.includes(date));
      if((matchingTrigger||sharedGraduation)&&
          (contentKey(a)===contentKey(b)||sharedGraduation))
        warnings.push("Coincidencia entre "+a.id+" y "+b.id+": revisa fechas, público y contenido.");
    }
  }
  return warnings;
}

