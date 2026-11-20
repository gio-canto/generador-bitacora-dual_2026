import {describe,it,expect} from "vitest";
import {eventsForSchool,specialEventById,specialEventText,validSpecialEvent} from "../src/services/special-events.js";
import {encodeWeekStatistics,decodeWeekStatistics,summarizeWeekStatistics} from "../src/services/matrix-statistics.js";
import {createMatrixPayload,parseMatrixPayload,createWeek,createStudent,registerDelivery,sanitizeDeliveryState} from "../src/services/delivery-registry.js";
import {buildManualStatistics,manualDaysFromStatistics} from "../src/services/manual-statistics.js";
import {buildPageModel} from "../src/services/pdf.js";
import {blankRecord,validateRecord} from "../src/domain/records.js";
import catalog from "../src/data/special-events.json";

const base=[
  {date:"2026-11-17",status:"laboral",start:"10:00",end:"14:00",area:"Archivo",activity:"Revisión de documentos institucionales."},
  {date:"2026-11-18",status:"falta",reasonId:"illness",activity:"No pude asistir por enfermedad."},
  {date:"2026-11-19",status:"sin_labores",reasonId:"facility_maintenance",activity:"Instalaciones cerradas por mantenimiento."},
  {date:"2026-11-20",status:"laboral",start:"10:00",end:"14:00",area:"Archivo",activity:"Clasificación de expedientes laborales."}
];
const evento=(mode="sin")=>({...base[1],status:"evento",eventId:"festival",
  eventPhase:"estatal",eventDiscipline:"Inglés",eventMode:mode,
  start:"09:00",end:"12:00",area:"Archivo",
  activity:"Participé en la fase estatal del Festival Académico de la DGETI."});

describe("v0.62.0 · catálogo de eventos",()=>{
  it("mantiene códigos únicos y reserva 63 para Otros",()=>{
    expect(new Set(catalog.map(x=>x.id)).size).toBe(catalog.length);
    expect(new Set(catalog.map(x=>x.code)).size).toBe(catalog.length);
    expect(catalog.find(x=>x.code===63)?.id).toBe("otros");
    for(const item of catalog){
      expect(item.code).toBeGreaterThan(0);
      expect(item.code).toBeLessThanOrEqual(63);
      expect(item.phases.length).toBeGreaterThan(0);
      expect(item.disciplines.length).toBeGreaterThan(0);
    }
  });
  it("resuelve eventos compartidos y exclusivos del plantel",()=>{
    const school="CENTRO DE BACHILLERATO TECNOLÓGICO INDUSTRIAL Y DE SERVICIOS NO. 134";
    expect(eventsForSchool(school).some(x=>x.id==="semana_ciencia_cbtis134")).toBe(true);
    expect(eventsForSchool("otro-plantel").some(x=>x.id==="semana_ciencia_cbtis134")).toBe(false);
    expect(eventsForSchool("otro-plantel").some(x=>x.id==="festival")).toBe(true);
  });
  it("propone texto editable con fase, disciplina y otros",()=>{
    const school="CBTis No. 134";
    const event=specialEventById("festival",school);
    expect(specialEventText(event,"estatal","Inglés")).toMatch(/fase estatal, disciplina Inglés/);
    expect(specialEventText(specialEventById("otros",school),"no_aplica","","Jornada institucional")).toContain("Jornada institucional");
    expect(validSpecialEvent({eventId:"otros",eventName:"Actividad interna",eventPhase:"local",eventDiscipline:"",eventMode:"sin"},school)).toBe(true);
    expect(validSpecialEvent({eventId:"otros",eventName:"",eventPhase:"local",eventMode:"sin"},school)).toBe(false);
  });
});

