import {afterEach,describe,expect,it,vi} from "vitest";
import {createCanvas} from "@napi-rs/canvas";
import {generateStudentDossierPdf} from "../src/services/student-dossier-report.js";
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
    const state=sample(9);
    const result=await generateStudentDossierPdf(state,"s1",{
      avatarImage:fakeAvatar,download:false,asOf:new Date("2026-10-23T18:00:00Z")
    });
    expect(result.studentId).toBe("s1");
    expect(result.pages).toBe(3); // portada + 2 páginas de semanas
    expect(result.filename).toMatch(/^expediente-dual-ana-lopez-.*\.pdf$/);
    const raw=new TextDecoder("latin1").decode(result.bytes);
    expect(raw).toContain("/Count 3");
    expect(result.bytes.length).toBeGreaterThan(1800);
  });
  it("genera dos páginas mínimas incluso sin semanas y sin avatar",async()=>{
    const real=document.createElement.bind(document);
    vi.spyOn(document,"createElement").mockImplementation(name=>
      name==="canvas"?createCanvas(1240,1754):real(name));
    const result=await generateStudentDossierPdf({
      students:[student],weeks:[],context:{school:"Plantel"}}, "s1",
      {avatarImage:null,download:false});
    expect(result.pages).toBe(2);
    expect(new TextDecoder("latin1").decode(result.bytes)).toContain("/Count 2");
  });
  it("rechaza la selección de un ID que no está en el registro",async()=>{
    await expect(generateStudentDossierPdf(sample(),"absent",{
      avatarImage:null,download:false
    })).rejects.toThrow("El alumno no está en el registro");
  });
});
