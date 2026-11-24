import {afterEach,describe,expect,it,vi} from "vitest";
import {readExternalBitacora} from "../src/services/external-ocr.js";
import {extractExternalFields} from "../src/services/external-bitacora.js";

const digital=[
 "Nombre del alumno: Persona de prueba",
 "Empresa: Institución de ejemplo",
 "Martes 17/11/2026","Actividades: Archivo",
 "Miércoles 18/11/2026","Actividades: Captura",
 "Jueves 19/11/2026","Sin labores",
 "Viernes 20/11/2026","Actividades: Revisión",
].join("\n");
const optical=[
 "Nombre del alumno: Persona de prueba",
 "Empresa: Institución de ejemplo",
 "Martes 17/11/2026","09:00-15:00","Actividades: Archivo",
 "Miércoles 18/11/2026","09:00-15:00","Actividades: Captura",
 "Jueves 19/11/2026","Sin labores",
 "Viernes 20/11/2026","09:00-15:00","Actividades: Revisión",
].join("\n");
const original=document.createElement("canvas").getContext;
afterEach(()=>{vi.restoreAllMocks();});
function documentAndCanvas(){
 const render=vi.fn(()=>({promise:Promise.resolve()}));
 const page={
   getTextContent:async()=>({items:digital.split("\n").map((str,i)=>({
     str,transform:[1,0,0,1,0,480-i*15],hasEOL:true
   }))}),
   getViewport:({scale})=>({width:400*scale,height:300*scale}),
   render,
   cleanup:vi.fn(),
 };
 const doc={numPages:1,getPage:async()=>page,destroy:vi.fn()};
 const pdfjs={getDocument:()=>({promise:Promise.resolve(doc),destroy:vi.fn()})};
 const context={
   drawImage:vi.fn(),
   getImageData:vi.fn(()=>({data:new Uint8ClampedArray(800*600*4).fill(255)})),
 };
 vi.spyOn(HTMLCanvasElement.prototype,"getContext").mockImplementation(()=>context);
 const pdf={name:"original.pdf",type:"application/pdf",size:100,
   arrayBuffer:async()=>new ArrayBuffer(16)};
 return {render,pdf,pdfjs};
}
describe("v0.70 · segunda lectura de PDF con texto incompleto",()=>{
 it("recupera horarios con OCR aunque el PDF ya contenga muchas palabras",async()=>{
   const {pdf,pdfjs,render}=documentAndCanvas();
   const worker={recognize:vi.fn(async()=>({data:{text:optical,confidence:88,blocks:[]}}))};
   const getWorker=vi.fn(async()=>worker);
   const result=await readExternalBitacora(pdf,{loadPdfJs:async()=>pdfjs,getWorker});
   const parsed=extractExternalFields(result.documents[0].text);
   expect(render).toHaveBeenCalled();
   expect(getWorker).toHaveBeenCalledTimes(1);
   expect(parsed.name).toBe("Persona de prueba");
   expect(parsed.company).toBe("Institución de ejemplo");
   expect(parsed.days.map(day=>day.hours)).toEqual(["6","6","","6"]);
   expect(parsed.days[2].status).toBe("sin_labores");
   expect(result.documents[0].method).toBe("mixed");
 });
 it("si el OCR adicional no se inicia, conserva el PDF y advierte al usuario",async()=>{
   const {pdf,pdfjs}=documentAndCanvas();
   const result=await readExternalBitacora(pdf,{
     loadPdfJs:async()=>pdfjs,getWorker:async()=>{throw Error("Motor no disponible");},
   });
   expect(result.documents[0].method).toBe("pdf-text");
   expect(result.documents[0].text).toContain("Persona de prueba");
   expect(result.documents[0].warning).toMatch(/reconocimiento adicional/i);
 });
});
