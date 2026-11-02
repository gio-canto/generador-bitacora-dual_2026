// @vitest-environment jsdom
import React from "react";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,waitFor,within} from "@testing-library/react";
import {createCanvas} from "@napi-rs/canvas";
import {diagnoseMessageEvent} from "../src/services/message-event-diagnostics.js";
import {markMessageSeen} from "../src/services/generator-message-rules.js";
import published from "../src/data/generator-messages.json";
import {NOTICE_FORMATS,downloadNoticeBatch,noticeBatchStyle}
  from "../src/services/notice-png.js";
import DeliveryAnnouncements from "../src/components/DeliveryAnnouncements.jsx";
import DebugNoticeLab from "../src/components/DebugNoticeLab.jsx";

vi.mock("../src/services/student-dossier-report.js",()=>({
 loadDossierLogo:vi.fn(async()=>({width:100,height:42}))
}));
vi.mock("../src/services/notice-png.js",async original=>{
 const core=await original();
 return {...core,
   drawNoticeCanvas:vi.fn((canvas,notice,{format}={})=>{
     if(notice.message?.length>2000)throw Error("El título o el mensaje es demasiado largo para este formato.");
     canvas.width=1080;canvas.height=format==="story"?1920:format==="square"?1080:1350;
   }),
   downloadNoticePng:vi.fn(async()=>({filename:"aviso-prueba.png"})),
   downloadNoticeBatch:vi.fn(async items=>({count:items.length,filename:"avisos.zip"}))
 };
});
const makeStorage=()=>{const m=new Map();return {
 getItem:key=>m.get(key)||null,setItem:(key,v)=>m.set(key,v)
};};
beforeEach(()=>{vi.clearAllMocks();});
afterEach(()=>{cleanup();});

describe("0.60.12 · diagnóstico aislado",()=>{
 it("explica eventos desactivados, fechas, público, repetición y disparadores",()=>{
   const grad=published.events.find(e=>e.trigger.type==="graduation");
   const context={trigger:"final-bitacora",date:"2027-07-22",
     profile:{school:"cbtis-134",specialty:"Programación"},
     profileId:"prueba",storage:makeStorage()};
   expect(diagnoseMessageEvent(published,grad,context)).toEqual({eligible:true,reasons:[]});
   expect(diagnoseMessageEvent(published,grad,{...context,profile:{school:"otro",specialty:"Programación"}})
     .reasons.join(" ")).toMatch(/plantel/);
   expect(diagnoseMessageEvent(published,grad,{...context,date:"2027-07-20"})
     .reasons.join(" ")).toMatch(/día de video/);
   expect(diagnoseMessageEvent(published,grad,{...context,trigger:"on-open"})
     .reasons.join(" ")).toMatch(/disparador/);
   const disabled={...published,events:published.events.map(e=>e.id===grad.id?{...e,enabled:false}:e)};
   expect(diagnoseMessageEvent(disabled,disabled.events.at(-1),context)
     .reasons.join(" ")).toMatch(/desactivado/);
   markMessageSeen(grad,context);
   expect(diagnoseMessageEvent(published,grad,context).reasons.join(" "))
     .toMatch(/ya vio/);
 });
 it("mantiene formato y estilo de cada aviso guardado",()=>{
   const saved={format:"square",theme:"night"};
   expect(noticeBatchStyle(saved,{format:"post",theme:"warm",preserveItemStyle:true}))
     .toEqual({format:"square",theme:"night"});
   expect(noticeBatchStyle(saved,{format:"story",theme:"warm"}))
     .toEqual({format:"story",theme:"warm"});
   expect(noticeBatchStyle({format:"otro",theme:"x"},{preserveItemStyle:true}))
     .toEqual({format:"post",theme:"editorial"});
 });
});

describe("0.60.12 · avisos PNG guardados",()=>{
 const saved=[
 {id:"a",kind:"custom",title:"Aviso A",message:"Entrega documento A",format:"square",theme:"night",createdAt:"2026-11-01T12:00:00Z"},
 {id:"b",kind:"custom",title:"Aviso B",message:"Entrega documento B",format:"post",theme:"editorial",createdAt:"2026-10-31T12:00:00Z"},
 {id:"c",kind:"custom",title:"Aviso C",message:"Entrega documento C",format:"story",theme:"warm",createdAt:"2026-10-30T12:00:00Z"}
 ];
 it("permite elegir sólo los avisos necesarios para ZIP y conserva estilos individuales",async()=>{
   const {downloadNoticeBatch:zip}=await import("../src/services/notice-png.js");
   render(<DeliveryAnnouncements state={{students:[],weeks:[],announcements:saved}}
     onSave={vi.fn()} onBack={vi.fn()}/>);
   fireEvent.click(screen.getByLabelText("Seleccionar aviso Aviso A"));
   fireEvent.click(screen.getByLabelText("Seleccionar aviso Aviso C"));
   fireEvent.click(screen.getByRole("button",{name:"Descargar seleccionados · ZIP (2)"}));
   await waitFor(()=>expect(zip).toHaveBeenCalled());
   const [items,opts]=zip.mock.calls.at(-1);
   expect(items.map(item=>item.title)).toEqual(["Aviso A","Aviso C"]);
   expect(opts.preserveItemStyle).toBe(true);
 });
 it("Debug muestra la vista previa real, cambia formatos y explica desbordamiento",async()=>{
   render(<DebugNoticeLab/>);
   await waitFor(()=>expect(screen.getByText(/PNG válido/)).toBeTruthy());
   fireEvent.change(screen.getByLabelText("Formato de prueba"),{target:{value:"story"}});
   await waitFor(()=>expect(screen.getByText(/1080 × 1920 px/)).toBeTruthy());
   fireEvent.change(screen.getByLabelText("Escenario PNG"),{target:{value:"overflow"}});
   await waitFor(()=>expect(screen.getByRole("alert").textContent).toContain("demasiado largo"));
   expect(screen.getByRole("button",{name:"Descargar PNG de prueba"}).disabled).toBe(true);
 });
});
