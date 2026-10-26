/**
 * Bitácora semanal: hoja CARTA horizontal (279.4 × 215.9 mm).
 * El arte histórico A4 horizontal se escala uniformemente y centra dentro
 * de un margen de seguridad de 8 mm compatible con impresoras domésticas.
 * No recortar el Data Matrix ni deformar firmas y tablas.
 */
export const LETTER_LANDSCAPE={w:279.4,h:215.9,margin:8};
export const ORIGINAL_LAYOUT={w:297,h:210};
export const LETTER_PDF_POINTS={w:792,h:612};
export function printPlacement(){
 const {w,h,margin}=LETTER_LANDSCAPE;
 const scale=Math.min((w-2*margin)/ORIGINAL_LAYOUT.w,(h-2*margin)/ORIGINAL_LAYOUT.h);
 return {scale,x:(w-ORIGINAL_LAYOUT.w*scale)/2,y:(h-ORIGINAL_LAYOUT.h*scale)/2};
}
export function prepareLetterPage(canvas,p){
 if(!Number.isFinite(p)||p<=0)throw new Error("Escala de impresión inválida.");
 canvas.width=Math.round(LETTER_LANDSCAPE.w*p);
 canvas.height=Math.round(LETTER_LANDSCAPE.h*p);
 const ctx=canvas.getContext("2d");
 ctx.fillStyle="#fff";
 ctx.fillRect(0,0,canvas.width,canvas.height);
 const {scale,x,y}=printPlacement();
 ctx.translate(x*p,y*p);
 ctx.scale(scale,scale);
 return ctx;
}
