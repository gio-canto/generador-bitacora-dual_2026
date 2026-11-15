import { describe, expect, it } from "vitest";
import {
  createStudent, createWeek, createMatrixPayload, parseMatrixPayload,
  findStudentByMatrixValue, transferStudentCompany, studentCompanyAtDate,
  studentIsActive, registerDelivery, sanitizeDeliveryState, weekSummary,
} from "../src/services/delivery-registry.js";
import { calculateDeliveryStatistics, calculateDualLifetimeStatistics } from "../src/services/statistics.js";
import { buildStudentDossier } from "../src/services/student-dossier.js";

const work = {version: 5, entries: Array.from({length: 4}, () => ({
  status: "laboral", minutes: 240, reasonCode: 0,
}))};
const original = createStudent({
  id: "alumna-transferida", name: "Alumna de prueba",
  specialty: "Programación", company: "Empresa Alfa",
});
const student = transferStudentCompany(original, "Empresa Beta", "2026-10-06");

describe("Reubicación de empresa sin baja de Dual", () => {
  it("mantiene un expediente activo y ambas asignaciones", () => {
    expect(student.id).toBe(original.id);
    expect(studentIsActive(student)).toBe(true);
    expect(student.company).toBe("Empresa Beta");
    expect(student.companyTransfers).toEqual([{
      fromCompany: "Empresa Alfa", toCompany: "Empresa Beta",
      effectiveDate: "2026-10-06", reason: "company_decision",
    }]);
    expect(studentCompanyAtDate(student, "2026-09-01")).toBe("Empresa Alfa");
    expect(studentCompanyAtDate(student, "2026-10-06")).toBe("Empresa Beta");
    expect(() => transferStudentCompany(student, "Empresa Beta", "2026-11-01")).toThrow();
  });

  it("acepta códigos históricos y muestra la reubicación sólo desde la fecha efectiva", () => {
    const oldCode = createMatrixPayload({
      student: original.name, specialty: original.specialty, company: original.company,
      startDate: "2026-09-01", endDate: "2026-09-04",
    });
    const newCode = createMatrixPayload({
      student: student.name, specialty: student.specialty, company: student.company,
      startDate: "2026-10-06", endDate: "2026-10-09",
      companyTransfer: { fromCompany: "Empresa Alfa", effectiveDate: "2026-10-06" },
    });
    expect(oldCode).not.toContain("|R1:");
    expect(newCode).toContain("|R1:20261006:empresa alfa");
    expect(parseMatrixPayload(newCode).companyTransfer).toMatchObject({
      fromCompany: "empresa alfa", effectiveDate: "2026-10-06",
      reason: "company_decision",
    });
    expect(findStudentByMatrixValue([student], oldCode)?.id).toBe(student.id);
    expect(findStudentByMatrixValue([student], newCode)?.id).toBe(student.id);
    const backdated = createMatrixPayload({
      student: student.name, specialty: student.specialty, company: student.company,
      startDate: "2026-09-01", endDate: "2026-09-04",
      companyTransfer: { fromCompany: "Empresa Alfa", effectiveDate: "2026-10-06" },
    });
    expect(backdated).not.toContain("|R1:");
  });

  it("conserva horas, fechas, empresas y cumplimiento de las dos etapas", () => {
    const before = registerDelivery(createWeek({
      id: "semana-antes", startDate: "2026-09-01", endDate: "2026-09-04",
    }), student.id, "2026-09-05T12:00:00Z", "manual", {
      statistics: work, companyAtDelivery: "Empresa Alfa",
    });
    const after = registerDelivery(createWeek({
      id: "semana-despues", startDate: "2026-10-06", endDate: "2026-10-09",
    }), student.id, "2026-10-10T12:00:00Z", "camera", {
      statistics: work, companyAtDelivery: "empresa beta",
      companyTransfer: {fromCompany: "empresa alfa", effectiveDate: "2026-10-06"},
      matrixVersion: 4,
    });
    const state = sanitizeDeliveryState({ students: [student], weeks: [before, after] });
    expect(state.students[0].companyTransfers).toHaveLength(1);
    expect(state.weeks[1].deliveries[student.id].companyTransfer.effectiveDate).toBe("2026-10-06");
    expect(weekSummary(before, [student]).applicable).toBe(1);
    expect(weekSummary(after, [student]).applicable).toBe(1);
    expect(calculateDualLifetimeStatistics(state).totalHours).toBe(32);
    const analysis = calculateDeliveryStatistics(state, {period:"all"});
    expect(analysis.byCompany.find((item)=>item.label==="Empresa Alfa")?.minutes).toBe(960);
    expect(analysis.byCompany.find((item)=>item.label==="Empresa Beta")?.minutes).toBe(960);
    expect(calculateDeliveryStatistics(state,{period:"all",company:"Empresa Alfa"}).totalMinutes).toBe(960);
    expect(calculateDeliveryStatistics(state,{period:"all",company:"Empresa Beta"}).totalMinutes).toBe(960);
    const dossier = buildStudentDossier(state,student.id);
    expect(dossier.timeline.map((row)=>row.company)).toEqual(["Empresa Beta","Empresa Alfa"]);
    expect(dossier.totalHours).toBe(32);
  });
});
