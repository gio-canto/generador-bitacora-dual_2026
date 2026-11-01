// @vitest-environment jsdom
import React from "react";
import {readFileSync} from "node:fs";
import {afterEach,describe,expect,it,vi} from "vitest";
import {act,cleanup,fireEvent,render,screen} from "@testing-library/react";
import config from "../src/data/generator-messages.json";
import {eligibleMessages,validateMessageConfig} from "../src/services/generator-message-rules.js";
import {GeneratorMessageCard} from "../src/components/GeneratorMessageHost.jsx";
import {youtubeCelebrationUrl,requestYoutubeAudio,sendYoutubeCommand} from "../src/services/youtube-celebration.js";

afterEach(()=>{cleanup();vi.useRealTimers();vi.restoreAllMocks();});
const generic=config.events.find(e=>e.id==="fin-dual");
const graduation=config.events.find(e=>e.trigger.type==="graduation");

describe("0.60.5 · despedida compartida",()=>{
  it("mantiene disparadores independientes con mismos atributos de celebración",()=>{
    expect(validateMessageConfig(config)).toEqual([]);
    expect(generic.trigger.type).toBe("final-bitacora");
    expect(graduation.trigger.type).toBe("graduation");
    expect(generic.celebration).toEqual(graduation.celebration);
    expect(generic.content.youtubeId).toBe("YUC4FH3tSOk");
    expect(graduation.content.youtubeId).toBe(generic.content.youtubeId);
    expect(generic.content.body).toContain("última bitácora");
    expect(graduation.content.body).toContain("la última vez que nos veremos");
    const byGraduation=eligibleMessages(config,{trigger:"final-bitacora",
      date:"2027-07-22",profile:{school:"cbtis-134",specialty:"Programación"},ignoreSeen:true})
      .filter(x=>x.trigger.type==="graduation");
    const byFinal=eligibleMessages(config,{trigger:"final-bitacora",
      date:"2027-05-20",profile:{school:"otro",specialty:"Programación"},ignoreSeen:true});
    expect(byGraduation.map(x=>x.id)).toEqual([graduation.id]);
    expect(byFinal.map(x=>x.id)).toEqual([generic.id]);
  });
  it("ambos mensajes tienen diseño unificado y bucle hasta el cierre",()=>{
    for(const event of [generic,graduation]){
      const close=vi.fn();
      const {unmount}=render(<GeneratorMessageCard event={event} onClose={close}/>);
      const modal=screen.getByRole("dialog");
      expect(modal.parentElement.className).toContain("generator-message-graduation");
      const url=screen.getByTitle("Video: "+event.content.title).getAttribute("src");
      expect(url).toContain("autoplay=1");
      expect(url).toContain("mute=1");
      expect(url).toContain("loop=1");
      expect(url).toContain("playlist=YUC4FH3tSOk");
      expect(screen.queryByText("El video inicia sin sonido.")).toBeNull();
      expect(screen.getByRole("button",{name:"Activar audio"})).toBeTruthy();
      fireEvent.click(screen.getByRole("button",{name:"Cerrar mensaje"}));
      expect(close).toHaveBeenCalledOnce();
      unmount();
    }
  });
});
describe("0.60.5 · audio y reproductor",()=>{
  it("rechaza IDs incorrectos y habilita el loop sólo con un video válido",()=>{
    expect(youtubeCelebrationUrl("<bad>")).toBe("");
    expect(youtubeCelebrationUrl("YUC4FH3tSOk",{loop:true}))
      .toContain("loop=1&playlist=YUC4FH3tSOk");
  });
  it("solicita audio al 90 por la API sin necesitar el botón, si el reproductor carga",()=>{
    vi.useFakeTimers();
    const {unmount}=render(<GeneratorMessageCard event={graduation} onClose={()=>{}}/>);
    const iframe=screen.getByTitle("Video: "+graduation.content.title);
    const spy=vi.spyOn(iframe.contentWindow,"postMessage");
    fireEvent.load(iframe);
    act(()=>{vi.advanceTimersByTime(300);});
    const requests=spy.mock.calls.map(([data])=>JSON.parse(data));
    expect(requests).toContainEqual({event:"command",func:"setVolume",args:[90]});
    expect(requests).toContainEqual({event:"command",func:"unMute",args:[]});
    act(()=>{vi.runOnlyPendingTimers();});
    unmount();
  });
  it("conserva un botón manual para navegadores que bloquean autoplay con sonido",()=>{
    const send=vi.fn(),fake={contentWindow:{postMessage:send}};
    expect(requestYoutubeAudio(fake)).toBe(true);
    expect(send.mock.calls.map(([raw])=>JSON.parse(raw).func)).toEqual(["setVolume","unMute"]);
    expect(sendYoutubeCommand(null,"mute")).toBe(false);
  });
});
describe("0.60.5 · Debug como efemérides",()=>{
  it("aplica el tema de graduación a toda la página desde Efemérides, sin panel especial",()=>{
    const src=readFileSync("src/debug-main.jsx","utf8");
    expect(src).toContain('classList.toggle("debug-graduation-preview"');
    expect(src).toContain("graduationPreviewForDate(eventConfig,eventId,value)");
    expect(src).toContain("graduationPreviewDates(event)");
    expect(src).toContain('matched.trigger.showOn!=="final-bitacora"?matched:null');
    expect(src).toContain('document.body.classList.remove("debug-graduation-preview")');
    expect(src).not.toContain("debug-graduation-controls");
    expect(src).not.toContain("debug-graduation-stage");
    expect(src).not.toContain("CBTis 134");
    expect(src).not.toContain("Probar tema de graduación");
  });
});
