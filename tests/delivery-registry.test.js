import { describe, expect, it } from "vitest";
import {
  contextIsComplete,
  createRegistryContext,
  createMatrixPayload,
  createStudent,
  createWeek,
  deliveryStatus,
  findStudentByMatrixValue,
  findWeekByMatrixValue,
  mergeStudents,
  parseMatrixPayload,
  parsePortableDeliveryFile,
  registerDelivery,
  statusFromTimestamp,
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
    const student = createStudent({
      name: "Virtual Insanity",
      specialty: "Programación",
      company: "COCYTIEG",
    });
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

  it("codifica identidad y periodo en el Data Matrix actual", () => {
    const payload = createMatrixPayload({
      student: "José Ángel Núñez",
      specialty: "Programación",
      company: "Consejo de Ciencia, Tecnología e Innovación del Estado de Guerrero (COCYTIEG)",
      entries: [
        { date: "2026-09-01" },
        { date: "2026-09-02" },
        { date: "2026-09-03" },
        { date: "2026-09-04" },
      ],
    });
    expect(parseMatrixPayload(payload)).toEqual({
      version: 4,
      name: "jose angel nunez",
      specialty: "programacion",
      company: "cocytieg",
      startDate: "2026-09-01",
      endDate: "2026-09-04",
    });
  });

  it("usa especialidad y empresa para distinguir nombres repetidos", () => {
    const a = createStudent({
      name: "Alex García",
      specialty: "Programación",
      company: "COCYTIEG",
    });
    const b = createStudent({
      name: "Alex García",
      specialty: "Contabilidad",
      company: "ITCH",
    });
    const payload = createMatrixPayload({
      student: "Alex García",
      specialty: "Contabilidad",
      company: "ITCH",
    });
    expect(findStudentByMatrixValue([a, b], payload)?.id).toBe(b.id);
    expect(findStudentByMatrixValue([a, b], "Alex García")).toBeNull();
  });

  it("envía cada Data Matrix a la semana de su propio periodo", () => {
    const week1 = createWeek({
      id: "week-1",
      label: "Semana 1",
      startDate: "2026-09-01",
      dueAt: "2026-09-05T18:00:00.000Z",
    });
    const week2 = createWeek({
      id: "week-2",
      label: "Semana 2",
      startDate: "2026-09-08",
      dueAt: "2026-09-12T18:00:00.000Z",
    });
    const payload = createMatrixPayload({
      student: "Ana López",
      specialty: "Programación",
      company: "COCYTIEG",
      entries: [
        { date: "2026-09-08" },
        { date: "2026-09-09" },
        { date: "2026-09-10" },
        { date: "2026-09-11" },
      ],
    });
    expect(findWeekByMatrixValue([week1, week2], payload)?.id).toBe("week-2");
  });

  it("calcula entrega a destiempo después del límite de la semana identificada", () => {
    const week = createWeek({
      startDate: "2026-09-01",
      dueAt: "2026-09-05T18:00:00.000Z",
    });
    expect(statusFromTimestamp(week, "2026-09-06T12:00:00.000Z")).toBe(
      "entregado_tarde",
    );
  });

  it("mantiene compatibilidad con Data Matrix v3 usando la semana seleccionada", () => {
    const week = createWeek({
      id: "week-old",
      startDate: "2026-09-01",
    });
    const legacy = "BD26|3|Sm9zw6kgw4FuZ2VsIE7DumHDsWV6|UHJvZ3JhbWFjacOzbg|Q09DWVRJRUc";
    expect(findWeekByMatrixValue([week], legacy, "week-old")?.id).toBe(
      "week-old",
    );
  });

  it("usa únicamente la escuela como configuración general", () => {
    const context = createRegistryContext({
      school: "CBTis 134",
      specialty: "Programación",
      semester: "4",
      group: "B",
      company: "COCYTIEG",
    });
    expect(context).toEqual({ school: "CBTis 134" });
    expect(contextIsComplete(context)).toBe(true);
  });

  it("guarda especialidad y empresa por alumno", () => {
    const student = createStudent({
      name: "Ana López",
      specialty: "Programación",
      company: "COCYTIEG",
    });
    expect(student).toMatchObject({
      name: "Ana López",
      specialty: "Programación",
      company: "COCYTIEG",
    });
  });

  it("actualiza los datos de un alumno repetido sin duplicarlo", () => {
    const original = createStudent({
      name: "Ana López",
      specialty: "Programación",
      company: "COCYTIEG",
    });
    const result = mergeStudents([original], [
      {
        name: "Ana Lopez",
        specialty: "Contabilidad",
        company: "ITCH",
      },
      {
        name: "Luis Pérez",
        specialty: "Programación",
        company: "COCYTIEG",
      },
    ]);
    expect(result.students).toHaveLength(2);
    expect(result.updated).toBe(1);
    expect(result.added).toBe(1);
    expect(result.students.find((student) => student.id === original.id)).toMatchObject({
      name: "Ana Lopez",
      specialty: "Contabilidad",
      company: "ITCH",
    });
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

  it("migra el esquema anterior y pasa especialidad y empresa a los alumnos", () => {
    const parsed = parsePortableDeliveryFile(
      JSON.stringify({
        schemaVersion: 2,
        context: {
          school: "CBTis 134",
          specialty: "Programación",
          semester: "4",
          group: "B",
          company: "COCYTIEG",
        },
        students: [
          {
            id: "student-1",
            name: "Alumno de prueba",
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
    expect(parsed.schemaVersion).toBe(4);
    expect(parsed.context).toEqual({ school: "CBTis 134" });
    expect(parsed.students[0]).toMatchObject({
      name: "Alumno de prueba",
      specialty: "Programación",
      company: "COCYTIEG",
    });
  });

  it("conserva datos individuales de archivos antiguos", () => {
    const parsed = parsePortableDeliveryFile(
      JSON.stringify({
        schemaVersion: 1,
        students: [
          {
            id: "student-1",
            name: "Alumno de prueba",
            school: "CBTis 134",
            specialty: "Contabilidad",
            company: "ITCH",
          },
        ],
        weeks: [],
      }),
    );
    expect(parsed.context).toEqual({ school: "CBTis 134" });
    expect(parsed.students[0]).toMatchObject({
      specialty: "Contabilidad",
      company: "ITCH",
    });
  });
});
