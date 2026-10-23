const str=(v,max=240)=>String(v??"").trim().slice(0,max);
const categories=["custom","release"];
const audienceTypes=["all","company","specialty","student"];
const id=()=>globalThis.crypto?.randomUUID?.()||"notice-"+Date.now()+"-"+Math.random().toString(36).slice(2);
export function normalizeAnnouncement(raw){
  if(!raw||typeof raw!=="object")return null;
  const title=str(raw.title,120),message=str(raw.message,1000);
  if(!title||!message)return null;
  return {id:str(raw.id,90)||id(),kind:categories.includes(raw.kind)?raw.kind:"custom",
    title,message,audience:audienceTypes.includes(raw.audience)?raw.audience:"all",
    audienceId:str(raw.audienceId,180),
    expiresAt:/^\d{4}-\d{2}-\d{2}$/.test(raw.expiresAt||"")?raw.expiresAt:"",
    createdAt:str(raw.createdAt,40)||new Date().toISOString(),
    enabled:raw.enabled!==false};
}
export function createAnnouncement(input){return normalizeAnnouncement({...input,id:id(),createdAt:new Date().toISOString()});}
export function announcedToStudent(item,student){
 if(!item||!student)return false;
 if(item.audience==="all")return true;
 return item.audience==="company"?student.company===item.audienceId:
   item.audience==="specialty"?student.specialty===item.audienceId:
   item.audience==="student"?student.id===item.audienceId:false;
}
export function visibleAnnouncements(state,{asOf=new Date(),student=null}={}){
 const local=asOf instanceof Date?asOf:new Date(asOf);
 const day=[local.getFullYear(),String(local.getMonth()+1).padStart(2,"0"),
   String(local.getDate()).padStart(2,"0")].join("-");
 return (state.announcements||[]).map(normalizeAnnouncement).filter(Boolean)
  .filter(a=>a.enabled&&(!a.expiresAt||a.expiresAt>=day)&&
    (!student||announcedToStudent(a,student)))
  .sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
}
export function upcomingDeliveryNotices(state,{asOf=new Date(),withinDays=7}={}){
 const now=asOf instanceof Date?asOf:new Date(asOf);
 if(!Number.isFinite(now.getTime()))return [];
 const candidates=(state.weeks||[]).filter(w=>{
   if(!w.dueAt||w.closedAt||new Date(w.dueAt).getTime()<=now.getTime())return false;
   const date=new Date(w.dueAt);
   return Number.isFinite(date.getTime())&&date.getTime()>=now.getTime()&&
      date.getTime()-now.getTime()<=withinDays*86400000;
 }).sort((a,b)=>a.dueAt.localeCompare(b.dueAt));
 const groups=new Map();
 for(const week of candidates){
   const key=week.dueAt;
   if(!groups.has(key))groups.set(key,[]);
   groups.get(key).push(week);
 }
 return [...groups.entries()].map(([dueAt,weeks])=>({
   id:"due-"+dueAt,kind:"reminder",title:"Próxima fecha de entrega",
   audience:"all",audienceId:"",expiresAt:"",
   dueAt,weeks:weeks.map(w=>({id:w.id,label:w.label})),
   message:"Recuerda entregar "+weeks.map(w=>w.label).join(", ")+
     (weeks.length===1?" antes del ":" antes del ")+
     new Date(dueAt).toLocaleString("es-MX",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"})+"."
 }));
}
export function announcementOverview(state,options={}){
 return {notices:visibleAnnouncements(state,options),
   deadlines:upcomingDeliveryNotices(state,options)};
}
