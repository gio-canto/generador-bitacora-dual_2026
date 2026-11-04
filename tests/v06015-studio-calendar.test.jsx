// @vitest-environment jsdom
import React from "react";
import {afterEach,describe,it,expect,vi} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import {StudioCalendar} from "../src/components/EventStudioControls.jsx";
import EventEditorDebug from "../src/components/EventEditorDebug.jsx";

afterEach(()=>{cleanup();vi.restoreAllMocks();});

describe("0.60.15 · calendario y configuración de prueba",()=>{
  it("puede navegar de julio a agosto dentro del periodo permitido",()=>{
    const onChange=vi.fn();
    render(<StudioCalendar label="Días de video" multiple
      value={["2027-07-22"]} onChange={onChange}
      min="2027-07-19" max="2027-08-05"/>);
    const next=screen.getByRole("button",{name:"Mes siguiente"});
    expect(next.disabled).toBe(false);
    fireEvent.click(next);
    expect(screen.getByRole("button",{name:"2027-08-05"}).disabled).toBe(false);
    expect(screen.getByRole("button",{name:"2027-08-06"}).disabled).toBe(true);
    expect(screen.getByRole("button",{name:"Mes siguiente"}).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button",{name:"2027-08-05"}));
    expect(onChange).toHaveBeenCalledWith(["2027-07-22","2027-08-05"]);
  });
  it("informa al simulador cuando el editor cambia su configuración",()=>{
    const onConfigChange=vi.fn();
    render(<EventEditorDebug onConfigChange={onConfigChange}/>);
    expect(onConfigChange).toHaveBeenCalled();
    const first=onConfigChange.mock.lastCall[0].events.length;
    fireEvent.click(screen.getByRole("button",{name:/Nuevo mensaje/}));
    expect(onConfigChange.mock.lastCall[0].events).toHaveLength(first+1);
    expect(onConfigChange.mock.lastCall[0].events.at(-1).enabled).toBe(false);
  });
});
