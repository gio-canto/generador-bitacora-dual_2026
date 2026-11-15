import { describe, expect, it } from "vitest";
import { createCanvas } from "@napi-rs/canvas";
import { blankRecord, validateRecord, waitingWeekEntries } from "../src/domain/records.js";
import { buildPageModel, drawPdfPage } from "../src/services/pdf.js";
import { LIMBO_COMPANY, createMatrixPayload, parseMatrixPayload, isLimboMatrixPayload } from "../src/services/delivery-registry.js";

const waiting = () => {
  const record = blankRecord();
  record.student = "Alumna Ejemplo";
  record.company = LIMBO_COMPANY;
  record.weekDate = "2026-11-10";
  record.entries = waitingWeekEntries(record.weekDate);
  record.authorities.elaboroName = record.student;
  // No hay representante de empresa ni instructor durante la reubicación.
  record.authorities.autorizoName = "";
  record.authorities.autorizoRole = "";
  record.instructor.enabled = false;
  return record;
};

describe("Flujo de bitácora en espera de reubicación", () => {
  it("genera de martes a viernes con solo la fecha, sin inventar horas ni actividades", () => {
    const entries = waitingWeekEntries("2026-11-10");
    expect(entries.map((entry) => entry.date)).toEqual([
      "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13",
    ]);
    expect(entries.every((entry) => entry.status === "sin_labores")).toBe(true);
    expect(entries.every((entry) => !entry.start && !entry.end && !entry.area)).toBe(true);
    expect(entries.every((entry) => entry.activity.includes("reubicación"))).toBe(true);
  });
  it("permite solo firmas del estudiante y Vinculación; no exige firmas de empresa", () => {
    const r = waiting();
    expect(validateRecord(r)).toEqual({});
    // La validación normal todavía requiere autorización del representante de empresa.
    const ordinary = { ...r, company: "Empresa de prueba" };
    expect(validateRecord(ordinary, 3)).toHaveProperty("authorities.autorizoName");
  });
  it("marca las cuatro jornadas en el PDF como espera de reubicación", () => {
    const r = waiting();
    const page = buildPageModel(r);
    expect(page.rows).toHaveLength(4);
    expect(page.rows.every((row) => row.label === "EN ESPERA DE REUBICACIÓN")).toBe(true);
    expect(page.rows.every((row) => row.special)).toBe(true);
    expect(page.fits).toBe(true);
    const canvas = createCanvas(1, 1);
    expect(drawPdfPage(canvas, 4, r, null).fits).toBe(true);
  });
  it("mantiene el Data Matrix compatible con Registro Dual y sin horas trabajadas", () => {
    const r = waiting();
    const code = createMatrixPayload(r);
    const payload = parseMatrixPayload(code);
    expect(isLimboMatrixPayload(payload)).toBe(true);
    expect(payload.statistics.entries).toHaveLength(4);
    expect(payload.statistics.entries.every((entry) => entry.status === "sin_labores" && entry.minutes === 0)).toBe(true);
  });
});
