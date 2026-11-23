import {describe,it,expect} from "vitest";
import {createStudent,createWeek,createDeliveryState,addStudentAlias,findStudentByMatrixValue,
  findWeekByMatrixValue,learnExternalExample,sanitizeDeliveryState,normalizeName,validDualWeekPeriod} from "../src/services/delivery-registry.js";
import {extractExternalFields,suggestExternalStudent,suggestExternalWeekPeriod,applyExternalLearning} from "../src/services/external-bitacora.js";

const maria=createStudent({id:"maria",name:"María López García",specialty:"Programación",company:"Archivo"});
const jose=createStudent({id:"jose",name:"José Antonio Pérez",specialty:"Programación",company:"Archivo"});
const matrixName="BD26|4|mARIA loPeZ garCIA|Programacion|Archivo|20261117|20261120";
const matrixAlias="BD26|4|MARIa LPEZ GRCIA|Programacion|Archivo|20261117|20261120";

describe("v0.64.0 · alias persistentes y aprendizaje",()=>{
  it("resuelve nombres sin distinguir acentos o mayúsculas",()=>{
    expect(normalizeName("  MARÍA  López ")).toBe(normalizeName("maria lopez"));
    expect(findStudentByMatrixValue([maria],matrixName)?.id).toBe(maria.id);
    expect(suggestExternalStudent({name:"MARIA LOPEZ GARCIA",text:""},[maria])).toBe(maria.id);
  });
  it("guarda alias confirmados y los usa en Data Matrix y OCR",()=>{
    const students=addStudentAlias([maria,jose],maria.id,"MARIa LPEZ GRCIA");
    expect(students[0].aliases).toEqual(["MARIa LPEZ GRCIA"]);
    expect(findStudentByMatrixValue(students,matrixAlias)?.id).toBe(maria.id);
    expect(suggestExternalStudent({name:"Maria Lpez Grcia",text:""},students)).toBe(maria.id);
    expect(addStudentAlias(students,maria.id,"maria lpez grcia")).toBe(students);
  });
  it("impide usar el nombre o el alias de otra persona",()=>{
    expect(()=>addStudentAlias([maria,jose],maria.id,"JOSE ANTONIO PEREZ")).toThrow(/otro alumno/);
    const withAlias=addStudentAlias([maria,jose],jose.id,"J. PEREZ");
    expect(()=>addStudentAlias(withAlias,maria.id,"j. pérez")).toThrow(/otro alumno/);
  });
  it("aprende de ejemplos fotográficos revisados, conservando respaldo limitado",()=>{
    const source={...createDeliveryState(),students:[maria,jose],weeks:[createWeek({startDate:"2026-11-17"})]};
    const learned=learnExternalExample(source,maria.id,
      {name:"MARIA LPEZ GRCIA",company:"Arch1vo",method:"ocr"},
      {company:"Archivo"});
    expect(learned.students[0].aliases).toContain("MARIA LPEZ GRCIA");
    expect(learned.ocrLearning.examples).toHaveLength(1);
    expect(learned.ocrLearning.examples[0]).toMatchObject({
      studentId:maria.id,observedName:"MARIA LPEZ GRCIA",confirmedName:maria.name,
      observedCompany:"Arch1vo",confirmedCompany:"Archivo",method:"ocr"
    });
    const restored=sanitizeDeliveryState(JSON.parse(JSON.stringify(learned)));
    expect(restored.students[0].aliases).toEqual(["MARIA LPEZ GRCIA"]);
    expect(restored.ocrLearning.examples).toHaveLength(1);
    expect(JSON.stringify(restored)).not.toContain("data:image");
  });
  it("reutiliza correcciones de empresa solamente si no son ambiguas",()=>{
    const example={studentId:"maria",observedCompany:"Arch1vo",confirmedCompany:"Archivo"};
    expect(applyExternalLearning({company:"ARCH1VO"},[example],"maria").company).toBe("Archivo");
    expect(applyExternalLearning({company:"Arch1vo"},[example],"jose").company).toBe("Arch1vo");
    expect(applyExternalLearning({company:"Arch1vo"},[example,
      {...example,confirmedCompany:"Archivo General"}],"maria").company).toBe("Arch1vo");
  });
  it("propone crear semana solo a partir de jornadas de un mismo martes a viernes",()=>{
    const extracted=extractExternalFields("Martes 17/11/2026\nMiércoles 18/11/2026\nViernes 20/11/2026");
    expect(suggestExternalWeekPeriod(extracted)).toEqual({startDate:"2026-11-17",endDate:"2026-11-20"});
    expect(suggestExternalWeekPeriod({dates:["2026-11-17","2026-11-25"]})).toBeNull();
    expect(suggestExternalWeekPeriod({dates:["2026-11-16"]})).toBeNull();
    expect(suggestExternalWeekPeriod({dates:[]})).toBeNull();
    expect(findWeekByMatrixValue([],matrixName)).toBeNull();
    expect(validDualWeekPeriod("2026-11-17","2026-11-20")).toBe(true);
    expect(validDualWeekPeriod("2026-11-16","2026-11-19")).toBe(false);
    expect(validDualWeekPeriod("2026-11-17","2026-11-21")).toBe(false);
  });
});