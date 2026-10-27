import {describe,it,expect,vi,afterEach} from "vitest";
import {createCanvas} from "@napi-rs/canvas";
import {decodePdfPages,scanFileKind,PDF_SCAN_LIMIT_BYTES,PDF_SCAN_LIMIT_PAGES} from "../src/services/scanned-pdf.js";

afterEach(()=>vi.restoreAllMocks());
const pdf=()=>({
  name:"bitacora.pdf",type:"application/pdf",size:2048,
  arrayBuffer:async()=>new Uint8Array([37,80,68,70]).buffer
});
function pdfjs(numPages){
  const cleaned=[],destroy=vi.fn(async()=>{}),rendered=[];
  const lib={getDocument:vi.fn(()=>({promise:Promise.resolve({
    numPages,
    getPage:async n=>({
      getViewport:({scale})=>({width:700*scale,height:520*scale}),
      render:({canvasContext,viewport})=>{
        rendered.push({n,viewport,canvasContext});
        return {promise:Promise.resolve()};
      },
      cleanup:()=>cleaned.push(n),
    }),
    destroy,
  })}))};
  return {lib,cleaned,destroy,rendered};
}
describe("Escanear bitácora desde PDF multipágina",()=>{
 it("distingue imágenes y PDFs por MIME o extensión sin aceptar otros archivos",()=>{
   expect(scanFileKind(pdf())).toBe("pdf");
   expect(scanFileKind({type:"",name:"BITACORA.PDF"})).toBe("pdf");
   expect(scanFileKind({type:"image/jpeg",name:"foto.jpg"})).toBe("image");
   expect(scanFileKind({type:"",name:"foto.PNG"})).toBe("image");
   expect(scanFileKind({type:"text/plain",name:"datos.txt"})).toBe("");
 });
 it("rasteriza páginas sin repetir códigos y libera cada canvas y documento",async()=>{
   const real=document.createElement.bind(document);
   vi.spyOn(document,"createElement").mockImplementation(name=>name==="canvas"?createCanvas(1,1):real(name));
   const fake=pdfjs(4);
   const out=await decodePdfPages(pdf(),fake.lib,async(canvas,n)=>
     n===1?"DUAL-ABC":n===2?"":n===3?"DUAL-ABC":"DUAL-XYZ");
   expect(out).toEqual({matches:[{payload:"DUAL-ABC",page:1},{payload:"DUAL-XYZ",page:4}],
     pages:4,total:4,truncated:false});
   expect(fake.rendered).toHaveLength(4);
   expect(fake.cleaned).toEqual([1,2,3,4]);
   expect(fake.destroy).toHaveBeenCalledTimes(1);
   expect(fake.rendered.every(p=>p.viewport.width<=1950)).toBe(true);
 });
 it("limita tamaño y páginas para evitar que Safari agote memoria",async()=>{
   const fake=pdfjs(PDF_SCAN_LIMIT_PAGES+5);
   const real=document.createElement.bind(document);
   vi.spyOn(document,"createElement").mockImplementation(name=>name==="canvas"?createCanvas(1,1):real(name));
   const out=await decodePdfPages(pdf(),fake.lib,async()=>null);
   expect(out.pages).toBe(PDF_SCAN_LIMIT_PAGES);
   expect(out.truncated).toBe(true);
   expect(fake.rendered).toHaveLength(PDF_SCAN_LIMIT_PAGES);
   await expect(decodePdfPages({...pdf(),size:PDF_SCAN_LIMIT_BYTES+1},fake.lib,async()=>null))
     .rejects.toThrow("18 MB");
 });
});
