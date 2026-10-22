import { canvasToJpeg, createPdfFromJpegs, downloadPdf } from "./delivery-report.js";
import { calculateDeliveryStatistics, genderLabels, percent } from "./statistics.js";
const W=1240,H=1754;
const COLORS={ink:"#1d1d1f",muted:"#6e6e73",line:"#e5e5e9",blue:"#0071e3",bg:"#f5f5f7",white:"#ffffff"};
const nice=(n,digits=0)=>Number(n||0).toLocaleString("es-MX",{maximumFractionDigits:digits});
const safe=(s)=>String(s||"").replace(/[^a-z0-9]+/gi,"-").replace(/^-|-$/g,"").slice(0,56).toLowerCase()||"general";
function rounded(ctx,x,y,w,h,r=20,fill=COLORS.white){
  ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();
}
function text(ctx,str,x,y,size=22,color=COLORS.ink,weight=400,maxWidth){
  ctx.font=weight+" "+size+'px -apple-system, "Segoe UI", Arial, sans-serif';
  ctx.fillStyle=color;
  if(maxWidth)ctx.fillText(String(str),x,y,maxWidth);else ctx.fillText(String(str),x,y);
}
function line(ctx,x,y,width,color=COLORS.line){ctx.fillStyle=color;ctx.fillRect(x,y,width,2);}
function section(ctx,x,y,w,h,title){rounded(ctx,x,y,w,h,24,COLORS.white);text(ctx,title,x+26,y+43,25,COLORS.ink,700);}
function stat(ctx,x,y,w,label,value){
  rounded(ctx,x,y,w,114,20,COLORS.white);
  text(ctx,value,x+20,y+60,36,COLORS.ink,750,w-36);
  text(ctx,label,x+20,y+91,17,COLORS.muted,600,w-36);
}
function rows(ctx,data,x,y,width,height=54,unit=""){
  const items=data.slice(0,6);
  if(!items.length){text(ctx,"Sin registros en el periodo.",x,y+24,18,COLORS.muted);return;}
  const max=Math.max(1,...items.map(d=>d.count??d.minutes??0));
  items.forEach((item,i)=>{
    const yy=y+i*height, value=item.count??item.minutes??0;
    text(ctx,item.label,x,yy+18,17,COLORS.muted,500,width*.65);
    text(ctx,nice(unit==="h"?value/60:value,unit==="h"?1:0)+unit,x+width-110,yy+18,18,COLORS.ink,700,104);
    rounded(ctx,x,yy+27,width-12,8,4,"#e9eef6");
    rounded(ctx,x,yy+27,Math.max(0,(width-12)*value/max),8,4,COLORS.blue);
  });
}
function startPage(report,page){
  const canvas=document.createElement("canvas");canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext("2d");
  ctx.fillStyle=COLORS.bg;ctx.fillRect(0,0,W,H);
  rounded(ctx,42,35,W-84,93,26,COLORS.white);
  rounded(ctx,65,61,52,52,13,COLORS.blue);
  text(ctx,"BD",76,96,25,COLORS.white,750);
  text(ctx,"Generador de Bitácora Dual",134,91,25,COLORS.ink,750);
  text(ctx,"ESTADÍSTICAS  /  v0.52",W-307,89,15,COLORS.muted,700);
  text(ctx,"Reporte estadístico",54,207,49,COLORS.ink,750);
  text(ctx,report.school,54,248,21,COLORS.muted,600,1100);
  text(ctx,report.scope,54,284,18,COLORS.muted,400,1100);
  line(ctx,54,316,W-108);
  text(ctx,"GENERACIÓN  "+report.generation,54,H-64,15,COLORS.muted,600);
  text(ctx,"Emitido "+report.date+"    •    "+page+"/2",W-305,H-64,15,COLORS.muted,600);
  return {ctx,canvas};
}
function reportMetadata(state,filters){
  const r=calculateDeliveryStatistics(state,filters);
  const label=filters.period==="weekly"?
    r.weeks[0]?.label || "Semana sin seleccionar" :
    filters.period==="monthly"?filters.month:"Histórico general";
  const parts=[label];
  if(filters.specialty)parts.push(filters.specialty);
  if(filters.company)parts.push(filters.company);
  return {r,school:state.context?.school||"Registro de entrega",
    generation:state.context?.generation||"No especificada",
    scope:parts.join(" · "),
    date:new Date().toLocaleDateString("es-MX",{day:"2-digit",month:"long",year:"numeric"}),
  };
}
export async function generateStatisticsReportPdf(state,filters){
  const report=reportMetadata(state,filters);
  const {r}=report;
  if(!r.weeks.length)throw Error("Selecciona un periodo con semanas registradas.");
  const pages=[];
  {
    const {ctx,canvas}=startPage(report,1);
    const gap=14,x=54,cardW=(W-108-gap*3)/4;
    stat(ctx,x,345,cardW,"Alumnos activos",nice(r.students.length));
    stat(ctx,x+(cardW+gap),345,cardW,"Horas realizadas",nice(r.totalMinutes/60,1)+" h");
    stat(ctx,x+2*(cardW+gap),345,cardW,"Jornadas con falta",nice(r.daily.falta));
    stat(ctx,x+3*(cardW+gap),345,cardW,"Uso identificado",percent(r.usage.used,r.students.length)+"%");
    section(ctx,54,480,1132,270,"Entrega de bitácoras");
    const deliveries=[
      ["Entregadas a tiempo",r.delivered],
      ["Entregadas tarde",r.late],
      ["No entregadas",r.notDelivered],
      ["No aplica",r.notApplicable],
    ];
    deliveries.forEach(([name,count],i)=>{
      const xx=84+(i%2)*530,yy=568+Math.floor(i/2)*83;
      text(ctx,name,xx,yy,22,COLORS.muted,500);
      text(ctx,nice(count),xx+426,yy,27,COLORS.ink,750);
      line(ctx,xx,yy+17,462);
    });
    section(ctx,54,772,1132,355,"Asistencia y jornadas");
    const dayItems=[
      ["Con labores",r.daily.laboral,"#0071e3"],["Faltas",r.daily.falta,"#e76b6b"],
      ["Sin labores",r.daily.sin_labores,"#e5a547"],["Días inhábiles",r.daily.inhabil,"#9097a3"],
    ];
    const total=dayItems.reduce((a,x)=>a+x[1],0);
    let offset=84;
    for(const [label,count,color] of dayItems){
      const width=total?1018*count/total:0;
      if(width){ctx.fillStyle=color;ctx.fillRect(offset,850,width,20);offset+=width;}
    }
    dayItems.forEach(([name,count,color],i)=>{
      const xx=84+(i%2)*523, yy=940+Math.floor(i/2)*80;
      ctx.fillStyle=color;ctx.beginPath();ctx.arc(xx+8,yy-8,7,0,2*Math.PI);ctx.fill();
      text(ctx,name,xx+28,yy,22,COLORS.muted,500);
      text(ctx,nice(count),xx+410,yy,27,COLORS.ink,750);
    });
    section(ctx,54,1149,1132,435,"Indicadores");
    const metrics=[
      ["Cumplimiento de entrega",r.deliveryRate+"%"],
      ["Entregas puntuales",r.onTimeRate+"%"],
      ["Asistencia en días laborables",r.attendanceRate+"%"],
      ["Entregas con estadísticas",r.coverage+"%"],
      ["Horas por bitácora con datos",nice(r.avgHours,1)+" h"],
      ["Bitácoras con datos",nice(r.weeksWithStatistics)],
    ];
    metrics.forEach(([label,value],i)=>{
      const xx=84+(i%2)*525,yy=1239+Math.floor(i/2)*94;
      text(ctx,label,xx,yy,20,COLORS.muted,500,475);
      text(ctx,value,xx,yy+38,30,COLORS.ink,750);
      line(ctx,xx,yy+51,475);
    });
    pages.push(canvasToJpeg(canvas));
  }
  {
    const {ctx,canvas}=startPage(report,2);
    section(ctx,54,345,543,445,"Causas de inasistencia");
    rows(ctx,r.causesAbsence,80,418,490,51);
    section(ctx,611,345,575,445,"Días sin labores");
    rows(ctx,r.causesNonWorking,639,418,520,51);
    section(ctx,54,811,543,360,"Género");
    rows(ctx,Object.entries(r.genderCounts).map(([key,count])=>({label:genderLabels[key],count})).filter(v=>v.count),80,884,480,50);
    section(ctx,611,811,575,360,"Utilización del generador");
    rows(ctx,[
      {label:"Generador",count:r.usage.used},
      {label:"Otro método",count:r.usage.other},
      {label:"Sin información",count:r.usage.unknown},
    ],639,894,520,60);
    section(ctx,54,1191,543,405,"Horas por especialidad");
    rows(ctx,r.bySpecialty,80,1265,490,49,"h");
    section(ctx,611,1191,575,405,"Horas por empresa");
    rows(ctx,r.byCompany,639,1265,520,49,"h");
    pages.push(canvasToJpeg(canvas));
  }
  const filename="estadisticas-dual-"+safe(report.generation)+"-"+safe(report.scope)+"-"+new Date().toISOString().slice(0,10)+".pdf";
  downloadPdf(createPdfFromJpegs(pages),filename);
  return {filename,pages:pages.length};
}
