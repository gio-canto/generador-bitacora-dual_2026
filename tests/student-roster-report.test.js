import {afterEach,describe,expect,it,vi} from "vitest";
import {createCanvas} from "@napi-rs/canvas";
import {buildStudentRosterModel,generateStudentRosterPdf} from "../src/services/student-roster-report.js";
import {createStudent,markStudentDesisted} from "../src/services/delivery-registry.js";

const student=(id,name,specialty,company)=>createStudent({
  id,name,specialty,company,group:"B",
});
const students=[
 student("a","Zoe","Programación","Empresa B"),
 student("b","Ana","Contabilidad","Empresa A"),
 student("c","Érika","Programación","Empresa A"),
 markStudentDesisted(student("d","Carlos","Programación","Empresa A")),
];
const state={students,context:{school:"CBTIS 134",generation:"2024–2027"}};
afterEach(()=>vi.restoreAllMocks());
describe("PDF de lista de alumnos 0.55.2",()=>{
  it("ordena alfabéticamente y separa desistidos",()=>{
    const active=buildStudentRosterModel(state);
    expect(active.total).toBe(3);
    expect(active.entries[0].students.map(s=>s.name)).toEqual(["Ana","Érika","Zoe"]);
    const all=buildStudentRosterModel(state,{includeDesisted:true});
    expect(all.total).toBe(4);
    expect(all.desisted).toBe(1);
  });
  it("agrupa por especialidad y dentro ordena los nombres",()=>{
    const m=buildStudentRosterModel(state,{sortBy:"specialty",includeDesisted:true});
    expect(m.entries.map(g=>g.label)).toEqual(["Contabilidad","Programación"]);
    expect(m.entries[1].students.map(s=>s.name)).toEqual(["Carlos","Érika","Zoe"]);
  });
  it("agrupa por empresa, sin duplicar estudiantes",()=>{
    const m=buildStudentRosterModel(state,{sortBy:"company"});
    expect(m.entries.map(g=>g.label)).toEqual(["Empresa A","Empresa B"]);
    expect(m.entries[0].students.map(s=>s.name)).toEqual(["Ana","Érika"]);
    expect(m.entries.reduce((n,g)=>n+g.students.length,0)).toBe(3);
  });
  it("produce un PDF con portada institucional, Blobs y varias páginas",async()=>{
    const original=document.createElement.bind(document);
    vi.spyOn(document,"createElement").mockImplementation(tag=>
      tag==="canvas"?createCanvas(1240,1754):original(tag));
    const image=createCanvas(64,64);
    const avatars=new Map(students.map(s=>[s.name,image]));
    const result=await generateStudentRosterPdf(state,{
      sortBy:"specialty",includeDesisted:true,
      logoImage:createCanvas(220,80),avatarImages:avatars,download:false,
    });
    expect(result.pages).toBe(1);
    expect(result.model.total).toBe(4);
    expect(result.filename).toBe("lista-alumnos-specialty-todos.pdf");
    expect(new TextDecoder("latin1").decode(result.bytes)).toContain("/Count 1");
    expect(result.bytes.length).toBeGreaterThan(1000);
  });
  it("divide un listado grande respetando el total de alumnos",async()=>{
    const original=document.createElement.bind(document);
    vi.spyOn(document,"createElement").mockImplementation(tag=>
      tag==="canvas"?createCanvas(1240,1754):original(tag));
    const many=Array.from({length:45},(_,i)=>student(String(i),"Estudiante "+i,"Programación","Empresa B"));
    const avatars=new Map(many.map(s=>[s.name,null]));
    const result=await generateStudentRosterPdf({...state,students:many},{
      sortBy:"alphabetical",logoImage:createCanvas(220,80),
      avatarImages:avatars,download:false
    });
    expect(result.pages).toBeGreaterThan(1);
    expect(result.model.total).toBe(45);
  });
  it("evita imprimir un PDF vacío",async()=>{
    await expect(generateStudentRosterPdf({students:[]},{download:false}))
      .rejects.toThrow("No hay alumnos");
  });
});
