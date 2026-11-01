// @vitest-environment jsdom
import React from "react";
import {afterEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import EventEditorDebug from "../src/components/EventEditorDebug.jsx";
import {GeneratorMessageCard} from "../src/components/GeneratorMessageHost.jsx";
import {getDefaultMessageConfig,eligibleMessages} from "../src/services/generator-message-rules.js";

afterEach(()=>cleanup());

describe("0.60.1 · editor por pasos",()=>{
  it("muestra únicamente los datos del paso actual y permite avanzar",()=>{
    render(<EventEditorDebug/>);
    expect(screen.getByRole("heading",{name:"Elige un evento"})).toBeTruthy();
    expect(screen.queryByLabelText("Título")).toBeNull();
    fireEvent.click(screen.getByRole("button",{name:/Destinatarios/}));
    expect(screen.getByRole("heading",{name:"¿Quién recibirá el mensaje?"})).toBeTruthy();
    expect(screen.getByRole("button",{name:/Todos los alumnos Dual/})).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:/Una especialidad/}));
    expect(screen.getByText("Especialidad")).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:/Cuándo/}));
    expect(screen.getByText("¿Cuántas veces?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:/Mensaje/}));
    expect(screen.getByRole("button",{name:"Vista previa del mensaje"})).toBeTruthy();
  });
  it("filtra por especialidad en todos los planteles, incluso en uno nuevo",()=>{
    const config=getDefaultMessageConfig();
    config.events[1].enabled=true;
    config.events[1].audience={schools:"all",specialties:["Programación"]};
    const run=profile=>eligibleMessages(config,{trigger:"on-open",profile,date:"2026-11-05",ignoreSeen:true});
    expect(run({school:"plantel-hipotetico",specialty:"Programación"}).map(x=>x.id)).toContain("encuesta-uso");
    expect(run({school:"plantel-hipotetico",specialty:"Contabilidad"})).toEqual([]);
  });
});

describe("0.60.1 · reproductor",()=>{
  it("inserta YouTube inmediatamente con autoplay silenciado",()=>{
    const event={id:"video-prueba",revision:1,presentation:"fullscreen",content:{
      title:"Aviso de prueba",body:"Contenido",youtubeId:"ABCDEFGHIjk",action:null
    }};
    const onClose=vi.fn();
    render(<GeneratorMessageCard event={event} onClose={onClose}/>);
    const frame=screen.getByTitle("Video: Aviso de prueba");
    expect(frame.getAttribute("src")).toContain("youtube-nocookie.com/embed/ABCDEFGHIjk");
    expect(frame.getAttribute("src")).toContain("autoplay=1");
    expect(frame.getAttribute("src")).toContain("mute=1");
    fireEvent.click(screen.getByRole("button",{name:"Cerrar mensaje"}));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
