// @vitest-environment jsdom
import React from "react";
import {readFileSync} from "node:fs";
import {afterEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import {GeneratorMessageCard} from "../src/components/GeneratorMessageHost.jsx";
import eventConfig from "../src/data/generator-messages.json";

afterEach(()=>{cleanup();vi.restoreAllMocks();});
const event=eventConfig.events.find(x=>x.trigger.type==="graduation");

describe("v0.60.4 · reproductor y modal de graduación",()=>{
  it("inicia automáticamente y silenciado, con API para audio tras interacción",()=>{
    const onClose=vi.fn();
    render(<GeneratorMessageCard event={event} onClose={onClose}/>);
    const iframe=screen.getByTitle("Video: "+event.content.title);
    const src=iframe.getAttribute("src");
    expect(src).toContain("autoplay=1");
    expect(src).toContain("mute=1");
    expect(src).toContain("enablejsapi=1");
    expect(src).toContain("loop=1");
    expect(src).toContain("playlist=YUC4FH3tSOk");
    expect(screen.queryByText("El video inicia sin sonido.")).toBeNull();
    expect(screen.getByRole("button",{name:"Activar audio"})).toBeTruthy();
    expect(screen.getByRole("button",{name:"Cerrar mensaje"})).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Cerrar mensaje"}));
    expect(onClose).toHaveBeenCalledOnce();
  });
  it("evita desbordamiento horizontal en el CSS del modal a cualquier ancho",()=>{
    const css=readFileSync("src/generator-messages.css","utf8");
    expect(css).toContain("overflow-x:hidden");
    expect(css).toContain("max-width:calc(100vw - 24px)");
    expect(css).toContain(".generator-message-media-controls");
    expect(css).toContain("box-sizing:border-box");
  });
  it("conserva el tema y componentes originales del generador",()=>{
    const css=readFileSync("src/generator-graduation.css","utf8");
    expect(css).toContain(".generator-graduation-active .shell");
    expect(css).toContain(".gm-bottom-nav");
    expect(css).toContain(".gm-panel");
    expect(css).toContain("prefers-reduced-motion");
  });
});

describe("v0.60.4 · Vista adaptable de Debug",()=>{
  const source=readFileSync("src/debug-main.jsx","utf8");
  it("permite lanzar los escenarios gráficos desde el marco",()=>{
    for(const scene of ["messages","editor","calendar","notifications","inbox","bell","pdf","camera"])
      expect(source).toContain('<option value="'+scene+'">');
    expect(source).toContain('<option value="./">Debug completo</option>');
    expect(source).toContain('debug-scene=');
    expect(source).toContain('nestedPreview');
    expect(source).not.toContain('<option value="graduation">');
    expect(source).not.toContain('onClick={()=>{setIframePage("./");setIframeScene("graduation");}}');
  });
  it("usa el aviso real y el video de graduación configurados en el JSON",()=>{
    expect(source).toContain("GeneratorMessageCard");
    expect(source).toContain('eventConfig.events.filter(event=>event.trigger?.type==="graduation")');
    expect(source).toContain("setAdaptivePreview(event)");
    expect(event.content.youtubeId).toBe("YUC4FH3tSOk");
  });
});
