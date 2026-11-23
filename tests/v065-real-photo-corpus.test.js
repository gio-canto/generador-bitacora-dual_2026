import {describe,it,expect} from "vitest";
import corpus from "../src/data/ocr-training-lote01.json";
import {dateFromExternal,timesFromExternal,extractExternalFields,suggestExternalWeekPeriod} from "../src/services/external-bitacora.js";
import {externalOcrQuality} from "../src/services/external-ocr.js";

describe("v0.65.0 · lote 01 de diez fotografías reales, con referencias anonimizadas",()=>{
  it("conserva diez muestras correspondientes a diez fotos, sin imágenes ni datos personales",()=>{
    expect(corpus.samples).toHaveLength(10);
    expect(new Set(corpus.samples.map(sample=>sample.photo)).size).toBe(10);
    expect(corpus.imagesInPublicRepo).toBe(false);
    expect(corpus.samples.filter(sample=>sample.writing==="manuscrito")).toHaveLength(2);
    expect(corpus.samples.every(sample=>!sample.text.includes("FIRMA DEL ALUMNO"))).toBe(true);
  });
  for(const sample of corpus.samples){
    it(sample.id+" · "+sample.layout+" · analiza el formato observado",()=>{
      const parsed=extractExternalFields(sample.text);
      expect(parsed.name).toBe("ALUMNO DE PRUEBA");
      expect(parsed.company).toBe("EMPRESA DE EJEMPLO");
      if(sample.confidence!=="estructura_verificada"){
        expect(suggestExternalWeekPeriod(parsed)).toBeNull();
        expect(parsed.warnings.join(" ")).toMatch(/fuera de martes a viernes/i);
        expect(parsed.days.some(day=>day.detected&&!day.hours)).toBe(true);
        return;
      }
      expect(parsed.recognized).toBe(4);
      expect(parsed.days.map(day=>day.date)).toEqual(sample.expectedDates);
      expect(parsed.days.map(day=>day.hours)).toEqual(sample.expectedHours);
      expect(parsed.days.map(day=>day.status)).toEqual(sample.expectedStatuses);
      expect(suggestExternalWeekPeriod(parsed)?.startDate).toBe(sample.expectedStart);
    });
  }
  it("interpreta fechas cortas, meses escritos y días de la semana",()=>{
    expect(dateFromExternal("10/11/26")).toBe("2026-11-10");
    expect(dateFromExternal("17/noviembre/2026")).toBe("2026-11-17");
    expect(dateFromExternal("01/septiembre/2026")).toBe("2026-09-01");
    expect(dateFromExternal("Martes, 10 de Noviembre de 2026")).toBe("2026-11-10");
    expect(dateFromExternal("31/02/26")).toBe("");
  });
  it("desambigua am/pm sin inventar una salida nocturna",()=>{
    expect(timesFromExternal("9a.m.-3p.m.")).toMatchObject({start:"09:00",end:"15:00",hours:"6"});
    expect(timesFromExternal("Entrada:9:00 am Salida:3:00 pm")).toMatchObject({hours:"6"});
    expect(timesFromExternal("09:00-14:00")).toMatchObject({hours:"5"});
    expect(timesFromExternal("9:00-2:00")).toMatchObject({start:"09:00",end:"",hours:""});
  });
  it("prioriza el OCR que detecta jornadas y fechas frente a palabras aisladas",()=>{
    const poor={data:{text:"BITÁCORA SEMANAL\nActividad\nDatos",confidence:85}};
    const improved={data:{text:corpus.samples[0].text,confidence:45}};
    expect(externalOcrQuality(improved)).toBeGreaterThan(externalOcrQuality(poor));
  });
});