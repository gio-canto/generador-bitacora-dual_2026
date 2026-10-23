import {blobatarUri} from "blobatar/uri";
import {buildStudentDossier} from "./student-dossier.js";
import {canvasToJpeg,createPdfFromJpegs,downloadPdf} from "./delivery-report.js";
import {VERSION} from "../domain/records.js";

const W=1240,H=1754;
const C={
  bg:"#f4f6f9",paper:"#ffffff",ink:"#182536",sub:"#526175",
  muted:"#758196",blue:"#1464ba",pale:"#ebf3fd",line:"#e4e9ef",
  teal:"#237b72",amber:"#a77725",red:"#a34e45",
};
const fmt=(n,dec=0)=>n===null||n===undefined?"—":
  Number(n).toLocaleString("es-MX",{maximumFractionDigits:dec});
const pc=n=>n==null?"—":fmt(n)+"%";
const hrs=n=>n==null?"—":fmt(n,1)+" h";
const safeSlug=value=>String(value||"alumno").normalize("NFD")
  .replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/gi,"-")
  .replace(/^-|-$/g,"").slice(0,70).toLowerCase()||"alumno";
const statusLabels={a_tiempo:"A TIEMPO",tarde:"TARDE",vencida:"PENDIENTE",
  en_plazo:"EN PLAZO",no_aplica:"NO APLICA"};
const dayLabels={laboral:"Con labores",falta:"Falta",
  sin_labores:"Sin labores",inhabil:"Inhábil"};
