import {deliveryStatus,studentAppliesToWeek,studentIsActive,weekSummary} from "./delivery-registry.js";
import {calculateDualMilestones} from "./dual-milestones.js";
import {pendingReasonReviews} from "./reason-reviews.js";

export const INBOX_SEEN_KEY="bitacora-dual-inbox-seen-v1";
export const INBOX_SOUND_KEY="bitacora-dual-inbox-sound-v1";
export const INBOX_IGNORED_KEY="bitacora-dual-inbox-ignored-v1";
// Una nueva semana (lunes) o una nueva captura/revisión permite reabrir
// advertencias recurrentes; no elimina faltas, entregas ni evidencia.
const weekToken=(date=new Date())=>{
  const utc=new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()));
  utc.setUTCDate(utc.getUTCDate()-(utc.getUTCDay()+6)%7);
  return utc.toISOString().slice(0,10);
};
export const registryCaptureToken=state=>
  (state?.weeks||[]).map(week=>{
    const deliveries=Object.entries(week.deliveries||{}).map(([id,entry])=>
      id+":"+(entry?.registeredAt||entry?.deliveredAt||"")+":"+(entry?.status||"")+":"+
      (entry?.statistics?.entries?.length||0)+":"+
      (entry?.statistics?.entries||[]).map(e=>e.reasonCode||0).join(",")).sort().join("|");
    return week.id+":"+week.startDate+":"+week.dueAt+":"+deliveries;
  }).sort().join("~");
export function readIgnoredInbox(storage){
  try {const data=JSON.parse(storage?.getItem(INBOX_IGNORED_KEY)||"{}");
    return data&&typeof data==="object"&&!Array.isArray(data)?data:{};}
  catch{return {};}
}
export function ignoreInboxNotice(storage,notice,state,{now=new Date()}={}){
  const current=readIgnoredInbox(storage);
  const value={week:weekToken(now),round:registryCaptureToken(state),
    recurring:notice.severity!=="info",at:Date.now()};
  try{storage?.setItem(INBOX_IGNORED_KEY,JSON.stringify({...current,[notice.id]:value}));}
  catch{/* el navegador puede bloquear almacenamiento */}
}
export function visibleInboxNotices(notices,storage,state,{now=new Date()}={}){
  const ignored=readIgnoredInbox(storage),week=weekToken(now),round=registryCaptureToken(state);
  return notices.filter(notice=>{
    const mark=ignored[notice.id];
    if(!mark)return true;
    // Avisos de seguimiento y urgentes reaparecen al cambiar la semana o
    // la captura; los informativos permanecen ocultos mientras sean idénticos.
    return mark.recurring&&(mark.week!==week||mark.round!==round);
  });
}

