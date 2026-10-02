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
  listProfiles,
  readActiveProfileId,
  switchProfile,
  createProfile,
  listArchivedProfiles,
  restoreProfile,
  deleteArchivedProfilePermanently,
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
    studentSignatureIntroduced: false,
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
    studentSignatureIntroduced: false,
    instructor: { enabled: true, name: "Instructor" },
  });
  expect(rememberName("Virtual Insanity")).toBe(false);
  expect(readProfile()).toBe("Alumno Actualizado");

  rememberProfile({
    studentGenericSignature: false,
    studentSignatureIntroduced: true,
  });
  expect(readProfileData()).toMatchObject({
    studentGenericSignature: false,
    studentSignatureIntroduced: true,
  });

  forgetProfile();
  expect(readProfileData()).toMatchObject({
    name: "Nueva persona",
    school: "",
    company: "",
    area: "",
    markdown: true,
    studentGenericSignature: false,
    studentSignatureIntroduced: false,
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
  expect(readProfile()).toBe("Nueva persona");
  expect(listArchivedProfiles().map((profile) => profile.name)).toContain(
    "Alumno de Prueba",
  );
  initializeProfile("Alumno de Prueba");
  expect(readProfile()).toBe("Nueva persona");
  expect(isVirtualName("  Virtual Insanity ")).toBe(true);
  expect(isVirtualName("JAMIROQUAI")).toBe(true);
});

it("mantiene varios alumnos separados y permite cambiar el perfil activo", () => {
  localStorage.clear();
  rememberProfile({ name: "Alumno Uno", company: "Empresa Uno", area: "Área Uno" });
  const firstId = readActiveProfileId();
  expect(listProfiles()).toHaveLength(1);

  const secondId = createProfile({});
  expect(readProfileData().name).toBe("Nueva persona");
  expect(listProfiles()).toHaveLength(2);
  expect(switchProfile(firstId)).toBe(true);
  expect(readProfile()).toBe("Alumno Uno");
  expect(switchProfile(secondId)).toBe(true);
  rememberProfile({ name: "Alumno Dos", company: "Empresa Dos", area: "Área Dos" });
  expect(listProfiles()).toHaveLength(2);
  expect(readActiveProfileId()).toBe(secondId);
  expect(readProfileData()).toMatchObject({ name: "Alumno Dos", company: "Empresa Dos" });

  expect(switchProfile(firstId)).toBe(true);
  expect(readProfileData()).toMatchObject({ name: "Alumno Uno", company: "Empresa Uno", area: "Área Uno" });
});


it("archiva solo el perfil activo y conserva los demás perfiles", () => {
  localStorage.clear();
  rememberProfile({ name: "Alumno Uno", company: "Empresa Uno" });
  const firstId = readActiveProfileId();
  const secondId = createProfile({});
  rememberProfile({ name: "Alumno Dos", company: "Empresa Dos" });

  expect(readActiveProfileId()).toBe(secondId);
  expect(forgetProfile()).toBe(true);
  expect(listProfiles()).toHaveLength(1);
  expect(listArchivedProfiles()).toEqual([
    { id: secondId, name: "Alumno Dos" },
  ]);
  expect(readActiveProfileId()).toBe(firstId);
  expect(readProfileData()).toMatchObject({
    name: "Alumno Uno",
    company: "Empresa Uno",
  });

  expect(restoreProfile(secondId)).toBe(true);
  expect(readActiveProfileId()).toBe(secondId);
  expect(readProfileData()).toMatchObject({
    name: "Alumno Dos",
    company: "Empresa Dos",
  });
  expect(listArchivedProfiles()).toHaveLength(0);
});

it("crea nombres provisionales distintos para varios perfiles nuevos", () => {
  localStorage.clear();
  createProfile({});
  expect(readProfile()).toBe("Nueva persona");
  createProfile({});
  expect(readProfile()).toBe("Nueva persona 2");
  expect(listProfiles().map((profile) => profile.name)).toEqual([
    "Nueva persona",
    "Nueva persona 2",
  ]);
});


it("crea un perfil provisional si se elimina el último perfil", () => {
  localStorage.clear();
  rememberProfile({ name: "Único Alumno", company: "Empresa Única" });
  const deletedId = readActiveProfileId();

  expect(forgetProfile()).toBe(true);
  expect(listProfiles()).toHaveLength(1);
  expect(readProfile()).toBe("Nueva persona");
  expect(readActiveProfileId()).not.toBe(deletedId);
  expect(listArchivedProfiles()).toEqual([
    { id: deletedId, name: "Único Alumno" },
  ]);

  expect(restoreProfile(deletedId)).toBe(true);
  expect(readActiveProfileId()).toBe(deletedId);
  expect(readProfileData()).toMatchObject({
    name: "Único Alumno",
    company: "Empresa Única",
  });
});


it("elimina para siempre solo un perfil archivado y sus datos asociados", () => {
  localStorage.clear();

  rememberProfile({ name: "Alumno Uno", company: "Empresa Uno" });
  const firstId = readActiveProfileId();

  const secondId = createProfile({});
  rememberProfile({ name: "Alumno Dos", company: "Empresa Dos" });

  localStorage.setItem(
    "bitacora_dual_clean_v3",
    JSON.stringify([
      { id: "r1", profileId: firstId, student: "Alumno Uno" },
      { id: "r2", profileId: secondId, student: "Alumno Dos" },
      { id: "legacy", student: "Alumno Dos" },
    ]),
  );
  localStorage.setItem(
    `bitacora_dual_draft_v1:${secondId}`,
    JSON.stringify({ profileId: secondId, identity: { student: "Alumno Dos" }, entries: [] }),
  );

  expect(forgetProfile()).toBe(true);
  expect(readActiveProfileId()).toBe(firstId);
  expect(listArchivedProfiles()).toEqual([
    { id: secondId, name: "Alumno Dos" },
  ]);

  expect(deleteArchivedProfilePermanently(firstId)).toBe(false);
  expect(readActiveProfileId()).toBe(firstId);
  expect(listProfiles().map((profile) => profile.id)).toContain(firstId);

  expect(deleteArchivedProfilePermanently(secondId)).toBe(true);
  expect(listArchivedProfiles()).toHaveLength(0);
  expect(readActiveProfileId()).toBe(firstId);
  expect(
    JSON.parse(localStorage.getItem("bitacora_dual_clean_v3")),
  ).toEqual([
    { id: "r1", profileId: firstId, student: "Alumno Uno" },
    { id: "legacy", student: "Alumno Dos" },
  ]);
  expect(
    localStorage.getItem(`bitacora_dual_draft_v1:${secondId}`),
  ).toBeNull();
});
