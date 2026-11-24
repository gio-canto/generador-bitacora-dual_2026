import {extractExternalFields,dateFromExternal,timesFromExternal,DATE_GLOBAL} from "./external-bitacora.js";
import {detectFourDayTable,tableCellRect,textFromTableCell,makeExternalTableTranscript} from "./external-table-layout.js";

/** Las coordenadas de las celdas están en píxeles de canvas, nunca en puntos PDF. */
function canvasCrop(canvas,rect,scale=3){
 if(!rect)return null;
 const crop=document.createElement("canvas");
 crop.width=Math.max(1,Math.round(rect.width*scale));
 crop.height=Math.max(1,Math.round(rect.height*scale));
 const ctx=crop.getContext("2d");
 if(!ctx)return null;
 ctx.imageSmoothingEnabled=true;
 ctx.drawImage(canvas,rect.left,rect.top,rect.width,rect.height,0,0,crop.width,crop.height);
 return crop;
}
function parsedDate(text){
 const source=String(text||"").replace(/\b[Oo](?=\d)/g,"0").replace(/(?<=\d)[Il](?=\d)/g,"1");
 const dates=[...source.matchAll(DATE_GLOBAL)].map(match=>dateFromExternal(match[0])).filter(Boolean);
 return dates.length===1?dates[0]:"";
}
async function readCell(worker,canvas,rect,kind){
 const crop=canvasCrop(canvas,rect);
 if(!crop)return "";
 let configured=false;
 try{
   if(typeof worker.setParameters==="function"){
     await worker.setParameters({
       tessedit_char_whitelist:kind==="hours"?"0123456789aApPmM:.,- /":"0123456789/-.",
       tessedit_pageseg_mode:"6",
     });
     configured=true;
   }
   const result=await worker.recognize(crop);
   return String(result?.data?.text||"").trim();
 }finally{
   crop.width=1;crop.height=1;
   if(configured)await worker.setParameters({
     tessedit_char_whitelist:"",tessedit_pageseg_mode:"3",
   });
 }
}
function validTimeCell(value){
 return /sin labores|suspensi[oó]n de labores|no hubo labores/i.test(value)||
   Boolean(timesFromExternal(value).hours);
}
/** Lee fecha, actividades, horas y área en el orden real de las cuatro celdas. */
export async function spatialExternalTableText(worker,canvas,recognized,{onProgress=()=>{},signal}={}){
 const grid=detectFourDayTable(canvas);
 if(!grid)return null;
 const raw=String(recognized?.data?.text||"");
 const full=extractExternalFields(raw);
 const blocks=recognized?.data?.blocks;
 const rows=[];
 for(let row=0;row<4;row++){
   if(signal?.aborted)throw new Error("Lectura cancelada.");
   onProgress({stage:"table",row:row+1,rows:4});
   let date=textFromTableCell(blocks,grid,0,row);
   let time=textFromTableCell(blocks,grid,2,row);
   const activity=textFromTableCell(blocks,grid,1,row);
   const area=textFromTableCell(blocks,grid,3,row);
   if(!parsedDate(date)){
     try{
       const corrected=await readCell(worker,canvas,tableCellRect(grid,0,row),"date");
       if(parsedDate(corrected))date=corrected;
     }catch(error){if(signal?.aborted)throw error;}
   }
   if(!validTimeCell(time)){
     try{
       const corrected=await readCell(worker,canvas,tableCellRect(grid,2,row),"hours");
       if(validTimeCell(corrected)||timesFromExternal(corrected).start)time=corrected;
     }catch(error){if(signal?.aborted)throw error;}
   }
   rows.push({date:parsedDate(date),time,activity,area});
 }
 if(rows.filter(r=>r.date).length<3)return null;
 const structured=makeExternalTableTranscript({
   name:full.name,company:full.company,
   weekLabel:(raw.match(/\bsemana\s+\d{1,2}\b/i)||[])[0]||"",
   rows,
 });
 const parsed=extractExternalFields(structured);
 if(parsed.recognized<3)return null;
 const oldHours=full.days.filter(d=>d.hours).length;
 const newHours=parsed.days.filter(d=>d.hours).length;
 return newHours>=oldHours?structured:null;
}
