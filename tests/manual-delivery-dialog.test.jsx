import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import ManualDeliveryDialog from "../src/components/ManualDeliveryDialog.jsx";
import { createStudent, createWeek } from "../src/services/delivery-registry.js";

const student = createStudent({ id:"a",name:"Estudiante de prueba",specialty:"Programación" });
const week = createWeek({ id:"w1",label:"Semana 1",startDate:"2026-10-20" });
afterEach(cleanup);

describe("captura manual en teléfonos · v0.52.2", () => {
  it("permite registrar jornadas para No entregado sin marcar la bitácora como recibida", () => {
    const onSave = vi.fn();
    render(<ManualDeliveryDialog student={student} week={week} initialStatus="no_entregado"
      onCancel={vi.fn()} onSave={onSave}/>);
    expect(screen.getByRole("dialog",{name:"Estudiante de prueba"})).toBeTruthy();
    expect(screen.getByText("Horas y jornadas")).toBeTruthy();
    expect(screen.getByRole("combobox",{name:"Estado de entrega"}).value).toBe("no_entregado");
    expect(screen.queryByRole("option",{name:"No aplica"})).toBeNull();
    fireEvent.change(screen.getByLabelText("Martes · jornada"),{target:{value:"laboral"}});
    fireEvent.change(screen.getByLabelText("Martes · horas"),{target:{value:"4"}});
    for (const day of ["Miércoles","Jueves","Viernes"])
      fireEvent.change(screen.getByLabelText(day+" · jornada"),{target:{value:"inhabil"}});
    fireEvent.click(screen.getByRole("button",{name:"Guardar registro"}));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].status).toBe("no_entregado");
    expect(onSave.mock.calls[0][0].statistics.entries[0].minutes).toBe(240);
    expect(onSave.mock.calls[0][0].usageSource).toBe("unknown");
  });
  it("conserva jornadas existentes y exige método si está entregado", () => {
    const onSave=vi.fn();
    const statistics={version:5,entries:[
      {status:"laboral",minutes:180,reasonCode:0,reasonId:""},
      {status:"inhabil",minutes:0,reasonCode:0,reasonId:""},
      {status:"inhabil",minutes:0,reasonCode:0,reasonId:""},
      {status:"inhabil",minutes:0,reasonCode:0,reasonId:""},
    ]};
    render(<ManualDeliveryDialog student={student} week={week} onCancel={vi.fn()} onSave={onSave}
      previous={{status:"entregado",source:"camera",matrixVersion:4,statistics}}/>);
    expect(screen.getByLabelText("Martes · horas").value).toBe("3");
    expect(screen.getByRole("combobox",{name:"Método de elaboración"}).value).toBe("generator");
    fireEvent.click(screen.getByRole("button",{name:"Guardar registro"}));
    expect(onSave.mock.calls[0][0].statistics.entries[0].minutes).toBe(180);
  });
  it("guarda un registro sin inventar horas cuando todavía no se han capturado", () => {
    const onSave=vi.fn();
    render(<ManualDeliveryDialog student={student} week={week} onCancel={vi.fn()} onSave={onSave}
      initialStatus="no_entregado"/>);
    fireEvent.click(screen.getByRole("button",{name:"Guardar registro"}));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      status:"no_entregado",statistics:null,usageSource:"unknown",
    }));
  });  it("avanza por alumnos al capturar la semana y no obliga a guardar a los omitidos",()=>{
    const onSave=vi.fn();
    const onSkip=vi.fn();
    const onCancel=vi.fn();
    render(<ManualDeliveryDialog student={student} week={week}
      batchProgress={{position:2,total:5,remaining:4}}
      initialStatus="no_entregado" onCancel={onCancel} onSkip={onSkip} onSave={onSave}/>);
    expect(screen.getByText(/Captura de jornadas · 2 de 5/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Omitir alumno"}));
    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button",{name:"Guardar y siguiente"}));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      status:"no_entregado",usageSource:"unknown",statistics:null
    }));
    fireEvent.click(screen.getByRole("button",{name:"Terminar"}));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
  it("las faltas de concursos aparecen por fase en la captura manual",()=>{
    render(<ManualDeliveryDialog student={student} week={week}
      initialStatus="no_entregado" onCancel={vi.fn()} onSave={vi.fn()}/>);
    fireEvent.change(screen.getByLabelText("Martes · jornada"),{target:{value:"falta"}});
    for(const code of ["20","21","22","23","24","25","26","27","28"])
      expect(screen.getByLabelText("Martes · motivo").querySelector('option[value="'+code+'"]')).toBeTruthy();
  });

});
