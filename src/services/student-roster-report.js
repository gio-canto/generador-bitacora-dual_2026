import {VERSION} from "../domain/records.js";
import {studentIsActive} from "./delivery-registry.js";
import {canvasToJpeg,createPdfFromJpegs,downloadPdf} from "./delivery-report.js";
import {loadDossierLogo,loadDossierAvatar} from "./student-dossier-report.js";

const WIDTH=1240,HEIGHT=1754,PAGE_WIDTH=595.28,PAGE_HEIGHT=841.89;
const PALETTE={ink:"#182532",muted:"#647181",line:"#dde4ec",light:"#f4f6f9",blue:"#1c659a"};
const locale=(a,b)=>String(a||"").localeCompare(String(b||""),"es",{sensitivity:"base",numeric:true});
const clean=s=>String(s||"").trim()||"Sin especificar";
const validModes=["alphabetical","specialty","company"];
export const ROSTER_MODES=[
  {id:"alphabetical",name:"Orden alfabético"},
  {id:"specialty",name:"Por especialidad"},
  {id:"company",name:"Por empresa"},
];
export function buildStudentRosterModel(state,{sortBy="alphabetical",includeDesisted=false}={}){
  const mode=validModes.includes(sortBy)?sortBy:"alphabetical";
  const students=(state.students||[]).filter(s=>includeDesisted||studentIsActive(s));
  const groups=new Map();
  for(const student of students){
    const key=mode==="specialty"?clean(student.specialty):mode==="company"?
      clean(student.company):"Listado general";
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(student);
  }
  const entries=[...groups].sort((a,b)=>locale(a[0],b[0])).map(([label,people])=>({
    label,students:people.sort((a,b)=>locale(a.name,b.name)||
      locale(a.specialty,b.specialty)||locale(a.company,b.company)||locale(a.id,b.id)),
  }));
  return {entries,sortBy:mode,includeDesisted,total:students.length,
    active:students.filter(studentIsActive).length,
    desisted:students.filter(s=>!studentIsActive(s)).length,
    school:state.context?.school||"Registro de entregas",
    generation:state.context?.generation||"No especificada"};
}
function pagedRoster(model){
  // Divisiones por grupos en las páginas; un encabezado se repite al pasar a otra.
  const pages=[];let page=[],height=0;
  const max=1250,groupHeight=57,rowHeight=72;
  const push=()=>{if(page.length){pages.push(page);page=[];height=0;}};
  for(const group of model.entries){
    let first=true;
    for(const student of group.students){
      if(height+rowHeight+(first?groupHeight:0)>max)push();
      if(first||page.length===0){
        page.push({type:"group",title:group.label});
        height+=groupHeight;first=false;
      }
      page.push({type:"student",student});
      height+=rowHeight;
    }
  }
  push();
  return pages.length?pages:[[{type:"empty"}]];
}
function txt(ctx,value,x,y,size=17,color=PALETTE.ink,weight=500,maxWidth){
  ctx.fillStyle=color;ctx.font=weight+" "+size+"px Arial,Helvetica,sans-serif";
  if(maxWidth)ctx.fillText(String(value??""),x,y,maxWidth);else ctx.fillText(String(value??""),x,y);
}
function rect(ctx,x,y,w,h,color="#fff"){ctx.fillStyle=color;ctx.fillRect(x,y,w,h);}
function avatar(ctx,image,name,x,y){
  const size=49;ctx.save();ctx.beginPath();ctx.arc(x+size/2,y+size/2,size/2,0,2*Math.PI);ctx.clip();
  rect(ctx,x,y,size,size,"#e5eff7");
  if(image)try{ctx.drawImage(image,x,y,size,size);}catch{/* Iniciales. */}
  else txt(ctx,clean(name).split(/\s+/).slice(0,2).map(w=>w[0]).join("").toUpperCase(),
    x+8,y+31,16,PALETTE.blue,700);
  ctx.restore();
}
function page(canvas,model,rows,number,total,logo,avatars){
  const ctx=canvas.getContext("2d");rect(ctx,0,0,WIDTH,HEIGHT);
  if(!logo)throw new Error("Falta el logotipo del Generador.");
  const nw=logo.naturalWidth||logo.width,nh=logo.naturalHeight||logo.height;
  const scale=Math.min(185/nw,77/nh);
  ctx.drawImage(logo,52,37+(77-nh*scale)/2,nw*scale,nh*scale);
  txt(ctx,"GENERADOR DE BITÁCORA DUAL",259,79,26,PALETTE.ink,750,920);
  txt(ctx,model.school,55,176,21,PALETTE.muted,600,1120);
  txt(ctx,"Generación "+model.generation,55,206,16,PALETTE.muted);
  rect(ctx,50,237,1140,54,PALETTE.ink);
  const mode=ROSTER_MODES.find(item=>item.id===model.sortBy)?.name||"Alumnos";
  txt(ctx,"LISTA DE ALUMNOS · "+mode.toUpperCase(),66,273,22,"#fff",750,1110);
  txt(ctx,model.total+" alumnos  ·  "+model.active+" activos  ·  "+model.desisted+" desistidos",
    61,325,18,PALETTE.muted,550);
  let y=352;let numberIndex=rows.reduce((x,item)=>x+(item.type==="student"?1:0),0);
  if(!numberIndex)txt(ctx,"No hay alumnos para este listado.",75,445,22,PALETTE.muted);
  for(const row of rows){
    if(row.type==="group"){
      rect(ctx,52,y,1136,42,PALETTE.light);
      txt(ctx,row.title,69,y+28,20,PALETTE.ink,700,1070);
      y+=57;continue;
    }
    if(row.type!=="student")continue;
    const student=row.student;
    avatar(ctx,avatars.get(student.name),student.name,71,y+8);
    txt(ctx,student.name,137,y+29,19,PALETTE.ink,700,940);
    txt(ctx,clean(student.specialty)+" · "+clean(student.company)+" · Grupo "+clean(student.group),
      137,y+53,15,PALETTE.muted,500,925);
    if(!studentIsActive(student))txt(ctx,"DESISTIDO",1037,y+32,14,PALETTE.muted,700,120);
    rect(ctx,61,y+71,1123,1,PALETTE.line);y+=72;
  }
  rect(ctx,52,1679,1135,1,PALETTE.line);
  txt(ctx,"REGISTRO DE ENTREGA · "+VERSION,58,1711,14,PALETTE.muted,600,800);
  txt(ctx,"PÁGINA "+number+" DE "+total,1005,1711,16,PALETTE.muted,650,180);
}
export async function generateStudentRosterPdf(state,options={}){
  const model=buildStudentRosterModel(state,options);
  if(!model.total)throw new Error("No hay alumnos para incluir en la lista.");
  const specs=pagedRoster(model);
  const logo=options.logoImage||await loadDossierLogo();
  const names=[...new Set(model.entries.flatMap(g=>g.students.map(s=>s.name)))];
  const avatars=options.avatarImages||new Map(await Promise.all(names.map(async name=>[
    name,await loadDossierAvatar(name)
  ])));
  const images=[];
  for(let i=0;i<specs.length;i++){
    const canvas=document.createElement("canvas");canvas.width=WIDTH;canvas.height=HEIGHT;
    page(canvas,model,specs[i],i+1,specs.length,logo,avatars);
    images.push(canvasToJpeg(canvas,PAGE_WIDTH,PAGE_HEIGHT));
  }
  const pdf=createPdfFromJpegs(images);
  const filename="lista-alumnos-"+model.sortBy+(model.includeDesisted?"-todos":"-activos")+".pdf";
  if(options.download!==false)downloadPdf(pdf,filename);
  return {filename,pages:images.length,model,bytes:pdf};
}
