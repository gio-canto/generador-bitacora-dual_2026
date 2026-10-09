import { describe, expect, it } from "vitest";
import reasons from "../src/data/non-working-reasons.json";

describe("catálogo de motivos frecuentes de Sin labores", () => {
  it("es fácil de editar y no contiene datos inválidos", () => {
    expect(Array.isArray(reasons)).toBe(true);
    expect(reasons.length).toBeGreaterThan(15);
    const ids = new Set();
    for (const reason of reasons) {
      expect(Object.keys(reason).sort()).toEqual(["id", "label", "text"]);
      expect(reason.id).toMatch(/^[a-z0-9_]+$/);
      expect(ids.has(reason.id)).toBe(false);
      ids.add(reason.id);
      expect(reason.label.trim().length).toBeGreaterThan(1);
      expect(reason.text.trim().split(/\s+/).length).toBeGreaterThanOrEqual(4);
    }
  });

  it("incluye cierres de empresa y descansos no necesariamente escolares", () => {
    const ids = reasons.map(({ id }) => id);
    expect(ids).toEqual(expect.arrayContaining([
      "facility_maintenance",
      "labor_stoppage",
      "natural_disaster",
      "hurricane",
      "earthquake",
      "company_event",
      "work_calendar_rest",
      "collective_agreement_rest",
      "collective_vacation",
      "statutory_labor_holiday",
    ]));
  });
});
