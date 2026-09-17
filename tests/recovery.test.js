import { it, expect } from "vitest";
import { recoverPreviousVersion } from "../src/services/recover-original.js";
import { blankRecord } from "../src/domain/records.js";
it("recupera borrador e historial de React una vez sin eliminar el respaldo de origen", () => {
  localStorage.clear();
  const older = { ...blankRecord(), id: "old", student: "Alumno Anterior" };
  const current = { ...blankRecord(), id: "new", student: "Alumno de Prueba" };
  localStorage.setItem("bitacora_dual_clean_v3", JSON.stringify([older]));
  const raw = JSON.stringify({ records: [current], draft: current });
  localStorage.setItem("bitacora_dual_react_v1", raw);
  recoverPreviousVersion();
  expect(
    JSON.parse(localStorage.getItem("bitacora_dual_clean_v3")),
  ).toHaveLength(2);
  expect(
    JSON.parse(localStorage.getItem("bitacora_dual_draft_v1")).identity.student,
  ).toBe(current.student);
  expect(localStorage.getItem("bitacora_dual_react_v1")).toBe(raw);
  localStorage.setItem("bitacora_dual_draft_v1", "edited");
  recoverPreviousVersion();
  expect(localStorage.getItem("bitacora_dual_draft_v1")).toBe("edited");
});
it("no escribe si los datos de origen son inválidos", () => {
  localStorage.clear();
  localStorage.setItem("bitacora_dual_react_v1", '{"records":[3]}');
  expect(() => recoverPreviousVersion()).toThrow();
  expect(localStorage.getItem("bitacora_dual_clean_v3")).toBeNull();
});