describe("v0.62.0 · Data Matrix y PDF",()=>{
  it("mantiene exactamente el bloque S5/BD26|4 si no hay eventos",()=>{
    const s=encodeWeekStatistics(base);
    expect(s).toMatch(/^S5:[A-Za-z0-9_-]{14}$/);
    const d=parseMatrixPayload(createMatrixPayload({student:"Persona Prueba",entries:base}));
    expect(d.version).toBe(4);
    expect(d.statistics.version).toBe(5);
    expect(d.statistics.entries[1].status).toBe("falta");
  });
  it("transmite evento, fase y disciplina, sin convertirlo en falta",()=>{
    const days=[base[0],evento(),base[2],base[3]];
    const code=encodeWeekStatistics(days);
    expect(code).toMatch(/^S6:[A-Za-z0-9_-]{20}$/);
    const payload=createMatrixPayload({student:"Persona Prueba",specialty:"Programación",company:"COCYTIEG",entries:days});
    expect(payload).toContain("BD26|5|");
    const r=parseMatrixPayload(payload);
    expect(r.version).toBe(5);
    expect(r.statistics.version).toBe(6);
    expect(r.statistics.entries[1]).toMatchObject({status:"evento",reasonId:"festival",
      eventPhase:"estatal",eventDiscipline:"Inglés",eventMode:"sin",minutes:0});
    expect(summarizeWeekStatistics(r.statistics)).toMatchObject({absent:0,events:1,minutes:480});
  });
  it("suma sólo horas reales cuando un evento es con labores",()=>{
    const days=[base[0],evento("con"),base[2],base[3]];
    const r=decodeWeekStatistics(encodeWeekStatistics(days));
    expect(r.entries[1]).toMatchObject({status:"evento",eventMode:"con",minutes:180});
    expect(summarizeWeekStatistics(r)).toMatchObject({events:1,absent:0,minutes:660});
    const p=blankRecord();
    p.entries=days;
    p.school="CBTis No. 134";
    expect(validateRecord(p,2)).toEqual({});
    const rows=buildPageModel(p).rows;
    expect(rows[1].label).toBe("EVENTO");
    expect(rows[1].timeLines.length).toBeGreaterThan(0);
    expect(rows[1].areaLines.flat().map(x=>x.text).join("")).toBe("Archivo");
  });
  it("muestra guiones y conserva el PDF sin horarios inventados en sin labores",()=>{
    const p=blankRecord();
    p.entries=[base[0],evento(),base[2],base[3]];
    const row=buildPageModel(p).rows[1];
    expect(row.label).toBe("EVENTO");
    expect(row.timeLines.flat().map(x=>x.text).join("")).toBe("-");
    expect(row.areaLines.flat().map(x=>x.text).join("")).toBe("-");
  });
  it("preserva jornadas S6 en respaldo escolar",()=>{
    const student=createStudent({name:"Persona Prueba",specialty:"Programación",company:"COCYTIEG"});
    const days=[base[0],evento(),base[2],base[3]];
    const stats=decodeWeekStatistics(encodeWeekStatistics(days));
    const week=registerDelivery(createWeek({startDate:"2026-11-17"}),student.id,"2026-11-21T11:00:00Z","camera",{matrixVersion:5,statistics:stats});
    const restored=sanitizeDeliveryState({schemaVersion:9,students:[student],weeks:[week]});
    expect(restored.weeks[0].deliveries[student.id].statistics.entries[1]).toMatchObject({
      status:"evento",eventPhase:"estatal",eventMode:"sin",eventDiscipline:"Inglés"});
  });
});
describe("v0.62.0 · captura manual",()=>{
  it("permite evento con labores y preserva su clasificación",()=>{
    const days=[
      {status:"laboral",hours:"4",reasonCode:"0"},
      {status:"evento",hours:"3",reasonCode:"1",eventPhase:"estatal",eventDiscipline:"Inglés",eventMode:"con"},
      {status:"sin_labores",hours:"",reasonCode:"1"},
      {status:"inhabil",hours:"",reasonCode:"0"}
    ];
    const stats=buildManualStatistics(days);
    expect(stats.version).toBe(6);
    expect(stats.entries[1]).toMatchObject({status:"evento",minutes:180,reasonCode:1,eventMode:"con"});
    expect(manualDaysFromStatistics(stats)[1].hours).toBe("3");
    expect(summarizeWeekStatistics(stats)).toMatchObject({events:1,absent:0,minutes:420});
  });
});
