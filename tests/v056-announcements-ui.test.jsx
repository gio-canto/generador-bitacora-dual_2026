import {describe,it,expect,vi,afterEach} from "vitest";
import {render,fireEvent,screen,cleanup} from "@testing-library/react";
import DeliveryAnnouncements from "../src/components/DeliveryAnnouncements.jsx";
import {createStudent} from "../src/services/delivery-registry.js";

afterEach(cleanup);
const student=createStudent({id:"student-1",name:"Alumna Ejemplo",
  company:"Empresa A",specialty:"Programación"});
const state={students:[student],weeks:[],announcements:[]};
describe("v0.56 · centro de anuncios",()=>{
 it("crea un recordatorio personalizado dirigido a una persona",()=>{
  const onSave=vi.fn();
  render(<DeliveryAnnouncements state={state} onSave={onSave} onBack={vi.fn()}/>);
  fireEvent.change(screen.getByLabelText("Destinatarios"),{target:{value:"student"}});
  fireEvent.change(screen.getByLabelText("Seleccionar alumno"),{target:{value:"student-1"}});
  fireEvent.change(screen.getByLabelText("Título"),{target:{value:"Presentar bitácora"}});
  fireEvent.change(screen.getByLabelText("Mensaje"),{target:{value:"Recuerda entregar la semana 20."}});
  fireEvent.click(screen.getByRole("button",{name:"Publicar aviso local"}));
  expect(onSave).toHaveBeenCalledWith([
   expect.objectContaining({title:"Presentar bitácora",message:"Recuerda entregar la semana 20.",
     audience:"student",audienceId:"student-1",kind:"custom"})
  ]);
 });
 it("permite preparar un anuncio de la versión actual",()=>{
  render(<DeliveryAnnouncements state={state} onSave={vi.fn()} onBack={vi.fn()}/>);
  fireEvent.change(screen.getByLabelText("Tipo"),{target:{value:"release"}});
  fireEvent.click(screen.getByRole("button",{name:"Usar datos de la versión actual"}));
  expect(screen.getByLabelText("Título").value).toContain("0.56.0");
  expect(screen.getByLabelText("Mensaje").value).toContain("Novedades:");
 });
});
