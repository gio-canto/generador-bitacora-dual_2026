// @vitest-environment jsdom
import React from "react";
import {afterEach,describe,expect,it} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import published from "../src/data/generator-messages.json";
import {readProfileData,rememberProfile,createProfile,switchProfile,
  readActiveProfileId} from "../src/services/profile.js";
import {graduationCohorts} from "../src/services/graduation-cohorts.js";
import {eligibleMessages,finalBitacoraMessages,activeGraduation,
  validateMessageConfig,messageEventWarnings} from "../src/services/generator-message-rules.js";
import {graduationPreviewForDate} from "../src/services/debug-graduation.js";
import {Profile} from "../src/components/Profile.jsx";

const cohort="cbtis134-dual-4-2027";
const school="cbtis-134";
const date="2027-07-22";
const profile={school,specialty:"Programación",generation:cohort};
const storage=()=>{const data=new Map();return{
  getItem:key=>data.get(key)||null,
  setItem:(key,value)=>data.set(key,value),
  removeItem:key=>data.delete(key)
};};

afterEach(()=>{cleanup();window.localStorage.clear();});

describe("0.60.11 · reglas de generaciones",()=>{
  it("restringe la graduación de 2027 a una generación explícita",()=>{
    const graduation=published.events.find(e=>e.trigger?.type==="graduation");
    expect(graduation.audience.generations).toEqual([cohort]);
    expect(validateMessageConfig(published)).toEqual([]);
    expect(activeGraduation(published,{date,profile})?.id).toBe(graduation.id);
    expect(finalBitacoraMessages(published,{date,profile}).map(e=>e.id)).toEqual([graduation.id]);
    for(const generation of ["","otra-generacion","cbtis134-dual-3-2026"]){
      const other={...profile,generation};
      expect(activeGraduation(published,{date,profile:other})).toBeNull();
      expect(finalBitacoraMessages(published,{date,profile:other}).map(e=>e.id))
        .toEqual(["fin-dual"]);
      expect(eligibleMessages(published,{date,profile:other,trigger:"final-bitacora"})
        .some(e=>e.id===graduation.id)).toBe(false);
    }
  });
  it("mantiene reglas históricas sin generaciones y exige claves válidas",()=>{
    const legacy=structuredClone(published);
    const old=legacy.events.find(e=>e.trigger.type==="graduation");
    delete old.audience.generations;
    expect(validateMessageConfig(legacy)).toEqual([]);
    expect(activeGraduation(legacy,{date,profile:{school,specialty:"Programación"}})?.id)
      .toBe(old.id);
    old.audience.generations=["generación 2027"];
    expect(validateMessageConfig(legacy).join(" ")).toContain("Generación destinataria no válida");
  });
  it("las graduaciones de cohortes diferentes no generan falsas alertas",()=>{
    const config=structuredClone(published),original=config.events.at(-1),other=structuredClone(original);
    other.id="graduacion-otra-generacion";
    other.audience.generations=["cbtis134-dual-5-2028"];
    config.events.push(other);
    expect(messageEventWarnings(config)).toEqual([]);
    expect(finalBitacoraMessages(config,{date,profile}).map(e=>e.id))
      .toEqual([original.id]);
  });
  it("el catálogo de perfil sólo contiene generaciones activas de su plantel",()=>{
    expect(graduationCohorts(published,"cbtis-134")).toEqual([{id:cohort,
      label:"Cuarta generación Dual · CBTis No. 134"}]);
    expect(graduationCohorts(published,"otro-plantel")).toEqual([]);
    expect(graduationCohorts(published,"CENTRO DE BACHILLERATO TECNOLÓGICO INDUSTRIAL Y DE SERVICIOS NO. 134"))
      .toHaveLength(1);
  });
  it("Debug diferencia perfiles reales y mantiene la vista forzada histórica",()=>{
    const id=published.events.at(-1).id;
    expect(graduationPreviewForDate(published,id,date,profile)?.id).toBe(id);
    expect(graduationPreviewForDate(published,id,date,{...profile,generation:"otra"})).toBeNull();
    expect(graduationPreviewForDate(published,id,date,{...profile,generation:""})).toBeNull();
    expect(graduationPreviewForDate(published,id,date)?.id).toBe(id);
  });
});
describe("0.60.11 · perfil y retrocompatibilidad",()=>{
  it("un perfil anterior sin generación no pierde sus datos",()=>{
    const s=storage();
    s.setItem("bitacora_profiles_v2",JSON.stringify({
      activeId:"p",profiles:{p:{name:"Alumna",school,semester:"5",
        specialty:"Programación",company:"Empresa",defaultStart:"10:00",defaultEnd:"14:00"}}
    }));
    const before=readProfileData(s);
    expect(before.generation).toBe("");
    expect(before.semester).toBe("5");
    expect(before.company).toBe("Empresa");
    expect(rememberProfile({generation:cohort},s)).toBe(true);
    expect(readProfileData(s).generation).toBe(cohort);
    expect(readProfileData(s).company).toBe("Empresa");
    expect(rememberProfile({group:"B"},s)).toBe(true);
    expect(readProfileData(s).generation).toBe(cohort);
    expect(rememberProfile({generation:""},s)).toBe(true);
    expect(readProfileData(s).generation).toBe("");
  });
  it("la generación no se mezcla al cambiar de alumno",()=>{
    const s=storage();
    const a=createProfile({name:"Alumna A",generation:cohort},s);
    const b=createProfile({name:"Alumna B",generation:"otra-generacion"},s);
    expect(readActiveProfileId(s)).toBe(b);
    expect(readProfileData(s).generation).toBe("otra-generacion");
    expect(switchProfile(a,s)).toBe(true);
    expect(readProfileData(s).generation).toBe(cohort);
    expect(switchProfile(b,s)).toBe(true);
    expect(readProfileData(s).generation).toBe("otra-generacion");
  });
  it("el formulario permite elegir la generación publicada",()=>{
    rememberProfile({name:"Alumna",school:school,
      specialty:"Programación",defaultStart:"10:00",defaultEnd:"14:00"});
    render(<Profile/>);
    fireEvent.click(screen.getByRole("button",{name:"Editar"}));
    const selector=screen.getByRole("combobox",{name:"Generación de Educación Dual (opcional)"});
    expect(selector.value).toBe("");
    expect([...selector.options].some(x=>x.value===cohort)).toBe(true);
    fireEvent.change(selector,{target:{value:cohort}});
    expect(selector.value).toBe(cohort);
  });
});
