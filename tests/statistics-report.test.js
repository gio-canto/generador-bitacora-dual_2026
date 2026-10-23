import {afterEach,describe,expect,it,vi} from "vitest";
import {createCanvas,loadImage} from "@napi-rs/canvas";
import {generateStatisticsReportPdf} from "../src/services/statistics-report.js";
import {createStudent,createWeek,saveManualDelivery} from "../src/services/delivery-registry.js";
import {buildManualStatistics} from "../src/services/manual-statistics.js";
describe("reporte PDF estadístico",()=>{
  afterEach(()=>{vi.restoreAllMocks();});
  it("descarga cinco páginas PDF con el logo real como Blob sin abrir la impresión",async()=>{
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
    expect(output.pages).toBe(5);
    expect(output.filename).toMatch(/^estadisticas-dual-.*\.pdf$/);
    expect(blob?.type).toBe("application/pdf");
    expect(blob?.size).toBeGreaterThan(1500);
    const pdfText = new TextDecoder("latin1").decode(new Uint8Array(await blob.arrayBuffer()));
    expect(pdfText).toContain("/Count 5");
    expect(click).toHaveBeenCalledTimes(1);
    URL.createObjectURL=originalCreate;URL.revokeObjectURL=originalRevoke;
  });
});
