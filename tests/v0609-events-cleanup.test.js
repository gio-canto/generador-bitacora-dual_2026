import {describe,it,expect} from "vitest";
import published from "../src/data/generator-messages.json";
import {eligibleMessages,markMessageSeen,hasSeenMessage,finalBitacoraMessages,
  historyMessages,messageEventWarnings,validateMessageConfig} from "../src/services/generator-message-rules.js";
import {enqueueEventMessages,retainEventsForContext,takeNextEvent} from "../src/services/generator-event-queue.js";

const profile={school:"cbtis-134",specialty:"Programación",generation:"cbtis134-dual-4-2027"};
const storage=()=>{const bag=new Map();return {
  getItem:key=>bag.get(key)||null,setItem:(key,value)=>bag.set(key,value)
};};
const context=(profileId,date="2027-07-22")=>({profile,profileId,date,storage:storage()});
const clone=()=>structuredClone(published);

describe("0.60.9 · depuración de eventos",()=>{
  it("conserva el esquema y prioriza graduación sólo al finalizar",()=>{
    const config=clone();
    expect(validateMessageConfig(config)).toEqual([]);
    expect(eligibleMessages(config,{...context("a"),trigger:"graduation"})).toEqual([]);
    expect(finalBitacoraMessages(config,context("a")).map(x=>x.trigger.type)).toEqual(["graduation"]);
  });
  it("rechaza prioridades y fechas incoherentes",()=>{
    const config=clone();
    config.events[0].priority=Number.NaN;
    expect(validateMessageConfig(config).join(" ")).toContain("Prioridad inválida");
    config.events[0].priority=100;
    config.events[2].trigger={type:"date",annualDate:"02-31"};
    expect(validateMessageConfig(config).join(" ")).toContain("Fecha del evento inválida");
  });
  it("elimina comunicaciones idénticas sin ocultar mensajes diferentes",()=>{
    const config=clone(),a=config.events[2];
    a.enabled=true;a.trigger={type:"date",date:"2027-07-22"};a.priority=30;
    const copy=structuredClone(a);
    copy.id="mensaje-copia";copy.priority=90;
    const another=structuredClone(a);
    another.id="otro-mensaje";another.content.title="Contenido diferente";
    config.events.push(copy,another);
    expect(messageEventWarnings(config)).toHaveLength(1);
    const result=eligibleMessages(config,{...context("a"),trigger:"date"});
    expect(result.map(x=>x.id)).toEqual(["mensaje-copia","otro-mensaje"]);
  });
  it("no ofrece la graduación en el historial antes de verla",()=>{
    const config=clone(),ctx=context("a");
    const grad=config.events.find(e=>e.trigger.type==="graduation");
    expect(historyMessages(config,ctx).map(x=>x.id)).not.toContain(grad.id);
    markMessageSeen(grad,ctx);
    expect(historyMessages(config,ctx).map(x=>x.id)).toContain(grad.id);
  });
  it("conserva la lectura del perfil original al recibir otro aviso",()=>{
    const c=context("alumno-a"),other=context("alumno-b");
    const event=clone().events[0];
    let queue=enqueueEventMessages([], [event],c,"final-bitacora");
    queue=enqueueEventMessages(queue,[event],other,"final-bitacora");
    expect(queue).toHaveLength(2);
    const {next}=takeNextEvent(queue,{profileId:"alumno-b",date:c.date});
    expect(next.ctx.profileId).toBe("alumno-a");
    markMessageSeen(next.event,next.ctx);
    expect(hasSeenMessage(event,c)).toBe(true);
    expect(hasSeenMessage(event,other)).toBe(false);
  });
  it("descarta pendientes de otro perfil pero conserva cierre final",()=>{
    const ctx=context("a");
    let queue=enqueueEventMessages([], [clone().events[2]],ctx,"date");
    queue=enqueueEventMessages(queue,[clone().events[0]],ctx,"final-bitacora");
    const keep=retainEventsForContext(queue,{profileId:"b",date:"2027-07-23"});
    expect(keep.map(x=>x.kind)).toEqual(["final-bitacora"]);
    expect(takeNextEvent(queue,{profileId:"b",date:"2027-07-23"}).next?.kind).toBe("final-bitacora");
  });
  it("evita avisos repetidos y omite los ya vistos",()=>{
    const ctx=context("a"),event=clone().events[0];
    let queue=enqueueEventMessages([], [event],ctx,"final-bitacora");
    queue=enqueueEventMessages(queue,[event],ctx,"final-bitacora");
    expect(queue).toHaveLength(1);
    expect(takeNextEvent(queue,{profileId:"a",date:ctx.date,wasSeen:()=>true}).next).toBeNull();
  });
});
