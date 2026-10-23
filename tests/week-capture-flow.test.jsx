import {afterEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import DeliveryRegistry from "../src/components/DeliveryRegistry.jsx";
import {createStudent,createDeliveryState,DELIVERY_KEY,writeDeliveryState} from "../src/services/delivery-registry.js";

afterEach(()=>{
  cleanup();
  localStorage.clear();
});

describe("alta semanal con captura progresiva",()=>{
  it("crea una semana, permite editar jornadas del alumnado y guarda registros manuales",async()=>{
    localStorage.clear();
    const raw=createDeliveryState();
    raw.context={school:"CBTIS 134",generation:"2024-2027"};
    raw.students=[
      createStudent({id:"a",name:"Ana de prueba",specialty:"Programación"}),
      createStudent({id:"b",name:"Luis de prueba",specialty:"Contabilidad"}),
    ];
    writeDeliveryState(raw);
    const {container}=render(<DeliveryRegistry onClose={vi.fn()}/>);
    fireEvent.click(screen.getAllByRole("button",{name:/Nueva semana/})[0]);
    fireEvent.change(container.querySelector('input[type="date"]'),{target:{value:"2026-10-27"}});
    fireEvent.change(container.querySelector('input[type="datetime-local"]'),{target:{value:"2026-11-01T19:00"}});
    fireEvent.click(screen.getByRole("button",{name:"Crear y capturar jornadas"}));
    expect(screen.getByRole("dialog",{name:"Ana de prueba"})).toBeTruthy();
    expect(screen.getByText(/Captura de jornadas · 1 de 2/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Martes · jornada"),{target:{value:"falta"}});
    fireEvent.change(screen.getByLabelText("Martes · motivo"),{target:{value:"23"}});
    for(const day of ["Miércoles","Jueves","Viernes"])
      fireEvent.change(screen.getByLabelText(day+" · jornada"),{target:{value:"inhabil"}});
    fireEvent.click(screen.getByRole("button",{name:"Guardar y siguiente"}));
    await waitFor(()=>expect(screen.getByRole("dialog",{name:"Luis de prueba"})).toBeTruthy());
    fireEvent.click(screen.getByRole("button",{name:"Omitir alumno"}));
    await waitFor(()=>expect(screen.queryByRole("dialog")).toBeNull());
    const saved=JSON.parse(localStorage.getItem(DELIVERY_KEY));
    expect(saved.weeks).toHaveLength(1);
    const d=saved.weeks[0].deliveries.a;
    expect(d.source).toBe("manual");
    expect(d.status).toBe("no_entregado");
    expect(d.statistics.entries[0]).toMatchObject({
      status:"falta",reasonCode:23,reasonId:"academic_festival_local",
    });
    expect(saved.weeks[0].deliveries.b).toBeUndefined();
  });
});
