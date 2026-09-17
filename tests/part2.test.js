import { it, expect } from "vitest";
import {
  weekSetup,
  signatureName,
  schoolSignatureRole,
  CREDIT_NAMES,
  isVirtualName,
} from "../src/domain/presentation.js";
import {
  rememberName,
  readProfile,
  forgetProfile,
  initializeProfile,
} from "../src/services/profile.js";
it("valida el martes y los horarios antes de crear la semana", () => {
  expect(weekSetup("2026-09-15", "14:00", "10:00").field).toBe("defaultEnd");
  expect(weekSetup("2026-02-30", "10:00", "14:00").field).toBe("weekDate");
  expect(weekSetup("2026-12-29", "10:00", "14:00").dates).toEqual([
    "2026-12-29",
    "2026-12-30",
    "2026-12-31",
    "2027-01-01",
  ]);
});
it("usa el nombre corto de las firmas o el nombre completo si falta", () => {
  expect(signatureName({ name: "Nombre completo", shortName: " Corto " })).toBe(
    "Corto",
  );
  expect(signatureName({ name: "Nombre completo", shortName: "" })).toBe(
    "Nombre completo",
  );
  expect(
    schoolSignatureRole("Alumno\nNombre completo", {
      name: "Nombre completo",
      shortName: "Corto",
    }),
  ).toEqual(["Alumno", "Corto"]);
});
it("recuerda el nombre sin confundir los disparadores secretos con el perfil", () => {
  localStorage.clear();
  rememberName("Alumno de Prueba");
  for (const name of [...CREDIT_NAMES, "jamiroquai", "Virtual Insanity"])
    expect(rememberName(name)).toBe(false);
  expect(readProfile()).toBe("Alumno de Prueba");
  forgetProfile();
  initializeProfile("Alumno de Prueba");
  expect(readProfile()).toBe("");
  expect(isVirtualName("  Virtual Insanity ")).toBe(true);
  expect(isVirtualName("JAMIROQUAI")).toBe(true);
});
