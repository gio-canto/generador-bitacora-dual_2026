import { describe, expect, it } from "vitest";
import {
  contextIsComplete,
  createRegistryContext,
  createStudent,
  createWeek,
  deliveryStatus,
  findStudentByMatrixValue,
  mergeStudents,
  parsePortableDeliveryFile,
  readGeneratorSnapshot,
  registerDelivery,
  statusFromTimestamp,
  studentsFromGenerator,
  weekSummary,
} from "../src/services/delivery-registry.js";

describe("subsistema de registro de entrega", () => {
  it("distingue una entrega a tiempo de una entrega a destiempo", () => {
    const week = createWeek({
      label: "Semana 1",
      dueAt: "2026-09-30T20:00:00.000Z",
    });
    expect(statusFromTimestamp(week, "2026-09-30T19:59:00.000Z")).toBe(
      "entregado",
    );
    expect(statusFromTimestamp(week, "2026-09-30T20:01:00.000Z")).toBe(
      "entregado_tarde",
    );
  });

  it("registra la hora y conserva el origen de la entrega", () => {
    const student = createStudent({ name: "Virtual Insanity" });
    const week = createWeek({
      label: "Semana 1",
      dueAt: "2026-09-30T20:00:00.000Z",
    });
    const updated = registerDelivery(
      week,
      student.id,
      "2026-09-30T19:00:00.000Z",
      "camera",
    );
    expect(deliveryStatus(updated, student.id)).toBe("entregado");
    expect(updated.deliveries[student.id]).toMatchObject({
      registeredAt: "2026-09-30T19:00:00.000Z",
      source: "camera",
    });
  });

  it("encuentra al alumno aunque el Data Matrix omita acentos", () => {
    const student = createStudent({ name: "José Ángel Núñez" });
    expect(findStudentByMatrixValue([student], "Jose Angel Nunez")?.id).toBe(
      student.id,
    );
    expect(
      findStudentByMatrixValue([student], "BD26|Jose Angel Nunez")?.id,
    ).toBe(student.id);
  });

  it("mantiene el contexto escolar una sola vez para toda la base", () => {
    const context = createRegistryContext({
      school: "CBTis 134",
      specialty: "Programación",
      semester: "4",
      group: "b",
      company: "COCYTIEG",
    });
    expect(contextIsComplete(context)).toBe(true);
    expect(context.group).toBe("B");

    const student = createStudent({
      name: "Ana López",
      specialty: "No debe duplicarse",
    });
    expect(student).not.toHaveProperty("specialty");
  });

  it("actualiza alumnos repetidos sin duplicarlos", () => {
    const original = createStudent({ name: "Ana López" });
    const result = mergeStudents([original], [
      { name: "Ana Lopez" },
      { name: "Luis Pérez" },
    ]);
    expect(result.students).toHaveLength(2);
    expect(result.updated).toBe(1);
    expect(result.added).toBe(1);
    expect(result.students.find((student) => student.id === original.id)?.name).toBe(
      "Ana Lopez",
    );
  });

  it("cruza las bitácoras guardadas del generador con el mismo grupo", () => {
    const storage = {
      getItem(key) {
        if (key === "bitacora_dual_react_v1") return null;
        if (key === "bitacora_dual_clean_v3")
          return JSON.stringify([
            {
              student: "Ana López",
              school: "CBTis 134",
              specialty: "Programación",
              semester: "4",
              group: "B",
            },
            {
              student: "Luis Pérez",
              school: "CBTis 134",
              specialty: "Contabilidad",
              semester: "4",
              group: "B",
            },
          ]);
        return null;
      },
    };
    const snapshot = readGeneratorSnapshot(storage);
    const matches = studentsFromGenerator(
      snapshot,
      createRegistryContext({
        school: "CBTis 134",
        specialty: "Programación",
        semester: "4",
        group: "B",
      }),
    );
    expect(matches).toEqual([{ name: "Ana López" }]);
  });

  it("resume el avance de una semana", () => {
    const students = [
      createStudent({ name: "Uno" }),
      createStudent({ name: "Dos" }),
      createStudent({ name: "Tres" }),
    ];
    let week = createWeek({
      dueAt: "2026-09-30T20:00:00.000Z",
    });
    week = registerDelivery(
      week,
      students[0].id,
      "2026-09-30T19:00:00.000Z",
      "camera",
    );
    week = registerDelivery(
      week,
      students[1].id,
      "2026-09-30T21:00:00.000Z",
      "manual",
    );
    expect(weekSummary(week, students)).toMatchObject({
      entregado: 1,
      entregado_tarde: 1,
      no_entregado: 1,
      registered: 2,
      total: 3,
      percent: 67,
    });
  });

  it("migra un archivo portátil anterior al esquema compartido", () => {
    const parsed = parsePortableDeliveryFile(
      JSON.stringify({
        schemaVersion: 1,
        students: [
          {
            id: "student-1",
            name: "Alumno de prueba",
            school: "CBTis 134",
            specialty: "Programación",
            semester: "4",
            group: "B",
          },
        ],
        weeks: [
          {
            id: "week-1",
            label: "Semana 1",
            deliveries: {},
          },
        ],
      }),
    );
    expect(parsed.schemaVersion).toBe(2);
    expect(parsed.students[0].name).toBe("Alumno de prueba");
    expect(parsed.context).toMatchObject({
      school: "CBTis 134",
      specialty: "Programación",
      semester: "4",
      group: "B",
    });
  });
});
