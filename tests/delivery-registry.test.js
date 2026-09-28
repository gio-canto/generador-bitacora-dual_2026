import { describe, expect, it } from "vitest";
import {
  createStudent,
  createWeek,
  deliveryStatus,
  findStudentByMatrixValue,
  mergeStudents,
  parsePortableDeliveryFile,
  registerDelivery,
  statusFromTimestamp,
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

  it("registra la hora y conserva el estado de la entrega", () => {
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
  });

  it("actualiza alumnos repetidos en una carga masiva sin duplicarlos", () => {
    const original = createStudent({
      name: "Ana López",
      specialty: "Programación",
    });
    const result = mergeStudents([original], [
      { name: "Ana Lopez", specialty: "Contabilidad" },
      { name: "Luis Pérez", specialty: "Programación" },
    ]);
    expect(result.students).toHaveLength(2);
    expect(result.updated).toBe(1);
    expect(result.added).toBe(1);
    expect(result.students.find((student) => student.id === original.id)?.specialty).toBe(
      "Contabilidad",
    );
  });

  it("valida el archivo portátil antes de cargarlo", () => {
    const student = createStudent({ name: "Alumno de prueba" });
    const week = createWeek({ label: "Semana 1" });
    const parsed = parsePortableDeliveryFile(
      JSON.stringify({
        schemaVersion: 1,
        students: [student],
        weeks: [week],
      }),
    );
    expect(parsed.students[0].name).toBe("Alumno de prueba");
    expect(parsed.weeks[0].label).toBe("Semana 1");
  });
});
