import { describe, expect, it } from "vitest";
import companies from "../src/data/companies.json";
import {
  LIMBO_COMPANY,
  createMatrixPayload,
  createStudent,
  createWeek,
  deliveryStatus,
  findStudentByMatrixValue,
  isLimboMatrixPayload,
  parseMatrixPayload,
  registerDelivery,
  sanitizeDeliveryState,
  setDeliveryStatus,
  updateWeekDueAt,
  weekSummary,
} from "../src/services/delivery-registry.js";

const alumna = createStudent({
  id: "alumna-ejemplo",
  name: "Alumna Ejemplo",
  specialty: "Programación",
  company: "Empresa anterior",
});
const inicio = "2026-10-06";
const fin = "2026-10-09";
const marca = "2026-10-14T19:00:00.000Z";
const fechaLimite = "2026-10-09T19:00:00.000Z";
const semana = () => createWeek({
  id: "semana-limbo", label: "Semana en espera",
  startDate: inicio, endDate: fin, dueAt: fechaLimite,
});

const codigo = (company, specialty = alumna.specialty, name = alumna.name) =>
  createMatrixPayload({
    student: name, specialty, company,
    startDate: inicio, endDate: fin,
  });

describe("Empresa En espera de reubicación: exención exclusiva de tardanza", () => {
  it("aparece como opción habitual y mantiene intacto el formato del Data Matrix", () => {
    expect(companies.some((item) => item.name === LIMBO_COMPANY)).toBe(true);
    const payload = parseMatrixPayload(codigo(LIMBO_COMPANY));
    expect(payload.version).toBe(4);
    expect(payload.startDate).toBe(inicio);
    expect(payload.endDate).toBe(fin);
    expect(isLimboMatrixPayload(payload)).toBe(true);
    expect(isLimboMatrixPayload(parseMatrixPayload(codigo("Empresa anterior")))).toBe(false);
  });

  it("identifica a la alumna sin cambiar su empresa registrada", () => {
    const parsed = codigo(LIMBO_COMPANY);
    expect(findStudentByMatrixValue([alumna], parsed)?.id).toBe(alumna.id);
    expect(alumna.company).toBe("Empresa anterior");
    expect(findStudentByMatrixValue([alumna], codigo(LIMBO_COMPANY, "Contabilidad"))).toBeNull();
    expect(findStudentByMatrixValue([alumna], codigo(LIMBO_COMPANY, alumna.specialty, "Otra Persona"))).toBeNull();
    const duplicada = createStudent({ id:"otra",name:alumna.name,specialty:alumna.specialty,company:"Empresa distinta" });
    expect(findStudentByMatrixValue([alumna,duplicada], parsed)).toBeNull();
  });

  it("siempre registra A tiempo aunque llegue después del plazo y conserva la excepción en el JSON", () => {
    const scanned = parseMatrixPayload(codigo(LIMBO_COMPANY));
    const stored = registerDelivery(semana(), alumna.id, marca, "camera", {
      matrixVersion:scanned.version, limboExempt:isLimboMatrixPayload(scanned),
    });
    expect(deliveryStatus(stored, alumna.id)).toBe("entregado");
    expect(stored.deliveries[alumna.id]).toMatchObject({
      source:"camera", registeredAt:marca, status:"entregado", limboExempt:true,
    });
    expect(weekSummary(stored,[alumna])).toMatchObject({
      entregado:1,entregado_tarde:0,registered:1,applicable:1,
    });
    const restored = sanitizeDeliveryState({students:[alumna],weeks:[stored]});
    expect(restored.weeks[0].deliveries[alumna.id].limboExempt).toBe(true);
    expect(restored.weeks[0].deliveries[alumna.id].status).toBe("entregado");
  });

  it("el cambio posterior de fecha límite no convierte en tardía una entrega en espera", () => {
    const stored = registerDelivery(semana(),alumna.id,marca,"camera",{limboExempt:true});
    const edited = updateWeekDueAt(stored,"2026-10-07T10:00:00.000Z");
    expect(edited.deliveries[alumna.id].status).toBe("entregado");
    expect(edited.deliveries[alumna.id].limboExempt).toBe(true);
    const corrected = setDeliveryStatus(edited,alumna.id,"entregado_tarde",marca,"manual");
    expect(corrected.deliveries[alumna.id].status).toBe("entregado");
    expect(corrected.deliveries[alumna.id].limboExempt).toBe(true);
  });

  it("todas las demás empresas siguen marcando entregas a destiempo y no se exentan las capturas manuales", () => {
    const regular = parseMatrixPayload(codigo("Empresa anterior"));
    const ordinary = registerDelivery(semana(),alumna.id,marca,"camera",{
      limboExempt:isLimboMatrixPayload(regular),
    });
    expect(deliveryStatus(ordinary,alumna.id)).toBe("entregado_tarde");
    expect(ordinary.deliveries[alumna.id].limboExempt).toBeUndefined();
    const manual = registerDelivery(semana(),alumna.id,marca,"manual",{limboExempt:true});
    expect(deliveryStatus(manual,alumna.id)).toBe("entregado_tarde");
    expect(weekSummary(manual,[alumna]).entregado_tarde).toBe(1);
  });

  it("el código no exenta sin fechas válidas ni altera la falta de entrega", () => {
    const withoutPeriod = parseMatrixPayload(createMatrixPayload({
      student:alumna.name,specialty:alumna.specialty,company:LIMBO_COMPANY,
    }));
    expect(isLimboMatrixPayload(withoutPeriod)).toBe(false);
    expect(deliveryStatus(semana(),alumna.id)).toBe("no_entregado");
  });
});
