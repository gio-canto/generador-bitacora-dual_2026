import {loadDossierLogo} from "./student-dossier-report.js";

export const NOTICE_FORMATS=[
  {id:"post",label:"Publicación vertical · 1080 × 1350",width:1080,height:1350},
  {id:"square",label:"Cuadrado · 1080 × 1080",width:1080,height:1080},
  {id:"story",label:"Historia · 1080 × 1920",width:1080,height:1920},
];
export const NOTICE_THEMES=[
  {id:"editorial",label:"Editorial institucional · A + B"},
  {id:"night",label:"Azul Oxford · A + B"},
  {id:"warm",label:"Editorial cálido · A + B"},
];
export const NOTICE_TEMPLATES=[
  {id:"reminder",label:"Entrega de bitácoras",title:"Entrega de bitácoras",
    subtitle:"",message:"Entrega las bitácoras indicadas antes de la fecha límite."},
  {id:"announcement",label:"Comunicado general",title:"Aviso importante",
    subtitle:"",message:""},
  {id:"release",label:"Novedades de la aplicación",title:"Nueva versión disponible",
    subtitle:"",message:"Consulta las nuevas funciones disponibles."},
  {id:"custom",label:"Aviso personalizado",title:"",subtitle:"",message:""},
];

const clean=value=>String(value??"").trim();
const font=(ctx,size,weight=500)=>{ctx.font=weight+" "+size+"px Arial, Helvetica, sans-serif";};
const txt=(ctx,value,x,y,size,color,weight=500)=>{
  font(ctx,size,weight);ctx.fillStyle=color;ctx.fillText(value,x,y);
};
const line=(ctx,x,y,width,color,height=2)=>{
  ctx.fillStyle=color;ctx.fillRect(x,y,width,height);
};
const labelCategory=kind=>kind==="reminder"?"ENTREGA":
  kind==="release"?"ACTUALIZACIÓN":"AVISO";
const upper=text=>text.toLocaleUpperCase("es-MX");

export function noticeFilename(item,format="post"){
 const base=clean(item?.title||"aviso").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
   .replace(/[^a-z0-9]+/gi,"-").replace(/^-|-$/g,"").slice(0,60).toLowerCase()||"aviso";
 return "aviso-"+base+"-"+format+".png";
}

export function noticeModel(item,overrides={}){
 const weekLabels=Array.isArray(item?.weekLabels)&&item.weekLabels.length?
   item.weekLabels:Array.isArray(item?.weeks)?item.weeks.map(week=>week?.label):[];
 const dueAt=typeof item?.dueAt==="string"&&Number.isFinite(Date.parse(item.dueAt))
   ?item.dueAt:"";
 const displayDate=/^\d{4}-\d{2}-\d{2}$/.test(item?.displayDate||"")?item.displayDate:"";
 return {
   title:clean(item?.title)||"Aviso",
   subtitle:clean(item?.subtitle),
   message:clean(item?.message),
   footer:/^generador de bitácora dual$/i.test(clean(item?.footer))?"":clean(item?.footer),
   audienceLabel:clean(item?.audienceLabel),
   weeksLabel:weekLabels.map(clean).filter(Boolean).join(" · "),
   dueAt,displayDate,
   dueLabel:clean(item?.dueLabel)||(dueAt?"ENTREGA HASTA EL "+
     new Intl.DateTimeFormat("es-MX",{
       day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"
     }).format(new Date(dueAt)).toLocaleUpperCase("es-MX"):
     displayDate?"FECHA: "+displayDate.split("-").reverse().join("/"):""),
   kind:item?.kind||"custom",
   format:NOTICE_FORMATS.some(x=>x.id===(overrides.format||item?.format))
     ?(overrides.format||item.format):"post",
   theme:NOTICE_THEMES.some(x=>x.id===(overrides.theme||item?.theme))
     ?(overrides.theme||item.theme):"editorial",
 };
}

// Una sola retícula editorial para los tres tamaños y paletas cromáticas.
function palette(theme){
 if(theme==="night")return {
   paper:"#122139",ink:"#FFFFFF",muted:"#CFD9E6",accent:"#AACBEC",
   rule:"#445A75",date:"#E6EFF8",dateInk:"#142B47",dateMuted:"#435D79",stripe:"#4C82B4"
 };
 if(theme==="warm")return {
   paper:"#FCF9F3",ink:"#302C29",muted:"#655E55",accent:"#95513F",
   rule:"#D7C8B9",date:"#37302D",dateInk:"#FFF9F3",dateMuted:"#E0D2C5",stripe:"#B16852"
 };
 return {
   paper:"#FCFDFE",ink:"#172C49",muted:"#4D5F72",accent:"#20517F",
   rule:"#C9D5E1",date:"#172C49",dateInk:"#FFFFFF",dateMuted:"#D6E2EF",stripe:"#4C8CBF"
 };
}

