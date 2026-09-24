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
  rememberProfile,
  readProfile,
  readProfileData,
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

it("recuerda todos los predeterminados sin guardar contenido de jornadas", () => {
  localStorage.clear();
  expect(
    rememberProfile({
      name: "Alumno de Prueba",
      school: "Plantel de Prueba",
      specialty: "Programación",
      semester: "5",
      group: "c",
      company: "Empresa de Prueba",
      defaultStart: "08:00",
      defaultEnd: "14:30",
      area: "Laboratorio de desarrollo",
      markdown: false,
      studentGenericSignature: true,
      authorities: {
        voboName: "Vo Bo",
        voboRole: "Vinculación",
        autorizoName: "Responsable",
        autorizoRole: "Jefatura",
      },
      instructor: {
        enabled: true,
        preset: "Instructor",
        name: "Instructor",
        roleMain: "Área técnica",
        note: "Instructor Formador",
      },
      entries: [{ activity: "Esto no debe quedar en el perfil" }],
    }),
  ).toBe(true);

  expect(readProfileData()).toEqual({
    name: "Alumno de Prueba",
    school: "Plantel de Prueba",
    specialty: "Programación",
    semester: "5",
    group: "C",
    company: "Empresa de Prueba",
    defaultStart: "08:00",
    defaultEnd: "14:30",
    area: "Laboratorio de desarrollo",
    markdown: false,
    studentGenericSignature: true,
    authorities: {
      voboName: "Vo Bo",
      voboRole: "Vinculación",
      autorizoName: "Responsable",
      autorizoRole: "Jefatura",
    },
    instructor: {
      enabled: true,
      preset: "Instructor",
      name: "Instructor",
      roleMain: "Área técnica",
      note: "Instructor Formador",
    },
  });
  expect(
    JSON.parse(localStorage.getItem("bitacora_profile_v1")).entries,
  ).toBeUndefined();

  rememberName("Alumno Actualizado");
  expect(readProfileData()).toMatchObject({
    name: "Alumno Actualizado",
    company: "Empresa de Prueba",
    markdown: false,
    studentGenericSignature: true,
    instructor: { enabled: true, name: "Instructor" },
  });
  expect(rememberName("Virtual Insanity")).toBe(false);
  expect(readProfile()).toBe("Alumno Actualizado");

  forgetProfile();
  expect(readProfileData()).toMatchObject({
    name: "",
    school: "",
    company: "",
    area: "",
    markdown: true,
    studentGenericSignature: false,
    authorities: {
      voboName: "",
      autorizoName: "",
    },
    instructor: {
      enabled: null,
      name: "",
    },
  });
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
