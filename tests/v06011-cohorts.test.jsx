// @vitest-environment jsdom
import React from "react";
import {afterEach,describe,expect,it} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import {readFileSync} from "node:fs";
import published from "../src/data/generator-messages.json";
import {readProfileData,rememberProfile,createProfile,switchProfile,
  readActiveProfileId} from "../src/services/profile.js";
import {eligibleMessages,finalBitacoraMessages,activeGraduation,
  validateMessageConfig,messageEventWarnings} from "../src/services/generator-message-rules.js";
import {graduationPreviewForDate} from "../src/services/debug-graduation.js";
import {Profile} from "../src/components/Profile.jsx";
const school="cbtis-134",date="2027-07-22";
const profile={school,specialty:"Programación"};
const store=()=>{const data=new Map();return{
  getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)
};};
afterEach(()=>{cleanup();window.localStorage.clear();});

describe("0.60.11.1 · generación institucional por plantel",()=>{
  it("no requiere generación en el perfil: utiliza plantel y fechas programadas",()=>{
    const grad=published.events.find(e=>e.trigger?.type==="graduation");
    expect(grad.graduation.label).toContain("Cuarta generación");
    expect(grad.audience.schools).toEqual(["cbtis-134"]);
    expect(grad.audience).not.toHaveProperty("generations");
    expect(validateMessageConfig(published)).toEqual([]);
    expect(activeGraduation(published,{date,profile})?.id).toBe(grad.id);
    expect(finalBitacoraMessages(published,{date,profile}).map(e=>e.id)).toEqual([grad.id]);
    expect(eligibleMessages(published,{date,profile,trigger:"final-bitacora"})
      .map(e=>e.id)).toContain(grad.id);
  });
  it("otras escuelas o fechas no reciben la graduación del CBTis 134",()=>{
    const wrongSchool={...profile,school:"otro-plantel"};
    expect(activeGraduation(published,{date,profile:wrongSchool})).toBeNull();
    expect(finalBitacoraMessages(published,{date,profile:wrongSchool})
      .map(e=>e.id)).toEqual([]);
    expect(finalBitacoraMessages(published,{date:"2027-06-22",profile})
      .map(e=>e.id)).toEqual([]);
    expect(activeGraduation(published,{date:"2027-07-25",profile})).toBeNull();
  });
  it("eventos históricos con audience.generations no obligan a los alumnos",()=>{
    const historic=structuredClone(published);
    const grad=historic.events.find(e=>e.trigger.type==="graduation");
    grad.audience.generations=["una-clave-obsoleta"];
    expect(validateMessageConfig(historic)).toEqual([]);
    expect(activeGraduation(historic,{date,profile})?.id).toBe(grad.id);
    expect(finalBitacoraMessages(historic,{date,profile})[0].id).toBe(grad.id);
  });
  it("advierte graduaciones superpuestas del mismo plantel pero no entre planteles",()=>{
    const config=structuredClone(published),original=config.events.at(-1);
    const another=structuredClone(original);
    another.id="graduacion-otro-plantel";
    another.audience.schools=["plantel-otro"];
    config.events.push(another);
    expect(messageEventWarnings(config)).toEqual([]);
    another.audience.schools=["cbtis-134"];
    expect(messageEventWarnings(config)).toHaveLength(1);
  });
  it("Debug simula planteles sin exigir generación al alumno",()=>{
    const id=published.events.at(-1).id;
    expect(graduationPreviewForDate(published,id,date,profile)?.id).toBe(id);
    expect(graduationPreviewForDate(published,id,date,{...profile,school:"otro"})).toBeNull();
    expect(graduationPreviewForDate(published,id,date)?.id).toBe(id);
    const debug=readFileSync("src/debug-main.jsx","utf8");
    expect(debug).not.toContain('id="debug-test-generation"');
  });
});
describe("0.60.11.1 · perfiles sin selección de generación",()=>{
  it("omite el campo antiguo sin perder datos escolares y sin obligar una migración",()=>{
    const s=store();
    s.setItem("bitacora_profiles_v2",JSON.stringify({
      activeId:"p",profiles:{p:{name:"Alumna",school,semester:"5",generation:"dato-anterior",
        specialty:"Programación",company:"Empresa",defaultStart:"10:00",defaultEnd:"14:00"}}
    }));
    const before=readProfileData(s);
    expect(before).not.toHaveProperty("generation");
    expect(before.semester).toBe("5");
    expect(before.company).toBe("Empresa");
    expect(rememberProfile({group:"B"},s)).toBe(true);
    expect(readProfileData(s)).not.toHaveProperty("generation");
    expect(readProfileData(s).company).toBe("Empresa");
    expect(JSON.parse(s.getItem("bitacora_profiles_v2")).profiles.p.generation).toBeUndefined();
  });
  it("al cambiar de alumno no se altera la escuela",()=>{
    const s=store();
    const a=createProfile({name:"A",school:"CBTis No. 134"},s);
    const b=createProfile({name:"B",school:"Otro plantel"},s);
    expect(readActiveProfileId(s)).toBe(b);
    expect(switchProfile(a,s)).toBe(true);
    expect(readProfileData(s).school).toBe("CBTis No. 134");
    expect(switchProfile(b,s)).toBe(true);
    expect(readProfileData(s).school).toBe("Otro plantel");
  });
  it("el formulario no muestra selección de generación",()=>{
    rememberProfile({name:"Alumna",school:"CENTRO DE BACHILLERATO TECNOLÓGICO INDUSTRIAL Y DE SERVICIOS NO. 134",
      specialty:"Programación",defaultStart:"10:00",defaultEnd:"14:00"});
    render(<Profile/>);
    fireEvent.click(screen.getByRole("button",{name:"Editar"}));
    expect(document.querySelector("#profileGeneration")).toBeNull();
    expect(screen.queryByText("Generación de Educación Dual (opcional)")).toBeNull();
    expect(screen.getByLabelText("Institución / plantel")).toBeTruthy();
  });
});
