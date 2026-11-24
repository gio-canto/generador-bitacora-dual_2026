import {PDF_SCAN_LIMIT_BYTES,PDF_SCAN_LIMIT_PAGES,scanFileKind} from "./scanned-pdf.js";
import {EXTERNAL_TEXT_LIMIT,extractExternalFields} from "./external-bitacora.js";
import {spatialExternalTableText} from "./external-table-ocr.js";
import {externalTextNeedsOcr,externalTranscriptQuality,mergeExternalPageText} from "./external-merge.js";

/** Motor OCR descargado sólo al solicitar lectura externa. */
export const OCR_SOURCES=[
 "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js",
 "https://unpkg.com/tesseract.js@5/dist/tesseract.min.js",
];
export const EXTERNAL_IMAGE_LIMIT_BYTES=12*1024*1024;
export const EXTERNAL_DOCX_LIMIT_BYTES=12*1024*1024;
export const DOCX_SOURCES=[
 "https://cdn.jsdelivr.net/npm/mammoth@1.13.0/mammoth.browser.min.js",
 "https://unpkg.com/mammoth@1.13.0/mammoth.browser.min.js",
];
export function externalFileKind(file){
 if(!file)return "";
 if(/\.docx$/i.test(file.name||""))return "docx";
 return scanFileKind(file);
}
let mammothLoader=null;
async function ensureDocxReader(){
 if(globalThis.mammoth?.extractRawText)return globalThis.mammoth;
 if(!mammothLoader)mammothLoader=(async()=>{
   for(const url of DOCX_SOURCES){
     try{await scriptOnce(url);if(globalThis.mammoth?.extractRawText)return globalThis.mammoth;}
     catch{/* Intentar otro servidor. */}
   }
   throw new Error("No se pudo cargar el lector de documentos Word.");
 })().catch(e=>{mammothLoader=null;throw e});
 return mammothLoader;
}
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
/** Puntuación conservadora: prioriza fechas y jornadas reconocidas sobre el texto de relleno. */
export function externalOcrQuality(result){
 const raw=String(result?.data?.text||"");
 if(!raw.trim())return 0;
 const fields=extractExternalFields(raw);
 const confidence=Number(result?.data?.confidence);
 return fields.recognized*20+fields.dates.length*4+fields.days.filter(day=>day.hours).length*9+
   (fields.name?8:0)+(fields.company?4:0)+
   (Number.isFinite(confidence)?Math.max(0,Math.min(100,confidence))/25:0);
}
/** Segunda pasada de alto contraste para documentos fotografiados con tintes azules/sombras. */
export function enhanceExternalPhotoCanvas(canvas){
 const copy=document.createElement("canvas");
 copy.width=canvas.width;copy.height=canvas.height;
 const context=copy.getContext("2d",{willReadFrequently:true});
 if(!context)return null;
 context.drawImage(canvas,0,0);
 let image;
 try{image=context.getImageData(0,0,copy.width,copy.height);}
 catch{return null;}
 const pixels=image.data,histogram=new Uint32Array(256);
 for(let i=0;i<pixels.length;i+=4){
   const brightness=Math.round(.299*pixels[i]+.587*pixels[i+1]+.114*pixels[i+2]);
   histogram[brightness]++;
 }
 const total=pixels.length/4;
 const quantile=part=>{
   let count=0;
   for(let i=0;i<256;i++){count+=histogram[i];if(count>=total*part)return i;}
   return 255;
 };
 const low=quantile(.03),high=quantile(.97);
 if(high<=low+16)return null;
 const factor=255/(high-low);
 for(let i=0;i<pixels.length;i+=4){
   const v=Math.round(.299*pixels[i]+.587*pixels[i+1]+.114*pixels[i+2]);
   const stretch=Math.max(0,Math.min(255,Math.round((v-low)*factor)));
   pixels[i]=stretch;pixels[i+1]=stretch;pixels[i+2]=stretch;
 }
 context.putImageData(image,0,0);
 return copy;
}
async function recognizeExternalPhoto(worker,canvas){
 const first=await worker.recognize(canvas,{}, {text:true,blocks:true});
 const fields=extractExternalFields(first?.data?.text||"");
 const confidence=Number(first?.data?.confidence);
 if(fields.recognized>=3&&fields.name&&!externalTextNeedsOcr(first?.data?.text||"")&&(!Number.isFinite(confidence)||confidence>=55))
   return first;
 let enhanced;
 try{enhanced=enhanceExternalPhotoCanvas(canvas);}
 catch{return first;}
 if(!enhanced)return first;
 try{
   const next=await worker.recognize(enhanced,{}, {text:true,blocks:true});
   const best=externalOcrQuality(next)>externalOcrQuality(first)?next:first;
   const other=best===first?next:first;
   const merged=mergeExternalPageText(String(best.data?.text||""),String(other.data?.text||""));
   return merged&&merged!==best.data?.text?{...best,data:{...best.data,text:merged}}:best;
 }finally{enhanced.width=1;enhanced.height=1;}
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
 const kind=externalFileKind(file);
 if(!kind)throw new Error("Este tipo de archivo no es compatible. Usa PDF, JPG, PNG o una fotografía.");
 if(kind==="pdf"&&file.size>PDF_SCAN_LIMIT_BYTES)throw new Error("El PDF supera el máximo de 18 MB.");
 if(kind==="docx"&&file.size>EXTERNAL_DOCX_LIMIT_BYTES)throw new Error("El Word supera el máximo de 12 MB.");
 if(kind==="image"&&file.size>EXTERNAL_IMAGE_LIMIT_BYTES)throw new Error("La imagen supera el máximo de 12 MB.");
 if(signal?.aborted)throw new Error("Lectura cancelada.");
 let pages=1,pdfText=0,ocrText=0,method="ocr",truncated=false;
 const chunks=[],documents=[];
 if(kind==="docx"){
   const mammoth=await ensureDocxReader();
   onProgress({stage:"docx",page:1,pages:1});
   const result=await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});
   chunks.push(String(result?.value||""));
   documents.push({page:1,text:String(result?.value||""),method:"docx-text"});
   method="docx-text";
 }else if(kind==="image"){
   const worker=await getWorker();
   onProgress({stage:"ocr",page:1,pages:1});
   const canvas=await imageToCanvas(file);
   try{
     const recognized=await recognizeExternalPhoto(worker,canvas);
     const structured=await spatialExternalTableText(worker,canvas,recognized,{onProgress,signal});
     const pageText=mergeExternalPageText(
       String(recognized?.data?.text||""),structured||"");
     chunks.push(pageText);
     documents.push({page:1,text:pageText,method:"ocr"});
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
         const readable=text.replace(/\s/g,"").length>=65;
         if(readable&&!externalTextNeedsOcr(text)){
           chunks.push(text);documents.push({page:i,text,method:"pdf-text"});pdfText++;
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
           const result=await recognizeExternalPhoto(worker,canvas);
           const structured=await spatialExternalTableText(worker,canvas,result,{onProgress,signal});
           const recognizedText=mergeExternalPageText(String(result?.data?.text||""),structured||"");
           const pageText=mergeExternalPageText(text,recognizedText);
           chunks.push(pageText);
           documents.push({page:i,text:pageText,method:readable?"mixed":"ocr"});
           ocrText++;
         }catch(error){
           if(signal?.aborted||!readable)throw error;
           // El texto incrustado sigue siendo utilizable aunque falle la lectura OCR.
           chunks.push(text);
           documents.push({page:i,text,method:"pdf-text",
             warning:"El reconocimiento adicional no se completó en esta página; revisa fechas y horarios."});
           pdfText++;
         }finally{canvas.width=1;canvas.height=1;}
       }finally{page.cleanup?.();}
     }
   }finally{await doc?.destroy?.();if(!doc)await loading.destroy?.();}
   method=ocrText&&pdfText?"mixed":pdfText?"pdf-text":"ocr";
 }
 const text=chunks.join("\n\n").slice(0,EXTERNAL_TEXT_LIMIT);
 if(!text.trim())throw new Error("No se reconoció texto. Prueba una fotografía más nítida o captura la entrega manualmente.");
 return {text,pages,method,truncated,documents};
}