import {describe,it,expect} from "vitest";
import published from "../src/data/generator-messages.json";
import {activeGraduation,eligibleMessages,finalBitacoraMessages,
  validateMessageConfig,messageEventWarnings,markMessageSeen} from "../src/services/generator-message-rules.js";
import {diagnoseMessageEvent} from "../src/services/message-event-diagnostics.js";

const base=()=>structuredClone(published);
const profile={school:"cbtis-134",specialty:"Programación"};
const store=()=>{const bag=new Map();return{
  getItem:key=>bag.get(key)||null,
  setItem:(key,value)=>bag.set(key,value)
};};
const context=(date="2027-07-22")=>({
  date,profile,profileId:"alumno-de-prueba",storage:store()
});

describe("0.60.15 · aislamiento y compatibilidad del motor de eventos",()=>{
  it("un aviso inválido no desactiva la graduación programada",()=>{
    const config=base();
    config.events[1].enabled=true;
    config.events[1].content.title="";
    expect(validateMessageConfig(config)).not.toEqual([]);
    const ctx=context();
    expect(activeGraduation(config,ctx)?.id).toBe("graduacion-cbtis134-dual-generacion4-2027");
    expect(finalBitacoraMessages(config,ctx).map(e=>e.id))
      .toEqual(["graduacion-cbtis134-dual-generacion4-2027"]);
    expect(eligibleMessages(config,{...ctx,trigger:"on-open"})).toEqual([]);
    expect(diagnoseMessageEvent(config,config.events[3],
      {...ctx,trigger:"final-bitacora"}).eligible).toBe(true);
    expect(diagnoseMessageEvent(config,config.events[1],
      {...ctx,trigger:"on-open"}).reasons).toContain("Este evento tiene errores de validación.");
  });
  it("un ID duplicado se omite sin perder la entrada original",()=>{
    const config=base();
    const copied=structuredClone(config.events[3]);
    copied.content.title="Copia incorrecta";
    copied.priority=500;
    config.events.push(copied);
    expect(validateMessageConfig(config).join(" ")).toContain("ID duplicado");
    expect(finalBitacoraMessages(config,context()).map(e=>e.content.title))
      .toEqual([config.events[3].content.title]);
    expect(messageEventWarnings(config)).toEqual([]);
  });
  it("la programación institucional no exige una marca de última bitácora",()=>{
    const config=base();
    const ctx=context();
    expect(finalBitacoraMessages(config,ctx)).toHaveLength(1);
    expect(finalBitacoraMessages(config,{...ctx,date:"2027-07-20"})).toEqual([]);
    expect(finalBitacoraMessages(config,{...ctx,profile:{...profile,school:"otro"}}))
      .toEqual([]);
    markMessageSeen(config.events[3],ctx);
    expect(finalBitacoraMessages(config,ctx)).toEqual([]);
    expect(finalBitacoraMessages(config,{...ctx,date:"2027-07-23"})).toHaveLength(1);
  });
  it("rechaza formatos de configuración ajenos",()=>{
    expect(eligibleMessages({version:2,events:base().events},{
      ...context(),trigger:"final-bitacora"
    })).toEqual([]);
  });
});
