import {describe,expect,it} from "vitest";
import {blankManualDays,buildManualStatistics,manualDaysFromStatistics} from "../src/services/manual-statistics.js";
import {createWeek,saveManualDelivery,sanitizeDeliveryState,createStudent} from "../src/services/delivery-registry.js";
describe("captura manual de estadísticas",()=>{
  const sample=[
    {status:"laboral",hours:"4",reasonCode:"0"},
    {status:"falta",hours:"",reasonCode:"3"},
    {status:"sin_labores",hours:"",reasonCode:"1"},
    {status:"inhabil",hours:"",reasonCode:"0"},
  ];
  it("guarda 4 jornadas y sus causas en minutos",()=>{
    const result=buildManualStatistics(sample);
    expect(result.entries[0].minutes).toBe(240);
    expect(result.entries[1].reasonCode).toBe(3);
    expect(result.entries[2].reasonCode).toBe(1);
    expect(manualDaysFromStatistics(result)[0].hours).toBe("4");
  });
  it("permite entregar sin estadísticas, sin inventar ceros",()=>{
    expect(buildManualStatistics(blankManualDays())).toBeNull();
    expect(()=>buildManualStatistics([{status:"laboral",hours:"4",reasonCode:"0"},...blankManualDays().slice(1)])).toThrow(/Completa/);
    expect(()=>buildManualStatistics(sample.map((x,i)=>i===0?{...x,hours:"-4"}:x))).toThrow(/horas/);
  });
  it("mantiene método de elaboración y resumen en respaldo",()=>{
    const st=createStudent({name:"Persona Ejemplo",semesterGroup:"5°A"});
    const week=saveManualDelivery(createWeek({startDate:"2026-10-20"}),st.id,"entregado",{usageSource:"other",statistics:buildManualStatistics(sample)});
    const saved=sanitizeDeliveryState({schemaVersion:8,students:[st],weeks:[week]});
    const delivery=saved.weeks[0].deliveries[st.id];
    expect(saved.schemaVersion).toBe(9);
    expect(saved.students[0].group).toBe("A");
    expect(delivery.usageSource).toBe("other");
    expect(delivery.statistics.entries[1].status).toBe("falta");
  });
});
