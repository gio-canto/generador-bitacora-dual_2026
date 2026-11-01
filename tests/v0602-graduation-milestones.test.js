import {describe,it,expect} from "vitest";
import {
  getDefaultMessageConfig,validateMessageConfig,activeGraduation,
  eligibleMessages,markMessageSeen,hasSeenMessage
} from "../src/services/generator-message-rules.js";
import {DUAL_MILESTONES,milestoneProgress,calculateDualMilestones} from "../src/services/dual-milestones.js";
import {getRegistryNotifications,ignoreInboxNotice,visibleInboxNotices} from "../src/services/registry-notifications.js";

const storage=()=>{const items=new Map();return{
  getItem:k=>items.get(k)||null,setItem:(k,v)=>items.set(k,v),removeItem:k=>items.delete(k)
};};
const person={id:"alumno-prueba",name:"Persona de prueba",specialty:"Programación",company:"Empresa"};
const profile={school:"cbtis-134",specialty:"Programación"};
const config=getDefaultMessageConfig();
const graduation=config.events.find(x=>x.trigger.type==="graduation");
const days=["2027-07-19","2027-07-20","2027-07-21","2027-07-22","2027-07-23"];

function stateForWeeks(count){
  const weeks=Array.from({length:count},(_,index)=>{
    const date=new Date(Date.UTC(2026,0,6+7*index)).toISOString().slice(0,10);
    return {id:"week-"+index,label:"Semana "+index,startDate:date,
      dueAt:date+"T18:00:00-06:00",
      deliveries:{[person.id]:{status:"entregado",registeredAt:"2027-02-03T18:00:00Z",
        statistics:{version:5,entries:Array.from({length:4},()=>({
          status:"laboral",minutes:420,reasonCode:0}))}}}};
  });
  return {students:[person],weeks};
}
describe("v0.60.2 · calendario de graduación",()=>{
  it("valida el ejemplo configurado y limita el tema al 19–23 de julio del CBTis 134",()=>{
    expect(validateMessageConfig(config)).toEqual([]);
    expect(graduation.content.youtubeId).toBe("YUC4FH3tSOk");
    for(const day of days)
      expect(activeGraduation(config,{date:day,profile})?.id).toBe(graduation.id);
    expect(activeGraduation(config,{date:"2027-07-18",profile})).toBeNull();
    expect(activeGraduation(config,{date:"2027-07-24",profile})).toBeNull();
    expect(activeGraduation(config,{date:"2027-07-22",profile:{school:"otro",specialty:"Programación"}})).toBeNull();
  });
  it("muestra el video sólo el jueves 22 y viernes 23; recuerda cada día por separado",()=>{
    expect(days.map(date=>eligibleMessages(config,{date,profile,trigger:"graduation",ignoreSeen:true}).length))
      .toEqual([0,0,0,1,1]);
    const browser=storage(),session=storage(),ctx={profile,profileId:"alumno-1",storage:browser,
      sessionStorage:session,trigger:"graduation"};
    expect(eligibleMessages(config,{...ctx,date:"2027-07-22"})).toHaveLength(1);
    markMessageSeen(graduation,{...ctx,date:"2027-07-22"});
    expect(hasSeenMessage(graduation,{...ctx,date:"2027-07-22"})).toBe(true);
    expect(eligibleMessages(config,{...ctx,date:"2027-07-22"})).toHaveLength(0);
    expect(eligibleMessages(config,{...ctx,date:"2027-07-23"})).toHaveLength(1);
  });
  it("rechaza días fuera del periodo o repetidos",()=>{
    const invalid=structuredClone(config);
    const item=invalid.events.find(x=>x.trigger.type==="graduation");
    item.trigger.videoDates.push("2027-07-25");
    expect(validateMessageConfig(invalid).some(x=>x.includes("dentro del periodo"))).toBe(true);
    item.trigger.videoDates=["2027-07-22","2027-07-22"];
    expect(validateMessageConfig(invalid).some(x=>x.includes("únicas"))).toBe(true);
  });
});
describe("v0.60.2 · umbrales registrados",()=>{
  it("distingue 480, 840, 1,000 y 1,504 horas sin recortar el total",()=>{
    expect(DUAL_MILESTONES.expanded).toBe(1000);
    expect(DUAL_MILESTONES.theoreticalLimit).toBe(1504);
    expect(milestoneProgress(1000*60).expandedReached).toBe(true);
    expect(milestoneProgress(1000*60).theoreticalLimitReached).toBe(false);
    expect(milestoneProgress(1504*60).theoreticalLimitReached).toBe(true);
    expect(milestoneProgress(1700*60).hours).toBe(1700);
    expect(milestoneProgress(1700*60).nextTargetHours).toBe(1504);
  });
  it("cuenta alumnos y registra los cuatro avisos al superar 1,504 horas",()=>{
    const state=stateForWeeks(55);
    const model=calculateDualMilestones(state);
    expect(model.socialReached).toBe(1);
    expect(model.professionalReached).toBe(1);
    expect(model.expandedReached).toBe(1);
    expect(model.theoreticalLimitReached).toBe(1);
    const notices=getRegistryNotifications(state,{now:new Date("2028-01-10T12:00:00Z")});
    for(const hours of [480,840,1000,1504])
      expect(notices.some(x=>x.id==="milestone:"+hours+":"+person.id)).toBe(true);
    expect(notices.find(x=>x.id==="milestone:1504:"+person.id)?.description).toContain("No implica");
  });
});
describe("v0.60.2 · avisos omitidos",()=>{
  it("advierte otra vez en la semana siguiente o tras una nueva captura",()=>{
    const state={students:[person],weeks:[{
      id:"week-a",label:"Semana A",startDate:"2026-10-27",
      dueAt:"2026-10-30T18:00:00-06:00",deliveries:{}
    }]};
    const store=storage();
    const monday=new Date(2026,10,2,12),nextMonday=new Date(2026,10,9,12);
    const notices=getRegistryNotifications(state,{now:monday});
    const alert=notices.find(x=>x.id==="due:late:week-a");
    expect(alert?.severity).toBe("urgent");
    ignoreInboxNotice(store,alert,state,{now:monday});
    expect(visibleInboxNotices([alert],store,state,{now:monday})).toEqual([]);
    expect(visibleInboxNotices([alert],store,state,{now:nextMonday})).toEqual([alert]);
    const newRound=structuredClone(state);
    newRound.weeks.push({id:"week-b",label:"Semana B",startDate:"2026-11-03",deliveries:{}});
    expect(visibleInboxNotices([alert],store,newRound,{now:monday})).toEqual([alert]);
  });
  it("oculta avisos informativos sin borrar registros",()=>{
    const state=stateForWeeks(20),store=storage();
    const notice={id:"milestone:480:alumno-prueba",severity:"info"};
    ignoreInboxNotice(store,notice,state,{now:new Date(2026,10,2)});
    expect(visibleInboxNotices([notice],store,state,{now:new Date(2026,10,16)})).toEqual([]);
    expect(state.weeks).toHaveLength(20);
  });
});
