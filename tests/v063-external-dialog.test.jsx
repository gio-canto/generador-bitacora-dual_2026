import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import {readFileSync} from "node:fs";
import ExternalBitacoraDialog from "../src/components/ExternalBitacoraDialog.jsx";
import {createStudent,createWeek} from "../src/services/delivery-registry.js";
import {readExternalBitacora} from "../src/services/external-ocr.js";

vi.mock("../src/services/external-ocr.js",()=>({
  externalFileKind: file=>file.name.endsWith(".docx")?"docx":"pdf",
  readExternalBitacora:vi.fn(),
  createExternalWorker:vi.fn(),
}));
const student=createStudent({name:"María López García",specialty:"Programación",company:"Archivo"});
const week=createWeek({startDate:"2026-11-17"});
const docText=[
 "Nombre del alumno: María López García",
 "Empresa: Archivo",
 ...["Martes 17/11/2026","Miércoles 18/11/2026","Jueves 19/11/2026","Viernes 20/11/2026"].flatMap(date=>
   [date,"Entrada: 09:00","Salida: 13:00","Actividades: Clasificación y digitalización de expedientes institucionales."])
].join("\n");

beforeEach(()=>{
 vi.stubGlobal("URL",Object.assign(URL,{createObjectURL:vi.fn(()=>"blob:test-external"),revokeObjectURL:vi.fn()}));
 readExternalBitacora.mockResolvedValue({text:docText,pages:1,method:"pdf-text",truncated:false});
});
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.clearAllMocks();});

describe("v0.63.0 · lector externo adaptado a escritorio y móvil",()=>{
 it("carga PDF, revisa alumno y semana y guarda cuatro jornadas",async()=>{
   const onSave=vi.fn(()=>true),onClose=vi.fn();
   render(<ExternalBitacoraDialog students={[student]} weeks={[week]} school="CBTis No. 134"
     loadPdfJs={vi.fn()} onClose={onClose} onSave={onSave}/>);
   const upload=screen.getByLabelText("Cargar PDF, Word o fotografías");
   fireEvent.change(upload,{target:{files:[new File(["pdf"],"externa.pdf",{type:"application/pdf"})]}});
   expect(await screen.findByText("Datos por confirmar")).toBeTruthy();
   expect(screen.getByLabelText("Alumno del padrón *").value).toBe(student.id);
   expect(screen.getByLabelText("Semana del registro *").value).toBe(week.id);
   expect(screen.getByText("Documento original")).toBeTruthy();
   expect(screen.getByLabelText("Martes · entrada externa").value).toBe("09:00");
   fireEvent.click(screen.getByRole("button",{name:"Confirmar y registrar"}));
   await waitFor(()=>expect(onSave).toHaveBeenCalledTimes(1));
   const payload=onSave.mock.calls[0][0];
   expect(payload.statistics.entries).toHaveLength(4);
   expect(payload.statistics.entries.every(x=>x.minutes===240)).toBe(true);
   expect(payload.metadata.filename).toBe("externa.pdf");
   expect(screen.getByText(/Bitácora registrada con jornadas/)).toBeTruthy();
 });
 it("ofrece captura fotográfica móvil, carga múltiple y documentos Word",async()=>{
   render(<ExternalBitacoraDialog students={[student]} weeks={[week]} school="CBTis No. 134"
     loadPdfJs={vi.fn()} onClose={vi.fn()} onSave={vi.fn()}/>);
   const camera=screen.getByLabelText("Tomar fotografía");
   expect(camera.getAttribute("capture")).toBe("environment");
   const upload=screen.getByLabelText("Cargar PDF, Word o fotografías");
   expect(upload.multiple).toBe(true);
   expect(upload.accept).toContain(".docx");
   fireEvent.change(upload,{target:{files:[
     new File(["a"],"uno.pdf",{type:"application/pdf"}),
     new File(["b"],"dos.docx",{type:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"})
   ]}});
   await waitFor(()=>expect(readExternalBitacora).toHaveBeenCalledTimes(2));
   expect(await screen.findByRole("tab",{name:"uno.pdf"})).toBeTruthy();
   expect(screen.getByRole("tab",{name:"dos.docx"})).toBeTruthy();
   const css=readFileSync("src/external-bitacora.css","utf8");
   expect(css).toContain("@media(max-width:480px)");
   expect(css).toContain("100dvh");
 });
});