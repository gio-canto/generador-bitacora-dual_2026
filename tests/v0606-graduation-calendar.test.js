import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import published from "../src/data/generator-messages.json";
import {graduationPreviewForDate,graduationPreviewDates} from "../src/services/debug-graduation.js";

const existing=published.events.find(x=>x.trigger.type==="graduation");
describe("0.60.6 · graduación como efeméride de página completa",()=>{
  it("obtiene las fechas desde el JSON, no desde un plantel o año fijo",()=>{
    expect(graduationPreviewDates(existing)).toEqual([
      "2027-07-19","2027-07-22","2027-07-23"
    ]);
    expect(graduationPreviewForDate(published,existing.id,"2027-07-19")?.id).toBe(existing.id);
    expect(graduationPreviewForDate(published,existing.id,"2027-07-22")?.id).toBe(existing.id);
    expect(graduationPreviewForDate(published,existing.id,"2027-07-23")?.id).toBe(existing.id);
    expect(graduationPreviewForDate(published,existing.id,"2027-07-18")).toBeNull();
    expect(graduationPreviewForDate(published,existing.id,"2027-07-24")).toBeNull();
  });
  it("permite simular otra generación, otro plantel y un borrador desactivado",()=>{
    const another=structuredClone(existing);
    another.id="graduacion-plantel-nuevo-2028";
    another.enabled=false;
    another.audience={schools:["otro-plantel"],specialties:["Contabilidad"]};
    another.trigger={type:"graduation",startDate:"2028-08-01",
      endDate:"2028-08-05",videoDates:["2028-08-04"]};
    another.graduation.label="Generación nueva";
    const config={...published,events:[...published.events,another]};
    expect(graduationPreviewDates(another)).toEqual(["2028-08-01","2028-08-04"]);
    expect(graduationPreviewForDate(config,another.id,"2028-08-04")?.graduation.label)
      .toBe("Generación nueva");
    expect(graduationPreviewForDate(config,existing.id,"2028-08-04")).toBeNull();
    expect(config.events.at(-1).enabled).toBe(false);
    expect(config.events.at(-1).audience.schools).toEqual(["otro-plantel"]);
  });
  it("quita la pestaña y maqueta y cambia toda la página temporalmente",()=>{
    const src=readFileSync("src/debug-main.jsx","utf8");
    const css=readFileSync("src/debug.css","utf8");
    expect(src).toContain('document.body.classList.toggle("debug-graduation-preview"');
    expect(src).toContain('document.body.classList.remove("debug-graduation-preview")');
    expect(src).toContain("graduationPreviewForDate(workEventConfig,eventId,value,{");
    expect(src).toContain("setGraduationPreview(null)");
    expect(src).toContain("Simular entrega de última bitácora");
    expect(src).not.toContain("showGraduationTest");
    expect(src).not.toContain("debug-graduation-controls");
    expect(src).not.toContain('value="graduation"');
    expect(src).not.toContain("Probar graduación");
    expect(css).toContain("body.debug-graduation-preview .debug-topbar");
    expect(css).toContain("body.debug-graduation-preview .debug-card");
    expect(css).toContain("body.debug-graduation-preview .debug-hero .hero-kicker");
    expect(css).not.toContain(".debug-graduation-stage");
  });
});
