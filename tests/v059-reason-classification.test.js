import { describe, expect, it } from "vitest";
import absence from "../src/data/absence-reasons.json";
import nonWorking from "../src/data/non-working-reasons.json";
import { classifyReason } from "../src/services/reason-classifier.js";
import { encodeWeekStatistics, decodeWeekStatistics } from "../src/services/matrix-statistics.js";
import { decideReasonReview, pendingReasonReviews } from "../src/services/reason-reviews.js";
import { sanitizeDeliveryState } from "../src/services/delivery-registry.js";

describe("v0.59 · reconocimiento local de motivos", () => {
  it("permite modificar palabras clave sin cambiar IDs ni códigos",()=>{
    for(const rows of [absence,nonWorking]) {
      expect(new Set(rows.map(item=>item.code)).size).toBe(rows.length);
      for(const item of rows) {
        expect(item.keywords.length).toBeGreaterThan(0);
        expect(new Set(item.keywords).size).toBe(item.keywords.length);
      }
    }
  });
  it("identifica citas, exámenes y fases de concursos",()=>{
    expect(classifyReason("falta","No asistí porque tuve una consulta médica.")?.id)
      .toBe("medical_appointment");
    expect(classifyReason("falta","Presenté el examen de admisión a la universidad.")?.id)
      .toBe("university_admission_exam");
    expect(classifyReason("falta","Participé en el concurso de prototipos fase estatal.")?.id)
      .toBe("prototypes_entrepreneurship_state");
  });
  it("reconoce Día de Muertos, huracanes, mantenimiento y cortes de luz",()=>{
    expect(classifyReason("sin_labores","La empresa suspendió actividades por Día de Muertos.")?.id)
      .toBe("local_company_holiday");
    expect(classifyReason("sin_labores","No hubo labores por el huracán Otis.")?.id)
      .toBe("hurricane");
    expect(classifyReason("sin_labores","La empresa cerró por mantenimiento.")?.id)
      .toBe("facility_maintenance");
    expect(classifyReason("sin_labores","No hubo trabajo porque se fue la luz.")?.id)
      .toBe("power_services");
  });
  it("no inventa clasificación cuando no encuentra motivo o la frase está negada",()=>{
    expect(classifyReason("falta","Tuve una situación que prefiero no describir.")).toBeNull();
    expect(classifyReason("falta","No tuve consulta médica, falté por un motivo diferente.")?.id)
      .not.toBe("medical_appointment");
    expect(classifyReason("inhabil","Se suspendió por Día de Muertos.")).toBeNull();
  });
  it("mantiene el protocolo Data Matrix v4 y asigna código Otro motivo cuando no sabe",()=>{
    const days=[
      {status:"laboral",start:"09:00",end:"14:00"},
      {status:"falta",activity:"Tuve un asunto del que no proporciono detalles."},
      {status:"sin_labores",activity:"La empresa suspendió labores por Día de Muertos."},
      {status:"inhabil"},
    ];
    const packed=encodeWeekStatistics(days);
    expect(packed).toMatch(/^S5:[A-Za-z0-9_-]{14}$/);
    const decoded=decodeWeekStatistics(packed);
    expect(decoded.entries[1].reasonCode).toBe(63);
    expect(decoded.entries[2].reasonId).toBe("local_company_holiday");
  });
});
const sample=()=>({
  students:[{id:"alumno1",name:"Alumna Ejemplo"}],
  weeks:[{id:"semana1",label:"Semana 1",startDate:"2026-10-20",
    deliveries:{alumno1:{
      status:"entregado",registeredAt:"2026-10-23T12:00:00Z",source:"camera",
      statistics:{version:5,entries:[
        {status:"laboral",minutes:240,reasonCode:0},
        {status:"falta",minutes:0,reasonCode:63,reasonId:""},
        {status:"sin_labores",minutes:0,reasonCode:63,reasonId:""},
        {status:"inhabil",minutes:0,reasonCode:0},
      ]},
    }}],
});
describe("v0.59 · avisos y revisión del administrador",()=>{
  it("muestra cada Otro motivo pendiente con alumno, semana y día",()=>{
    const items=pendingReasonReviews(sample());
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({student:"Alumna Ejemplo",day:"Miércoles",status:"falta"});
    expect(items[1].status).toBe("sin_labores");
  });
  it("permite dejarlo como Otro motivo y conservar esa decisión en JSON",()=>{
    let state=decideReasonReview(sample(),{
      weekId:"semana1",studentId:"alumno1",dayIndex:1,code:63
    });
    state=sanitizeDeliveryState(state);
    expect(pendingReasonReviews(state)).toHaveLength(1);
    expect(state.weeks[0].deliveries.alumno1.statistics.entries[1].reasonReview).toBe("kept");
  });
  it("reclasifica sólo la jornada seleccionada sin alterar las horas",()=>{
    const updated=decideReasonReview(sample(),{
      weekId:"semana1",studentId:"alumno1",dayIndex:1,code:1
    });
    const stats=updated.weeks[0].deliveries.alumno1.statistics;
    expect(stats.entries[1].reasonId).toBe("medical_appointment");
    expect(stats.entries[1].reasonCode).toBe(1);
    expect(stats.entries[0].minutes).toBe(240);
    expect(stats.entries[2].reasonCode).toBe(63);
    expect(pendingReasonReviews(updated)).toHaveLength(1);
  });
  it("rechaza códigos de otro estado y registros ya revisados",()=>{
    expect(()=>decideReasonReview(sample(),{
      weekId:"semana1",studentId:"alumno1",dayIndex:1,code:45,
    })).toThrow();
    const reviewed=decideReasonReview(sample(),{
      weekId:"semana1",studentId:"alumno1",dayIndex:1,code:63
    });
    expect(()=>decideReasonReview(reviewed,{
      weekId:"semana1",studentId:"alumno1",dayIndex:1,code:1
    })).toThrow();
  });
});
