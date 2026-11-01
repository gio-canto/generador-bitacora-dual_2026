import {describe,it,expect} from "vitest";
import {classifyReason} from "../src/services/reason-classifier.js";
import nonWorking from "../src/data/non-working-reasons.json";
import {getDefaultMessageConfig,validateMessageConfig,eligibleMessages,markMessageSeen,hasSeenMessage,mexicoDate,validSurveyUrl} from "../src/services/generator-message-rules.js";
import {getRegistryNotifications,markInboxSeen,getSeenInbox} from "../src/services/registry-notifications.js";
const fakeStorage=()=>{const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)}};
const profile={school:"cbtis-134",specialty:"Programación"};
const sample=()=>({students:[{id:"student-1",name:"Persona de prueba",specialty:"Programación",company:"Empresa de prueba"}],
  weeks:[{id:"week-1",label:"Semana de prueba",startDate:"2026-10-20",dueAt:"2026-10-23T18:00:00-06:00",
    deliveries:{}}]});
describe("v0.60 · causas de Sin labores",()=>{
  it("mantiene códigos anteriores y agrega 25–27",()=>{
    expect(nonWorking.find(r=>r.code===1)?.id).toBe("facility_maintenance");
    expect(nonWorking.find(r=>r.code===25)?.id).toBe("fumigation_sanitation");
    expect(nonWorking.find(r=>r.code===26)?.id).toBe("supervisor_absence");
    expect(nonWorking.find(r=>r.code===27)?.id).toBe("no_assigned_work");
    expect(new Set(nonWorking.map(r=>r.code)).size).toBe(nonWorking.length);
  });
  it("reconoce fumigación, suspensión, eventos y falta de responsables",()=>{
    expect(classifyReason("sin_labores","No se laboró porque fumigaron el lugar.")?.code).toBe(25);
    expect(classifyReason("sin_labores","Nos pidieron no ir a trabajar porque no habría labores.")?.code).toBe(4);
    expect(classifyReason("sin_labores","El personal asistió a un evento de la empresa.")?.code).toBe(9);
    expect(classifyReason("sin_labores","El encargado no se presentó en la empresa.")?.code).toBe(26);
    expect(classifyReason("sin_labores","No nos asignaron trabajo durante la jornada.")?.code).toBe(27);
  });
});
describe("v0.60 · eventos del generador",()=>{
  it("valida configuración de publicación",()=>{
    const c=getDefaultMessageConfig();
    expect(validateMessageConfig(c)).toEqual([]);
    c.events[1].id=c.events[0].id;
    expect(validateMessageConfig(c)).toContain("Evento 2: ID duplicado.");
  });
  it("filtra por escuela, especialidad, fecha y tipo de activación",()=>{
    const c=getDefaultMessageConfig();const e=c.events[2];
    e.enabled=true;e.trigger={type:"date",date:"2026-12-01"};
    e.audience={schools:["cbtis-134"],specialties:["Programación"]};
    const run=(date,p=profile)=>eligibleMessages(c,{trigger:"date",date,profile:p,ignoreSeen:true});
    expect(run("2026-12-01").map(x=>x.id)).toContain(e.id);
    expect(run("2026-12-02")).toEqual([]);
    expect(run("2026-12-01",{school:"otro",specialty:"Programación"})).toEqual([]);
    expect(run("2026-12-01",{school:"cbtis-134",specialty:"Contabilidad"})).toEqual([]);
    e.trigger={type:"date",annualDate:"12-01"};
    expect(run("2027-12-01").map(x=>x.id)).toContain(e.id);
  });
  it("recuerda mensajes por perfil y revisión sin repetirlos",()=>{
    const c=getDefaultMessageConfig(),e=c.events[0],storage=fakeStorage(),sessionStorage=fakeStorage();
    const ctx={trigger:"final-bitacora",date:"2026-10-31",profile,profileId:"student-x",storage,sessionStorage};
    expect(eligibleMessages(c,ctx)).toHaveLength(1);
    markMessageSeen(e,ctx);
    expect(hasSeenMessage(e,ctx)).toBe(true);
    expect(eligibleMessages(c,ctx)).toHaveLength(0);
    e.revision=2;
    expect(eligibleMessages(c,ctx)).toHaveLength(1);
    expect(validSurveyUrl("javascript:alert(1)")).toBe(false);
  });
  it("normaliza fechas en la zona de México",()=>{
    expect(mexicoDate(new Date("2026-11-01T04:30:00Z"))).toBe("2026-10-31");
  });
});
describe("v0.60 · centro administrativo de avisos",()=>{
  it("advierte una entrega vencida sin inventar datos de horas",()=>{
    const out=getRegistryNotifications(sample(),{now:new Date("2026-11-01T18:00:00Z")});
    expect(out.some(x=>x.id==="due:late:week-1"&&x.severity==="urgent")).toBe(true);
    expect(out.some(x=>x.id.startsWith("milestone:"))).toBe(false);
  });
  it("agrupa motivos sin clasificar, respaldo y conserva memoria de lectura",()=>{
    const state=sample();
    state.weeks[0].deliveries["student-1"]={status:"entregado",registeredAt:"2026-10-23T13:00:00Z",statistics:{version:5,entries:[
      {status:"falta",minutes:0,reasonCode:63},{status:"laboral",minutes:240,reasonCode:0},
      {status:"sin_labores",minutes:0,reasonCode:63},{status:"inhabil",minutes:0,reasonCode:0}
    ]}};
    const notices=getRegistryNotifications(state,{now:new Date("2026-11-01"),backupPending:true});
    expect(notices.some(x=>x.action==="reasons"&&x.count===2)).toBe(true);
    expect(notices.some(x=>x.action==="backup")).toBe(true);
    const storage=fakeStorage();markInboxSeen(storage,notices);
    expect(getSeenInbox(storage)["reasons:pending"]).toBeTruthy();
  });
});
