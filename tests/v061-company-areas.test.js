import { describe, it, expect } from "vitest";
import companies from "../src/data/companies.json";
import { readProfileData, rememberProfile, rememberCompanyArea } from "../src/services/profile.js";

const council = companies.find((item) => item.shortName === "COCYTIEG");
const institute = companies.find((item) => item.shortName === "ITCH");
function memory() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  };
}

describe("0.61.0 · áreas por empresa", () => {
  it("incluye Departamento de Archivo sin consultar el instructor", () => {
    expect(council.areas).toContain("Departamento de Archivo");
    expect(council.areas).toContain("Departamento de Apropiación Social de la Ciencia");
    expect(council.areas).not.toContain("Área de Archivo");
    expect(new Set(council.areas).size).toBe(council.areas.length);
    expect(institute.areas).toBeUndefined();
  });

  it("conserva distintas áreas y capturas libres para cada empresa", () => {
    const storage = memory();
    expect(rememberProfile({ name: "Alumno", company: council.name, area: "Departamento de Archivo" }, storage)).toBe(true);
    expect(readProfileData(storage).area).toBe("Departamento de Archivo");
    expect(rememberProfile({ company: institute.name }, storage)).toBe(true);
    expect(readProfileData(storage).area).toBe("");
    expect(rememberProfile({ area: "Laboratorio propio" }, storage)).toBe(true);
    expect(rememberProfile({ company: council.name }, storage)).toBe(true);
    expect(readProfileData(storage).area).toBe("Departamento de Archivo");
    expect(readProfileData(storage).areaByCompany[institute.name]).toBe("Laboratorio propio");
  });

  it("guarda un área de otra empresa sin cambiar el perfil activo", () => {
    const storage = memory();
    rememberProfile({ name: "Alumno", company: council.name, area: "Área de Informática" }, storage);
    expect(rememberCompanyArea(institute.name, "Área de soporte", storage)).toBe(true);
    expect(readProfileData(storage).company).toBe(council.name);
    expect(readProfileData(storage).area).toBe("Área de Informática");
    expect(readProfileData(storage).areaByCompany[institute.name]).toBe("Área de soporte");
  });

  it("migra áreas anteriores sin cambiar el texto guardado", () => {
    const storage = memory();
    storage.setItem("bitacora_profile_v1", JSON.stringify({
      name: "Alumno anterior", company: council.name, area: "Área de Archivo",
    }));
    const profile = readProfileData(storage);
    expect(profile.area).toBe("Área de Archivo");
    expect(profile.areaByCompany[council.name]).toBe("Área de Archivo");
  });

  it("cambiar de instructor nunca modifica la elección del área", () => {
    const storage = memory();
    rememberProfile({ name: "Alumno", company: council.name, area: "Departamento de Archivo" }, storage);
    rememberProfile({ instructor: {
      name: council.instructors[3].name, roleMain: council.instructors[3].roleMain,
    } }, storage);
    expect(readProfileData(storage).area).toBe("Departamento de Archivo");
  });

  it("permite vaciar el área sin volver a introducir un valor antiguo", () => {
    const storage = memory();
    rememberProfile({ name: "Alumno", company: council.name, area: "A" }, storage);
    rememberProfile({ area: "" }, storage);
    expect(readProfileData(storage).area).toBe("");
    expect(readProfileData(storage).areaByCompany[council.name]).toBeUndefined();
  });
});
