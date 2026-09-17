import schools from "../data/schools.json" with { type: "json" };
import companies from "../data/companies.json" with { type: "json" };
import { validTime } from "./records.js";
export const defaultCatalogs = { schools, companies };
export function validateCatalogs(c) {
  if (
    !c ||
    !Array.isArray(c.schools) ||
    !Array.isArray(c.companies) ||
    !c.schools.length ||
    !c.companies.length
  )
    throw new Error("Incluye al menos un plantel y una empresa.");
  for (const type of ["schools", "companies"]) {
    if (c[type].length > 300)
      throw new Error("El catálogo admite hasta 300 elementos por tipo.");
    const ids = new Set(),
      names = new Set();
    for (const row of c[type]) {
      if (
        typeof row.id !== "string" ||
        !row.id.trim() ||
        typeof row.name !== "string" ||
        !row.name.trim() ||
        row.name.length > 180 ||
        ids.has(row.id) ||
        names.has(row.name.trim().toLowerCase())
      )
        throw new Error(
          "Revisa nombres e identificadores: no pueden estar vacíos ni repetidos.",
        );
      ids.add(row.id);
      names.add(row.name.trim().toLowerCase());
      if (
        row.shortName !== undefined &&
        (typeof row.shortName !== "string" || row.shortName.length > 180)
      )
        throw new Error(
          "El nombre corto debe ser texto de hasta 180 caracteres.",
        );
      if (
        row.instructorEnabledByDefault !== undefined &&
        typeof row.instructorEnabledByDefault !== "boolean"
      )
        throw new Error("La opción de instructor debe ser true o false.");
      if (type === "schools") {
        for (const key of ["voboName", "voboRole"])
          if (
            typeof row[key] !== "string" ||
            !row[key].trim() ||
            row[key].length > 180
          )
            throw new Error(
              "Completa el nombre corto y los datos de Vinculación.",
            );
        for (const key of ["specialties", "semesters", "groups"])
          if (
            !Array.isArray(row[key]) ||
            !row[key].length ||
            row[key].some(
              (x) => typeof x !== "string" || !x.trim() || x.length > 100,
            )
          )
            throw new Error("Completa especialidades, semestres y grupos.");
      } else {
        if (
          !validTime(row.start) ||
          !validTime(row.end) ||
          row.end <= row.start
        )
          throw new Error(
            "La salida de la empresa debe ser posterior a la entrada.",
          );
        if (
          typeof row.area !== "string" ||
          !row.area.trim() ||
          row.area.length > 150
        )
          throw new Error("Escribe el área predeterminada.");
        for (const key of ["representatives", "instructors"])
          if (
            !Array.isArray(row[key]) ||
            row[key].some(
              (p) =>
                typeof p.name !== "string" ||
                !p.name.trim() ||
                p.name.length > 100 ||
                typeof p[key === "instructors" ? "roleMain" : "role"] !==
                  "string" ||
                !p[key === "instructors" ? "roleMain" : "role"].trim() ||
                p[key === "instructors" ? "roleMain" : "role"].length > 180,
            )
          )
            throw new Error(
              "Completa nombre y cargo de cada representante o instructor.",
            );
      }
    }
  }
  return c;
}
