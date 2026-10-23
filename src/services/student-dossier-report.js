import {blobatarUri} from "blobatar/uri";
import {buildStudentDossier} from "./student-dossier.js";
import {canvasToJpeg,createPdfFromJpegs,downloadPdf} from "./delivery-report.js";
import {VERSION} from "../domain/records.js";

const W=1240,H=1754,PDF_W=595.28,PDF_H=841.89;
const C={ink:"#17232d",muted:"#5f6b78",line:"#d9dfe5",paper:"#ffffff",
  back:"#f4f6f8",blue:"#1d6096",green:"#327548",red:"#ae4640",amber:"#966d22"};
const fmt=(n,dec=0)=>n==null?"—":Number(n).toLocaleString("es-MX",{maximumFractionDigits:dec});
const hrs=n=>n==null?"—":fmt(n,1)+" h";
const pct=n=>n==null?"—":fmt(n)+"%";
const slug=s=>String(s||"alumno").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/gi,"-").replace(/^-|-$/g,"").slice(0,65).toLowerCase()||"alumno";
export const DOSSIER_ROWS_PER_PAGE=14;
const MARKS={
  a_tiempo:{symbol:"✓",label:"A tiempo",color:C.green,bg:"#e3f1e7"},
  tarde:{symbol:"!",label:"Tarde",color:C.amber,bg:"#fbefd7"},
  vencida:{symbol:"×",label:"Pendiente",color:C.red,bg:"#f9e5e2"},
  en_plazo:{symbol:"·",label:"En plazo",color:C.blue,bg:"#e8f0f9"},
  no_aplica:{symbol:"—",label:"No aplica",color:C.muted,bg:"#e9edf1"},
};
/** Real, distinct abbreviated labels: Semana 20 -> S20. */
export function abbreviateWeekLabel(label){
 const value=String(label||"").trim();
 const number=value.match(/(?:^|\b)(?:semana|sem\.?)\s*[#º°:\-]?\s*(\d+)/i)
   ||value.match(/(\d+)\s*$/);
 if(number)return "S"+number[1];
 if(!value)return "—";
 const compact=value.replace(/\s+/g,"");
 return (compact[0]||"S").toUpperCase()+compact.slice(-3).toUpperCase();
}
function txt(ctx,value,x,y,size=18,color=C.ink,weight=400,maxWidth){
 ctx.fillStyle=color;ctx.font=weight+" "+size+"px Arial,Helvetica,sans-serif";
 if(maxWidth)ctx.fillText(String(value??""),x,y,maxWidth);else ctx.fillText(String(value??""),x,y);
}
function rect(ctx,x,y,w,h,color=C.paper){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
function rule(ctx,x,y,w,color=C.line){rect(ctx,x,y,w,1.5,color);}
function shorten(ctx,value,max){
 let str=String(value||"");
 if(ctx.measureText(str).width<=max)return str;
 while(str.length&&ctx.measureText(str+"…").width>max)str=str.slice(0,-1);
 return str+"…";
}
export async function loadDossierAvatar(name){
  if(typeof Image==="undefined")return null;
  return new Promise(resolve=>{
    const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);
    img.src=blobatarUri(name||"Alumno",{size:128,background:"circle"});
  });
}
export async function loadDossierLogo(){
  if(typeof Image==="undefined"||typeof document==="undefined")throw new Error("No se pudo cargar el logotipo del Generador.");
  const base=import.meta.env?.BASE_URL||"/";
  const urls=[
    new URL("Assets/Asset_logo.png",new URL(base,document.baseURI)).href,
    new URL("../Assets/Asset_logo.png",document.baseURI).href,
    new URL("Assets/Asset_logo.png",document.baseURI).href
  ];
  for(const src of urls){
    const img=await new Promise(resolve=>{
      const image=new Image();image.onload=()=>resolve(image);
      image.onerror=()=>resolve(null);image.src=src;
    });
    if(img&&(img.naturalWidth||img.width)>0)return img;
  }
  throw new Error("No se pudo cargar el logotipo oficial. Recarga la página.");
}
function paintLogo(ctx,logo){
 if(!logo)throw new Error("Falta el logotipo oficial del Generador.");
 const w=logo.naturalWidth||logo.width,h=logo.naturalHeight||logo.height;
 const scale=Math.min(161/w,86/h);
 if(!Number.isFinite(scale)||scale<=0)throw new Error("Logotipo no válido.");
 ctx.drawImage(logo,45,31+(86-h*scale)/2,w*scale,h*scale);
}
function avatar(ctx,img,name){
 ctx.save();ctx.beginPath();ctx.arc(100,235,48,0,Math.PI*2);ctx.clip();
 rect(ctx,52,187,96,96,"#e6eff9");
 if(img){try{ctx.drawImage(img,52,187,96,96);}catch{/* initials below */}}
 else txt(ctx,String(name||"AL").split(/\s+/).slice(0,2).map(s=>s[0]).join("").toUpperCase(),73,251,30,C.blue,700);
 ctx.restore();
}
function header(ctx,logo,page,pages,context){
 rect(ctx,0,0,W,H);
 paintLogo(ctx,logo);
 txt(ctx,"GENERADOR DE BITÁCORA DUAL",221,74,27,C.ink,750,975);
 txt(ctx,context.school||"Registro de entregas",223,105,18,C.muted,500,975);
 rule(ctx,46,137,1149);rule(ctx,46,1698,1149);
 txt(ctx,"USO ESCOLAR INTERNO · "+VERSION,50,1729,14,C.muted,600);
 txt(ctx,page+" / "+pages,1131,1729,16,C.muted,700);
}
function bar(ctx,label,y){
 rect(ctx,49,y-27,1142,38,C.ink);
 txt(ctx,label.toUpperCase(),63,y,20,"#fff",750,1110);
}
export function interpretStudentDossier(d){
 if(!d||!d.due)return "Sin entregas vencidas. El cumplimiento se calculará al concluir los plazos.";
 const parts=["Se recibieron "+d.submitted+" de "+d.due+" bitácoras vencidas ("+pct(d.deliveryRate)+")."];
 parts.push(d.pending?"Hay "+d.pending+" pendiente"+(d.pending===1?"":"s")+".":"No hay entregas vencidas pendientes.");
 if(d.late)parts.push(d.late+" entrega"+(d.late===1?" fue tardía.":"s fueron tardías."));
 parts.push(d.weeksWithStats?"Se registraron "+d.absences+" faltas en "+d.knownDays+" jornadas.":"No hay jornadas capturadas para evaluar la asistencia.");
 return parts.join(" ");
}
function mark(ctx,status,x,y,size=30){
 const m=MARKS[status]||MARKS.en_plazo;
 rect(ctx,x,y-size*.9,size,size,m.bg);
 txt(ctx,m.symbol,x+size*.28,y-size*.15,size*.73,m.color,800);
}
function wrap(ctx,message,maxWidth){
 ctx.font="500 19px Arial,Helvetica,sans-serif";
 const lines=[];let current="";
 for(const word of String(message).split(/\s+/)){
   const next=current?current+" "+word:word;
   if(current&&ctx.measureText(next).width>maxWidth){lines.push(current);current=word;}
   else current=next;
 }
 if(current)lines.push(current);
 return lines;
}
function summary(canvas,d,img,logo,pages,context){
 const ctx=canvas.getContext("2d");header(ctx,logo,1,pages,context);
 txt(ctx,"REPORTE INDIVIDUAL DE CUMPLIMIENTO",49,173,24,C.ink,750,1128);
 avatar(ctx,img,d.name);
 txt(ctx,d.name,166,222,30,C.ink,750,980);
 txt(ctx,d.specialty+" · "+d.company+" · Grupo "+d.group,167,252,18,C.muted,500,990);
 txt(ctx,"Periodo: "+(d.dateFrom||"—")+" — "+(d.dateTo||"—"),167,277,16,C.muted,500);
 bar(ctx,"Resumen de cumplimiento",338);
 const cards=[
   ["Cumplimiento",pct(d.deliveryRate),d.submitted+" / "+d.due+" entregas"],
   ["Puntualidad",pct(d.onTimeRate),d.onTime+" a tiempo · "+d.late+" tarde"],
   ["Pendientes",fmt(d.pending),d.upcoming+" aún en plazo"],
   ["Horas",hrs(d.totalHours),d.weeksWithStats+" semanas con datos"],
   ["Faltas",fmt(d.absences),d.knownDays+" jornadas registradas"],
   ["Asistencia",pct(d.attendanceRate),d.workDays+" días con labores"]
 ];
 const w=(1142-24)/3;
 cards.forEach(([title,value,sub],i)=>{
   const x=49+(i%3)*(w+12),y=369+Math.floor(i/3)*122;
   rect(ctx,x,y,w,111,C.back);
   txt(ctx,title,x+14,y+30,17,C.muted,600,w-28);
   txt(ctx,value,x+14,y+72,34,C.ink,750,w-28);
   txt(ctx,sub,x+14,y+99,14,C.muted,500,w-28);
 });
 bar(ctx,"Interpretación automática",655);
 wrap(ctx,interpretStudentDossier(d),1100).slice(0,5)
   .forEach((value,i)=>txt(ctx,value,63,693+i*28,19,C.ink,500,1105));
 bar(ctx,"Comportamiento de entregas",872);
 txt(ctx,"Últimas semanas registradas · número real de semana",63,911,16,C.muted,500);
 // Exactly the stored week labels, never positional S1/S2 columns.
 const recent=[...d.timeline].sort((a,b)=>String(a.startDate).localeCompare(String(b.startDate))).slice(-25);
 for(let i=0;i<recent.length;i++){
   const w=recent[i],col=i%5,row=Math.floor(i/5),x=62+col*228,y=952+row*75;
   rect(ctx,x,y,213,61,C.back);
   txt(ctx,abbreviateWeekLabel(w.label),x+10,y+27,22,C.ink,700,111);
   mark(ctx,w.state,x+157,y+35,29);
   txt(ctx,w.startDate||"—",x+10,y+50,14,C.muted,500,137);
 }
 if(d.timeline.length>25)txt(ctx,"El historial completo continúa en las páginas siguientes.",65,1358,15,C.muted,500,1100);
 bar(ctx,"Claves de comportamiento",1465);
 ["a_tiempo","tarde","vencida","en_plazo","no_aplica"].forEach((key,i)=>{
   mark(ctx,key,65+i*229,1510,29);
   txt(ctx,MARKS[key].label,104+i*229,1504,16,C.ink,600,178);
 });
 txt(ctx,"Las semanas sin estadísticas no equivalen a cero faltas.",62,1581,17,C.muted,500,1100);
 txt(ctx,"Todas las semanas y sus estados se incluyen en el detalle.",62,1607,17,C.muted,500,1100);
}
function details(canvas,d,logo,page,pages,context,rows){
 const ctx=canvas.getContext("2d");header(ctx,logo,page,pages,context);
 txt(ctx,"DETALLE DE SEMANAS",54,201,32,C.ink,750);
 txt(ctx,d.name+" · "+d.specialty,54,232,18,C.muted,500,1100);
 bar(ctx,"Historial de entregas",293);
 const cols=[60,180,388,648,795,920,1060];
 ["Semana","Periodo","Estado","Horas","Faltas","Labores","Clave"]
   .forEach((v,i)=>txt(ctx,v,cols[i],336,17,C.ink,700,cols[i+1]?cols[i+1]-cols[i]-8:120));
 rule(ctx,58,352,1129);
 rows.forEach((w,i)=>{
   const top=363+i*87;
   if(i%2===1)rect(ctx,57,top,1132,86,C.back);
   ctx.font="700 19px Arial,Helvetica,sans-serif";
   txt(ctx,abbreviateWeekLabel(w.label),cols[0],top+31,21,C.ink,750,102);
   txt(ctx,(w.startDate||"—")+" / "+(w.endDate||"—"),cols[1],top+30,15,C.muted,500,201);
   txt(ctx,MARKS[w.state]?.label||"—",cols[2],top+30,18,C.ink,650,232);
   txt(ctx,w.statsKnown?hrs(w.hours):"—",cols[3],top+30,18,C.ink,700,119);
   txt(ctx,w.statsKnown?fmt(w.absenceCount):"—",cols[4],top+30,18,C.ink,700);
   txt(ctx,w.statsKnown?fmt(w.workCount):"—",cols[5],top+30,18,C.ink,700);
   mark(ctx,w.state,cols[6]+14,top+36,31);
   ctx.font="500 15px Arial,Helvetica,sans-serif";
   txt(ctx,shorten(ctx,w.label||"Semana",405)+" · "+(w.method||"Sin dato"),
     61,top+67,15,C.muted,500,1060);
   rule(ctx,58,top+85,1132);
 });
 txt(ctx,"Una entrega tardía cuenta como recibida. «No aplica» queda excluido.",58,1646,17,C.muted,500,1130);
}
export async function generateStudentDossierPdf(state,studentId,options={}){
  const d=buildStudentDossier(state,studentId,options);
  if(!d)throw new Error("El alumno no está en el registro.");
  const avatarImg=options.avatarImage===undefined?await loadDossierAvatar(d.name):options.avatarImage;
  const logo=options.logoImage||await loadDossierLogo();
  const detailPages=Math.max(1,Math.ceil(d.timeline.length/DOSSIER_ROWS_PER_PAGE));
  const total=1+detailPages,output=[],context=state.context||{};
  const first=document.createElement("canvas");first.width=W;first.height=H;
  summary(first,d,avatarImg,logo,total,context);
  output.push(canvasToJpeg(first,PDF_W,PDF_H));
  for(let i=0;i<detailPages;i++){
    const canvas=document.createElement("canvas");canvas.width=W;canvas.height=H;
    details(canvas,d,logo,i+2,total,context,
      d.timeline.slice(i*DOSSIER_ROWS_PER_PAGE,(i+1)*DOSSIER_ROWS_PER_PAGE));
    output.push(canvasToJpeg(canvas,PDF_W,PDF_H));
  }
  const filename="expediente-dual-"+slug(d.name)+".pdf",bytes=createPdfFromJpegs(output);
  if(options.download!==false)downloadPdf(bytes,filename);
  return {filename,pages:output.length,bytes,studentId:d.id,interpretation:interpretStudentDossier(d)};
}
