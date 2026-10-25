import {describe,it,expect} from "vitest";
import {BACKUP_DAY,BACKUP_REMINDER_KEY,observeBackupActivity,
  shouldRemindBackup,acknowledgeBackupReminder,readBackupReminder
} from "../src/services/backup-reminder.js";
const now=Date.parse("2026-10-25T12:00:00.000Z");
const data=(updatedAt=now-45*60*1000)=>({
  students:[{id:"a"}],weeks:[{id:"w"}],updatedAt:new Date(updatedAt).toISOString()
});
function memory(){
 const store=new Map();
 return {getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),
  get raw(){return store}};
}
describe("Recordatorios de respaldo poco frecuentes y locales",()=>{
 it("no alerta sin datos ni al comenzar, ni durante capturas recientes",()=>{
   const storage=memory();
   expect(shouldRemindBackup({students:[],weeks:[],updatedAt:new Date(now).toISOString()},
     {firstSeenAt:now-4*BACKUP_DAY},now)).toBe(false);
   let meta=observeBackupActivity(storage,data(),now);
   expect(meta.firstSeenAt).toBe(now);
   expect(shouldRemindBackup(data(),meta,now)).toBe(false);
   meta={...meta,firstSeenAt:now-2*BACKUP_DAY};
   expect(shouldRemindBackup(data(now-5*60*1000),meta,now)).toBe(false);
   expect(shouldRemindBackup(data(),meta,now)).toBe(true);
 });
 it("tras respaldar solo recuerda si hay cambios nuevos y pasan al menos 3 días",()=>{
   const storage=memory();
   observeBackupActivity(storage,data(),now-6*BACKUP_DAY);
   acknowledgeBackupReminder(storage,"saved",now-4*BACKUP_DAY);
   let meta=readBackupReminder(storage);
   expect(meta.lastBackupAt).toBe(now-4*BACKUP_DAY);
   expect(shouldRemindBackup(data(now-5*BACKUP_DAY),meta,now)).toBe(false);
   expect(shouldRemindBackup(data(),meta,now)).toBe(true);
   acknowledgeBackupReminder(storage,"shown",now);
   meta=readBackupReminder(storage);
   expect(shouldRemindBackup(data(),meta,now+BACKUP_DAY)).toBe(false);
   expect(shouldRemindBackup(data(),meta,now+4*BACKUP_DAY)).toBe(true);
 });
 it("Recordar después pospone 48 horas y un respaldo reinicia el recordatorio",()=>{
   const storage=memory();
   const meta=observeBackupActivity(storage,data(),now-2*BACKUP_DAY);
   expect(shouldRemindBackup(data(),meta,now)).toBe(true);
   acknowledgeBackupReminder(storage,"later",now);
   expect(shouldRemindBackup(data(),readBackupReminder(storage),now+BACKUP_DAY)).toBe(false);
   const later=readBackupReminder(storage);
   expect(later.snoozedUntil).toBe(now+2*BACKUP_DAY);
   acknowledgeBackupReminder(storage,"saved",now+3*BACKUP_DAY);
   const saved=readBackupReminder(storage);
   expect(saved.snoozedUntil).toBe(0);
   expect(shouldRemindBackup(data(),saved,now+8*BACKUP_DAY)).toBe(false);
 });
 it("metadatos corruptos o almacenamiento no disponible no bloquean Registro Dual",()=>{
   const storage={getItem(){return "{invalid";},setItem(){throw Error("denied")}};
   expect(readBackupReminder(storage).lastBackupAt).toBe(0);
   expect(observeBackupActivity(storage,data(),now).firstSeenAt).toBe(now);
   expect(acknowledgeBackupReminder(storage,"saved",now).lastBackupAt).toBe(now);
 });
});
