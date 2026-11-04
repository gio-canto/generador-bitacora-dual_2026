import {describe,it,expect,vi,afterEach} from "vitest";
import {waitForFinalFarewell,BEFORE_FINAL_PDF_EVENT} from "../src/services/final-pdf-flow.js";

afterEach(()=>{vi.useRealTimers();});
describe("0.60.15 · recuperación del PDF",()=>{
  it("continúa normalmente cuando no existe anfitrión",async()=>{
    await expect(waitForFinalFarewell({},()=>{},50)).resolves.toBe(false);
  });
  it("cierra la espera si el anfitrión aceptó el evento pero dejó de responder",async()=>{
    vi.useFakeTimers();
    let delayedContinuation;
    const waiting=waitForFinalFarewell({},event=>{
      expect(event.type).toBe(BEFORE_FINAL_PDF_EVENT);
      event.detail.handled=true;
      delayedContinuation=event.detail.continueToPdf;
    },30);
    await vi.advanceTimersByTimeAsync(30);
    await expect(waiting).resolves.toBe(false);
    delayedContinuation();
  });
  it("no deja temporizadores cuando la despedida se cierra correctamente",async()=>{
    vi.useFakeTimers();
    const waiting=waitForFinalFarewell({},event=>{
      event.detail.handled=true;
      event.detail.continueToPdf();
      event.detail.continueToPdf();
    },300);
    await expect(waiting).resolves.toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});
