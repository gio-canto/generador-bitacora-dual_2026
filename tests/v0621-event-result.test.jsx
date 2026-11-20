import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import ManualDeliveryDialog from "../src/components/ManualDeliveryDialog.jsx";
import { eventsForSchool, specialEventById, specialEventText, validSpecialEvent } from "../src/services/special-events.js";
import { blankRecord, recordShape } from "../src/domain/records.js";
import { buildManualStatistics, manualDaysFromStatistics } from "../src/services/manual-statistics.js";
import { createStudent, createWeek, registerDelivery, sanitizeDeliveryState } from "../src/services/delivery-registry.js";
import { encodeWeekStatistics, decodeWeekStatistics } from "../src/services/matrix-statistics.js";

const school = "CBTis No. 134";
afterEach(cleanup);

describe("0.62.1 · resultado de eventos especiales", () => {
  it("abrevia el Festival Académico y muestra el aviso general sin la frase anterior", () => {
    expect(specialEventById("festival",school)?.label).toBe("Festival Académico de la DGETI");
    const source=readFileSync(new URL("../src/legacy/editor.js",import.meta.url),"utf8");
    expect(source).toContain("Esta opción sirve para registrar la participación en concursos");
    expect(source).toContain("Señala también si realizaste labores de Educación Dual");
    expect(source).not.toContain("El evento no se contabilizará como falta y podrá ser revisado en Registro Dual.");
  });

  it("incluye el resultado sólo cuando se captura; aplica a todos los eventos", () => {
    for (const event of eventsForSchool(school)) {
      const phase=event.phases[0],discipline=event.disciplines[0];
      const name=event.id==="otros"?"Actividad institucional":"";
      const plain=specialEventText(event,phase,discipline,name);
      const ranked=specialEventText(event,phase,discipline,name,"3.er lugar");
      expect(plain).not.toContain("Resultado obtenido:");
      expect(ranked).toBe(plain+" Resultado obtenido: 3.er lugar.");
    }
    expect(specialEventText(specialEventById("festival",school),"estatal","Inglés","","1.er lugar."))
      .toContain("Resultado obtenido: 1.er lugar.");
  });

  it("conserva compatibilidad con registros previos y valida 120 caracteres",()=>{
    const old={eventId:"festival",eventPhase:"estatal",eventDiscipline:"Inglés",eventMode:"sin"};
    expect(validSpecialEvent(old,school)).toBe(true);
    expect(validSpecialEvent({...old,eventResult:"Primer lugar"},school)).toBe(true);
    expect(validSpecialEvent({...old,eventResult:"x".repeat(121)},school)).toBe(false);
    const record=blankRecord();
    const entry={date:"2026-11-17",start:"",end:"",area:"",activity:"Participé en una actividad académica.",
      status:"evento",...old,eventResult:"3.er lugar"};
    record.entries=[entry];
    expect(recordShape(record)).toBe(true);
    record.entries=[{...entry,eventResult:"x".repeat(121)}];
    expect(recordShape(record)).toBe(false);
  });

  it("mantiene los datos de resultado fuera de S6; no altera las lecturas anteriores",()=>{
    const event={status:"evento",eventId:"festival",eventPhase:"estatal",
      eventDiscipline:"Inglés",eventMode:"sin",eventResult:"1.er lugar"};
    const week=[
      {status:"laboral",start:"10:00",end:"14:00"},
      event,{status:"inhabil"},{status:"inhabil"}
    ];
    const withResult=encodeWeekStatistics(week);
    const withoutResult=encodeWeekStatistics(week.map(({eventResult,...entry})=>entry));
    expect(withResult).toMatch(/^S6:/);
    expect(withResult).toBe(withoutResult);
    expect(decodeWeekStatistics(withResult)?.entries[1]).not.toHaveProperty("eventResult");
  });

  it("el registro manual captura y recupera el resultado en respaldo JSON",()=>{
    const onSave=vi.fn();
    const student=createStudent({name:"Persona Ejemplo",specialty:"Programación",company:"COCYTIEG"});
    const week=createWeek({startDate:"2026-11-17"});
    render(<ManualDeliveryDialog student={student} school={school} week={week}
      initialStatus="no_entregado" onSave={onSave} onCancel={vi.fn()}/>);
    fireEvent.change(screen.getByLabelText("Martes · jornada"),{target:{value:"evento"}});
    fireEvent.change(screen.getByLabelText("Martes · evento"),{target:{value:"1"}});
    fireEvent.change(screen.getByLabelText("Martes · fase"),{target:{value:"estatal"}});
    const result=screen.getByLabelText("Martes · resultado obtenido");
    expect(result.getAttribute("placeholder")).toMatch(/1.er lugar/);
    fireEvent.change(result,{target:{value:"3.er lugar"}});
    for(const day of ["Miércoles","Jueves","Viernes"])
      fireEvent.change(screen.getByLabelText(day+" · jornada"),{target:{value:"inhabil"}});
    fireEvent.click(screen.getByRole("button",{name:"Guardar registro"}));
    expect(onSave).toHaveBeenCalledTimes(1);
    const stats=onSave.mock.calls[0][0].statistics;
    expect(stats.entries[0]).toMatchObject({status:"evento",eventPhase:"estatal",
      eventResult:"3.er lugar",minutes:0});
    expect(manualDaysFromStatistics(stats)[0].eventResult).toBe("3.er lugar");
    const registered=registerDelivery(week,student.id,"2026-11-21T10:00:00Z","manual",
      {matrixVersion:5,statistics:stats});
    const restored=sanitizeDeliveryState({schemaVersion:9,students:[student],weeks:[registered]});
    expect(restored.weeks[0].deliveries[student.id].statistics.entries[0].eventResult)
      .toBe("3.er lugar");
  });

  it("el resultado es opcional y no agrega campos ficticios a una jornada sin evento",()=>{
    const days=[
      {status:"laboral",hours:"4",reasonCode:"0"},
      {status:"evento",hours:"",reasonCode:"1",eventPhase:"estatal",eventDiscipline:"Inglés",eventMode:"sin"},
      {status:"sin_labores",hours:"",reasonCode:"1"},
      {status:"inhabil",hours:"",reasonCode:"0"}
    ];
    const stats=buildManualStatistics(days);
    expect(stats.version).toBe(6);
    expect(stats.entries[1]).not.toHaveProperty("eventResult");
    expect(stats.entries[0]).not.toHaveProperty("eventResult");
  });
});
