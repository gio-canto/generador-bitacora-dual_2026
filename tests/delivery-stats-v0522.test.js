import { describe, it, expect } from "vitest";
import {createStudent,createWeek,saveManualDelivery,deliveryStatus,weekSummary,sanitizeDeliveryState,setDeliveryStatus} from "../src/services/delivery-registry.js";
import {buildManualStatistics} from "../src/services/manual-statistics.js";
import {calculateDeliveryStatistics,calculateDualLifetimeStatistics} from "../src/services/statistics.js";

const a=createStudent({id:"a",name:"Alumna A",specialty:"Programación",company:"Empresa A"});
const b=createStudent({id:"b",name:"Alumno B",specialty:"Contabilidad",company:"Empresa B"});
const valid=buildManualStatistics([
  {status:"laboral",hours:"4",reasonCode:"0"},
  {status:"laboral",hours:"3",reasonCode:"0"},
  {status:"falta",hours:"",reasonCode:"1"},
  {status:"inhabil",hours:"",reasonCode:"0"},
]);

describe("estados pendientes con estadísticas · v0.52.2",()=>{
  it("conserva horas de No entregado tras migración, sin aumentar el cumplimiento",()=>{
    const week=saveManualDelivery(createWeek({id:"w1",startDate:"2026-10-20"}),a.id,
      "no_entregado",{statistics:valid,usageSource:"other",timestamp:"2026-10-24T10:00:00Z"});
    const restored=sanitizeDeliveryState({schemaVersion:9,students:[a,b],weeks:[week]});
    const w=restored.weeks[0];
    expect(deliveryStatus(w,a.id)).toBe("no_entregado");
    expect(w.deliveries[a.id].statistics.entries[0].minutes).toBe(240);
    expect(weekSummary(w,restored.students)).toMatchObject({no_entregado:2,registered:0,applicable:2,percent:0});
    const stats=calculateDeliveryStatistics(restored,{period:"weekly",weekId:w.id});
    expect(stats.delivered).toBe(0);
    expect(stats.notDelivered).toBe(2);
    expect(stats.totalMinutes).toBe(420);
    expect(stats.pendingMinutes).toBe(420);
    expect(stats.pendingWithStatistics).toBe(1);
    expect(stats.deliveryRate).toBe(0);
    expect(stats.coverage).toBe(50);
    expect(calculateDualLifetimeStatistics(restored).totalHours).toBe(7);
  });
  it("No aplica elimina estadísticas expresamente; sin dato no equivale a cero",()=>{
    const original=saveManualDelivery(createWeek({id:"w1",startDate:"2026-10-20"}),a.id,"no_entregado",
      {statistics:valid,usageSource:"other"});
    const changed=setDeliveryStatus(original,a.id,"no_aplica","","manual");
    expect(deliveryStatus(changed,a.id)).toBe("no_aplica");
    expect(changed.deliveries[a.id].statistics).toBeUndefined();
    const stats=calculateDeliveryStatistics({students:[a,b],weeks:[changed]},
      {period:"weekly",weekId:changed.id});
    expect(stats.totalMinutes).toBe(0);
    expect(stats.applicable).toBe(1);
    expect(stats.notApplicable).toBe(1);
    expect(stats.coverage).toBe(0);
  });
  it("registros sin jornada no se cuentan en cobertura; No entregado con jornada sí",()=>{
    const week=createWeek({id:"w1",startDate:"2026-10-20"});
    const saved=saveManualDelivery(week,a.id,"no_entregado",{usageSource:"unknown"});
    const stats=calculateDeliveryStatistics({students:[a,b],weeks:[saved]},
      {period:"weekly",weekId:saved.id});
    expect(stats.notDelivered).toBe(2);
    expect(stats.weeksWithStatistics).toBe(0);
    expect(stats.pendingMinutes).toBe(0);
    expect(stats.coverage).toBe(0);
  });  it("una captura al crear la semana queda manual incluso al corregir un código de cámara",()=>{
    const one=createWeek({id:"w1",startDate:"2026-10-20"});
    const original={
      ...one,
      deliveries:{[a.id]:{status:"entregado",registeredAt:"2026-10-24T10:00:00Z",
        source:"camera",matrixVersion:4,usageSource:"generator",statistics:valid}},
    };
    const manual=saveManualDelivery(original,a.id,"entregado",{statistics:valid,usageSource:"other"});
    const saved=sanitizeDeliveryState({schemaVersion:9,students:[a],weeks:[manual]});
    const d=saved.weeks[0].deliveries[a.id];
    expect(d.source).toBe("manual");
    expect(d.matrixVersion).toBeUndefined();
    expect(d.usageSource).toBe("other");
    expect(d.statistics.entries[0].minutes).toBe(240);
  });

});
