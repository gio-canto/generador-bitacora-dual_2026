// @vitest-environment jsdom
import React from "react";
import {afterEach,describe,it,expect,vi} from "vitest";
import {cleanup,fireEvent,render,screen,within,waitFor} from "@testing-library/react";
import {readFileSync} from "node:fs";
import EventEditorDebug from "../src/components/EventEditorDebug.jsx";
import currentJSON from "../src/data/generator-messages.json";

afterEach(()=>{cleanup();vi.restoreAllMocks();});
const openEvent=index=>{
  const item=screen.getAllByRole("article")[index];
  fireEvent.click(within(item).getByRole("button",{name:"Modificar"}));
};
describe("v0.60.3 · editor visual y configuración real",()=>{
  it("inicia con todos los eventos del JSON publicado y conserva sus títulos",()=>{
    render(<EventEditorDebug/>);
    expect(screen.getByText(/4 eventos cargados automáticamente/)).toBeTruthy();
    for(const e of currentJSON.events)expect(screen.getByText(e.content.title)).toBeTruthy();
    expect(screen.getByText("JSON original")).toBeTruthy();
    expect(document.querySelector(".es-studio select")).toBeNull();
    expect(document.querySelector('.es-studio input[type="date"]')).toBeNull();
  });
  it("navega por siete pasos y selecciona planteles, fechas y formato con controles propios",()=>{
    render(<EventEditorDebug/>);
    openEvent(0);
    expect(screen.getByRole("heading",{name:"¿Quién recibirá el mensaje?"})).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:/Una especialidad/}));
    expect(screen.getByText("Especialidad")).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Cuándo"}));
    expect(screen.getByText("¿Cuántas veces?")).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Calendario"}));
    expect(screen.getByText("Vigente desde (opcional)")).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Mensaje"}));
    expect(screen.getByRole("button",{name:"Vista previa del mensaje"})).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Pruebas"}));
    expect(screen.getByRole("heading",{name:"Prueba tus eventos"})).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Publicar"}));
    expect(screen.getByRole("heading",{name:"Revisa y publica"})).toBeTruthy();
    expect(screen.getByText(/El commit lo haces tú en GitHub/)).toBeTruthy();
  });
  it("ensaya la graduación ya configurada sin importar ni alterar el JSON",()=>{
    render(<EventEditorDebug/>);
    const event=currentJSON.events.find(e=>e.trigger.type==="graduation");
    const row=screen.getByText(event.content.title).closest("article");
    fireEvent.click(within(row).getByRole("button",{name:"Probar"}));
    const dialog=screen.getByRole("dialog",{name:event.content.title});
    expect(within(dialog).getByTitle("Video: "+event.content.title).getAttribute("src")).toContain("YUC4FH3tSOk");
    fireEvent.click(within(dialog).getByRole("button",{name:"Cerrar mensaje"}));
    expect(screen.getByText("Fecha de prueba")).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:/Probar diseño de graduación/}));
    expect(screen.getByLabelText("Prueba del modo graduación")).toBeTruthy();
    expect(screen.getByText("JSON original")).toBeTruthy();
  });
  it("exporta el JSON completo al editar sólo un evento, sin realizar commits",async()=>{
    const writer=vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:writer}});
    render(<EventEditorDebug/>);
    openEvent(0);
    fireEvent.click(screen.getByRole("button",{name:"Mensaje"}));
    fireEvent.change(screen.getByLabelText("Título"),{target:{value:"Título modificado"}});    
    fireEvent.click(screen.getByRole("button",{name:"Publicar"}));
    fireEvent.click(screen.getByRole("button",{name:"Copiar JSON"}));
    await waitFor(()=>expect(writer).toHaveBeenCalled());
    const exported=JSON.parse(writer.mock.calls[0][0]);
    expect(exported.events).toHaveLength(currentJSON.events.length);
    expect(exported.events[0].content.title).toBe("Título modificado");
    expect(exported.events.slice(1)).toEqual(currentJSON.events.slice(1));
    expect(screen.getByText(/Sustitúyelo en GitHub y crea el commit manualmente|JSON copiado/)).toBeTruthy();
  });
});
describe("v0.60.3 · FAQ público",()=>{
  it("actualiza notas recientes conservando el historial anterior",()=>{
    const html=readFileSync("faq/index.html","utf8");
    expect(html).toContain("Versión 0.60.6");
    expect(html).toContain("0.60.5 · Felicitaciones");
    expect(html).toContain("0.60.4 · Videos");
    expect(html).toContain("0.60.3 · Editor visual");
    expect(html).toContain("0.60.2 · Graduación");
    expect(html).toContain("0.59.0 · Clasificación");
    expect(html).toContain("0.58.2-beta.1 · Hitos");
    expect(html).toContain("0.51.0-beta.1 · Estadísticas");
    expect(html).toContain("Beta 0.50.0-beta.45 · Nueva identidad");
    expect(html).toContain('id="releaseNotesTitle"');
  });
});