const days=["Mar","Mié","Jue","Vie"];
function text(ctx,value,x,y,size=18,color=C.ink,weight=400,maxWidth){
  ctx.font=weight+' '+size+'px Arial,Helvetica,sans-serif';
  ctx.fillStyle=color;
  if(maxWidth)ctx.fillText(String(value??""),x,y,maxWidth);
  else ctx.fillText(String(value??""),x,y);
}
function box(ctx,x,y,w,h,r=17,color=C.paper){
  ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();
}
function line(ctx,x,y,w,color=C.line){ctx.fillStyle=color;ctx.fillRect(x,y,w,2);}
function initials(name){
  return String(name||"").split(/\s+/).filter(Boolean).slice(0,2)
    .map(n=>n[0].toLocaleUpperCase("es-MX")).join("")||"AL";
}
function drawAvatar(ctx,avatar,name,x,y,size){
  ctx.save();ctx.beginPath();
  ctx.arc(x+size/2,y+size/2,size/2,0,Math.PI*2);ctx.clip();
  ctx.fillStyle=C.pale;ctx.fillRect(x,y,size,size);
  if(avatar){
    try{ctx.drawImage(avatar,x,y,size,size);}
    catch{text(ctx,initials(name),x+size*.23,y+size*.61,size*.33,C.blue,700);}
  }else text(ctx,initials(name),x+size*.23,y+size*.61,size*.33,C.blue,700);
  ctx.restore();
}
export async function loadDossierAvatar(name){
  if(typeof Image==="undefined")return null;
  return new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>resolve(img);
    img.onerror=()=>resolve(null);
    img.src=blobatarUri(name||"Alumno",{size:128,background:"circle"});
  });
}
function page(ctx,canvas,report,n,total,avatar){
  ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,H);
  box(ctx,43,39,W-86,97,23);
  box(ctx,61,56,57,57,14,C.pale);
  text(ctx,"GD",74,94,27,C.blue,750);
  text(ctx,"GENERADOR DE BITÁCORA DUAL",138,83,22,C.ink,750,790);
  text(ctx,"REGISTRO DE ENTREGAS",139,110,14,C.muted,600,840);
  text(ctx,"EXPEDIENTE INDIVIDUAL",W-299,94,16,C.sub,750,225);
  text(ctx,report.school||"Registro de entregas",60,190,21,C.sub,600,1100);
  text(ctx,"Generación: "+(report.generation||"No especificada"),60,220,17,C.muted,500,1030);
  line(ctx,60,242,W-120);
  line(ctx,60,1666,W-120);
  text(ctx,"USO ESCOLAR INTERNO · Datos al "+report.issued,60,1698,15,C.muted,600,790);
  text(ctx,n+" / "+total+" · "+VERSION,W-238,1698,15,C.muted,600,189);
}
function sectionHeading(ctx,title,y,note){
  text(ctx,title,69,y,24,C.ink,750,1090);
  if(note)text(ctx,note,70,y+25,15,C.muted,450,1080);
}
function metric(ctx,x,y,w,title,value,detail){
  box(ctx,x,y,w,119,17);
  text(ctx,title,x+16,y+29,15,C.sub,600,w-30);
  text(ctx,value,x+16,y+75,34,C.ink,750,w-30);
  if(detail)text(ctx,detail,x+16,y+100,12,C.muted,500,w-30);
}
function profile(ctx,d,avatar){
  box(ctx,60,272,1120,222,24);
  drawAvatar(ctx,avatar,d.name,88,310,136);
  text(ctx,d.name,244,359,37,C.ink,750,900);
  text(ctx,d.specialty+" · "+d.company,245,391,18,C.sub,500,865);
  text(ctx,"Grupo "+d.group+" · "+(d.active?"Activo":"Historial"),245,419,17,C.muted,500,820);
  text(ctx,"Periodo: "+(d.dateFrom||"—")+" a "+(d.dateTo||"—"),245,447,15,C.muted,500,870);
}
function summaryPage(canvas,report,d,avatar) {
  const ctx=canvas.getContext("2d");
  page(ctx,canvas,report,1,report.total,avatar);
  profile(ctx,d,avatar);
  sectionHeading(ctx,"Cumplimiento y asistencia",548);
  const k=[
    ["Cumplimiento",pc(d.deliveryRate),d.submitted+" de "+d.due+" vencidas"],
    ["Pendientes",fmt(d.pending),d.upcoming+" aún en plazo"],
    ["Puntualidad",pc(d.onTimeRate),d.onTime+" a tiempo · "+d.late+" tarde"],
    ["Horas",hrs(d.totalHours),d.weeksWithStats+" semanas con datos"],
    ["Faltas",fmt(d.absences),d.knownDays+" jornadas registradas"],
    ["Asistencia",pc(d.attendanceRate),d.workDays+" días con labores"],
    ["Horas promedio",hrs(d.averageHours),"Por semana con datos"],
    ["No aplica",fmt(d.notApplicable),d.registeredWeeks+" semanas en historial"]
  ];
  const gap=12,width=(1120-gap*3)/4;
  k.forEach(([a,b,c],i)=>metric(ctx,60+(i%4)*(width+gap),
    580+Math.floor(i/4)*133,width,a,b,c));
  sectionHeading(ctx,"Actividad mensual",888);
  box(ctx,60,925,1120,272,19);
  const months=d.monthly.slice(-7);
  const max=Math.max(1,...months.map(v=>v.minutes));
  if(!months.length)text(ctx,"Sin semanas registradas",87,996,18,C.muted);
  else months.forEach((row,i)=>{
    const yy=963+i*31;
    text(ctx,row.month,82,yy,17,C.sub,600,110);
    box(ctx,218,yy-13,650,15,7,C.pale);
    box(ctx,218,yy-13,650*(row.minutes/max),15,7,C.blue);
    text(ctx,hrs(row.minutes/60),889,yy,17,C.ink,700,98);
    text(ctx,row.pending+" pendientes",998,yy,14,C.muted,500,154);
  });
  sectionHeading(ctx,"Motivos de falta",1252);
  box(ctx,60,1288,1120,301,20);
  if(d.byCause.length){
    d.byCause.slice(0,6).forEach((cause,i)=>{
      const y=1333+i*41;
      text(ctx,cause.label,85,y,18,C.sub,500,950);
      text(ctx,fmt(cause.count),1090,y,20,C.ink,700,63);
      if(i<Math.min(d.byCause.length,6)-1)line(ctx,85,y+13,1050);
    });
    if(d.byCause.length>6)text(ctx,"Otros motivos: "+(d.byCause.length-6),86,1570,14,C.muted);
  }else text(ctx,d.weeksWithStats?"Sin faltas en las jornadas registradas":
    "No hay jornadas capturadas",85,1351,19,C.muted);
  text(ctx,"La falta puede tener justificación. Revisar el motivo antes de tomar decisiones.",62,1636,15,C.sub,500,1095);
}
function detailPage(canvas,report,d,rows,pageNum,avatar){
  const ctx=canvas.getContext("2d");
  page(ctx,canvas,report,pageNum,report.total,avatar);
  sectionHeading(ctx,d.name,294,"Historial semanal · "+
    (rows[0]?.startDate||"")+" — "+(rows.at(-1)?.startDate||""));
  // El tamaño de la tarjeta es fijo para evitar desbordamientos.
  rows.forEach((week,i)=>{
    const top=341+i*209;
    box(ctx,61,top,1118,195,18);
    text(ctx,week.label||"Semana",81,top+35,21,C.ink,750,670);
    text(ctx,week.startDate+" — "+week.endDate,82,top+61,15,C.muted,500,530);
    const statusColor=week.state==="vencida"?C.red:
      week.state==="a_tiempo"?C.teal:week.state==="tarde"?C.amber:C.sub;
    text(ctx,statusLabels[week.state]||"—",908,top+34,17,statusColor,750,242);
    text(ctx,week.statsKnown?hrs(week.hours):"Sin jornadas",924,top+60,15,C.sub,500,220);
    line(ctx,80,top+78,1079);
    if(!week.statsKnown){
      text(ctx,"Sin datos de jornadas",83,top+122,18,C.muted,500,500);
    }else{
      week.days.slice(0,4).forEach((day,j)=>{
        const yy=top+102+j*21;
        text(ctx,["Mar","Mié","Jue","Vie"][day.index]||"Día",83,yy,14,C.muted,650,72);
        text(ctx,dayLabels[day.status]||"—",162,yy,15,C.ink,600,180);
        text(ctx,day.status==="laboral"?hrs(day.minutes/60):"—",357,yy,15,C.sub,600,100);
        if(day.reason)text(ctx,day.reason,479,yy,14,C.sub,450,642);
      });
    }
  });
  text(ctx,"A tiempo y tarde cuentan como entregadas. Las semanas sin datos no equivalen a cero faltas.",62,1635,15,C.sub,500,1090);
}
/**
 * Genera un archivo privado en el navegador. Nunca sube el historial a terceros.
 * options.avatarImage permite pruebas sin decodificar SVG en jsdom.
 */
