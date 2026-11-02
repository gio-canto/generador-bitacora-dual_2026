import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import published from "../src/data/generator-messages.json";
import {activeGraduation,eligibleMessages,finalBitacoraMessages,validateMessageConfig,
  markMessageSeen} from "../src/services/generator-message-rules.js";

const profile={school:"cbtis-134",specialty:"Programación",generation:"cbtis134-dual-4-2027"};
const config=structuredClone(published);
const grad=config.events.find(e=>e.trigger.type==="graduation");
const local=()=>{const data=new Map();return{
  getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)
};};

describe("0.60.7 · despedida tras la última bitácora",()=>{
  it("guarda el mensaje y activa showOn sólo después del PDF final",()=>{
    expect(grad.trigger.showOn).toBe("final-bitacora");
    expect(grad.content.body).toContain("Un año después");
    expect(grad.content.body).toContain("desgracia y alegría");
    expect(validateMessageConfig(config)).toEqual([]);
    for(const date of ["2027-07-19","2027-07-22","2027-07-23"]){
      expect(activeGraduation(config,{date,profile})?.id).toBe(grad.id);
      expect(eligibleMessages(config,{date,profile,trigger:"graduation"})).toEqual([]);
    }
    expect(eligibleMessages(config,{date:"2027-07-22",profile,trigger:"final-bitacora"})
      .map(x=>x.id)).toContain(grad.id);
  });
  it("prioriza la felicitación especial, nunca dos despedidas por un mismo PDF",()=>{
    const result=finalBitacoraMessages(config,{date:"2027-07-22",profile});
    expect(result.map(x=>x.id)).toEqual([grad.id]);
    expect(finalBitacoraMessages(config,{date:"2027-07-20",profile}).map(x=>x.id))
      .toEqual(["fin-dual"]);
    expect(finalBitacoraMessages(config,{
      date:"2027-07-22",profile:{school:"otro-plantel",specialty:"Programación"}
    }).map(x=>x.id)).toEqual(["fin-dual"]);
  });
  it("no repite el mensaje genérico si ya se vio el de graduación",()=>{
    const storage=local(),ctx={date:"2027-07-22",profile,profileId:"usuario-prueba",storage};
    expect(finalBitacoraMessages(config,ctx).map(x=>x.id)).toEqual([grad.id]);
    markMessageSeen(grad,ctx);
    expect(finalBitacoraMessages(config,ctx)).toEqual([]);
    expect(finalBitacoraMessages(config,{...ctx,date:"2027-07-23"}).map(x=>x.id))
      .toEqual([grad.id]);
  });
  it("nuevas graduaciones también esperan a que termine la última bitácora",()=>{
    const another=structuredClone(grad);
    another.id="generacion-otro-plantel-2029";
    another.audience={schools:["otro-plantel"],specialties:"all"};
    another.trigger={type:"graduation",startDate:"2029-07-10",endDate:"2029-07-16",
      videoDates:["2029-07-15"],showOn:"final-bitacora"};
    const all={...config,events:[...config.events,another]};
    expect(validateMessageConfig(all)).toEqual([]);
    expect(eligibleMessages(all,{date:"2029-07-15",profile:{school:"otro-plantel"},
      trigger:"graduation"})).toEqual([]);
    expect(finalBitacoraMessages(all,{date:"2029-07-15",profile:{school:"otro-plantel"}})
      .map(x=>x.id)).toEqual([another.id]);
  });
  it("respeta graduaciones históricas que no traen showOn",()=>{
    const historic=structuredClone(grad);
    historic.trigger.showOn=undefined;
    const historicConfig={version:1,events:[historic]};
    expect(validateMessageConfig(historicConfig)).toEqual([]);
    expect(eligibleMessages(historicConfig,{date:"2027-07-22",profile,
      trigger:"graduation"}).map(x=>x.id)).toEqual([historic.id]);
    const combined={...config,events:config.events.map(e=>
      e.trigger?.type==="graduation"?historic:e)};
    expect(finalBitacoraMessages(combined,{date:"2027-07-22",profile})).toEqual([]);
  });
  it("Debug conserva la prueba manual, nunca abre el video sólo por la fecha",()=>{
    const debug=readFileSync("src/debug-main.jsx","utf8");
    const editor=readFileSync("src/components/EventEditorDebug.jsx","utf8");
    expect(debug).toContain("Simular entrega de última bitácora");
    expect(debug).toContain('matched.trigger.showOn!=="final-bitacora"');
    expect(editor).toContain('showOn:"final-bitacora"');
    expect(editor).toContain("Después de la última bitácora");
    expect(readFileSync("src/legacy/editor.js","utf8")).toContain("bitacora-final-bitacora");
  });
});
