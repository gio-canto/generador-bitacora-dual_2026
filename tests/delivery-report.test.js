import { describe, expect, it } from "vitest";
import {
  createStudent,
  createWeek,
  registerDelivery,
  setDeliveryStatus,
} from "../src/services/delivery-registry.js";
import { buildDeliveryReportModel } from "../src/services/delivery-report.js";

describe("reportes de entrega", () => {
  it("construye un listado simplificado con generación, resumen y estados", () => {
    const a = createStudent({
      id: "a",
      name: "Ana López",
      specialty: "Programación",
      company: "COCYTIEG",
    });
    const b = createStudent({
      id: "b",
      name: "Luis Pérez",
      specialty: "Contabilidad",
      company: "ITCH",
    });
    const c = createStudent({
      id: "c",
      name: "María Torres",
      specialty: "Programación",
      company: "La Avispa",
    });
    let week = createWeek({
      id: "week-1",
      label: "Semana 1",
      startDate: "2026-09-01",
      dueAt: "2026-09-05T18:00:00.000Z",
    });
    week = registerDelivery(
      week,
      a.id,
      "2026-09-05T17:00:00.000Z",
      "camera",
    );
    week = setDeliveryStatus(
      week,
      b.id,
      "no_entregado",
      "",
      "manual",
    );
    week = setDeliveryStatus(
      week,
      c.id,
      "no_aplica",
      "2026-09-05T16:00:00.000Z",
      "manual",
    );

    const model = buildDeliveryReportModel(
      {
        context: {
          school: "CBTis 134",
          generation: "2025-2028",
        },
        students: [a, b, c],
        weeks: [week],
      },
      {
        mode: "simple",
        weekId: week.id,
        createdAt: "2026-09-28T21:30:00.000Z",
      },
    );

    expect(model.school).toBe("CBTis 134");
    expect(model.generation).toBe("2025-2028");
    expect(model.weeks).toHaveLength(1);
    expect(model.weeks[0].summary).toMatchObject({
      entregado: 1,
      entregado_tarde: 0,
      no_entregado: 1,
      no_aplica: 1,
      applicable: 2,
      total: 3,
    });
    expect(model.weeks[0].rows.map((row) => row.status)).toEqual([
      "entregado",
      "no_aplica",
      "no_entregado",
    ]);
    expect(model.weeks[0].rows[0].source).toBe("Cámara");
  });

  it("construye una matriz global alumno por semana", () => {
    const a = createStudent({
      id: "a",
      name: "Ana López",
      specialty: "Programación",
      company: "COCYTIEG",
    });
    const b = createStudent({
      id: "b",
      name: "Luis Pérez",
      specialty: "Contabilidad",
      company: "ITCH",
    });

    let week1 = createWeek({
      id: "w1",
      label: "Semana 1",
      startDate: "2026-09-01",
      dueAt: "2026-09-05T18:00:00.000Z",
    });
    let week2 = createWeek({
      id: "w2",
      label: "Semana 2",
      startDate: "2026-09-08",
      dueAt: "2026-09-12T18:00:00.000Z",
    });

    week1 = setDeliveryStatus(
      week1,
      a.id,
      "entregado",
      "2026-09-05T17:00:00.000Z",
      "camera",
    );
    week2 = setDeliveryStatus(
      week2,
      a.id,
      "entregado_tarde",
      "2026-09-13T10:00:00.000Z",
      "manual",
    );
    week1 = setDeliveryStatus(
      week1,
      b.id,
      "no_aplica",
      "2026-09-05T16:30:00.000Z",
      "manual",
    );
    week2 = setDeliveryStatus(
      week2,
      b.id,
      "entregado",
      "2026-09-11T10:00:00.000Z",
      "camera",
    );

    const model = buildDeliveryReportModel(
      {
        context: { school: "CBTis 134", generation: "2025-2028" },
        students: [b, a],
        weeks: [week2, week1],
      },
      { mode: "global", createdAt: "2026-09-28T21:30:00.000Z" },
    );

    expect(model.mode).toBe("global");
    expect(model.weeks.map((week) => week.id)).toEqual(["w1", "w2"]);
    expect(model.globalRows.map((row) => row.name)).toEqual([
      "Ana López",
      "Luis Pérez",
    ]);
    expect(model.globalRows[0].weeks.map((item) => item.status)).toEqual([
      "entregado",
      "entregado_tarde",
    ]);
    expect(model.globalRows[1].weeks.map((item) => item.status)).toEqual([
      "no_aplica",
      "entregado",
    ]);
  });

  it("ordena el reporte semana por semana por fecha inicial", () => {
    const student = createStudent({ id: "a", name: "Ana López" });
    const late = createWeek({
      id: "later",
      label: "Semana 2",
      startDate: "2026-09-08",
    });
    const early = createWeek({
      id: "early",
      label: "Semana 1",
      startDate: "2026-09-01",
    });

    const model = buildDeliveryReportModel(
      {
        context: { school: "CBTis 134", generation: "2025-2028" },
        students: [student],
        weeks: [late, early],
      },
      { mode: "weekly" },
    );

    expect(model.weeks.map((week) => week.id)).toEqual(["early", "later"]);
  });
});
