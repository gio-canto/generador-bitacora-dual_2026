import { describe, it, expect } from "vitest";
import {
  blankRecord,
  weekDates,
  generateEntries,
  validateRecord,
  recordShape,
  withStatus,
} from "../src/domain/records.js";
import {
  initialState,
  parseBackup,
  mergeRecords,
  KEY,
  persist,
} from "../src/services/storage.js";
import { defaultCatalogs, validateCatalogs } from "../src/domain/catalogs.js";
const valid = () => {
  const r = blankRecord();
  r.student = "Alumno de Prueba";
  r.company = "Empresa de Prueba";
  r.weekDate = "2026-09-17";
  r.entries = generateEntries(r).map((e) => ({
    ...e,
    activity: "Realicé pruebas de integración del sistema.",
  }));
  r.authorities.autorizoName = "Persona de Prueba";
  r.authorities.autorizoRole = "Jefatura de Informática";
  return r;
};
const memory = () => {
  const m = new Map();
  return { getItem: (k) => m.get(k) || null, setItem: (k, v) => m.set(k, v) };
};
describe("fechas y prevención de errores", () => {
  it("genera la semana cruzando año sin depender de zona horaria", () =>
    expect(weekDates("2027-01-01")).toEqual([
      "2026-12-29",
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
    ]));
  it("rechaza fechas imposibles", () =>
    expect(weekDates("2026-02-30")).toEqual([]));
  it("acepta una bitácora completa", () =>
    expect(validateRecord(valid())).toEqual({}));
  it("bloquea horario invertido, fecha repetida y actividad incompleta", () => {
    const r = valid();
    r.entries[1].date = r.entries[0].date;
    r.entries[0].end = "08:00";
    r.entries[2].activity = "prueba";
    expect(validateRecord(r)).toHaveProperty("entries.1.date");
    expect(validateRecord(r)).toHaveProperty("entries.0.end");
    expect(validateRecord(r)).toHaveProperty("entries.2.activity");
  });
  it("requiere justificación de falta y omite horarios de días especiales", () => {
    const r = valid();
    r.entries[0] = withStatus(r.entries[0], "falta");
    r.entries[0].activity = "";
    expect(validateRecord(r)).toHaveProperty("entries.0.activity");
    r.entries[0] = withStatus(r.entries[0], "inhabil");
    expect(validateRecord(r)).toEqual({});
  });
  it("no impone tres palabras a nombres legales", () => {
    const r = valid();
    r.student = "Li Wang";
    expect(validateRecord(r)).toEqual({});
  });
});
describe("almacenamiento y respaldos", () => {
  it("recupera un borrador incompleto sin bloquear su lectura", () => {
    const s = memory(),
      r = blankRecord();
    r.entries = [
      {
        date: "",
        start: "",
        end: "",
        area: "",
        activity: "",
        status: "laboral",
      },
    ];
    persist({ draft: r, records: [], catalogs: null }, s);
    expect(initialState(s).draft.entries).toHaveLength(1);
  });
  it("migra historial y borrador anteriores conservando id", () => {
    const s = memory(),
      r = valid();
    s.setItem("bitacora_dual_clean_v3", JSON.stringify([r]));
    s.setItem(
      "bitacora_dual_draft_v1",
      JSON.stringify({ identity: r, currentId: r.id, entries: r.entries }),
    );
    const state = initialState(s);
    expect(state.migrated).toBe(true);
    expect(state.draft.id).toBe(r.id);
    expect(s.getItem("bitacora_dual_clean_v3")).not.toBeNull();
  });
  it("preserva datos dañados para recuperación", () => {
    const s = memory();
    s.setItem(KEY, "{mal");
    expect(initialState(s).storageError).toBeTruthy();
    expect(s.getItem(KEY)).toBe("{mal");
  });
  it("tolera bloqueo total del almacenamiento", () =>
    expect(
      initialState({
        getItem() {
          throw Error("denied");
        },
      }).storageError,
    ).toBeTruthy());
  it("rechaza respaldo con actividad inválida", () => {
    const r = valid();
    r.entries[0].activity = { html: "bad" };
    expect(() => parseBackup(JSON.stringify([r]))).toThrow();
  });
  it("no sobrescribe registros con el mismo id", () => {
    const r = valid(),
      changed = { ...r, student: "Otra Persona" };
    const result = mergeRecords([r], [changed]);
    expect(result.records).toHaveLength(2);
    expect(result.records[0].id).not.toBe(result.records[1].id);
  });
  it("ignora duplicados exactos", () => {
    const r = valid();
    expect(mergeRecords([r], [r]).added).toBe(0);
  });
  it("valida catálogos y horarios", () => {
    expect(validateCatalogs(defaultCatalogs)).toBe(defaultCatalogs);
    const c = structuredClone(defaultCatalogs);
    c.companies[0].end = "02:00";
    expect(() => validateCatalogs(c)).toThrow();
  });
});
it("rechaza tipos que podrían romper el motor PDF", () => {
  const r = valid();
  r.authorities.voboRole = true;
  expect(() => parseBackup(JSON.stringify([r]))).toThrow();
});
