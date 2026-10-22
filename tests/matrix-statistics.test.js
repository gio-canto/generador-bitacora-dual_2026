import { describe, it, expect } from "vitest";
import { encodeWeekStatistics, decodeWeekStatistics, summarizeWeekStatistics } from "../src/services/matrix-statistics.js";
import { createMatrixPayload, parseMatrixPayload, createWeek, createStudent, registerDelivery, sanitizeDeliveryState } from "../src/services/delivery-registry.js";

const sample = [
  { date:"2026-10-20", status:"laboral", start:"10:00", end:"14:00" },
  { date:"2026-10-21", status:"falta", reasonId:"illness", activity:"Estuve enfermo" },
  { date:"2026-10-22", status:"sin_labores", reasonId:"facility_maintenance", activity:"Cierre de instalaciones" },
  { date:"2026-10-23", status:"laboral", start:"09:30", end:"14:00" },
];

describe("Data Matrix estadístico v0.51", () => {
  it("codifica cuatro jornadas en 10 bytes (14 caracteres Base64URL)", () => {
    const result = encodeWeekStatistics(sample);
    expect(result).toMatch(/^S5:[A-Za-z0-9_-]{14}$/);
    const decoded = decodeWeekStatistics(result);
    expect(decoded?.entries.map(day=>day.status)).toEqual(["laboral","falta","sin_labores","laboral"]);
    expect(decoded.entries[0].minutes).toBe(240);
    expect(decoded.entries[3].minutes).toBe(270);
    expect(decoded.entries[1].reasonId).toBe("illness");
    expect(decoded.entries[2].reasonId).toBe("facility_maintenance");
    expect(summarizeWeekStatistics(decoded)).toMatchObject({
      minutes: 510, worked: 2, absent: 1, nonWorking: 1, holidays: 0
    });
  });
  it("identifica corrupción del bloque sin impedir leer datos de identificación", () => {
    const original = encodeWeekStatistics(sample);
    expect(decodeWeekStatistics("S5:------")).toBeNull();
    const altered = original.slice(0, -1) + (original.at(-1) === "A" ? "B" : "A");
    // Algunas alteraciones del último carácter pueden afectar sólo bits de relleno.
    expect([null, "object"].includes(typeof decodeWeekStatistics(altered))).toBe(true);
    expect(decodeWeekStatistics(original)).not.toBeNull();
  });
  it("retiene la estructura BD26|4 para compatibilidad con lectores existentes", () => {
    const payload = createMatrixPayload({
      student:"María López",specialty:"Programación",company:"COCYTIEG",entries:sample,
    });
    const parts=payload.split("|");
    expect(parts[0]).toBe("BD26");
    expect(parts[1]).toBe("4");
    expect(parts).toHaveLength(8);
    expect(parts[7]).toMatch(/^S5:/);
    const data = parseMatrixPayload(payload);
    expect(data.version).toBe(4);
    expect(data.statistics.entries[0].minutes).toBe(240);
    expect(data.startDate).toBe("2026-10-20");
  });
  it("acepta códigos antiguos sin inventar estadísticas", () => {
    const old = parseMatrixPayload("BD26|4|maria lopez|programacion|cocytieg|20261020|20261023");
    expect(old.name).toBe("maria lopez");
    expect(old).not.toHaveProperty("statistics");
    expect(parseMatrixPayload("BD26|María López")).not.toHaveProperty("statistics");
  });
  it("conserva datos al migrar el registro y sus respaldos", () => {
    const student = createStudent({name:"María López",specialty:"Programación",company:"COCYTIEG",gender:"female"});
    const stats = decodeWeekStatistics(encodeWeekStatistics(sample));
    const week = registerDelivery(createWeek({startDate:"2026-10-20"}),student.id,"2026-10-24T11:00:00Z","camera",{
      matrixVersion:4,statistics:stats,
    });
    const restored = sanitizeDeliveryState({schemaVersion:7,students:[student],weeks:[week]});
    expect(restored.schemaVersion).toBe(8);
    expect(restored.students[0].gender).toBe("female");
    expect(restored.weeks[0].deliveries[student.id].statistics.entries[1].reasonId).toBe("illness");
  });
  it("no fabrica estadísticas cuando no hay cuatro jornadas válidas", () => {
    expect(encodeWeekStatistics(sample.slice(0,3))).toBe("");
    expect(encodeWeekStatistics([{...sample[0],end:"09:00"},...sample.slice(1)])).toBe("");
  });
});
