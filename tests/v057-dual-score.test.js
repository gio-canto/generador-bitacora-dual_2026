import {describe,expect,it} from "vitest";
import {calculateDualScore,dualScoreGraphParts,DUAL_SCORE_NOTICE} from "../src/services/dual-score.js";
const make=(states)=>({timeline:states.map((status,i)=>({
  status,expired:true,startDate:"2026-09-"+String(10+i).padStart(2,"0"),
})).reverse()});
describe("v0.57 Índice de Seguimiento Dual",()=>{
 it("no inventa un cero si todavía no existen periodos evaluables",()=>{
   const score=calculateDualScore({timeline:[{status:"no_entregado",expired:false}]});
   expect(score).toMatchObject({value:null,label:"Sin evaluación",provisional:true,due:0});
 });
 it("excluye No aplica, usa cumplimiento, puntualidad y regularidad últimas cuatro",()=>{
   const s=calculateDualScore(make(["entregado","entregado","entregado_tarde","no_entregado","no_aplica","entregado"]));
   expect(s.due).toBe(5);
   expect(s.components).toMatchObject({compliance:80,punctuality:60,regularity:75,recentDue:4,delivered:4,onTime:3});
   expect(s.value).toBe(73);
   expect(s.provisional).toBe(false);
   expect(s.label).toBe("Seguimiento favorable");
   expect(s.interpretation).toContain("regularizar 1 entrega vencida");
 });
 it("un expediente con un único plazo nunca recibe un puntaje definitivo",()=>{
   const perfect=calculateDualScore(make(["entregado"]));
   expect(perfect).toMatchObject({value:100,provisional:true,due:1,label:"Seguimiento sólido"});
   const missing=calculateDualScore(make(["no_entregado"]));
   expect(missing).toMatchObject({value:0,provisional:true,due:1});
 });
 it("muestra aviso de uso escolar interno también si todavía no hay score",()=>{
   expect(DUAL_SCORE_NOTICE).toContain("Uso escolar interno");
   expect(DUAL_SCORE_NOTICE).toContain("no es puntaje de crédito ni una sanción");
   expect(calculateDualScore(make([])).interpretation).toContain(DUAL_SCORE_NOTICE);
   expect(calculateDualScore(make(["entregado"])).interpretation).toContain(DUAL_SCORE_NOTICE);
 });
 it("representa 0–100 mediante aportes 50/30/20 sin inventar barras si no hay evaluación",()=>{
   const score=calculateDualScore(make(["entregado","entregado","entregado_tarde","no_entregado","no_aplica","entregado"]));
   const parts=dualScoreGraphParts(score);
   expect(parts.map(p=>p.label)).toEqual(["Cumplimiento","Puntualidad","Regularidad"]);
   expect(parts.map(p=>p.points)).toEqual([40,18,15]);
   expect(parts.reduce((sum,p)=>sum+p.points,0)).toBe(73);
   expect(dualScoreGraphParts(calculateDualScore(make([])))).toEqual([]);
   expect(dualScoreGraphParts(calculateDualScore(make(["no_entregado"])))).toHaveLength(3);
 });
 it("no penaliza las faltas, sus justificaciones ni los días inhábiles",()=>{
   const base=make(["entregado","entregado_tarde","entregado","no_entregado"]);
   const before=calculateDualScore(base);
   const after=calculateDualScore({...base,absences:30,nonWorkingDays:10,offDays:9,byCause:[
     {label:"Enfermedad",count:30}],knownDays:49});
   expect(after).toEqual(before);
 });
});
