/**
 * Recordatorios discretos de respaldo para el Registro Dual (local-first).
 * Las fechas se guardan solo en el navegador, no en el archivo de alumnos.
 * No se solicitan permisos de notificaciones ni se muestra nada al capturar.
 */
export const BACKUP_REMINDER_KEY="registro-dual-backup-reminder-v1";
export const BACKUP_DAY=24*60*60*1000;
const parseTime=value=>{
 const t=Number(value);
 return Number.isFinite(t)&&t>0?t:0;
};
export const hasRegistryContent=state=>Boolean(
 state&&(state.students?.length||state.weeks?.length||state.announcements?.length)
);
export function readBackupReminder(storage){
 try{
   const raw=JSON.parse(storage?.getItem(BACKUP_REMINDER_KEY)||"{}");
   return {
     firstSeenAt:parseTime(raw.firstSeenAt),
     lastBackupAt:parseTime(raw.lastBackupAt),
     lastPromptAt:parseTime(raw.lastPromptAt),
     snoozedUntil:parseTime(raw.snoozedUntil),
   };
 }catch{return {firstSeenAt:0,lastBackupAt:0,lastPromptAt:0,snoozedUntil:0};}
}
export function writeBackupReminder(storage,meta){
 try{storage?.setItem(BACKUP_REMINDER_KEY,JSON.stringify(meta));}catch{/* almacenamiento opcional */}
 return meta;
}
export function observeBackupActivity(storage,state,now=Date.now()){
 const meta=readBackupReminder(storage);
 if(!hasRegistryContent(state)||meta.firstSeenAt)return meta;
 return writeBackupReminder(storage,{...meta,firstSeenAt:now});
}
export function shouldRemindBackup(state,meta,now=Date.now()){
 if(!hasRegistryContent(state)||!meta?.firstSeenAt)return false;
 const modified=Date.parse(state.updatedAt||"");
 if(!Number.isFinite(modified)||modified<=0)return false;
 if(now-meta.firstSeenAt<BACKUP_DAY)return false;
 if(now-modified<30*60*1000)return false; // no interrumpir una sesión de captura
 if(meta.snoozedUntil>now)return false;
 if(meta.lastPromptAt&&now-meta.lastPromptAt<3*BACKUP_DAY)return false;
 if(meta.lastBackupAt){
   if(modified<=meta.lastBackupAt)return false; // no hay cambios sin respaldar
   if(now-meta.lastBackupAt<3*BACKUP_DAY)return false;
 }
 return true;
}
export function acknowledgeBackupReminder(storage,kind,now=Date.now()){
 const meta=readBackupReminder(storage);
 const next=kind==="saved"
   ? {...meta,lastBackupAt:now,lastPromptAt:0,snoozedUntil:0}
   : kind==="shown"
     ? {...meta,lastPromptAt:now}
     : {...meta,lastPromptAt:now,snoozedUntil:now+2*BACKUP_DAY};
 return writeBackupReminder(storage,next);
}
