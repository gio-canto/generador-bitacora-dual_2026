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

    const model = buildDeliveryReportModel(
      {
        context: {
          school: "CBTis 134",
          generation: "2025-2028",
        },
        students: [a, b],
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
      total: 2,
    });
    expect(model.weeks[0].rows.map((row) => row.status)).toEqual([
      "entregado",
      "no_entregado",
    ]);
    expect(model.weeks[0].rows[0].source).toBe("Cámara");
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