// Calcula cortes por ancho real, no por número estimado de caracteres.
// No se recortan ni estiran palabras para que los PNG conserven legibilidad.
function wrapText(ctx,value,maxWidth,size,weight=500){
 font(ctx,size,weight);
 const result=[];
 const paragraphs=clean(value).split(/\r?\n/);
 for(const paragraph of paragraphs){
   const words=paragraph.split(/\s+/).filter(Boolean);
   let row="";
   const pushWord=word=>{
     let part="";
     for(const char of [...word]){
       if(part&&ctx.measureText(part+char).width>maxWidth){
         if(row){result.push(row);row="";}
         result.push(part);part=char;
       }else part+=char;
     }
     return part;
   };
   for(const rawWord of words){
     const word=ctx.measureText(rawWord).width>maxWidth?pushWord(rawWord):rawWord;
     if(!word)continue;
     const combined=row?row+" "+word:word;
     if(row&&ctx.measureText(combined).width>maxWidth){
       result.push(row);row=word;
     }else row=combined;
   }
   if(row)result.push(row);
 }
 return result;
}
function fitted(ctx,text,width,initial,min,maxLines,maxHeight,weight=500,leading=1.25){
 if(!clean(text))return {lines:[],size:initial,height:0,leading};
 for(let size=initial;size>=min;size-=2){
   const lines=wrapText(ctx,text,width,size,weight);
   const height=lines.length*size*leading;
   if(lines.length<=maxLines&&height<=maxHeight){
     return {lines,size,height,leading};
   }
 }
 return null;
}
function drawBlock(ctx,block,x,top,color,weight=500){
 block.lines.forEach((row,index)=>txt(ctx,row,x,top+block.size+
   index*block.size*block.leading,block.size,color,weight));
}
function drawLogo(ctx,img,x,y,maxW,maxH){
 if(!img)throw Error("No se pudo cargar el logotipo oficial.");
 const w=img.naturalWidth||img.width,h=img.naturalHeight||img.height;
 if(!w||!h)throw Error("Logotipo no válido.");
 const scale=Math.min(maxW/w,maxH/h);
 ctx.drawImage(img,x,y+(maxH-h*scale)/2,w*scale,h*scale);
}
function dateParts(notice){
 if(notice.dueAt){
   const d=new Date(notice.dueAt);
   if(Number.isFinite(d.getTime()))return {
     day:new Intl.DateTimeFormat("es-MX",{day:"2-digit"}).format(d),
     month:upper(new Intl.DateTimeFormat("es-MX",{month:"long"}).format(d)),
     year:new Intl.DateTimeFormat("es-MX",{year:"numeric"}).format(d),
     time:new Intl.DateTimeFormat("es-MX",{hour:"2-digit",minute:"2-digit",hour12:false}).format(d)
   };
 }
 if(notice.displayDate){
   const [y,m,d]=notice.displayDate.split("-").map(Number);
   const value=new Date(y,m-1,d,12);
   return {day:String(d).padStart(2,"0"),month:upper(
     new Intl.DateTimeFormat("es-MX",{month:"long"}).format(value)),year:String(y),time:""};
 }
 return null;
}
function duePanel(ctx,p,notice,x,y,w,h){
 const parts=dateParts(notice);
 ctx.fillStyle=p.date;ctx.fillRect(x,y,w,h);
 ctx.fillStyle=p.stripe;ctx.fillRect(x,y,8,h);
 const px=x+36;
 txt(ctx,"FECHA LÍMITE",px,y+43,19,p.dateMuted,700);
 if(parts){
   const daySize=h<=190?92:h<=225?106:124;
   txt(ctx,parts.day,px,y+h-31,daySize,p.dateInk,800);
   const monthX=px+178;
   const monthFit=fitted(ctx,parts.month,w-390,43,27,1,53,750);
   if(!monthFit)throw Error("La fecha no cabe en el diseño seleccionado.");
   txt(ctx,parts.month,monthX,y+h-79,monthFit.size,p.dateInk,750);
   txt(ctx,parts.year,monthX,y+h-38,29,p.dateMuted,600);
   if(parts.time){
     font(ctx,27,700);
     const time=parts.time+" h";
     txt(ctx,time,x+w-33-ctx.measureText(time).width,y+h-41,27,p.dateInk,700);
   }
 }else{
   const withoutPrefix=notice.dueLabel.replace(
     /^(?:FECHA(?:\s+LÍMITE)?|ENTREGA\s+HASTA\s+EL)\s*[: ]*\s*/i,"").trim()||notice.dueLabel;
   const fit=fitted(ctx,withoutPrefix,w-76,h<=190?44:51,25,2,h-78,750,1.17);
   if(!fit)throw Error("La fecha no cabe. Reduce el texto de la fecha límite.");
   drawBlock(ctx,fit,px,y+52,p.dateInk,750);
 }
}
/** La vista previa y la descarga usan exactamente el mismo Canvas local. */
export function drawNoticeCanvas(canvas,item,{logo,format,theme}={}){
 const notice=noticeModel(item,{format,theme});
 const selected=NOTICE_FORMATS.find(x=>x.id===notice.format);
 canvas.width=selected.width;canvas.height=selected.height;
 const ctx=canvas.getContext("2d");
 if(!ctx)throw Error("El navegador no admite la vista previa del aviso.");
 const W=selected.width,H=selected.height;
 const p=palette(notice.theme);
 const square=H===1080,story=H===1920;
 const m=72,w=W-2*m;
 const top=story?105:square?46:75;
 const headerY=top+99,kindY=headerY+44,titleTop=kindY+24;
 const bottom=H-(story?100:67);
 ctx.fillStyle=p.paper;ctx.fillRect(0,0,W,H);
 // Cabecera discreta: solo logotipo, categoría y una regla.
 drawLogo(ctx,logo,m,top,206,80);
 const cat=labelCategory(notice.kind);
 font(ctx,20,750);
 txt(ctx,cat,W-m-ctx.measureText(cat).width,top+49,20,p.accent,750);
 line(ctx,m,headerY,w,p.rule,2);
 // Reserva los datos operativos primero; el texto ocupa el espacio restante.
 let cursor=bottom;
 if(notice.footer){
   const footer=fitted(ctx,notice.footer,w,21,17,2,60,600,1.2);
   if(!footer)throw Error("La firma es demasiado larga para este formato.");
   const footerTop=cursor-footer.height;
   line(ctx,m,footerTop-22,w,p.rule,2);
   drawBlock(ctx,footer,m,footerTop,p.muted,600);
   cursor=footerTop-49;
 }
 const hasDue=Boolean(notice.dueAt||notice.displayDate||notice.dueLabel);
 const dueH=hasDue?(square?184:story?265:230):0;
 const dueY=hasDue?cursor-dueH:0;
 if(hasDue){cursor=dueY-(square?26:34);}
 const audience=notice.audienceLabel?fitted(ctx,notice.audienceLabel,w,25,19,2,70,650):null;
 if(notice.audienceLabel&&!audience)throw Error("El destinatario es demasiado largo para el PNG.");
 const audienceTop=audience?cursor-(audience.height+29):0;
 if(audience)cursor=audienceTop-20;
 const weekFit=notice.weeksLabel?fitted(ctx,notice.weeksLabel,w,34,23,3,
   square?115:story?175:145,700,1.22):null;
 if(notice.weeksLabel&&!weekFit)throw Error("Demasiadas semanas para el aviso. Selecciona menos semanas.");
 const weeksHeight=weekFit?weekFit.height+50:0;
 const weeksTop=weekFit?cursor-weeksHeight:0;
 if(weekFit)cursor=weeksTop-(square?18:28);
 const heroWidth=w-28;
 const heroHeight=cursor-titleTop-8;
 if(heroHeight<=0)throw Error("No hay espacio para el aviso. Reduce el texto o utiliza Historia.");
 let titleFit=null,bodyFit=null;
 for(let size=square?82:story?99:94;size>=50;size-=2){
   const candidate=fitted(ctx,notice.title,heroWidth,size,size,square?4:5,
     heroHeight,800,1.12);
   if(!candidate)continue;
   const remaining=heroHeight-candidate.height-(notice.message?27:0);
   const body=notice.message?fitted(ctx,notice.message,heroWidth,
     square?33:story?42:37,22,story?15:square?7:10,remaining,450,1.35):
     {lines:[],size:30,height:0,leading:1.35};
   if(body){titleFit=candidate;bodyFit=body;break;}
 }
 if(!titleFit||!bodyFit)throw Error(
   "El título o el mensaje es demasiado largo para este formato. Acórtalo o elige Historia.");
 // Retícula suiza: filete vertical, titular contundente, texto sin adornos.
 line(ctx,m,titleTop+4,8,p.accent,Math.min(88,titleFit.height-8));
 drawBlock(ctx,titleFit,m+28,titleTop,p.ink,800);
 if(bodyFit.lines.length){
   drawBlock(ctx,bodyFit,m+28,titleTop+titleFit.height+27,p.muted,450);
 }
 if(weekFit){
   line(ctx,m,weeksTop,w,p.rule,2);
   txt(ctx,"SEMANAS POR ENTREGAR",m,weeksTop+28,18,p.accent,750);
   drawBlock(ctx,weekFit,m,weeksTop+39,p.ink,700);
 }else if(notice.subtitle){
   // En los avisos sin semanas, la etiqueta opcional es información contextual.
   // Va en la retícula solo cuando no oculta el contenido operativo.
   const extra=fitted(ctx,notice.subtitle,w,22,18,2,57,650);
   if(extra&&weeksTop===0&&cursor-titleTop-titleFit.height-bodyFit.height>85){
     drawBlock(ctx,extra,m,titleTop+titleFit.height+bodyFit.height+44,p.accent,650);
   }
 }
 if(audience){
   txt(ctx,"DIRIGIDO A",m,audienceTop+19,17,p.accent,700);
   drawBlock(ctx,audience,m,audienceTop+22,p.ink,650);
 }
 if(hasDue)duePanel(ctx,p,notice,m,dueY,w,dueH);
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
 if(items.length>25)throw Error("Para descargar por lote, selecciona un máximo de 25 avisos.");
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
