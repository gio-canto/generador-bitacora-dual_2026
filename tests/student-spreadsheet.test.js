import { describe, expect, it } from "vitest";
import { parseStudentSpreadsheet, normalizeSpecialty } from "../src/services/student-spreadsheet.js";
describe("carga de alumnos desde formatos escolares",()=>{
  const sample=[
    ["ALUMNOS PARTICIPANTES EN EL PROGRAMA DUAL"],
    ["PLANTEL: CBTIS 134"],
    ["No.","NOMBRE DEL ALUMNO","","SEMESTRE Y GRUPO ","ESPECIALIDAD","DEPENDENCIA"],
    [1,"Ana López",null,"5°A","PRGRAMACIÓN","UAGRO"],
    [2,"Luis Pérez",null,"5°B","A. R. H.","COCYTIEG"],
    [3,"Ana López",null,"5°A","PROGRAMACION","UAGRO"],
    [null,null,null,null,null,null],
    ["NOMBRE Y FIRMA DEL MAESTRO:"],
  ];
  it("encuentra encabezados debajo de títulos y celdas combinadas",()=>{
    const result=parseStudentSpreadsheet(sample);
    expect(result.headerRow).toBe(3);
    expect(result.students).toHaveLength(2);
    expect(result.students[0]).toMatchObject({name:"Ana López",specialty:"Programación",company:"UAGRO",semesterGroup:"5°A"});
    expect(result.students[1].specialty).toBe("Administración de Recursos Humanos");
    expect(result.warnings).toHaveLength(1);
  });
  it("ignora pies de firma y no inventa género",()=>{
    const result=parseStudentSpreadsheet(sample);
    expect(result.students.some(s=>s.name.includes("MAESTRO"))).toBe(false);
    expect(result.students[0].gender).toBe("");
  });
  it("acepta tablas convencionales, rechaza formatos incompatibles",()=>{
    expect(parseStudentSpreadsheet([["Nombre","Especialidad","Empresa"],["Eva","Ofimatica","Nissan"]]).students[0].specialty).toBe("Ofimática");
    expect(()=>parseStudentSpreadsheet([["Nombre","Grupo"],["Eva","A"]])).toThrow(/columnas/);
    expect(normalizeSpecialty("Contabilidad")).toBe("Contabilidad");
  });
});
