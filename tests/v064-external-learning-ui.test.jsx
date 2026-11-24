import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import ExternalBitacoraDialog from "../src/components/ExternalBitacoraDialog.jsx";
import {createStudent,createWeek} from "../src/services/delivery-registry.js";
import {readExternalBitacora} from "../src/services/external-ocr.js";

vi.mock("../src/services/external-ocr.js",()=>({
  externalFileKind:()=> "image",
  readExternalBitacora:vi.fn(),
  createExternalWorker:vi.fn(),
}));
const student=createStudent({id:"alumno",name:"María López García",specialty:"Programación",company:"Archivo"});
const week=createWeek({id:"semana",startDate:"2026-11-17",label:"Semana nueva"});
const recognized=[
 "Nombre del alumno: Maria Lpez Grcia",
 "Empresa: Arch1vo",
 "Martes 17/11/2026","Entrada: 09:00","Salida: 13:00",
 "Miércoles 18/11/2026","Entrada: 09:00","Salida: 13:00",
 "Jueves 19/11/2026","Entrada: 09:00","Salida: 13:00",
 "Viernes 20/11/2026","Entrada: 09:00","Salida: 13:00",
].join("\n");

beforeEach(()=>{
 vi.stubGlobal("URL",Object.assign(URL,{createObjectURL:vi.fn(()=>"blob:photo"),revokeObjectURL:vi.fn()}));
 readExternalBitacora.mockResolvedValue({text:recognized,method:"ocr",pages:1,truncated:false});
});
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.clearAllMocks();});

describe("v0.68 · lector sin controles públicos de entrenamiento",()=>{
 it("ofrece crear la semana y registra sin activar aprendizaje",async()=>{
   const onSave=vi.fn(()=>true),onCreateWeek=vi.fn(()=>week.id),onClose=vi.fn();
   const props={students:[student],weeks:[],school:"CBTis No. 134",loadPdfJs:vi.fn(),
     onSave,onCreateWeek,onClose};
   const view=render(<ExternalBitacoraDialog {...props}/>);
   fireEvent.change(screen.getByLabelText("Cargar PDF, Word o fotografías"),{
     target:{files:[new File(["imagen"],"alumno.jpg",{type:"image/jpeg"})]}
   });
   expect(await screen.findByText("Datos por confirmar")).toBeTruthy();
   expect(screen.getByRole("button",{name:"Crear semana"})).toBeTruthy();
   fireEvent.click(screen.getByRole("button",{name:"Crear semana"}));
   expect(screen.getByLabelText("Inicio de la nueva semana externa").value).toBe("2026-11-17");
   fireEvent.click(screen.getByRole("button",{name:"Crear y seleccionar"}));
   expect(onCreateWeek).toHaveBeenCalledWith(expect.objectContaining({startDate:"2026-11-17"}));
   view.rerender(<ExternalBitacoraDialog {...props} weeks={[week]}/>);
   fireEvent.change(screen.getByLabelText("Alumno del padrón *"),{target:{value:student.id}});
   expect(screen.queryByLabelText(/Aprender de esta lectura confirmada/)).toBeNull();
   fireEvent.click(screen.getByRole("button",{name:"Confirmar y registrar"}));
   await waitFor(()=>expect(onSave).toHaveBeenCalledTimes(1));
   expect(onSave.mock.calls[0][0]).toMatchObject({studentId:student.id,weekId:week.id});
   expect(onSave.mock.calls[0][0]).not.toHaveProperty("learnAlias");
 });
 it("no permite entrenar con fotografías desde la interfaz pública",async()=>{
   const onLearn=vi.fn(),onSave=vi.fn(),onCreateWeek=vi.fn(),onClose=vi.fn();
   render(<ExternalBitacoraDialog students={[student]} weeks={[]} school="CBTis No. 134"
     loadPdfJs={vi.fn()} onSave={onSave} onLearn={onLearn}
     onCreateWeek={onCreateWeek} onClose={onClose}/>);
   fireEvent.change(screen.getByLabelText("Cargar PDF, Word o fotografías"),{
     target:{files:[new File(["imagen"],"evidencia-historica.jpg",{type:"image/jpeg"})]}
   });
   expect(await screen.findByText("Datos por confirmar")).toBeTruthy();
   expect(screen.queryByRole("button",{name:"Guardar ejemplo sin registrar entrega"})).toBeNull();
   expect(screen.queryByText(/Aprender de esta lectura/)).toBeNull();
   expect(onLearn).not.toHaveBeenCalled();
 });
});