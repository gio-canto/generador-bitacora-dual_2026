import {afterEach,describe,expect,it,vi} from "vitest";
import {createCanvas} from "@napi-rs/canvas";
import {
 NOTICE_FORMATS,NOTICE_THEMES,NOTICE_TEMPLATES,noticeModel,noticeFilename,
 drawNoticeCanvas,renderNoticePng,downloadNoticeBatch,
} from "../src/services/notice-png.js";
import {normalizeAnnouncement} from "../src/services/delivery-announcements.js";
afterEach(()=>vi.restoreAllMocks());
const logo=()=>createCanvas(150,65);
const reminder={id:"due-1",kind:"reminder",title:"Última fecha de entrega",
 subtitle:"BITÁCORAS DE EDUCACIÓN DUAL",
 message:"Entrega las semanas 18, 19 y 20 antes del último día indicado.",
 dueLabel:"FECHA LÍMITE 30 DE OCTUBRE",footer:"CBTIS 134 · Educación Dual"};

describe("Avisos PNG v0.56.1",()=>{
 it("ofrece tres formatos, tres estilos y plantillas",()=>{
  expect(NOTICE_FORMATS.map(x=>[x.width,x.height])).toEqual([
   [1080,1350],[1080,1080],[1080,1920]]);
  expect(NOTICE_THEMES).toHaveLength(3);
  expect(NOTICE_TEMPLATES.some(x=>x.id==="release")).toBe(true);
 });
 it.each(NOTICE_FORMATS)("genera PNG real $id sin descargar ni enviar datos",async format=>{
  const real=document.createElement.bind(document);
  vi.spyOn(document,"createElement").mockImplementation(tag=>
    tag==="canvas"?createCanvas(1,1):real(tag));
  const exported=await renderNoticePng(reminder,{logo:logo(),format:format.id,theme:"editorial"});
  expect([exported.width,exported.height]).toEqual([format.width,format.height]);
  expect(exported.filename).toMatch(/^aviso-ultima-fecha-de-entrega/);
  expect(Array.from(exported.bytes.slice(0,8))).toEqual([137,80,78,71,13,10,26,10]);
  expect(exported.bytes.length).toBeGreaterThan(2000);
 });
 it("dibuja un texto largo y con fecha sin romper el canvas",()=>{
  const canvas=createCanvas(1,1);
  const item={...reminder,title:"La semana de entrega extraordinaria",
    message:"Es importante presentar las bitácoras correspondientes a la semana 18, 19 y 20 del periodo actual.",
    audienceLabel:"Estudiantes de Programación"};
  expect(()=>drawNoticeCanvas(canvas,item,{logo:logo(),format:"story",theme:"night"}))
    .not.toThrow();
  expect(canvas.height).toBe(1920);
 });
 it("avisa si el mensaje completo no cabe en un PNG cuadrado",()=>{
  const canvas=createCanvas(1,1);
  const long={...reminder,message:"Es indispensable atender esta convocatoria y proporcionar todos los datos de identificación, documentos, formatos de entrega y observaciones solicitados por el plantel, tal como se comunicó durante la clase. ".repeat(8)};
  expect(()=>drawNoticeCanvas(canvas,long,{logo:logo(),format:"square",theme:"editorial"}))
    .toThrow(/mensaje es demasiado largo/);
 });
 it("respeta título, pie, fecha, tamaño y tema de diseños guardados",()=>{
  const normalized=normalizeAnnouncement({
   title:"Aviso personal",message:"Presentar la bitácora",
   subtitle:"PERSONALIZADO",footer:"CBTIS 134",displayDate:"2026-10-30",
   theme:"night",format:"square",kind:"reminder"});
  expect(normalized).toMatchObject({
   subtitle:"PERSONALIZADO",footer:"CBTIS 134",displayDate:"2026-10-30",
   theme:"night",format:"square",kind:"reminder"});
  expect(noticeModel(normalized).dueLabel).toBe("FECHA: 30/10/2026");
  expect(noticeFilename(normalized,normalized.format)).toBe("aviso-aviso-personal-square.png");
 });
 it("genera ZIP válido con dos PNG y numeración sin dependencias",async()=>{
  const real=document.createElement.bind(document);
  vi.spyOn(document,"createElement").mockImplementation(tag=>
    tag==="canvas"?createCanvas(1,1):real(tag));
  const output=await downloadNoticeBatch([reminder,{
   kind:"release",title:"Nueva versión",message:"Mejoras del Generador"
  }],{logo:logo(),format:"square",download:false});
  expect(output.count).toBe(2);
  expect(output.filename).toBe("avisos-generador-dual.zip");
  expect(Array.from(output.bytes.slice(0,4))).toEqual([80,75,3,4]);
  expect(Array.from(output.bytes.slice(-22,-18))).toEqual([80,75,5,6]);
  const content=new TextDecoder().decode(output.bytes);
  expect(content).toContain("01-aviso-ultima-fecha-de-entrega-square.png");
  expect(content).toContain("02-aviso-nueva-version-square.png");
 });
 it("rechaza lotes vacíos o mayores de 25 archivos",async()=>{
  await expect(downloadNoticeBatch([],{logo:logo(),download:false})).rejects.toThrow("No hay avisos");
  await expect(downloadNoticeBatch(Array.from({length:26},()=>reminder),
   {logo:logo(),download:false})).rejects.toThrow("máximo de 25");
 });
});
