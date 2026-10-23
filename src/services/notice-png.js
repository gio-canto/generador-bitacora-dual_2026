import {loadDossierLogo} from "./student-dossier-report.js";

export const NOTICE_FORMATS=[
  {id:"post",label:"Publicación vertical · 1080 × 1350",width:1080,height:1350},
  {id:"square",label:"Cuadrado · 1080 × 1080",width:1080,height:1080},
  {id:"story",label:"Historia · 1080 × 1920",width:1080,height:1920},
];
export const NOTICE_THEMES=[
  {id:"editorial",label:"Institucional claro"},
  {id:"night",label:"Azul Oxford"},
  {id:"warm",label:"Editorial cálido"},
];
export const NOTICE_TEMPLATES=[
  {id:"reminder",label:"Recordatorio de entrega",title:"Último día de entrega",
    subtitle:"BITÁCORAS DE EDUCACIÓN DUAL",message:"Recuerda entregar las semanas indicadas antes de la fecha límite."},
  {id:"announcement",label:"Comunicado general",title:"Aviso importante",
    subtitle:"COMUNICADO",message:"Escribe aquí el mensaje que deseas compartir."},
  {id:"release",label:"Novedades del Generador",title:"Nueva versión disponible",
    subtitle:"ACTUALIZACIÓN DEL SISTEMA",message:"Consulta las nuevas funciones del Generador de Bitácora Dual."},
  {id:"custom",label:"Aviso personalizado",title:"Un aviso para ti",
    subtitle:"AVISO",message:"Escribe aquí tu aviso."},
];
const clean=s=>String(s??"").trim();
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const label=(ctx,text,x,y,size,color,weight=500)=>{
  ctx.font=weight+" "+size+"px Arial, Helvetica, sans-serif";
  ctx.fillStyle=color;
  ctx.fillText(text,x,y);
};
export function noticeFilename(item,format="post"){
 const base=clean(item?.title||"aviso").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
   .replace(/[^a-z0-9]+/gi,"-").replace(/^-|-$/g,"").slice(0,60).toLowerCase()||"aviso";
 return "aviso-"+base+"-"+format+".png";
}
export function noticeModel(item,overrides={}){
 return {
   title:clean(item?.title)||"Aviso",
   subtitle:clean(item?.subtitle)||(item?.kind==="release"?"NOVEDADES DEL SISTEMA":
     item?.kind==="reminder"?"FECHA DE ENTREGA":"COMUNICADO"),
   message:clean(item?.message)||"",
   footer:clean(item?.footer)||"GENERADOR DE BITÁCORA DUAL",
   audienceLabel:clean(item?.audienceLabel),
   dueLabel:clean(item?.dueLabel),
   kind:item?.kind||"custom",
   format:NOTICE_FORMATS.some(x=>x.id===(overrides.format||item?.format))
     ?(overrides.format||item.format):"post",
   theme:NOTICE_THEMES.some(x=>x.id===(overrides.theme||item?.theme))
     ?(overrides.theme||item.theme):"editorial",
 };
}
function palette(theme){
 if(theme==="night")return {bg:"#101D33",ink:"#FFFFFF",muted:"#D4DFED",accent:"#89B8EF",panel:"#1C2F4C",rule:"#405779",stamp:"#C9E0FC"};
 if(theme==="warm")return {bg:"#F1ECE4",ink:"#332B26",muted:"#726357",accent:"#9B483B",panel:"#FFFBF5",rule:"#D8C9B9",stamp:"#9B483B"};
 return {bg:"#F5F7FA",ink:"#12233B",muted:"#516277",accent:"#174F91",panel:"#FFFFFF",rule:"#D5DEE9",stamp:"#174F91"};
}
function wrapped(ctx,words,width,size,weight=500){
 ctx.font=weight+" "+size+"px Arial, Helvetica, sans-serif";
 const lines=[];let line="";
 for(const word of clean(words).split(/\s+/).filter(Boolean)){
   const next=line?line+" "+word:word;
   if(line&&ctx.measureText(next).width>width){lines.push(line);line=word;}
   else line=next;
 }
 if(line)lines.push(line);
 return lines;
}
function fitText(ctx,text,width,initial,min,maxLines,weight=700){
 for(let size=initial;size>=min;size-=2){
   const lines=wrapped(ctx,text,width,size,weight);
   if(lines.length<=maxLines)return {lines,size};
 }
 const size=min,lines=wrapped(ctx,text,width,size,weight);
 if(lines.length>maxLines){
   const clipped=lines.slice(0,maxLines);
   let last=clipped[maxLines-1]||"";
   ctx.font=weight+" "+size+"px Arial, Helvetica, sans-serif";
   while(last.length&&ctx.measureText(last+"…").width>width)last=last.slice(0,-1);
   clipped[maxLines-1]=last+"…";
   return {lines:clipped,size};
 }
 return {lines,size};
}
function drawLogo(ctx,img,x,y,maxW,maxH){
 if(!img)throw Error("No se pudo cargar el logotipo oficial.");
 const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;
 if(!w||!h)throw Error("Logotipo no válido.");
 const scale=Math.min(maxW/w,maxH/h);
 ctx.drawImage(img,x,y+(maxH-h*scale)/2,w*scale,h*scale);
}
/** Canvas drawing uses only local data. Returns the canvas for preview or PNG export. */
export function drawNoticeCanvas(canvas,item,{logo,format,theme}={}){
 const notice=noticeModel(item,{format,theme});
 const selected=NOTICE_FORMATS.find(x=>x.id===notice.format);
 canvas.width=selected.width;canvas.height=selected.height;
 const ctx=canvas.getContext("2d");
 if(!ctx)throw Error("El navegador no admite la vista previa del aviso.");
 const W=selected.width,H=selected.height,p=palette(notice.theme);
 ctx.fillStyle=p.bg;ctx.fillRect(0,0,W,H);
 // The artwork uses a flexible vertical composition with restrained institutional shapes.
 ctx.fillStyle=p.accent;ctx.fillRect(0,0,W,17);
 ctx.globalAlpha=.065;
 ctx.fillStyle=p.accent;
 ctx.beginPath();ctx.arc(W+85,H*.2,W*.57,0,Math.PI*2);ctx.fill();
 ctx.beginPath();ctx.arc(-105,H*.85,W*.4,0,Math.PI*2);ctx.fill();
 ctx.globalAlpha=1;
 const margin=72,top=H===1920?90:72,logoHeight=104;
 drawLogo(ctx,logo,margin,top,234,logoHeight);
 label(ctx,"G E N E R A D O R   D E   B I T Á C O R A   D U A L",
   margin,top+145,20,p.muted,700);
 ctx.fillStyle=p.rule;ctx.fillRect(margin,top+174,W-margin*2,2);
 const contentTop=H===1920?top+375:top+315;
 const type=notice.subtitle.toLocaleUpperCase("es-MX");
 label(ctx,type,margin,contentTop,25,p.accent,750);
 const title=fitText(ctx,notice.title,W-margin*2,86,49,H===1080?3:4,750);
 const titleHeight=title.size*1.16;
 const titleY=contentTop+100;
 title.lines.forEach((row,i)=>label(ctx,row,margin,titleY+i*titleHeight,title.size,p.ink,750));
 const endTitle=titleY+(title.lines.length-1)*titleHeight;
 const availableHeight=Math.max(160,(H===1080?H-280:H-365)-endTitle);
 const messageSize=clamp(H===1080?33:38,29,41);
 const maxLines=Math.max(3,Math.floor(availableHeight/(messageSize*1.48)));
 const textFit=fitText(ctx,notice.message,W-margin*2-50,messageSize,27,maxLines,450);
 const bodyY=endTitle+100;
 textFit.lines.forEach((row,i)=>label(ctx,row,margin,bodyY+i*textFit.size*1.48,
   textFit.size,p.muted,450));
 // Recipient/date strip is optional, never invent a deadline.
 const bottom=H-145;
 if(notice.audienceLabel||notice.dueLabel){
   const stripH=notice.audienceLabel&&notice.dueLabel?115:80;
   const stripY=H-300-stripH;
   ctx.fillStyle=p.panel;ctx.beginPath();ctx.roundRect(margin,stripY,W-margin*2,stripH,20);ctx.fill();
   let y=stripY+44;
   if(notice.dueLabel){label(ctx,notice.dueLabel,margin+25,y,26,p.accent,750);y+=43;}
   if(notice.audienceLabel)label(ctx,"PARA: "+notice.audienceLabel,margin+25,y,21,p.muted,650);
 }
 ctx.fillStyle=p.rule;ctx.fillRect(margin,bottom-30,W-margin*2,2);
 const footer=fitText(ctx,notice.footer,W-margin*2,23,17,2,600);
 footer.lines.forEach((row,i)=>label(ctx,row,margin,bottom+i*28,footer.size,p.ink,600));
 label(ctx,"GD",W-margin-54,bottom+2,25,p.stamp,800);
 return canvas;
}
const dataBytes=dataUrl=>{
 const base64=String(dataUrl||"").split(",")[1]||"";
 const binary=atob(base64);
 const result=new Uint8Array(binary.length);
 for(let i=0;i<binary.length;i++)result[i]=binary.charCodeAt(i);
 return result;
};
function linkDownload(blob,name){
 const url=URL.createObjectURL(blob);
 const a=document.createElement("a");a.href=url;a.download=name;
 a.style.display="none";document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
}
export async function renderNoticePng(item,{logo,format,theme}={}){
 const art=logo||await loadDossierLogo();
 const canvas=document.createElement("canvas");
 drawNoticeCanvas(canvas,item,{logo:art,format,theme});
 const dataUrl=canvas.toDataURL("image/png");
 return {filename:noticeFilename(item,format||item.format),bytes:dataBytes(dataUrl),
   dataUrl,width:canvas.width,height:canvas.height};
}
export async function downloadNoticePng(item,options={}){
 const result=await renderNoticePng(item,options);
 if(options.download!==false)linkDownload(new Blob([result.bytes],{type:"image/png"}),result.filename);
 return result;
}
// Minimal standards-compliant ZIP (stored, no compression). Avoids a new dependency.
function crc32(bytes){
 let crc=~0;
 for(const byte of bytes){
   crc^=byte;
   for(let j=0;j<8;j++)crc=(crc>>>1)^((crc&1)?0xEDB88320:0);
 }
 return (~crc)>>>0;
}
function zipFiles(files){
 const writer=[];
 const push16=n=>{writer.push(n&255,(n>>>8)&255);};
 const push32=n=>{push16(n&65535);push16((n>>>16)&65535);};
 const encoder=new TextEncoder(),meta=[];
 for(const f of files){
   const name=encoder.encode(f.filename),bytes=f.bytes,offset=writer.length,crc=crc32(bytes);
   push32(0x04034b50);push16(20);push16(0x0800);push16(0);push16(0);push16(0);
   push32(crc);push32(bytes.length);push32(bytes.length);push16(name.length);push16(0);
   writer.push(...name);
   for(let i=0;i<bytes.length;i++)writer.push(bytes[i]);
   meta.push({name,bytes,offset,crc});
 }
 const start=writer.length;
 for(const m of meta){
   push32(0x02014b50);push16(20);push16(20);push16(0x0800);push16(0);
   push16(0);push16(0);push32(m.crc);push32(m.bytes.length);push32(m.bytes.length);
   push16(m.name.length);push16(0);push16(0);push16(0);push16(0);push32(0);push32(m.offset);
   writer.push(...m.name);
 }
 const size=writer.length-start;
 push32(0x06054b50);push16(0);push16(0);push16(meta.length);push16(meta.length);
 push32(size);push32(start);push16(0);
 return new Uint8Array(writer);
}
export async function downloadNoticeBatch(items,options={}){
 if(!items.length)throw Error("No hay avisos para descargar.");
 const logo=options.logo||await loadDossierLogo();
 const results=[];
 for(let i=0;i<items.length;i++){
   const art=await renderNoticePng(items[i],{logo,format:options.format,theme:options.theme});
   results.push({...art,filename:String(i+1).padStart(2,"0")+"-"+art.filename});
 }
 const archive=zipFiles(results);
 if(options.download!==false)
   linkDownload(new Blob([archive],{type:"application/zip"}),"avisos-generador-dual.zip");
 return {count:results.length,filename:"avisos-generador-dual.zip",bytes:archive};
}
