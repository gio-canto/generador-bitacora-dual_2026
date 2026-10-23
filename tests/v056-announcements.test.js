import {describe,it,expect} from "vitest";
import {createAnnouncement,normalizeAnnouncement,visibleAnnouncements,
 upcomingDeliveryNotices,announcedToStudent} from "../src/services/delivery-announcements.js";
import {sanitizeDeliveryState,portableDeliveryFile,createWeek,createStudent}
 from "../src/services/delivery-registry.js";
describe("v0.56 · anuncios en el registro",()=>{
 const student=createStudent({id:"A",name:"Alumno A",company:"Empresa A",specialty:"Programación"});
 it("guarda anuncios en el respaldo y conserva los datos viejos",()=>{
  const raw={students:[student],weeks:[],announcements:[{
   id:"notice1",title:"Nueva versión",message:"Conoce las mejoras",
   kind:"release",audience:"all",createdAt:"2026-10-23T12:00:00Z",
  }]};
  const saved=sanitizeDeliveryState(raw);
  expect(saved.announcements).toHaveLength(1);
  expect(portableDeliveryFile(saved).announcements[0].title).toBe("Nueva versión");
  expect(sanitizeDeliveryState({students:[student],weeks:[]}).announcements).toEqual([]);
 });
 it("rechaza avisos vacíos, limpia tipos desconocidos y textos grandes",()=>{
  expect(normalizeAnnouncement({title:"",message:""})).toBeNull();
  const item=normalizeAnnouncement({title:"x",message:"y".repeat(2000),kind:"unknown",audience:"other"});
  expect(item.kind).toBe("custom");
  expect(item.message.length).toBe(1000);
  expect(item.audience).toBe("all");
 });
 it("respeta caducidad, categorías y destinatarios",()=>{
  const notice=createAnnouncement({title:"Entrega especial",message:"Presentar bitácora",
   audience:"company",audienceId:"Empresa A",expiresAt:"2026-10-24"});
  const state={announcements:[notice,{...notice,id:"expired",expiresAt:"2026-10-01"}]};
  expect(visibleAnnouncements(state,{asOf:new Date("2026-10-23T12:00:00") })).toHaveLength(1);
  expect(announcedToStudent(notice,student)).toBe(true);
  expect(announcedToStudent(notice,{...student,company:"Empresa B"})).toBe(false);
 });
 it("agrupa únicamente fechas límite futuras en los próximos siete días",()=>{
  const now=new Date("2026-10-23T13:00:00Z");
  const make=(id,dueAt)=>createWeek({id,label:"Semana "+id,
    startDate:"2026-10-20",dueAt,endDate:"2026-10-23"});
  const weeks=[
   make("20","2026-10-26T20:00:00Z"),
   make("21","2026-10-26T20:00:00Z"),
   make("22","2026-11-30T20:00:00Z"),
   make("19","2026-10-22T20:00:00Z"),
  ];
  const messages=upcomingDeliveryNotices({weeks},{asOf:now});
  expect(messages).toHaveLength(1);
  expect(messages[0].weeks.map(w=>w.label)).toEqual(["Semana 20","Semana 21"]);
  expect(messages[0].message).toContain("Semana 20, Semana 21");
 });
});