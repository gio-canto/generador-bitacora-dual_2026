import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import messages from "../src/data/generator-messages.json";
import companies from "../src/data/companies.json";
import {finalBitacoraMessages,validateMessageConfig} from "../src/services/generator-message-rules.js";

const profile={school:"cbtis-134",specialty:"Programación"};

describe("despedida automática por fecha y catálogo del Consejo",()=>{
  it("no exige marcar la última bitácora",()=>{
    const shell=readFileSync("src/legacy/shell.html","utf8");
    const editor=readFileSync("src/legacy/editor.js","utf8");
    expect(shell).not.toContain('id="generatorFinalDual"');
    expect(editor).not.toContain("generatorFinalDual");
    expect(editor).toContain("const scheduledFarewell=finalBitacoraMessages");
    expect(editor).toContain("mobile:isMobileLike(),final:scheduledFarewell,saved");
    expect(editor).toContain('window.dispatchEvent(new CustomEvent("bitacora-final-bitacora"');
  });
  it("sólo presenta el evento de la fecha programada y del plantel correspondiente",()=>{
    expect(validateMessageConfig(messages)).toEqual([]);
    const get=(date,school="cbtis-134")=>finalBitacoraMessages(messages,{
      date,profile:{...profile,school}
    }).map(event=>event.id);
    expect(get("2027-07-22")).toEqual(["graduacion-cbtis134-dual-generacion4-2027"]);
    expect(get("2027-07-23")).toEqual(["graduacion-cbtis134-dual-generacion4-2027"]);
    expect(get("2027-07-19")).toEqual([]);
    expect(get("2027-07-24")).toEqual([]);
    expect(get("2027-07-22","otro-plantel")).toEqual([]);
    expect(messages.events.find(event=>event.id==="fin-dual")?.enabled).toBe(false);
  });
  it("conserva un solo instructor Raúl Armando Ocampo en el Consejo",()=>{
    const council=companies.find(company=>company.id==="company-1");
    expect(council?.shortName).toBe("COCYTIEG");
    const matches=council.instructors.filter(item=>item.name.includes("Raúl Armando Ocampo"));
    expect(matches).toEqual([{
      name:"Ing. Raúl Armando Ocampo",
      roleMain:"Encargado del Área de Archivo"
    }]);
  });
});
