import {describe,expect,it} from "vitest";
import {calculateDeliveryStatistics} from "../src/services/statistics.js";
import {createStudent,createWeek,registerDelivery,saveManualDelivery} from "../src/services/delivery-registry.js";
import {buildManualStatistics} from "../src/services/manual-statistics.js";
describe("estadísticas v0.52",()=>{
  const a=createStudent({name:"Alumno QR",gender:"male",company:"Empresa 1"});
  const b=createStudent({name:"Alumna manual",gender:"female",company:"Empresa 2"});
  const c=createStudent({name:"Otro método",company:"Empresa 2"});
  const week=createWeek({startDate:"2026-10-20"});
  const statistics=buildManualStatistics([
    {status:"laboral",hours:"4",reasonCode:"0"},
    {status:"laboral",hours:"4",reasonCode:"0"},
    {status:"falta",hours:"",reasonCode:"3"},
    {status:"inhabil",hours:"",reasonCode:"0"},
  ]);
  const w1=registerDelivery(week,a.id,"2026-10-24T10:00:00Z","camera",{matrixVersion:4,statistics});
  const w2=saveManualDelivery(w1,b.id,"entregado",{usageSource:"generator",statistics});
  const w3=saveManualDelivery(w2,c.id,"entregado",{usageSource:"other"});
  const state={students:[a,b,c],weeks:[w3]};
  it("cuenta uso por QR o confirmación manual y no deduce uso de otros campos",()=>{
    const r=calculateDeliveryStatistics(state,{period:"weekly",weekId:w3.id});
    expect(r.usage).toEqual({used:2,other:1,unknown:0});
    expect(r.weeksWithStatistics).toBe(2);
    expect(r.daily).toMatchObject({laboral:4,falta:2,inhabil:2});
    expect(r.totalMinutes).toBe(960);
    expect(r.byCompany.find(x=>x.label==="Empresa 1").minutes).toBe(480);
  });
  it("diferencia entregas y datos estadísticos ausentes",()=>{
    const result=calculateDeliveryStatistics(state,{period:"weekly",weekId:w3.id});
    expect(result.coverage).toBe(67);
    expect(result.applicable).toBe(3);
    expect(result.deliveryRate).toBe(100);
  });
  it("no asume que un alumno sin entrega no usa la herramienta",()=>{
    const result=calculateDeliveryStatistics({students:[...state.students,createStudent({name:"Sin entregar"})],weeks:[w3]},{period:"weekly",weekId:w3.id});
    expect(result.usage.unknown).toBe(1);
    expect(result.notDelivered).toBe(1);
  });
});