export async function generateStudentDossierPdf(state,studentId,options={}){
  const d=buildStudentDossier(state,studentId,options);
  if(!d)throw new Error("El alumno no está en el registro.");
  const pagesOfWeeks=6;
  const detailPages=Math.max(1,Math.ceil(d.timeline.length/pagesOfWeeks));
  const report={
    school:state.context?.school||"Registro de entregas",
    generation:state.context?.generation||"",
    issued:new Date().toLocaleDateString("es-MX"),
    total:1+detailPages
  };
  const avatar=options.avatarImage===undefined?await loadDossierAvatar(d.name):options.avatarImage;
  const output=[];
  const first=document.createElement("canvas");first.width=W;first.height=H;
  summaryPage(first,report,d,avatar);
  output.push(canvasToJpeg(first));
  for(let p=0;p<detailPages;p++){
    const canvas=document.createElement("canvas");canvas.width=W;canvas.height=H;
    const rows=d.timeline.slice(p*pagesOfWeeks,(p+1)*pagesOfWeeks);
    detailPage(canvas,report,d,rows,p+2,avatar);
    output.push(canvasToJpeg(canvas));
  }
  const filename="expediente-dual-"+safeSlug(d.name)+"-"+new Date().toISOString().slice(0,10)+".pdf";
  const pdf=createPdfFromJpegs(output);
  if(options.download!==false)downloadPdf(pdf,filename);
  return {filename,pages:output.length,bytes:pdf,studentId:d.id};
}
