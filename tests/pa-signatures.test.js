import {describe,it,expect} from "vitest";
import {createCanvas} from "@napi-rs/canvas";
import {actingSigner,paIsComplete,isDifferentSigner} from "../src/domain/signing.js";
import {blankRecord,generateEntries,validateRecord,recordShape} from "../src/domain/records.js";
import {buildPageModel,drawPdfPage} from "../src/services/pdf.js";
import {rememberProfile,readProfileData} from "../src/services/profile.js";
import shell from "../src/legacy/shell.html?raw";

function sample(){
 const r=blankRecord();
 r.student="Alumno Ejemplo";
 r.company="Empresa de Prueba";
 r.authorities.elaboroName=r.student;
 r.authorities.autorizoName="Director Titular";
 r.authorities.autorizoRole="Dirección General";
 r.instructor={enabled:true,preset:"__custom__",name:"Instructor Titular",
   roleMain:"Jefatura de Informática",note:"Instructor Formador",
   paEnabled:false,paName:"",paRole:""};
 r.entries=generateEntries({...r,weekDate:"2026-10-20"}).map(e=>({
   ...e,activity:"Documenté las actividades del área de formación.",
 }));
 return r;
}
function store(){
 const map=new Map();
 return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),
   removeItem:k=>map.delete(k)};
}
describe("P. A. · por ausencia del titular",()=>{
 it("mantiene al titular y define a la persona suplente sin sobrescribirla",()=>{
   const original=actingSigner({name:"Lic. Titular",role:"Dirección",enabled:false,
     paName:"Ing. Suplente",paRole:"Subdirección"});
   expect(original).toMatchObject({name:"Lic. Titular",byAbsence:false});
   const acting=actingSigner({name:"Lic. Titular",role:"Dirección",enabled:true,
     paName:"Ing. Suplente",paRole:"Subdirección"});
   expect(acting).toMatchObject({name:"Ing. Suplente",principal:"Lic. Titular",
     absenceLine:"P. A. · Por ausencia del Lic. Titular",byAbsence:true});
   expect(paIsComplete(true,"Suplente","")).toBe(false);
   expect(isDifferentSigner("Misma Persona","misma persona")).toBe(false);
 });
 it("ofrece los dos controles separados en el asistente de responsables",()=>{
   for(const id of ["autorizoPaEnabled","autorizoPaPreset","autorizoPaName",
     "autorizoPaRole","instructorPaEnabled","instructorPaPreset",
     "instructorPaName","instructorPaRole"]) expect(shell).toContain('id="'+id+'"');
 });
 it("valida a ambos suplentes activos pero no exige P. A. en bitácoras anteriores",()=>{
   const r=sample();
   expect(validateRecord(r)).toEqual({});
   r.authorities.autorizoPaEnabled=true;
   expect(validateRecord(r)).toHaveProperty("authorities.autorizoPaName");
   r.authorities.autorizoPaName="Director Suplente";
   r.authorities.autorizoPaRole="Subdirección";
   r.instructor.paEnabled=true;
   expect(validateRecord(r)).toHaveProperty("instructor.paName");
   r.instructor.paName="Formador Suplente";
   r.instructor.paRole="Jefatura Auxiliar";
   expect(validateRecord(r)).toEqual({});
   expect(recordShape(r)).toBe(true);
   r.instructor.paName=r.instructor.name;
   expect(validateRecord(r)).toHaveProperty("instructor.paName");
 });
 it("persiste los suplentes en perfiles con independencia de sus titulares",()=>{
   const storage=store();
   expect(rememberProfile({name:"Persona de prueba",
     authorities:{autorizoName:"Principal",autorizoPaEnabled:true,
       autorizoPaName:"Suplente de empresa",autorizoPaRole:"Subdirección"},
     instructor:{enabled:true,name:"Formador original",roleMain:"Asesor",
       paEnabled:true,paName:"Formador sustituto",paRole:"Auxiliar"}},
     storage)).toBe(true);
   const saved=readProfileData(storage);
   expect(saved.authorities.autorizoName).toBe("Principal");
   expect(saved.authorities.autorizoPaName).toBe("Suplente de empresa");
   expect(saved.instructor.name).toBe("Formador original");
   expect(saved.instructor.paName).toBe("Formador sustituto");
 });
 it("muestra firmas diferentes al activar P. A. en el PDF y conserva una página",()=>{
   const r=sample();
   const normal=createCanvas(1,1),substitute=createCanvas(1,1);
   expect(drawPdfPage(normal,3,r,null).fits).toBe(true);
   r.authorities.autorizoPaEnabled=true;
   r.authorities.autorizoPaName="Lic. Suplente";
   r.authorities.autorizoPaRole="Subdirección";
   r.instructor.paEnabled=true;
   r.instructor.paName="Ing. Suplente";
   r.instructor.paRole="Informática";
   expect(buildPageModel(r).fits).toBe(true);
   expect(drawPdfPage(substitute,3,r,null).fits).toBe(true);
   expect(Buffer.compare(normal.toBuffer("image/png"),substitute.toBuffer("image/png")))
     .not.toBe(0);
 });
});
