import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import ManualDeliveryDialog from "../src/components/ManualDeliveryDialog.jsx";
import { blankManualDays, buildManualStatistics, manualDaysFromStatistics } from "../src/services/manual-statistics.js";
import { encodeWeekStatistics, decodeWeekStatistics } from "../src/services/matrix-statistics.js";
import { createStudent, createWeek } from "../src/services/delivery-registry.js";
import { blankRecord, validateRecord } from "../src/domain/records.js";
import { buildPageModel } from "../src/services/pdf.js";

afterEach(cleanup);
const student=createStudent({name:"Alumno de prueba",specialty:"Programación",company:"COCYTIEG"});
const week=createWeek({startDate:"2026-11-17"});
const school="CBTis No. 134";
const event={date:"2026-11-17",status:"evento",start:"09:00",end:"12:00",
  area:"Área de proyectos",activity:"Participé en la presentación de prototipos ante el jurado.",
  eventId:"prototipos",eventPhase:"estatal",eventDiscipline:"Emprendimiento social",
  eventMode:"con",eventResult:"3.er lugar"};

describe("v0.62.2 · evento sin selector de modalidad",()=>{
  it("el editor no muestra modalidades y crea eventos con labores",()=>{
    const source=readFileSync("src/legacy/editor.js","utf8");
    expect(source).not.toContain('field("Modalidad",');
    expect(source).toContain('eventMode:"con",eventResult:""');
    expect(source).toContain("Completa el horario y el área de la jornada.");
  });
  it("el registro manual muestra horarios y área de eventos sin preguntar modalidad",()=>{
    const onSave=vi.fn();
    render(<ManualDeliveryDialog student={student} school={school} week={week}
      initialStatus="no_entregado" onSave={onSave} onCancel={vi.fn()}/>);
    fireEvent.change(screen.getByLabelText("Martes · jornada"),{target:{value:"evento"}});
    expect(screen.queryByLabelText("Martes · modalidad")).toBeNull();
    expect(screen.getByLabelText("Martes · horas")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Martes · evento"),{target:{value:"2"}});
    expect(screen.queryByLabelText("Martes · modalidad")).toBeNull();
    fireEvent.change(screen.getByLabelText("Martes · fase"),{target:{value:"estatal"}});
    fireEvent.change(screen.getByLabelText("Martes · horas"),{target:{value:"3"}});
    for(const day of ["Miércoles","Jueves","Viernes"])
      fireEvent.change(screen.getByLabelText(day+" · jornada"),{target:{value:"inhabil"}});
    fireEvent.click(screen.getByRole("button",{name:"Guardar registro"}));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0].statistics.entries[0]).toMatchObject({
      status:"evento",eventMode:"con",minutes:180,reasonId:"prototipos"});
  });
  it("el nuevo modo predeterminado es con labores, pero conserva historial sin labores",()=>{
    expect(blankManualDays()[0].eventMode).toBe("con");
    const previous={version:6,entries:[
      {status:"evento",minutes:0,reasonCode:2,reasonId:"prototipos",
        eventPhase:"estatal",eventDiscipline:"Emprendimiento social",eventMode:"sin"},
      {status:"inhabil",minutes:0,reasonCode:0},{status:"inhabil",minutes:0,reasonCode:0},
      {status:"inhabil",minutes:0,reasonCode:0}
    ]};
    const restored=manualDaysFromStatistics(previous);
    expect(restored[0].eventMode).toBe("sin");
    expect(buildManualStatistics(restored).entries[0]).toMatchObject({status:"evento",eventMode:"sin",minutes:0});
  });
  it("el PDF sólo imprime EVENTO y transmite modo con labores en S6",()=>{
    const record=blankRecord();
    record.school=school;record.entries=[event];
    expect(validateRecord({...record,entries:[event,event,event,event]},2))["entries.1.date"]).toBeTruthy();
    expect(buildPageModel(record).rows[0]).toMatchObject({label:"EVENTO",st:"evento"});
    const code=encodeWeekStatistics([event,
      {status:"inhabil"},{status:"inhabil"},{status:"inhabil"}]);
    expect(code).toMatch(/^S6:/);
    expect(decodeWeekStatistics(code).entries[0]).toMatchObject({status:"evento",eventMode:"con",minutes:180});
  });
});
