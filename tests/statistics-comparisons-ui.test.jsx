import {afterEach,describe,expect,it,vi} from "vitest";
import {render,screen,within,cleanup} from "@testing-library/react";
import DeliveryStatistics from "../src/components/DeliveryStatistics.jsx";
import {createStudent,createWeek,saveManualDelivery} from "../src/services/delivery-registry.js";
import {buildManualStatistics} from "../src/services/manual-statistics.js";

vi.mock("../src/components/StudentInsights.jsx",()=>({default:()=>null}));
vi.mock("../src/components/AnimatedValue.jsx",()=>({
  default:({value})=><>{value}</>,
}));
afterEach(cleanup);

describe("comparativos de empresas y grupos en Estadísticas",()=>{
 it("presenta las empresas, la proporción A/B y separa las faltas de días inhábiles",()=>{
   const a=createStudent({id:"a",name:"Estudiante A",company:"Empresa 1",group:"A"});
   const b=createStudent({id:"b",name:"Estudiante B",company:"Empresa 1",group:"A"});
   const c=createStudent({id:"c",name:"Estudiante C",company:"Empresa 2",group:"B"});
   const days=buildManualStatistics([
     {status:"laboral",hours:"4",reasonCode:"0"},
     {status:"falta",hours:"",reasonCode:"0"},
     {status:"sin_labores",hours:"",reasonCode:"0"},
     {status:"inhabil",hours:"",reasonCode:"0"},
   ]);
   let week=createWeek({startDate:"2026-10-20",label:"Semana 1"});
   week=saveManualDelivery(week,a.id,"entregado",{statistics:days});
   render(<DeliveryStatistics state={{students:[a,b,c],weeks:[week]}}
     onBack={vi.fn()} onReportStudent={vi.fn()} onReportStatistics={vi.fn()}/>);
   const companies=screen.getByRole("region",{name:"Estadísticas por empresa"});
   expect(within(companies).getByText("Comparación por empresa")).toBeTruthy();
   expect(within(companies).getAllByText("Empresa 1").length).toBeGreaterThan(0);
   expect(within(companies).getByText("Mayor tasa de faltas")).toBeTruthy();
   const groups=screen.getByRole("region",{name:"Estadísticas por grupo"});
   expect(within(groups).getByText("Grupo A")).toBeTruthy();
   expect(within(groups).getByText("Grupo B")).toBeTruthy();
   expect(within(groups).getAllByText("66,7%").length).toBeGreaterThan(0);
   expect(within(groups).getAllByText("33,3%").length).toBeGreaterThan(0);
   expect(screen.getAllByText("Días inhábiles").length).toBeGreaterThan(0);
 });
});
