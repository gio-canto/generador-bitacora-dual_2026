import {afterEach,describe,expect,it,vi} from "vitest";
import {createCanvas} from "@napi-rs/canvas";
import {generateStudentDossierPdf,interpretStudentDossier,drawDualScoreGraph,DOSSIER_ROWS_PER_PAGE} from "../src/services/student-dossier-report.js";
import {buildStudentDossier} from "../src/services/student-dossier.js";
import {calculateDualScore} from "../src/services/dual-score.js";
import {createStudent,createWeek,saveManualDelivery} from "../src/services/delivery-registry.js";
import {buildManualStatistics} from "../src/services/manual-statistics.js";

const student=createStudent({id:"s1",name:"Ana López",specialty:"Programación",company:"Empresa A",group:"B"});
const work=buildManualStatistics([
  {status:"laboral",hours:"4",reasonCode:"0"},
  {status:"falta",hours:"",reasonCode:"23"},
  {status:"laboral",hours:"4",reasonCode:"0"},
  {status:"inhabil",hours:"",reasonCode:"0"},
]);
function sample(weeks=2){
  return {context:{school:"CBTIS de prueba",generation:"2024-2027"},
    students:[student],weeks:Array.from({length:weeks},(_,i)=>{
      const date=new Date(Date.UTC(2026,7,4+i*7)).toISOString().slice(0,10);
      const w=createWeek({id:"w"+i,label:"Semana "+(i+1),startDate:date,endDate:date});
      return i%3===0?saveManualDelivery(w,"s1","entregado",{statistics:work,usageSource:"generator"}):w;
    })};
}
afterEach(()=>vi.restoreAllMocks());
describe("PDF del expediente individual v0.55.1",()=>{
  it("genera PDF multipágina, avatar y las jornadas sin depender de un servidor",async()=>{
    const real=document.createElement.bind(document);
    vi.spyOn(document,"createElement").mockImplementation(name=>
      name==="canvas"?createCanvas(1240,1754):real(name));
    const fakeAvatar=createCanvas(96,96);
    const officialLogo=createCanvas(180,65);
    const state=sample(9);
    const result=await generateStudentDossierPdf(state,"s1",{
      avatarImage:fakeAvatar,logoImage:officialLogo,download:false,asOf:new Date("2026-10-23T18:00:00Z")
    });
    expect(result.studentId).toBe("s1");
    expect(DOSSIER_ROWS_PER_PAGE).toBeGreaterThan(9);
    expect(result.pages).toBe(2); // resumen + historial compacto
    expect(result.filename).toBe("expediente-dual-ana-lopez.pdf");
    const raw=new TextDecoder("latin1").decode(result.bytes);
    expect(raw).toContain("/Count 2");
    expect(result.interpretation).toMatch(/bitácoras vencidas/);
    expect(result.bytes.length).toBeGreaterThan(1800);
    expect(result.bytes.length).toBeGreaterThan(1800);
  });
  it("dibuja una gráfica real de Score Dual con contribuciones y deja el resto del eje visible",()=>{
    const canvas=createCanvas(1240,1754),ctx=canvas.getContext("2d");
    const score=calculateDualScore({
      timeline:["entregado","entregado","entregado_tarde","no_entregado","no_aplica","entregado"]
       .reverse().map((status,i)=>({status,expired:true,startDate:"2026-09-"+String(10+i)})),
    });
    expect(score.value).toBe(73);
    drawDualScoreGraph(ctx,score);
    const pixel=part=>[...ctx.getImageData(Math.floor(726+430*part),797,1,1).data].slice(0,3);
    expect(pixel(.2)).toEqual([29,96,150]); // 40 puntos de cumplimiento
    expect(pixel(.49)).toEqual([45,143,150]); // 18 puntos de puntualidad
    expect(pixel(.65)).toEqual([197,148,71]); // 15 puntos de regularidad
    expect(pixel(.90)).toEqual([226,232,238]); // 27 puntos restantes
  });
  it("no pinta un score igual a cero si aún no hay semanas evaluables",()=>{
    const canvas=createCanvas(1240,1754),ctx=canvas.getContext("2d");
    const score=calculateDualScore({timeline:[]});
    expect(score.value).toBeNull();
    drawDualScoreGraph(ctx,score);
    const data=[...ctx.getImageData(790,797,1,1).data].slice(0,3);
    expect(data).toEqual([226,232,238]);
  });
  it("genera dos páginas mínimas incluso sin semanas y sin avatar",async()=>{
    const real=document.createElement.bind(document);
    vi.spyOn(document,"createElement").mockImplementation(name=>
      name==="canvas"?createCanvas(1240,1754):real(name));
    const result=await generateStudentDossierPdf({
      students:[student],weeks:[],context:{school:"Plantel"}}, "s1",
      {avatarImage:null,logoImage:createCanvas(180,65),download:false});
    expect(result.pages).toBe(2);
    expect(new TextDecoder("latin1").decode(result.bytes)).toContain("/Count 2");
  });
  it("rechaza la selección de un ID que no está en el registro",async()=>{
    await expect(generateStudentDossierPdf(sample(),"absent",{
      avatarImage:null,logoImage:createCanvas(180,65),download:false
    })).rejects.toThrow("El alumno no está en el registro");
  });
  it("interpreta la situación sin inventar cumplimiento ni fecha de emisión",()=>{
    const noDue=buildStudentDossier({students:[student],weeks:[]},"s1");
    expect(interpretStudentDossier(noDue)).toContain("Sin entregas vencidas");
    const d=buildStudentDossier(sample(5),"s1",{asOf:new Date("2026-10-23T18:00:00Z")});
    const explanation=interpretStudentDossier(d);
    expect(explanation).toMatch(/Hay \d+ pendientes?\./);
    expect(explanation).toMatch(/faltas en \d+ jornadas/);
    expect(explanation).not.toMatch(/folio|actualización|emitido/i);
  });
  it("pagina sin cortar historial de muchas semanas",async()=>{
    const real=document.createElement.bind(document);
    vi.spyOn(document,"createElement").mockImplementation(name=>
      name==="canvas"?createCanvas(1240,1754):real(name));
    const weeks=DOSSIER_ROWS_PER_PAGE*2+1;
    const result=await generateStudentDossierPdf(sample(weeks),"s1",{
      avatarImage:null,logoImage:createCanvas(180,65),download:false,
      asOf:new Date("2026-12-23T18:00:00Z")
    });
    expect(result.pages).toBe(4);
    expect(new TextDecoder("latin1").decode(result.bytes)).toContain("/Count 4");
  });

});
