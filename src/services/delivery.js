import {
  canvasToJpegBytes,
  createPdf,
  drawPdfPage,
  buildPageModel,
} from "./pdf.js";
import { validateRecord, titleOf } from "../domain/records.js";
export async function makePdf(record, logo) {
  if (
    Object.keys(validateRecord(record)).length ||
    !buildPageModel(record).fits
  )
    throw new Error("Revisa los campos marcados antes de descargar.");
  const canvas = document.createElement("canvas");
  drawPdfPage(canvas, 11.81, record, logo);
  const bytes = createPdf(
    await canvasToJpegBytes(canvas),
    canvas.width,
    canvas.height,
  );
  canvas.width = canvas.height = 1;
  return new File([bytes], `${titleOf(record).replaceAll(" ", "_")}.pdf`, {
    type: "application/pdf",
  });
}
export async function deliver(file) {
  if (
    navigator.share &&
    navigator.canShare?.({ files: [file] }) &&
    matchMedia("(pointer: coarse)").matches
  ) {
    try {
      await navigator.share({ files: [file], title: "Bitácora semanal" });
      return true;
    } catch (e) {
      if (e.name === "AbortError") return false;
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return true;
}
