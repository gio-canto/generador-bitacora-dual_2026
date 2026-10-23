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
      expect(reason.code).toBeGreaterThan(0);
      expect(reason.code).toBeLessThan(63);
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
  it("agrega los nueve concursos por fase con IDs y códigos estables sin colisiones", () => {
    const expected = [
      ["prototypes_entrepreneurship_local",20],
      ["prototypes_entrepreneurship_state",21],
      ["prototypes_entrepreneurship_national",22],
      ["academic_festival_local",23],
      ["academic_festival_state",24],
      ["academic_festival_national",25],
      ["enac_local",26],
      ["enac_state",27],
      ["enac_national",28],
    ];
    const codes = absenceReasons.map(reason=>reason.code);
    expect(new Set(codes).size).toBe(absenceReasons.length);
    expect(absenceReasons.filter(reason=>reason.code<=19).map(reason=>reason.code))
      .toEqual(Array.from({length:19},(_,i)=>i+1));
    for (const [id,code] of expected) {
      const reason=absenceReasons.find(item=>item.id===id);
      expect(reason?.code).toBe(code);
      expect(reason?.label.toLowerCase()).toContain(
        id.endsWith("_local")?"local":id.endsWith("_state")?"estatal":"nacional"
      );
    }
  });

  it("usa nombres cortos y justificaciones directas sin repetir la inasistencia", () => {
    const names = [
      "Prototipos y Emprendimiento", "Festival Académico", "ENAC",
    ];
    const titles = [
      "el Concurso Nacional de Prototipos y Proyectos de Emprendimiento",
      "el Festival Académico",
      "el Encuentro Nacional de Arte y Cultura (ENAC)",
    ];
    const phases = [
      ["local","Local"],["estatal","Estatal"],["nacional","Nacional"],
    ];
    for (let group=0; group<3; group++) for (let phase=0; phase<3; phase++) {
      const reason=absenceReasons.find(x=>x.code===20+group*3+phase);
      expect(reason.label).toBe(names[group]+" · "+phases[phase][1]);
      expect(reason.text).toBe("Participación en "+titles[group]+", fase "+phases[phase][0]+".");
      expect(reason.text).not.toMatch(/inasistencia|horario|jornada|representación/i);
      expect(reason.label.length).toBeLessThan(60);
    }
  });

});
