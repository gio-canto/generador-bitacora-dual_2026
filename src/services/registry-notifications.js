import {deliveryStatus,studentAppliesToWeek,studentIsActive,weekSummary} from "./delivery-registry.js";
import {calculateDualMilestones} from "./dual-milestones.js";
import {pendingReasonReviews} from "./reason-reviews.js";

export const INBOX_SEEN_KEY="bitacora-dual-inbox-seen-v1";
export const INBOX_SOUND_KEY="bitacora-dual-inbox-sound-v1";
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
    if(student.professionalReached)result.push(notice("milestone:840:"+student.id,
      "Hito de 840 horas",student.name+" alcanzó 840 horas registradas.","info","statistics"));
    else if(student.socialReached)result.push(notice("milestone:480:"+student.id,
      "Hito de 480 horas",student.name+" alcanzó 480 horas registradas.","info","statistics"));
    else if(student.hasData && student.socialRemainingHours<=40)
      result.push(notice("milestone:near:"+student.id,"Próximo hito de horas",
        student.name+" está a "+student.socialRemainingHours.toFixed(1)+" h de 480.","info","statistics"));
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
export async function playInboxBell(){
  const Audio=typeof window!=="undefined"&&(window.AudioContext||window.webkitAudioContext);
  if(!Audio)return false;
  try{
    audioContext ||= new Audio();
    if(audioContext.state==="suspended")await audioContext.resume();
    if(audioContext.state!=="running")return false;
    const now=audioContext.currentTime;
    for(const [i,hz] of [784,1046].entries()){
      const osc=audioContext.createOscillator(),gain=audioContext.createGain();
      osc.type="sine";osc.frequency.setValueAtTime(hz,now+i*.13);
      gain.gain.setValueAtTime(.0001,now+i*.13);
      gain.gain.exponentialRampToValueAtTime(.06,now+i*.13+.014);
      gain.gain.exponentialRampToValueAtTime(.0001,now+i*.13+.38);
      osc.connect(gain);gain.connect(audioContext.destination);
      osc.start(now+i*.13);osc.stop(now+i*.13+.4);
    }
    return true;
  }catch{return false}
}
