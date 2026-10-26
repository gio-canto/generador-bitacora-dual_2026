/**
 * PDF recibido como bitácora escaneada: rasteriza páginas únicamente al
 * seleccionar un archivo. Nunca altera el PDF original ni el registro local.
 * El SDK de PDF es opcional y se carga bajo demanda para no bloquear Inicio.
 */
export const PDF_SCAN_LIMIT_BYTES=18*1024*1024;
export const PDF_SCAN_LIMIT_PAGES=16;
export const PDFJS_SOURCES=[
  ["https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js",
   "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js"],
  ["https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js",
   "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js"],
];
export const isPdfScanFile=file=>Boolean(file&&(
  file.type==="application/pdf"||/\.pdf$/i.test(file.name||"")
));
/** Distinguir PDF, imagen y archivo no admitido sin depender solo del MIME de iOS. */
export function scanFileKind(file){
  if(!file)return "";
  if(isPdfScanFile(file))return "pdf";
  if(/^image\//i.test(file.type||"")||/\.(png|jpe?g|webp|heic|heif|bmp|gif)$/i.test(file.name||""))return "image";
  return "";
}

/**
 * @param {File} file PDF a leer
 * @param {object} pdfjs Librería PDF.js ya cargada
 * @param {(canvas:HTMLCanvasElement,page:number)=>Promise<string|null>} decode
 * Devuelve payloads únicos de las páginas, sin dar por entregados códigos
 * inexistentes. Solo rasteriza las primeras 16 páginas para acotar memoria.
 */
export async function decodePdfPages(file,pdfjs,decode){
 if(!isPdfScanFile(file))throw new Error("El archivo seleccionado no es PDF.");
 if(file.size>PDF_SCAN_LIMIT_BYTES)throw new Error("El PDF supera el límite de 18 MB.");
 if(!pdfjs?.getDocument)throw new Error("No está disponible el lector de PDF.");
 const loading=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),
   useSystemFonts:true});
 let doc;
 try{
   doc=await loading.promise;
   const total=doc.numPages;
   const scanned=Math.min(total,PDF_SCAN_LIMIT_PAGES);
   const matches=[],seen=new Set();
   for(let n=1;n<=scanned;n++){
     const page=await doc.getPage(n);
     const natural=page.getViewport({scale:1});
     const scale=Math.min(2,1950/Math.max(natural.width,natural.height));
     const viewport=page.getViewport({scale:Math.max(.5,scale)});
     const canvas=document.createElement("canvas");
     canvas.width=Math.ceil(viewport.width);
     canvas.height=Math.ceil(viewport.height);
     try{
       await page.render({canvasContext:canvas.getContext("2d"),viewport}).promise;
       const payload=String(await decode(canvas,n)||"").trim();
       if(payload&&!seen.has(payload)){
         matches.push({payload,page:n});seen.add(payload);
       }
     }finally{
       canvas.width=1;canvas.height=1;
       page.cleanup?.();
     }
   }
   return {matches,pages:scanned,total,truncated:total>PDF_SCAN_LIMIT_PAGES};
 }finally{
   await doc?.destroy?.();
   if(!doc)await loading.destroy?.();
 }
}
