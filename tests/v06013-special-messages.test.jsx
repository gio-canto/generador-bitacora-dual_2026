// @vitest-environment jsdom
import React from "react";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {act,cleanup,fireEvent,render,screen} from "@testing-library/react";
import {readFileSync} from "node:fs";
import {GeneratorMessageCard} from "../src/components/GeneratorMessageHost.jsx";
import GeneratorMessageHost from "../src/components/GeneratorMessageHost.jsx";
import published from "../src/data/generator-messages.json";
import {enqueueEventMessages,prioritizeFinalEvent,takeNextEvent,eventQueueKey}
 from "../src/services/generator-event-queue.js";
import {hasSeenMessage} from "../src/services/generator-message-rules.js";
import {BEFORE_FINAL_PDF_EVENT} from "../src/services/final-pdf-flow.js";

const store=()=>{const data=new Map();return {
 getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)
};};
const ctx=()=>({profileId:"alumna",date:"2027-07-22",
 profile:{school:"cbtis-134",specialty:"Programación"},storage:store(),sessionStorage:store()});
const final=published.events.find(event=>event.trigger.type==="graduation");
const tab=published.events.find(event=>event.presentation==="tab");
beforeEach(()=>{window.localStorage.clear();window.sessionStorage.clear();document.body.style.overflow="";});
afterEach(()=>{cleanup();vi.useRealTimers();vi.restoreAllMocks();document.body.style.overflow="";});

describe("0.60.13 · prioridad y lecturas",()=>{
 it("interrumpe una pestaña sin marcarla vista y la reanuda después de la despedida",()=>{
   const context=ctx(),notice={...tab,enabled:true};
   const active={event:notice,ctx:context,kind:"date"};
   const farewell={event:final,ctx:context,kind:"final-bitacora",onClose:vi.fn()};
   const queue=prioritizeFinalEvent([],active,farewell);
   expect(queue.map(item=>item.event.id)).toEqual([final.id,notice.id]);
   expect(hasSeenMessage(notice,context)).toBe(false);
   const first=takeNextEvent(queue,{profileId:"alumna",date:context.date});
   expect(first.next).toBe(farewell);
   expect(first.queue[0].kind).toBe("date");
 });
 it("evita que la misma despedida quede dos veces en la cola",()=>{
   const context=ctx(),farewell={event:final,ctx:context,kind:"final-bitacora"};
   const pending=[farewell,{event:tab,ctx:context,kind:"date"}];
   expect(prioritizeFinalEvent(pending,null,farewell)).toHaveLength(2);
   expect(eventQueueKey(prioritizeFinalEvent(pending,null,farewell)[0])).toBe(eventQueueKey(farewell));
 });
 it("conserva la selección de eventos ordinarios y su prioridad original",()=>{
   const context=ctx(),normal=[{...tab,id:"mensaje-a",priority:5},{...tab,id:"mensaje-b",priority:50}];
   const ordinary=enqueueEventMessages([],normal,context,"date");
   expect(ordinary.map(item=>item.event.id)).toEqual(["mensaje-b","mensaje-a"]);
   expect(prioritizeFinalEvent(ordinary,null,{event:final,ctx:context,kind:"final-bitacora"})
     .map(item=>item.event.id)).toEqual([final.id,"mensaje-b","mensaje-a"]);
 });
});

describe("0.60.13 · accesibilidad y presentación de avisos",()=>{
 const event={...final,content:{...final.content,youtubeId:null},presentation:"medium"};
 it("captura Escape, atrapa Tab, restaura foco y el desplazamiento",()=>{
   const trigger=document.createElement("button");trigger.textContent="Volver";
   document.body.appendChild(trigger);trigger.focus();
   const onClose=vi.fn();
   render(<GeneratorMessageCard event={event} onClose={onClose}/>);
   const dialog=screen.getByRole("dialog",{name:event.content.title});
   expect(document.activeElement).toBe(dialog);
   expect(document.body.style.overflow).toBe("hidden");
   fireEvent.keyDown(document,{key:"Tab",shiftKey:true});
   expect(document.activeElement).toBe(screen.getByRole("button",{name:"Cerrar"}));
   fireEvent.keyDown(document,{key:"Escape"});
   expect(onClose).toHaveBeenCalledOnce();
   cleanup();
   expect(document.body.style.overflow).toBe("");
   expect(document.activeElement).toBe(trigger);
   trigger.remove();
 });
 it("los avisos de pestaña no bloquean la página",()=>{
   const onClose=vi.fn();
   render(<GeneratorMessageCard event={{...event,presentation:"tab"}} onClose={onClose}/>);
   expect(screen.getByRole("status")).toBeTruthy();
   expect(document.body.style.overflow).toBe("");
   fireEvent.click(screen.getByRole("button",{name:"Cerrar mensaje"}));
   expect(onClose).toHaveBeenCalledOnce();
 });
 it("el cierre móvil ofrece continuar al PDF sin depender del video",()=>{
   render(<GeneratorMessageCard event={event} onClose={()=>{}}
     onCloseLabel="Continuar al PDF"/>);
   expect(screen.getByRole("button",{name:"Continuar al PDF"})).toBeTruthy();
 });
 it("el historial modal cierra con Escape y libera el desplazamiento",()=>{
   render(<GeneratorMessageHost/>);
   act(()=>window.dispatchEvent(new Event("bitacora-open-messages")));
   expect(screen.getByRole("dialog",{name:"Mis mensajes"})).toBeTruthy();
   expect(document.body.style.overflow).toBe("hidden");
   fireEvent.keyDown(document,{key:"Escape"});
   expect(screen.queryByRole("dialog",{name:"Mis mensajes"})).toBeNull();
   expect(document.body.style.overflow).toBe("");
 });
 it("continúa exactamente una vez después de cerrar una despedida",()=>{
   vi.useFakeTimers({toFake:["Date"]});
   vi.setSystemTime(new Date("2027-07-22T18:00:00Z"));
   render(<GeneratorMessageHost/>);
   const resume=vi.fn(),detail={school:"CBTis No. 134",specialty:"Programación",
     handled:false,continueToPdf:resume};
   act(()=>window.dispatchEvent(new CustomEvent(BEFORE_FINAL_PDF_EVENT,{detail})));
   expect(detail.handled).toBe(true);
   expect(screen.getByRole("button",{name:"Continuar al PDF"})).toBeTruthy();
   expect(resume).not.toHaveBeenCalled();
   fireEvent.click(screen.getByRole("button",{name:"Continuar al PDF"}));
   expect(resume).toHaveBeenCalledOnce();
 });
 it("CSS adapta avisos pequeños a zonas seguras y movimiento reducido",()=>{
   const css=readFileSync("src/generator-messages-v06013.css","utf8");
   expect(css).toContain("safe-area-inset-bottom");
   expect(css).toContain("prefers-reduced-motion:reduce");
   expect(css).toContain("max-height");
   const debug=readFileSync("src/components/EventEditorDebug.jsx","utf8");
   expect(debug).toContain("Orden de mensajes para este escenario");
 });
});
