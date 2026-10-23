import {describe,it,expect,vi,afterEach,beforeEach} from "vitest";
import {render,fireEvent,screen,cleanup,waitFor} from "@testing-library/react";
import DeliveryAnnouncements from "../src/components/DeliveryAnnouncements.jsx";
import {createStudent} from "../src/services/delivery-registry.js";
import {downloadNoticePng,downloadNoticeBatch,drawNoticeCanvas} from "../src/services/notice-png.js";

vi.mock("../src/services/student-dossier-report.js",()=>({
 loadDossierLogo:vi.fn(async()=>({width:120,height:62})),
}));
vi.mock("../src/services/notice-png.js",async original=>({
 ...await original(),
 drawNoticeCanvas:vi.fn((canvas,_notice,{format}={})=>{
   canvas.width=1080;canvas.height=format==="story"?1920:format==="square"?1080:1350;
 }),
 downloadNoticePng:vi.fn(async()=>({filename:"aviso.png"})),
 downloadNoticeBatch:vi.fn(async items=>({filename:"avisos.zip",count:items.length})),
}));
const student=createStudent({id:"student-1",name:"Alumna Ejemplo",
 company:"Empresa A",specialty:"Programación"});
const state={students:[student],weeks:[],announcements:[]};
beforeEach(()=>vi.clearAllMocks());
afterEach(cleanup);

describe("v0.56.1 · generador de avisos PNG",()=>{
 it("crea y guarda un diseño personalizado para un alumno",async()=>{
  const onSave=vi.fn();
  render(<DeliveryAnnouncements state={state} onSave={onSave} onBack={vi.fn()}/>);
  fireEvent.click(screen.getByRole("tab",{name:"Crear aviso"}));
  fireEvent.change(screen.getByLabelText("Título"),{target:{value:"Presentar bitácora"}});
  fireEvent.change(screen.getByLabelText("Subtítulo"),{target:{value:"RECORDATORIO"}});
  fireEvent.change(screen.getByLabelText("Mensaje"),{target:{value:"Recuerda entregar la semana 20."}});
  fireEvent.change(screen.getByLabelText("Destinatarios"),{target:{value:"student"}});
  fireEvent.change(screen.getByLabelText("Seleccionar alumno"),{target:{value:"student-1"}});
  fireEvent.change(screen.getByLabelText("Fecha del aviso (opcional)"),
    {target:{value:"2026-10-30"}});
  fireEvent.click(screen.getByRole("button",{name:"Guardar diseño"}));
  expect(onSave).toHaveBeenCalledWith([expect.objectContaining({
   title:"Presentar bitácora",subtitle:"RECORDATORIO",message:"Recuerda entregar la semana 20.",
   audience:"student",audienceId:"student-1",displayDate:"2026-10-30",
   kind:"custom",format:"post"})]);
 });
 it("puede generar aviso de la versión y exportarlo a PNG",async()=>{
  render(<DeliveryAnnouncements state={state} onSave={vi.fn()} onBack={vi.fn()}/>);
  fireEvent.click(screen.getByRole("tab",{name:"Crear aviso"}));
  fireEvent.change(screen.getByLabelText("Plantilla"),{target:{value:"release"}});
  fireEvent.click(screen.getByRole("button",{name:"Usar datos de la versión actual"}));
  expect(screen.getByLabelText("Título").value).toContain("0.56.1");
  expect(screen.getByLabelText("Mensaje").value).toContain("Novedades:");
  fireEvent.click(screen.getAllByRole("button",{name:"Descargar PNG"})[0]);
  await waitFor(()=>expect(downloadNoticePng).toHaveBeenCalled());
 });
 it("permite cambiar formato, generar aviso automático y descargar lote ZIP",async()=>{
  const due=new Date(Date.now()+86400000*2).toISOString();
  const withDeadline={...state,weeks:[{id:"w20",label:"Semana 20",dueAt:due}]};
  render(<DeliveryAnnouncements state={withDeadline} onSave={vi.fn()} onBack={vi.fn()}/>);
  expect(screen.getByText("Próxima fecha de entrega")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Formato PNG"),{target:{value:"story"}});
  await waitFor(()=>expect(drawNoticeCanvas).toHaveBeenCalledWith(
   expect.anything(),expect.anything(),expect.objectContaining({format:"story"})));
  fireEvent.click(screen.getByRole("button",{name:"Descargar todos · ZIP"}));
  await waitFor(()=>expect(downloadNoticeBatch).toHaveBeenCalledWith(
   expect.any(Array),expect.objectContaining({format:"story"})));
 });
 it("conserva avisos antiguos editables y exportables",async()=>{
  const previous={...state,announcements:[{
   id:"saved1",title:"Aviso anterior",message:"Presentar el reporte",kind:"custom",
   audience:"all",createdAt:"2026-10-20T12:00:00Z"
  }]};
  render(<DeliveryAnnouncements state={previous} onSave={vi.fn()} onBack={vi.fn()}/>);
  expect(screen.getByText("Aviso anterior")).toBeTruthy();
  fireEvent.click(screen.getByRole("button",{name:"Editar"}));
  expect(screen.getByLabelText("Título").value).toBe("Aviso anterior");
 });
});
