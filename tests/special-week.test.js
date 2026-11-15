import { describe, expect, it } from "vitest";
import { buildPageModel } from "../src/services/pdf.js";
import {
  createMatrixPayload, parseMatrixPayload, createStudent, createWeek,
  findStudentByMatrixValue, registerDelivery, sanitizeDeliveryState, weekSummary,
} from "../src/services/delivery-registry.js";
import { buildStudentDossier } from "../src/services/student-dossier.js";
import { calculateDualLifetimeStatistics } from "../src/services/statistics.js";
import { normalizeRecord, validateRecord } from "../src/domain/records.js";

const days = ["2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06"];
const entries = days.map((date, index) => ({
  date, status: "sin_labores", reasonId: "", specialType: index % 2 ? "limbo" : "asistencia",
  start: "09:00", end: "12:00", area: index % 2 ? "" : "Plantel educativo",
  activity: index % 2
    ? "Continué en espera de asignación a otra empresa receptora."
    : "Asistí al plantel para seguimiento del proceso de reubicación.",
}));
const student = createStudent({
  id: "special-student", name: "Alumna Ejemplo Prueba",
  specialty: "Programación", company: "Empresa Ejemplo",
});

describe("Bitácora especial de reubicación", () => {
  it("distingue asistencia y espera sin romper Data Matrix BD26|4 ni estadísticas S5", () => {
    const code = createMatrixPayload({
      student:student.name, company:student.company, specialty:student.specialty,
      reportMode:"special", entries,
    });
    expect(code).toContain("|S5:");
    expect(code).toContain("|M1:ALAL");
    const payload = parseMatrixPayload(code);
    expect(payload.version).toBe(4);
    expect(payload.reportMode).toBe("special");
    expect(payload.specialDays).toEqual(["asistencia","limbo","asistencia","limbo"]);
    expect(payload.statistics.entries.map((day)=>day.status)).toEqual([
      "sin_labores","sin_labores","sin_labores","sin_labores",
    ]);
    expect(payload.statistics.entries.every((day)=>day.minutes===0)).toBe(true);
    expect(findStudentByMatrixValue([student],code)?.id).toBe(student.id);
  });
  it("una bitácora normal no tiene M1 y conserva las etiquetas originales", () => {
    const normal = entries.map((e) => ({
      ...e, status:"laboral",specialType:"",area:"Empresa",start:"10:00",end:"14:00",
    }));
    const code = createMatrixPayload({
      student:student.name,company:student.company,specialty:student.specialty,
      reportMode:"normal",entries:normal,
    });
    expect(code).not.toContain("|M1:");
    expect(parseMatrixPayload(code).reportMode).toBeUndefined();
    const pdf = buildPageModel({ entries, markdown:true, reportMode:"special" });
    expect(pdf.rows[0].label).toContain("ASISTENCIA");
    expect(pdf.rows[1].label).toBe("EN ESPERA DE REUBICACIÓN");
    expect(pdf.rows[0].timeLines.flat().join(" ")).not.toBe("-");
    expect(pdf.rows[1].timeLines.flat().join(" ")).toBe("-");
  });
  it("el registro conserva una entrega y no suma horas de empresa ni registra una baja", () => {
    const w=createWeek({id:"special-week",label:"Semana especial",startDate:days[0],endDate:days[3]});
    const code=createMatrixPayload({
      student:student.name, company:student.company, specialty:student.specialty,
      reportMode:"special",entries,
    });
    const payload=parseMatrixPayload(code);
    const delivered=registerDelivery(w,student.id,"2026-11-07T10:00:00Z","camera",{
      matrixVersion:payload.version,statistics:payload.statistics,specialDays:payload.specialDays,
    });
    const state=sanitizeDeliveryState({students:[student],weeks:[delivered]});
    expect(weekSummary(state.weeks[0],state.students).registered).toBe(1);
    expect(state.students[0].dualStatus).toBe("active");
    expect(state.weeks[0].deliveries[student.id].specialDays).toEqual(payload.specialDays);
    expect(calculateDualLifetimeStatistics(state).totalHours).toBe(0);
    const dossier=buildStudentDossier(state,student.id);
    expect(dossier.timeline[0].reportMode).toBe("special");
    expect(dossier.timeline[0].days[0].specialType).toBe("asistencia");
    expect(dossier.timeline[0].days[1].specialType).toBe("limbo");
  });
  it("mantiene la validación de cuatro jornadas y exige lugar al marcar asistencia", () => {
    const r=normalizeRecord({
      student:student.name,company:student.company,school:"Plantel",
      specialty:student.specialty,semester:"5",group:"B",reportMode:"special",entries,
    });
    expect(validateRecord(r,2)).toEqual({});
    r.entries[0].area="";
    expect(validateRecord(r,2)["entries.0.area"]).toBeTruthy();
  });
});
