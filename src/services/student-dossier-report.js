import {blobatarUri} from "blobatar/uri";
import {buildStudentDossier} from "./student-dossier.js";
import {canvasToJpeg,createPdfFromJpegs,downloadPdf} from "./delivery-report.js";
import {VERSION} from "../domain/records.js";

const W=1754,H=1240,PDF_W=841.89,PDF_H=595.28;
const C={ink:"#17232d",muted:"#5f6b78",line:"#d9dfe5",paper:"#ffffff",back:"#f4f6f8",blue:"#1d6096",green:"#327548",red:"#ae4640",amber:"#966d22"};
const fmt=(n,dec=0)=>n==null?"—":Number(n).toLocaleString("es-MX",{maximumFractionDigits:dec});
const hrs=n=>n==null?"—":fmt(n,1)+" h";
const pct=n=>n==null?"—":fmt(n)+"%";
const slug=s=>String(s||"alumno").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/gi,"-").replace(/^-|-$/g,"").slice(0,65).toLowerCase()||"alumno";
export const DOSSIER_ROWS_PER_PAGE=19;
const MARKS={
  a_tiempo:{symbol:"✓",label:"A tiempo",color:C.green,bg:"#e3f1e7"},
  tarde:{symbol:"!",label:"Tarde",color:C.amber,bg:"#fbefd7"},
  vencida:{symbol:"×",label:"Pendiente",color:C.red,bg:"#f9e5e2"},
  en_plazo:{symbol:"·",label:"En plazo",color:C.blue,bg:"#e8f0f9"},
  no_aplica:{symbol:"—",label:"No aplica",color:C.muted,bg:"#e9edf1"},
};
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
  const scale=Math.min(190/w,78/h);
  if(!Number.isFinite(scale)||scale<=0)throw new Error("Logotipo no válido.");
  ctx.drawImage(logo,44,21+(78-h*scale)/2,w*scale,h*scale);
}
function avatar(ctx,img,name){
  ctx.save();ctx.beginPath();ctx.arc(105,190,50,0,Math.PI*2);ctx.clip();
  rect(ctx,55,140,100,100,"#e6eff9");
  if(img){try{ctx.drawImage(img,55,140,100,100);}catch{/* fallback */}}
  else txt(ctx,String(name||"AL").split(/\s+/).slice(0,2).map(s=>s[0]).join("").toUpperCase(),78,206,31,C.blue,700);
  ctx.restore();
}
function header(ctx,logo,page,pages,context){
  rect(ctx,0,0,W,H);
  paintLogo(ctx,logo);
  txt(ctx,"GENERADOR DE BITÁCORA DUAL",254,59,26,C.ink,750);
  txt(ctx,context.school||"Registro de entregas",254,88,18,C.muted,500,810);
  txt(ctx,"REPORTE INDIVIDUAL DE CUMPLIMIENTO",1128,62,22,C.ink,750,575);
  txt(ctx,"Generación "+(context.generation||"—"),1130,91,16,C.muted,500,560);
  rule(ctx,44,119,1666);rule(ctx,44,1195,1666);
  txt(ctx,"USO ESCOLAR INTERNO · "+VERSION,50,1220,15,C.muted,600);
  txt(ctx,"PÁGINA "+page+" DE "+pages,1545,1220,16,C.muted,700);
}
function bar(ctx,label,y){rect(ctx,50,y-24,1652,32,C.ink);txt(ctx,label.toUpperCase(),63,y,20,"#fff",750);}
export function interpretStudentDossier(d){
  if(!d||!d.due)return "Sin entregas vencidas. El cumplimiento se calculará al concluir los plazos.";
  const parts=["Se recibieron "+d.submitted+" de "+d.due+" bitácoras vencidas ("+pct(d.deliveryRate)+")."];
  parts.push(d.pending?"Hay "+d.pending+" pendiente"+(d.pending===1?"":"s")+".":"No hay entregas vencidas pendientes.");
  if(d.late)parts.push(d.late+" entrega"+(d.late===1?" fue tardía.":"s fueron tardías."));
  parts.push(d.weeksWithStats?"Se registraron "+d.absences+" faltas en "+d.knownDays+" jornadas.":"No hay jornadas capturadas para evaluar la asistencia.");
  return parts.join(" ");
}
function mark(ctx,status,x,y,size=26){
  const m=MARKS[status]||MARKS.en_plazo;
  rect(ctx,x,y-size*.9,size,size,m.bg);
  txt(ctx,m.symbol,x+size*.26,y-size*.18,size*.73,m.color,800);
}
function summary(canvas,d,img,logo,pages,context){
  const ctx=canvas.getContext("2d");header(ctx,logo,1,pages,context);
  avatar(ctx,img,d.name);
  txt(ctx,d.name,175,182,36,C.ink,750,1380);
  txt(ctx,d.specialty+" · "+d.company+" · Grupo "+d.group,175,213,18,C.muted,500,1450);
  txt(ctx,"Periodo: "+(d.dateFrom||"—")+" — "+(d.dateTo||"—"),175,237,16,C.muted,500);
  bar(ctx,"Resumen de cumplimiento",291);
  const cards=[
    ["Cumplimiento",pct(d.deliveryRate),d.submitted+" / "+d.due+" entregas"],
    ["Puntualidad",pct(d.onTimeRate),d.onTime+" a tiempo · "+d.late+" tarde"],
    ["Pendientes",fmt(d.pending),d.upcoming+" en plazo"],
    ["Horas",hrs(d.totalHours),d.weeksWithStats+" semanas con datos"],
    ["Faltas",fmt(d.absences),d.knownDays+" jornadas registradas"],
    ["Asistencia",pct(d.attendanceRate),d.workDays+" días con labores"]
  ];
  const w=(1652-55)/6;
  cards.forEach(([title,value,sub],i)=>{
    const x=50+i*(w+11);rect(ctx,x,316,w,98,C.back);
    txt(ctx,title,x+12,340,16,C.muted,600,w-18);
    txt(ctx,value,x+12,380,33,C.ink,750,w-18);
    txt(ctx,sub,x+12,403,13,C.muted,500,w-18);
  });
  bar(ctx,"Interpretación automática",457);
  const explanation=interpretStudentDossier(d);
  ctx.font="500 19px Arial,Helvetica,sans-serif";
  let words=explanation.split(/\s+/),lines=[],current="";
  for(const word of words){
    const combined=current?current+" "+word:word;
    if(ctx.measureText(combined).width>1600&&current){lines.push(current);current=word;}
    else current=combined;
  }
  if(current)lines.push(current);
  lines.slice(0,3).forEach((v,i)=>txt(ctx,v,62,491+i*25,19,C.ink,500,1600));
  bar(ctx,"Comportamiento de entregas",604);
  txt(ctx,"Mes",65,644,17,C.muted,700);
  for(let n=0;n<6;n++)txt(ctx,"S"+(n+1),890+n*123,644,17,C.muted,700);
  rule(ctx,64,658,1628);
  const months=[...new Set(d.timeline.map(w=>w.startDate?.slice(0,7)).filter(Boolean))].sort().slice(-12);
  months.forEach((month,i)=>{
    const y=690+i*34;
    txt(ctx,month,65,y,17,C.ink,600);
    d.timeline.filter(w=>w.startDate?.startsWith(month)).sort((a,b)=>a.startDate.localeCompare(b.startDate))
      .slice(0,6).forEach((w,j)=>mark(ctx,w.state,889+j*123,y-2,23));
    if(i%2===1)rule(ctx,65,y+9,1624,"#f0f1f3");
  });
  bar(ctx,"Claves de comportamiento",1115);
  ["a_tiempo","tarde","vencida","en_plazo","no_aplica"].forEach((key,i)=>{
    mark(ctx,key,72+i*319,1150,24);
    txt(ctx,MARKS[key].label,105+i*319,1147,17,C.ink,550,255);
  });
  txt(ctx,"Los periodos sin jornadas capturadas no equivalen a cero faltas.",65,1181,15,C.muted,450,1550);
}
function details(canvas,d,logo,page,pages,context,rows){
  const ctx=canvas.getContext("2d");header(ctx,logo,page,pages,context);
  txt(ctx,"DETALLE DE SEMANAS",59,177,31,C.ink,750);
  txt(ctx,d.name+" · "+d.specialty,59,211,18,C.muted,500,1570);
  bar(ctx,"Historial de entregas y jornadas",261);
  const cols=[58,390,598,826,964,1082,1197,1508];
  ["Semana","Periodo","Entrega","Horas","Faltas","Labores","Registro","Estado"]
    .forEach((v,i)=>txt(ctx,v,cols[i]+3,302,17,C.ink,700));
  rule(ctx,56,313,1640);
  rows.forEach((w,i)=>{
    const top=325+i*43;
    if(i%2===1)rect(ctx,56,top,1640,42,C.back);
    ctx.font="650 17px Arial,Helvetica,sans-serif";
    txt(ctx,shorten(ctx,w.label||"Semana",312),cols[0]+4,top+27,17,C.ink,650,316);
    txt(ctx,(w.startDate||"—")+" / "+(w.endDate||"—"),cols[1]+3,top+27,16,C.muted,500,205);
    txt(ctx,MARKS[w.state]?.label||"—",cols[2]+3,top+27,17,C.ink,550,200);
    txt(ctx,w.statsKnown?hrs(w.hours):"—",cols[3]+3,top+27,17,C.ink,600);
    txt(ctx,w.statsKnown?fmt(w.absenceCount):"—",cols[4]+3,top+27,17,C.ink,600);
    txt(ctx,w.statsKnown?fmt(w.workCount):"—",cols[5]+3,top+27,17,C.ink,600);
    txt(ctx,w.method||"—",cols[6]+3,top+27,16,C.muted,500,290);
    mark(ctx,w.state,cols[7]+18,top+30,27);
    rule(ctx,57,top+42,1637);
  });
  txt(ctx,"Semanas en esta página: "+rows.length,58,Math.min(1158,325+rows.length*43+32),16,C.muted,500);
  txt(ctx,"— = No aplica o sin datos · Una entrega tardía sigue contando como recibida.",58,1180,15,C.muted,500,1600);
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
