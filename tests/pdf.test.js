import { it, expect } from "vitest";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { writeFileSync } from "node:fs";
import { blankRecord, generateEntries } from "../src/domain/records.js";
import { buildPageModel, drawPdfPage, createPdf } from "../src/services/pdf.js";
const sample = () => {
  const r = blankRecord();
  r.student = "Alumno de Prueba";
  r.company =
    "Consejo de Ciencia, Tecnología e Innovación del Estado de Guerrero (COCYTIEG)";
  r.weekDate = "2026-09-17";
  r.authorities.elaboroName = r.student;
  r.authorities.autorizoName = "Responsable de Prueba";
  r.authorities.autorizoRole = "Jefatura de Informática";
  r.entries = generateEntries(r).map((e) => ({
    ...e,
    activity:
      "- Revisé el funcionamiento del **sistema de constancias**.\n- Documenté las pruebas realizadas y sus resultados.",
  }));
  return r;
};
it("genera un PDF A4 horizontal de una página con la misma vista previa", async () => {
  const r = sample(),
    canvas = createCanvas(1, 1),
    logo = await loadImage("public/Assets/Edu.png");
  Object.defineProperty(logo, "naturalWidth", { value: logo.width });
  Object.defineProperty(logo, "naturalHeight", { value: logo.height });
  expect(drawPdfPage(canvas, 6, r, logo).fits).toBe(true);
  const bytes = createPdf(
      canvas.toBuffer("image/jpeg"),
      canvas.width,
      canvas.height,
    ),
    text = new TextDecoder().decode(bytes);
  expect(text.startsWith("%PDF-1.4")).toBe(true);
  expect(text).toContain("/Count 1");
  expect(text).toContain("841.8898 595.2756");
  writeFileSync("/tmp/bitacora-validation.pdf", bytes);
  writeFileSync("/tmp/bitacora-validation.png", canvas.toBuffer("image/png"));
});
it("bloquea una hoja que rebasa el espacio compartido", () => {
  const r = sample();
  r.entries.forEach(
    (e) => (e.activity = "Actividad detallada de la jornada. ".repeat(25)),
  );
  expect(buildPageModel(r).fits).toBe(false);
});
it("bloquea cargos con líneas que se perderían al imprimir", () => {
  const r = sample();
  r.authorities.autorizoRole = "Uno\nDos\nTres\nCuatro\nCinco";
  expect(buildPageModel(r).fits).toBe(false);
});
it("ajusta palabras largas al ancho de la celda", () => {
  const r = sample();
  r.entries[0].activity = "Supercalifragilistico".repeat(20);
  expect(buildPageModel(r).rows[0].activityLines.length).toBeGreaterThan(1);
});

it("cambia el render del PDF cuando se activa la firma genérica del alumno", () => {
  const unsigned = sample();
  const signed = sample();
  signed.studentGenericSignature = true;
  const a = createCanvas(1, 1);
  const b = createCanvas(1, 1);
  drawPdfPage(a, 4, unsigned, null);
  drawPdfPage(b, 4, signed, null);
  expect(Buffer.compare(a.toBuffer("image/png"), b.toBuffer("image/png"))).not.toBe(0);
});
