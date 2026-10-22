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
  });
});
