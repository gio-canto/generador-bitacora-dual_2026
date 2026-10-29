import {afterEach,describe,expect,it,vi} from "vitest";
import {createCanvas,loadImage} from "@napi-rs/canvas";
import {generateStatisticsReportPdf} from "../src/services/statistics-report.js";
import {createStudent,createWeek,saveManualDelivery} from "../src/services/delivery-registry.js";
import {buildManualStatistics} from "../src/services/manual-statistics.js";
describe("reporte PDF estadístico",()=>{
  afterEach(()=>{vi.restoreAllMocks();});
  it("descarga seis páginas, comparativa de horas y anexo íntegro de empresas",async()=>{
    const realCreate=document.createElement.bind(document);
    vi.spyOn(document,"createElement").mockImplementation(name=>name==="canvas"?createCanvas(1240,1754):realCreate(name));
    let blob=null;
    const originalCreate=URL.createObjectURL;
    const originalRevoke=URL.revokeObjectURL;
    URL.createObjectURL=vi.fn(value=>{blob=value;return "blob:estadisticas-prueba";});
    URL.revokeObjectURL=vi.fn();
    const click=vi.spyOn(HTMLAnchorElement.prototype,"click").mockImplementation(()=>{});
    const student=createStudent({name:"Persona Ejemplo",specialty:"Programación",company:"Empresa 1"});
    const statistics=buildManualStatistics([
      {status:"laboral",hours:"4",reasonCode:"0"},
      {status:"laboral",hours:"4",reasonCode:"0"},
      {status:"inhabil",hours:"",reasonCode:"0"},
      {status:"falta",hours:"",reasonCode:"3"},
    ]);
    const week=saveManualDelivery(createWeek({startDate:"2026-10-20",label:"Semana 1"}),student.id,"entregado",{usageSource:"generator",statistics});
    vi.spyOn(globalThis,"setTimeout").mockImplementation(()=>0);
    const logo = await loadImage("public/Assets/Asset_logo.png");
    const output=await generateStatisticsReportPdf({context:{school:"Plantel de prueba",generation:"2025–2028"},students:[student],weeks:[week]},{period:"weekly",weekId:week.id},{logoImage:logo});
    expect(output.pages).toBe(9);
    expect(output.filename).toMatch(/^estadisticas-dual-.*\.pdf$/);
    expect(output.pages).toBeGreaterThanOrEqual(9);
    expect(blob?.type).toBe("application/pdf");
    expect(blob?.size).toBeGreaterThan(1500);
    const pdfText = new TextDecoder("latin1").decode(new Uint8Array(await blob.arrayBuffer()));
    expect(pdfText).toContain("/Count 9");
    expect(click).toHaveBeenCalledTimes(1);
    URL.createObjectURL=originalCreate;URL.revokeObjectURL=originalRevoke;
  });
  it("pagina todas las empresas en el anexo sin excluir las que tienen cero faltas",async()=>{
    const realCreate=document.createElement.bind(document);
    vi.spyOn(document,"createElement").mockImplementation(name=>name==="canvas"?createCanvas(1240,1754):realCreate(name));
    const logo=await loadImage("public/Assets/Asset_logo.png");
    const students=Array.from({length:27},(_,i)=>createStudent({
      id:"empresa-"+i,name:"Estudiante "+i,company:"Empresa "+String(i+1).padStart(2,"0"),
    }));
    const week=createWeek({id:"w1",startDate:"2026-10-20",label:"Semana 1"});
    const state={students,weeks:[week],context:{school:"Plantel",generation:"2025–2028"}};
    const oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL;
    URL.createObjectURL=vi.fn(()=>"blob:estadisticas-test");
    URL.revokeObjectURL=vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype,"click").mockImplementation(()=>{});
    vi.spyOn(globalThis,"setTimeout").mockImplementation(()=>0);
    try{
      const result=await generateStatisticsReportPdf(state,{period:"weekly",weekId:"w1"},{logoImage:logo});
      expect(result.pages).toBe(11); // 7 páginas, 2 anexos de empresas y 2 de alumnos.
    }finally{
      URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke;
    }
  });

});
