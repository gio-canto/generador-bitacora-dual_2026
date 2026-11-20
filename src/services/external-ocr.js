import {PDF_SCAN_LIMIT_BYTES,PDF_SCAN_LIMIT_PAGES,scanFileKind} from "./scanned-pdf.js";
import {EXTERNAL_TEXT_LIMIT} from "./external-bitacora.js";

/** Motor OCR descargado sólo al solicitar lectura externa. */
export const OCR_SOURCES=[
 "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js",
 "https://unpkg.com/tesseract.js@5/dist/tesseract.min.js",
];
export const EXTERNAL_IMAGE_LIMIT_BYTES=12*1024*1024;
let loader=null;
function scriptOnce(src){
 return new Promise((resolve,reject)=>{
   const tag=document.createElement("script");
   tag.src=src;tag.async=true;
   const timeout=setTimeout(()=>{tag.remove();reject(new Error("La descarga del lector OCR excedió el tiempo permitido."));},25000);
   tag.onload=()=>{clearTimeout(timeout);resolve();};
   tag.onerror=()=>{clearTimeout(timeout);tag.remove();reject(new Error("No fue posible descargar el motor OCR."));};
   document.head.appendChild(tag);
 });
}
export async function ensureExternalOcr(){
 if(globalThis.Tesseract?.createWorker)return globalThis.Tesseract;
 if(!loader)loader=(async()=>{
   for(const src of OCR_SOURCES){
     try{await scriptOnce(src);if(globalThis.Tesseract?.createWorker)return globalThis.Tesseract;}
     catch{/* Intentar origen alternativo. */}
   }
   throw new Error("No se pudo iniciar OCR. Comprueba tu conexión e intenta nuevamente.");
 })().catch(e=>{loader=null;throw e});
 return loader;
}
export async function createExternalWorker(onProgress=()=>{}){
 const tesseract=await ensureExternalOcr();
 return tesseract.createWorker(["spa","eng"],1,{
   logger:event=>{if(event?.status==="recognizing text")onProgress(Math.round((event.progress||0)*100));}
 });
}
async function imageToCanvas(file){
 let image,cleanup=()=>{},width,height;
 try {
   if(typeof createImageBitmap==="function"){
     image=await createImageBitmap(file);
     cleanup=()=>image.close?.();
     width=image.width;height=image.height;
   }else throw new Error("usar imagen HTML");
 }catch{
   const url=URL.createObjectURL(file);
   try{
     image=new Image();
     image.src=url;
     if(image.decode)await image.decode();
     else await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;});
     width=image.naturalWidth;height=image.naturalHeight;
   }finally{cleanup=()=>URL.revokeObjectURL(url);}
 }
 if(!width||!height){cleanup();throw new Error("No se pudo abrir la fotografía.");}
 const scale=Math.min(1,1900/Math.max(width,height));
 const canvas=document.createElement("canvas");
 canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));
 try{canvas.getContext("2d",{willReadFrequently:true}).drawImage(image,0,0,canvas.width,canvas.height);}
 finally{cleanup();}
 return canvas;
}
function textLinesFromPdf(items){
 const lines=[];let last=null;
 for(const item of items||[]){
   const text=String(item.str||"").trim();
   if(!text)continue;
   const y=Number(item.transform?.[5]);
   if(!last||(!Number.isFinite(y))||Math.abs(last.y-y)>3||item.hasEOL){
     last={y:Number.isFinite(y)?y:0,text};lines.push(last);
   }else last.text+=" "+text;
 }
 return lines.map(x=>x.text).join("\n");
}
export async function readExternalBitacora(file,{loadPdfJs,getWorker,onProgress=()=>{},signal}={}){
 if(!file)throw new Error("Selecciona un archivo.");
 const kind=scanFileKind(file);
 if(!kind)throw new Error("Este tipo de archivo no es compatible. Usa PDF, JPG, PNG o una fotografía.");
 if(kind==="pdf"&&file.size>PDF_SCAN_LIMIT_BYTES)throw new Error("El PDF supera el máximo de 18 MB.");
 if(kind==="image"&&file.size>EXTERNAL_IMAGE_LIMIT_BYTES)throw new Error("La imagen supera el máximo de 12 MB.");
 if(signal?.aborted)throw new Error("Lectura cancelada.");
 let pages=1,pdfText=0,ocrText=0,method="ocr",truncated=false;
 const chunks=[];
 if(kind==="image"){
   const worker=await getWorker();
   onProgress({stage:"ocr",page:1,pages:1});
   const canvas=await imageToCanvas(file);
   try{
     const recognized=await worker.recognize(canvas);
     chunks.push(String(recognized?.data?.text||""));
     ocrText++;
   }finally{canvas.width=1;canvas.height=1;}
 }else{
   const pdfjs=await loadPdfJs();
   const loading=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),useSystemFonts:true});
   let doc;
   try{
     doc=await loading.promise;
     pages=Math.min(doc.numPages,PDF_SCAN_LIMIT_PAGES);
     truncated=doc.numPages>pages;
     for(let i=1;i<=pages;i++){
       if(signal?.aborted)throw new Error("Lectura cancelada.");
       onProgress({stage:"pdf",page:i,pages});
       const page=await doc.getPage(i);
       try{
         const content=await page.getTextContent();
         const text=textLinesFromPdf(content.items);
         if(text.replace(/\s/g,"").length>=65){
           chunks.push(text);pdfText++;
           continue;
         }
         const natural=page.getViewport({scale:1});
         const scale=Math.min(2,1800/Math.max(natural.width,natural.height));
         const viewport=page.getViewport({scale:Math.max(.5,scale)});
         const canvas=document.createElement("canvas");
         canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
         try{
           await page.render({canvasContext:canvas.getContext("2d"),viewport}).promise;
           const worker=await getWorker();
           onProgress({stage:"ocr",page:i,pages});
           const result=await worker.recognize(canvas);
           chunks.push(String(result?.data?.text||text));ocrText++;
         }finally{canvas.width=1;canvas.height=1;}
       }finally{page.cleanup?.();}
     }
   }finally{await doc?.destroy?.();if(!doc)await loading.destroy?.();}
   method=ocrText&&pdfText?"mixed":pdfText?"pdf-text":"ocr";
 }
 const text=chunks.join("\n\n").slice(0,EXTERNAL_TEXT_LIMIT);
 if(!text.trim())throw new Error("No se reconoció texto. Prueba una fotografía más nítida o captura la entrega manualmente.");
 return {text,pages,method,truncated};
}