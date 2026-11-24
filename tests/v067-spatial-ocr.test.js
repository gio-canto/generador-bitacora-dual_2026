import {describe,it,expect,vi} from "vitest";
import {detectFourDayTable,tableCellRect,textFromTableCell,makeExternalTableTranscript} from "../src/services/external-table-layout.js";
import {spatialExternalTableText} from "../src/services/external-table-ocr.js";
import {extractExternalFields,timesFromExternal,suggestExternalWeekPeriod} from "../src/services/external-bitacora.js";
import {readExternalBitacora} from "../src/services/external-ocr.js";

const dates1=["2026-11-17","2026-11-18","2026-11-19","2026-11-20"];
const dates2=["2026-11-10","2026-11-11","2026-11-12","2026-11-13"];

function imageGrid(){
 const width=1000,height=700,pixels=new Uint8ClampedArray(width*height*4);
 pixels.fill(255);
 const column=[60,145,650,770,930],row=[230,250,270,325,390,455,520];
 const plot=(x,y)=>{const i=(Math.round(y)*width+Math.round(x))*4;
   if(i>=0&&i<pixels.length-3)for(let k=0;k<3;k++)pixels[i+k]=0;};
 for(const x of column)for(let y=230;y<=530;y++)for(let pad=-2;pad<=2;pad++)plot(x+pad,y+(x-60)*.01);
 for(const y of row)for(let x=column[0];x<=column.at(-1);x++)for(let pad=-2;pad<=2;pad++)plot(x,y+(x-60)*.01+pad);
 return {width,height,getContext:()=>({getImageData:()=>({data:pixels})})};
}
const center=(r)=>({x0:r.left+8,x1:r.left+r.width-8,y0:r.top+6,y1:r.top+Math.min(r.height-6,25)});
function blocksForRows(grid,dates,times){
 const words=[];
 for(let i=0;i<4;i++){
   const entries=[dates[i],"Actividad "+(i+1),times[i],"Área de prueba"];
   entries.forEach((text,column)=>{
     const rect=tableCellRect(grid,column,i);
     if(rect)words.push({text,bbox:center(rect)});
   });
 }
 return [{paragraphs:[{lines:[{words}]}]}];
}
describe("v0.67.0 · lectura espacial por celdas de PDFs escaneados",()=>{
 it("detecta cinco límites de columnas y las cuatro filas incluso con inclinación",()=>{
   const grid=detectFourDayTable(imageGrid());
   expect(grid).not.toBeNull();
   expect(grid.columns).toHaveLength(5);
   expect(grid.rows).toHaveLength(5);
   expect(grid.columns[2]).toBeGreaterThan(600);
   expect(grid.slope).toBeGreaterThan(0);
   expect(grid.rows[0]).toBeGreaterThan(260);
   expect(tableCellRect(grid,2,0).width).toBeGreaterThan(90);
 });
 it("no intenta leer celdas sin líneas verificables",()=>{
   const canvas={width:1000,height:700,getContext:()=>({getImageData:()=>({data:new Uint8ClampedArray(1000*700*4).fill(255)})})};
   expect(detectFourDayTable(canvas)).toBeNull();
 });
 it("la coordenada de cada palabra determina su columna y fila",()=>{
   const grid=detectFourDayTable(imageGrid());
   const blocks=blocksForRows(grid,dates1,["9a.m.-3p.m.","9a.m.-3p.m.","9a.m.-3p.m.","sin labores"]);
   expect(textFromTableCell(blocks,grid,2,0)).toBe("9a.m.-3p.m.");
   expect(textFromTableCell(blocks,grid,0,1)).toBe(dates1[1]);
   expect(textFromTableCell(blocks,grid,3,0)).toBe("Área de prueba");
 });
 it("recupera 18 horas y viernes sin labores en la primera página",async()=>{
   const canvas=imageGrid(),grid=detectFourDayTable(canvas);
   const blocks=blocksForRows(grid,dates1,["9a.m.-3p.m.","9a.m.-3p.m.","9a.m.-3p.m.","sin labores"]);
   const worker={recognize:vi.fn()};
   const result=await spatialExternalTableText(worker,canvas,{data:{
     text:"Nombre del alumno: Persona de prueba\nEmpresa: Institución de ejemplo\nSemana 12",blocks
   }});
   const parsed=extractExternalFields(result);
   expect(result).toContain("Empresa: Institución de ejemplo");
   expect(parsed.days.map(d=>d.hours)).toEqual(["6","6","6",""]);
   expect(parsed.days[3].status).toBe("sin_labores");
   expect(suggestExternalWeekPeriod(parsed)?.startDate).toBe(dates1[0]);
   expect(worker.recognize).not.toHaveBeenCalled();
 });
 it("recupera 24 horas de 9 a 15 y 7 a 13 en la segunda página",async()=>{
   const canvas=imageGrid(),grid=detectFourDayTable(canvas);
   const blocks=blocksForRows(grid,dates2,["9a.m.-3p.m.","7a.m.-1p.m.","7a.m.-1p.m.","7a.m.-1p.m."]);
   const result=await spatialExternalTableText({recognize:vi.fn()},canvas,{data:{
     text:"Nombre del alumno: Persona de prueba\nEmpresa: Institución de ejemplo\nSemana 11",blocks
   }});
   const parsed=extractExternalFields(result);
   expect(parsed.days.map(d=>d.hours)).toEqual(["6","6","6","6"]);
   expect(suggestExternalWeekPeriod(parsed)?.startDate).toBe(dates2[0]);
 });
 it("acepta 12 y 24 horas sin confundir 23:00 con 11:00",()=>{
   expect(timesFromExternal("09:00-15:00").hours).toBe("6");
   expect(timesFromExternal("17:00-23:00")).toMatchObject({start:"17:00",end:"23:00",hours:"6"});
   expect(timesFromExternal("9a.m.-3p.m.").hours).toBe("6");
   expect(timesFromExternal("7a.m.-1p.m.").hours).toBe("6");
   expect(timesFromExternal("09:00-3:00").hours).toBe("");
   expect(timesFromExternal("Ya.m.-3p.m.").hours).toBe("");
 });
 it("la extracción PDF conserva documentos individuales por página",async()=>{
   const makePage=(text)=>({getTextContent:async()=>({items:text.split("\n").map((str,i)=>({
     str,transform:[1,0,0,1,0,500-i*18],hasEOL:true
   }))}),cleanup:()=>{}});
   const raw1="Nombre del alumno: Persona de prueba\nEmpresa: Empresa de ejemplo\nSemana 12\n17/11/2026\n09:00-15:00\n18/11/2026\n09:00-15:00\n19/11/2026\n09:00-15:00\n20/11/2026\nSin labores";
   const raw2="Nombre del alumno: Persona de prueba\nEmpresa: Empresa de ejemplo\nSemana 11\n10/11/2026\n09:00-15:00\n11/11/2026\n07:00-13:00\n12/11/2026\n07:00-13:00\n13/11/2026\n07:00-13:00";
   const doc={numPages:2,getPage:async i=>makePage(i===1?raw1:raw2),destroy:async()=>{}};
   const pdfjs={getDocument:()=>({promise:Promise.resolve(doc)})};
   const pdf={name:"dos-semanas.pdf",size:100,type:"application/pdf",arrayBuffer:async()=>new ArrayBuffer(8)};
   const response=await readExternalBitacora(pdf,{loadPdfJs:async()=>pdfjs,getWorker:()=>{throw Error("OCR unnecessary")}});
   expect(response.documents).toHaveLength(2);
   expect(response.documents[0].text).toContain("Semana 12");
   expect(response.documents[1].text).toContain("Semana 11");
   expect(extractExternalFields(response.documents[0].text).dates).toContain(dates1[0]);
   expect(extractExternalFields(response.documents[1].text).dates).toContain(dates2[0]);
 });
});
