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
  });  it("permite escoger cada fase y conservar su ID en el registro manual",()=>{
    const reasons=[
      ["prototypes_entrepreneurship_local",20],
      ["prototypes_entrepreneurship_state",21],
      ["prototypes_entrepreneurship_national",22],
      ["academic_festival_local",23],["academic_festival_state",24],
      ["academic_festival_national",25],["enac_local",26],
      ["enac_state",27],["enac_national",28],
    ];
    for (const [id,code] of reasons) {
      const day={status:"falta",hours:"",reasonCode:String(code)};
      const stats=buildManualStatistics([sample[0],day,sample[2],sample[3]]);
      expect(stats.entries[1]).toMatchObject({status:"falta",reasonCode:code,reasonId:id});
      expect(manualDaysFromStatistics(stats)[1].reasonCode).toBe(String(code));
    }
  });

});