const days=2*86400000;
export const getSeenInbox=(storage)=>{try{return JSON.parse(storage?.getItem(INBOX_SEEN_KEY)||"{}")||{}}catch{return {}}};
export const markInboxSeen=(storage,notifications)=>{
  try{storage?.setItem(INBOX_SEEN_KEY,JSON.stringify({...getSeenInbox(storage),
    ...Object.fromEntries(notifications.map(item=>[item.id,Date.now()]))}));}catch{}
};
export const isInboxSoundOn=storage=>{try{return storage?.getItem(INBOX_SOUND_KEY)!=="off"}catch{return true}};
export const setInboxSound=(storage,enabled)=>{try{storage?.setItem(INBOX_SOUND_KEY,enabled?"on":"off")}catch{}};
const notice=(id,title,description,severity="info",action="home",extra={})=>({
  id,title,description,severity,action,...extra
});
export function getRegistryNotifications(state,{now=new Date(),backupPending=false}={}){
  const result=[],today=+new Date(now);
  if(backupPending)result.push(notice("backup:pending","Respaldo pendiente",
    "Hay cambios sin una copia reciente.","followup","backup"));
  const reasons=pendingReasonReviews(state);
  if(reasons.length)result.push(notice("reasons:pending",""+reasons.length+" motivos por revisar",
    "Revisa las jornadas registradas como «Otro motivo».","followup","reasons",{count:reasons.length}));
  const applicable=state?.students||[];
  const ordered=[...(state?.weeks||[])].sort((a,b)=>String(b.startDate||"").localeCompare(String(a.startDate||"")));
  let missingStats=0,late=0;
  for(const week of ordered.slice(0,6)){
    const students=applicable.filter(s=>studentIsActive(s)&&studentAppliesToWeek(s,week));
    const summary=weekSummary(week,students);
    const due=week.dueAt?Date.parse(week.dueAt):NaN;
    if(!week.dueAt && students.length)
      result.push(notice("due:unset:"+week.id,"Semana sin fecha límite",
        week.label||"Configura la fecha de entrega.","followup","week",{weekId:week.id}));
    if(Number.isFinite(due) && summary.no_entregado>0){
      const overdue=due<today,soon=due>=today&&due<=today+days;
      if(overdue||soon)result.push(notice((overdue?"due:late:":"due:soon:")+week.id,
        overdue?summary.no_entregado+" entregas pendientes": "Próximo vencimiento",
        (week.label||"Semana")+" · "+summary.no_entregado+" sin entregar.",
        overdue?"urgent":"followup","week",{weekId:week.id}));
    }
    for(const student of students){
      const delivery=week.deliveries?.[student.id];
      if(deliveryStatus(week,student.id)==="entregado_tarde")late++;
      if(delivery && ["entregado","entregado_tarde"].includes(deliveryStatus(week,student.id)) &&
          !Array.isArray(delivery.statistics?.entries))missingStats++;
    }
  }
  if(late)result.push(notice("late:count:"+late,""+late+" entregas a destiempo",
    "Revisa el historial reciente de recepción.","info","weeks"));
  if(missingStats)result.push(notice("stats:missing:"+missingStats,""+missingStats+" registros sin jornadas",
    "Los códigos antiguos o las capturas sin estadísticas no permiten atribuir horas.","info","statistics"));
  const model=calculateDualMilestones(state);
  for(const student of model.students){
    const targets=[
      [480,"socialReached"],[840,"professionalReached"],
      [1000,"expandedReached"],[1504,"theoreticalLimitReached"]
    ];
    for(const [hours,key] of targets){
      if(!student[key])continue;
      result.push(notice("milestone:"+hours+":"+student.id,
        hours===1504?"Referencia teórica de 1,504 horas":"Hito de "+hours.toLocaleString("es-MX")+" horas",
        student.name+" alcanzó "+hours.toLocaleString("es-MX")+" horas registradas."+
          (hours===1504?" No implica un límite de captura ni acreditación automática.":""),
        "info","statistics"));
    }
    if(student.hasData&&!student.theoreticalLimitReached&&student.nextRemainingHours<=40)
      result.push(notice("milestone:near:"+student.id+":"+student.nextTargetHours,
        "Próximo hito de horas",student.name+" está a "+
        student.nextRemainingHours.toFixed(1)+" h de "+
        student.nextTargetHours.toLocaleString("es-MX")+".","info","statistics"));
  }
  const repeated=new Map();
  for(const week of state?.weeks||[])for(const [studentId,delivery] of Object.entries(week.deliveries||{})){
    const count=(delivery?.statistics?.entries||[]).filter(day=>day.status==="falta").length;
    if(count)repeated.set(studentId,(repeated.get(studentId)||0)+count);
  }
  for(const [id,total] of repeated){
    if(total<3)continue;
    const person=applicable.find(s=>s.id===id);
    if(person)result.push(notice("absence:repeat:"+id,"Faltas recurrentes",
      person.name+" acumula "+total+" jornadas registradas como falta.","followup","statistics"));
  }
  const level={urgent:0,followup:1,info:2};
  return result.sort((a,b)=>(level[a.severity]-level[b.severity])||a.title.localeCompare(b.title,"es"));
}
let audioContext=null;
export async function playInboxBell({tone="normal"}={}){
  // Opciones de prueba en Debug; la bandeja utiliza el timbre normal.
  const notes=tone==="soft"?[698]:tone==="double"?[784,1046,784,1046]:[784,1046];
  const Audio=typeof window!=="undefined"&&(window.AudioContext||window.webkitAudioContext);
  if(!Audio)return false;
  try{
    audioContext ||= new Audio();
    if(audioContext.state==="suspended")await audioContext.resume();
    if(audioContext.state!=="running")return false;
    const now=audioContext.currentTime;
    for(const [i,hz] of notes.entries()){
      const osc=audioContext.createOscillator(),gain=audioContext.createGain();
      osc.type="sine";osc.frequency.setValueAtTime(hz,now+i*.13);
      gain.gain.setValueAtTime(.0001,now+i*.13);
      gain.gain.exponentialRampToValueAtTime(tone==="soft"?.026:.06,now+i*.13+.014);
      gain.gain.exponentialRampToValueAtTime(.0001,now+i*.13+.38);
      osc.connect(gain);gain.connect(audioContext.destination);
      osc.start(now+i*.13);osc.stop(now+i*.13+.4);
    }
    return true;
  }catch{return false}
}
