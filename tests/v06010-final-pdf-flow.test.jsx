// @vitest-environment jsdom
import React from "react";
import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {act,cleanup,fireEvent,render,screen} from "@testing-library/react";
import {readFileSync} from "node:fs";
import GeneratorMessageHost from "../src/components/GeneratorMessageHost.jsx";
import {BEFORE_FINAL_PDF_EVENT,requiresFarewellBeforePdf,
  waitForFinalFarewell} from "../src/services/final-pdf-flow.js";

beforeEach(()=>{window.localStorage.clear();window.sessionStorage.clear();});
afterEach(()=>{cleanup();vi.restoreAllMocks();});

describe("v0.60.10 · orden de despedida y PDF",()=>{
  it("sólo espera el video si la bitácora es final, móvil y guardada",()=>{
    expect(requiresFarewellBeforePdf({mobile:true,final:true,saved:true})).toBe(true);
    expect(requiresFarewellBeforePdf({mobile:false,final:true,saved:true})).toBe(false);
    expect(requiresFarewellBeforePdf({mobile:true,final:false,saved:true})).toBe(false);
    expect(requiresFarewellBeforePdf({mobile:true,final:true,saved:false})).toBe(false);
  });
  it("sin anfitrión o sin despedida continúa inmediatamente",async()=>{
    const dispatch=vi.fn();
    await expect(waitForFinalFarewell({school:"otro"},dispatch)).resolves.toBe(false);
    expect(dispatch).toHaveBeenCalledOnce();
    expect(dispatch.mock.calls[0][0].type).toBe(BEFORE_FINAL_PDF_EVENT);
  });
  it("espera hasta cerrar el video y sólo reanuda una vez",async()=>{
    let continueToPdf;
    const waiting=waitForFinalFarewell({},event=>{
      event.detail.handled=true;
      continueToPdf=event.detail.continueToPdf;
    });
    const completed=vi.fn();
    waiting.then(completed);
    await Promise.resolve();
    expect(completed).not.toHaveBeenCalled();
    continueToPdf();
    continueToPdf();
    await expect(waiting).resolves.toBe(true);
    expect(completed).toHaveBeenCalledOnce();
  });
  it("el cierre de la despedida React libera la generación y no el montaje",async()=>{
    render(<GeneratorMessageHost/>);
    const resume=vi.fn();
    const detail={school:"CBTis No. 134",specialty:"Programación",continueToPdf:resume,handled:false};
    act(()=>window.dispatchEvent(new CustomEvent(BEFORE_FINAL_PDF_EVENT,{detail})));
    expect(detail.handled).toBe(true);
    expect(resume).not.toHaveBeenCalled();
    const modal=screen.getByRole("dialog",{name:/Felicidades por concluir tu formación dual/i});
    expect(modal).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Cerrar mensaje"}));
    expect(resume).toHaveBeenCalledOnce();
  });
  it("el generador difiere el lienzo en móvil y conserva la descarga de escritorio",()=>{
    const js=readFileSync("src/legacy/editor.js","utf8");
    const shell=readFileSync("src/legacy/shell.html","utf8");
    const before=js.indexOf("await waitForFinalFarewell(");
    const renderPdf=js.indexOf("const rendered = drawPdfPage(canvas, 11.81)",before);
    const deliver=js.indexOf("startMobileFinalDelivery(blob,safeFileName())",renderPdf);
    expect(before).toBeGreaterThan(0);
    expect(renderPdf).toBeGreaterThan(before);
    expect(deliver).toBeGreaterThan(renderPdf);
    expect(js).toContain("await deliverPdf(blob,safeFileName())");
    expect(js).toContain("if(!mobileFinal){");
    expect(js).toContain("pdfRequestActive=true");
    for(const id of ["finalPdfReadyDialog","finalPdfDownload","finalPdfShare"])
      expect(shell).toContain('id="'+id+'"');
  });
});
