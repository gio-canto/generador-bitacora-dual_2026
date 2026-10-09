import { describe, expect, it } from "vitest";
import absenceReasons from "../src/data/absence-reasons.json";

describe("catálogo de motivos frecuentes de falta", () => {
  it("mantiene una estructura segura y editable", () => {
    expect(Array.isArray(absenceReasons)).toBe(true);
    expect(absenceReasons.length).toBeGreaterThan(0);

    const ids = new Set();
    for (const reason of absenceReasons) {
      expect(reason).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          label: expect.any(String),
          text: expect.any(String),
        }),
      );
      expect(reason.id).toMatch(/^[a-z0-9_]+$/);
      expect(ids.has(reason.id)).toBe(false);
      ids.add(reason.id);

      expect(reason.label.trim().length).toBeGreaterThan(1);
      expect(reason.text.trim().split(/\s+/).length).toBeGreaterThanOrEqual(4);
    }
  });

  it("conserva los motivos institucionales actuales", () => {
    const ids = absenceReasons.map((reason) => reason.id);
    expect(ids).toContain("medical_appointment");
    expect(ids).toContain("university_admission_exam");
    expect(ids).toContain("demonstrations");
    expect(ids).toContain("natural_disaster");
    expect(ids).toContain("social_unrest");
  });
});
