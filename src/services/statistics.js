import {studentIsActive,studentAppliesToWeek} from "./delivery-registry.js";
import {summarizeWeekStatistics,causeLabel} from "./matrix-statistics.js";
export const percent = (value,total) => total ? Math.round(value/total*100) : 0;
const makeCounts=()=>({laboral:0,falta:0,sin_labores:0,inhabil:0});
export const genderLabels={
  male:"Hombres",female:"Mujeres",nonbinary:"No binario",
  other:"Otro",undisclosed:"Prefiero no responder","":"Sin dato",
};
function groupTotals(people, field) {
  const groups=new Map();
  for(const item of people){
    const key=item[field]||"Sin especificar";
    groups.set(key,(groups.get(key)||0)+1);
  }
  return [...groups.entries()].map(([label,count])=>({label,count})).sort((a,b)=>b.count-a.count);
}
export function calculateDeliveryStatistics(state,{period="weekly",weekId="",month="",specialty="",company=""}={}){
  const roster=(state.students||[]).filter(student=>(!specialty||student.specialty===specialty)&&(!company||student.company===company));
  const students=roster.filter(studentIsActive);
  const byId=new Map(roster.map(item=>[item.id,item]));
  const weeks=(state.weeks||[]).filter(w=>period==="all" || (period==="monthly" ? w.startDate?.startsWith(month) : w.id===weekId)).sort((a,b)=>(a.startDate||"").localeCompare(b.startDate||""));
  const daily=makeCounts(),causes={falta:new Map(),sin_labores:new Map()};
  const methods=new Map(), trend=[];
  let totalMinutes=0, weeksWithStatistics=0,delivered=0,late=0,notDelivered=0,notApplicable=0,applicable=0;
  let reportCount=0;
  const dayTrend=[0,0,0,0];
  const receivedCompanies=[],receivedSpecialties=[];
  for(const week of weeks){
    let weekMinutes=0,weekReports=0;
    for(const student of roster){
      if(!studentAppliesToWeek(student,week))continue;
      const delivery=week.deliveries?.[student.id];
      if(delivery?.status==="no_aplica"){notApplicable++;continue;}
      applicable++;
      if(!delivery){notDelivered++;continue;}
      if(delivery.status==="entregado_tarde")late++;
      else if(delivery.status==="entregado")delivered++;
      const scanned=delivery.source==="camera" && Number.isInteger(delivery.matrixVersion) && delivery.matrixVersion>0;
      const source=scanned||delivery.usageSource==="generator"||delivery.matrixVersion>0?"generator"
        :delivery.usageSource==="other"?"other":"unknown";
      const current=methods.get(student.id)||"unknown";
      methods.set(student.id,source==="generator"?"generator":current==="generator"?current:source==="other"?"other":current);
      const summary=summarizeWeekStatistics(delivery.statistics);
      if(!summary)continue;
      weeksWithStatistics++;reportCount++;weekReports++;
      totalMinutes+=summary.minutes;weekMinutes+=summary.minutes;
      for(let index=0;index<4;index++){
        const day=delivery.statistics.entries[index];
        daily[day.status]++;
        dayTrend[index]+=day.minutes||0;
        if(day.status==="falta"||day.status==="sin_labores"){
          const map=causes[day.status], key=day.reasonCode;
          map.set(key,(map.get(key)||0)+1);
        }
      }
      receivedCompanies.push({company:student.company,minutes:summary.minutes});
      receivedSpecialties.push({specialty:student.specialty,minutes:summary.minutes});
    }
    trend.push({label:week.label,startDate:week.startDate,minutes:weekMinutes,reports:weekReports});
  }
  const used=students.filter(item=>methods.get(item.id)==="generator").length;
  const other=students.filter(item=>methods.get(item.id)==="other").length;
  const genderCounts=Object.fromEntries(Object.keys(genderLabels).map(x=>[x,students.filter(s=>(s.gender||"")===x).length]));
  const breakdown=(map,type)=>[...map.entries()].map(([code,count])=>({code,count,label:causeLabel(type,code)})).sort((a,b)=>b.count-a.count);
  const groupMinutes=(field,entries)=>[...entries.reduce((acc,row)=>{
    const name=row[field]||"Sin especificar";acc.set(name,(acc.get(name)||0)+row.minutes);return acc;
  },new Map())].map(([label,minutes])=>({label,minutes})).sort((a,b)=>b.minutes-a.minutes);
  return {
    roster,students,weeks,trend,dayTrend,daily,totalMinutes,
    weeksWithStatistics,reportCount,applicable,delivered,late,notDelivered,notApplicable,
    usage:{used,other,unknown:students.length-used-other},
    genderCounts, causesAbsence:breakdown(causes.falta,"falta"),causesNonWorking:breakdown(causes.sin_labores,"sin_labores"),
    byCompany:groupMinutes("company",receivedCompanies),
    bySpecialty:groupMinutes("specialty",receivedSpecialties),
    coverage:percent(weeksWithStatistics,delivered+late),
    onTimeRate:percent(delivered,applicable),
    deliveryRate:percent(delivered+late,applicable),
    attendanceRate:percent(daily.laboral,daily.laboral+daily.falta),
    avgHours:weeksWithStatistics?totalMinutes/60/weeksWithStatistics:0,
  };
}
