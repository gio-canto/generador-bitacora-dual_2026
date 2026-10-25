import { useEffect, useMemo, useRef, useState } from "react";
import AnimatedValue from "./AnimatedValue.jsx";
import StudentInsights from "./StudentInsights.jsx";
import {calculateStudentInsights} from "../services/student-insights.js";
import { calculateDeliveryStatistics, calculateDualLifetimeStatistics, genderLabels, percent } from "../services/statistics.js";
import { interpretStatistics } from "../services/statistics-interpretation.js";
import "../delivery-statistics.css";

const fmt = (n, digits = 0) => Number(n || 0).toLocaleString("es-MX", { maximumFractionDigits:digits });
const hours = value => value == null ? "—" : fmt(value, 1) + " h";
const STAT_SECTIONS=[["summary","Resumen"],["attendance","Asistencia"],["companies","Empresas"],["groups","Grupos"],["students","Alumnos"],["history","Histórico"]];
const COLORS = ["#0071e3","#d97979","#e3a244","#929aa6","#8b75c3","#2a9e92","#cf7ea5"];

function Breakdown({ items, empty = "Sin datos en el periodo" }) {
  const total = items.reduce((acc, item) => acc + item.value, 0);
  return <>
    {total ? (
      <div className="ds-stack" role="img" aria-label={items.map(item=>item.label+": "+item.value).join(", ")}>
        {items.filter(item => item.value > 0).map(item =>
          <span key={item.label} style={{ width:100 * item.value / total + "%", background:item.color }} title={item.label+": "+item.value}/>)}
      </div>
    ) : <p className="ds-empty">{empty}</p>}
    <div className="ds-legend">
      {items.map(item => <div className="ds-legend-row" key={item.label}>
        <span className="ds-color-dot" style={{ background:item.color }} />
        <span>{item.label}</span><strong>{fmt(item.value)}</strong>
      </div>)}
    </div>
  </>;
}
function Bars({ title, rows, unit = "", max = 7 }) {
  const items = rows.filter(row => Number.isFinite(row.value) && row.value >= 0).sort((a,b)=>b.value-a.value).slice(0,max);
  const high = Math.max(1, ...items.map(row=>row.value));
  return <section className="ds-panel">
    <h2>{title}</h2>
    {items.some(item => item.value > 0) ? items.map(row => <div className="ds-cause" key={row.label}>
      <div className="ds-cause-label"><span>{row.label}</span><strong>{fmt(row.value, unit ? 1 : 0)}{unit}</strong></div>
      <div className="ds-track"><i style={{width:100*row.value/high+"%"}}/></div>
    </div>) : <p className="ds-empty">Sin registros en el periodo.</p>}
  </section>;
}

const displayPercent=value=>value==null?"—":fmt(value,1)+"%";
function Leader({label,row,field,empty="Sin datos comparables"}){
 const value=!row?empty:field==="hours"?hours(row.hours):
   field==="absences"?fmt(row.absences):
   displayPercent(row.absenceRate)+" de "+fmt(row.applicableDays)+" jornadas";
 return <div className="ds-comparison-leader">
   <span>{label}</span><strong>{row?.label||"—"}</strong><small>{value}</small>
 </div>;
}
function PerformanceTable({rows,type}){
 const company=type==="company";
 return <div className="ds-table-scroll" tabIndex={0} aria-label={company?"Tabla comparativa de empresas":"Tabla comparativa de grupos"}>
   <table className="ds-table ds-comparison-table">
     <thead><tr>
       <th scope="col">{company?"Empresa":"Grupo"}</th>
       <th scope="col">Alumnos activos</th>
       {!company&&<th scope="col">% del alumnado</th>}
       <th scope="col">Horas</th>
       {company&&<th scope="col">Horas por alumno con datos</th>}
       <th scope="col">Faltas</th>
       <th scope="col">Tasa de faltas</th>
       <th scope="col">Sin labores</th>
       <th scope="col">Inhábiles</th>
     </tr></thead>
     <tbody>{rows.map(row=><tr key={row.label}>
       <th scope="row">{row.label}</th>
       <td>{fmt(row.activeStudents)}</td>
       {!company&&<td>{displayPercent(row.share)}</td>}
       <td>{row.reports?hours(row.hours):"Sin datos"}</td>
       {company&&<td>{hours(row.averageHours)}</td>}
       <td>{row.reports?fmt(row.absences):"—"}</td>
       <td>{displayPercent(row.absenceRate)}{row.applicableDays>0?
         <small className="ds-comparison-sample">{fmt(row.applicableDays)} jornadas computables</small>:null}</td>
       <td>{row.reports?fmt(row.nonWorking):"—"}</td>
       <td>{row.reports?fmt(row.holidays):"—"}</td>
     </tr>)}</tbody>
   </table>
 </div>;
}
function Metric({name,value}) {
  return <article className="ds-kpi"><strong><AnimatedValue value={value}/></strong><span>{name}</span></article>;
}
export default function DeliveryStatistics({ state, onBack, onReportStudent, onReportStatistics }) {
  const rootRef = useRef(null);
  const [period,setPeriod] = useState("weekly");
  const [weekId,setWeekId] = useState(state.weeks.at(-1)?.id || "");
  const [month,setMonth] = useState(state.weeks.at(-1)?.startDate?.slice(0,7) || new Date().toISOString().slice(0,7));
  const [specialty,setSpecialty] = useState("");
  const [company,setCompany] = useState("");
  const [metric,setMetric] = useState("hours");
  const [section,setSection] = useState("summary");
  const [navOpen,setNavOpen] = useState(false);
  const [filtersOpen,setFiltersOpen] = useState(false);
  const specialties = [...new Set(state.students.map(student=>student.specialty).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"es"));
  const companies = [...new Set(state.students.map(student=>student.company).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"es"));
  const filters = {period,weekId,month,specialty,company};

  // El panel y el PDF comparten exactamente la misma fuente de estadísticas.
  const data = useMemo(() => calculateDeliveryStatistics(state,filters),[state,period,weekId,month,specialty,company]);
  const lifetime = useMemo(() => calculateDualLifetimeStatistics(state,{specialty,company}),[state,specialty,company]);
  const daily = [
    {label:"Con labores",value:data.daily.laboral,color:COLORS[0]},
    {label:"Faltas",value:data.daily.falta,color:COLORS[1]},
    {label:"Sin labores",value:data.daily.sin_labores,color:COLORS[2]},
    {label:"Días inhábiles",value:data.daily.inhabil,color:COLORS[3]},
  ];
  const deliveries = [
    {label:"A tiempo",value:data.delivered,color:COLORS[0]},
    {label:"A destiempo",value:data.late,color:COLORS[2]},
    {label:"No entregadas",value:data.notDelivered,color:COLORS[1]},
    {label:"No aplica",value:data.notApplicable,color:COLORS[3]},
  ];
  const usage = [
    {label:"Generador",value:data.usage.used,color:COLORS[0]},
    {label:"Otro método",value:data.usage.other,color:COLORS[5]},
    {label:"Sin información",value:data.usage.unknown,color:COLORS[3]},
  ];
  const genders = Object.entries(data.genderCounts).map(([key,value],index)=>({
    label:genderLabels[key]||"Sin dato",value,color:COLORS[index%COLORS.length],
  }));
  const trend = period==="weekly"
    ? ["Martes","Miércoles","Jueves","Viernes"].map((label,i)=>({label,minutes:data.dayTrend[i]}))
    : data.trend.map(row=>({label:row.label,minutes:row.minutes}));
  const highest = Math.max(1,...trend.map(item=>item.minutes));
  const viewKey = [period,weekId,month,specialty,company,state.updatedAt || ""].join("|");

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ||
        typeof IntersectionObserver === "undefined") return;
    const elements = Array.from(root.querySelectorAll(
      ".ds-results .ds-kpi, .ds-results .ds-panel, .ds-results .ds-lifetime-heading"
    ));
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("ds-revealed");
          observer.unobserve(entry.target);
        }
      }
    }, {threshold:0.07,rootMargin:"0px 0px -12px 0px"});
    elements.forEach((element, index) => {
      if (element.classList.contains("ds-revealed")) return;
      element.style.setProperty("--ds-stagger", String(index % 4));
      element.classList.add("ds-reveal-ready");
      observer.observe(element);
    });
    return () => {
      observer.disconnect();
      // Ensure nothing stays invisible when switching modes before an item enters view.
      elements.forEach(element => element.classList.remove("ds-reveal-ready"));
    };
  }, [viewKey,metric,section]);

  const insightSummary=useMemo(()=>calculateStudentInsights(state,filters),[state,period,weekId,month,specialty,company]);
  const interpretation=useMemo(()=>interpretStatistics(data,insightSummary),[data,insightSummary]);

  return <div className="delivery-analytics-container" ref={rootRef}>
    <div className="ds-header">
      <button className="btn" type="button" onClick={onBack}>← Volver</button>
      <span className="delivery-kicker">Registro de entrega</span>
      <div className="ds-panel-head">
        <h1>Estadísticas</h1>
        <button className="btn" type="button" onClick={onReportStatistics}>Abrir Reportes</button>
      </div>
    </div>

    <div className="ds-mobile-toolbar">
      <button type="button" className="btn" aria-expanded={navOpen}
        aria-controls="ds-sidebar" onClick={()=>setNavOpen(value=>!value)}>☰ {STAT_SECTIONS.find(([id])=>id===section)?.[1]} · Secciones</button>
    </div>
    <div className="ds-workspace">
      <aside id="ds-sidebar" className={"ds-sidebar"+(navOpen?" ds-sidebar-open":"")} aria-label="Menú de estadísticas">
        <button className="ds-sidebar-close" aria-label="Cerrar menú de estadísticas" type="button"
          onClick={()=>setNavOpen(false)}>✕ Cerrar</button>
        <span className="delivery-kicker">EXPLORAR DATOS</span>
        <nav aria-label="Secciones de estadísticas">
          {STAT_SECTIONS.map(([id,label],index)=><button type="button" key={id}
            className={section===id?"active":""} aria-current={section===id?"page":undefined}
            onClick={()=>{setSection(id);setNavOpen(false);}}>
            <span>{String(index+1).padStart(2,"0")}</span>{label}
          </button>)}
        </nav>
        <p>Selecciona una sección para consultar solo sus indicadores.</p>
      </aside>
      {navOpen&&<button type="button" className="ds-sidebar-scrim" aria-label="Cerrar menú"
        onClick={()=>setNavOpen(false)}/>}
      <div className="ds-workspace-content">
        <div className={"ds-filter-panel"+(filtersOpen?" ds-filters-open":" ds-filters-closed")}>
          <button type="button" className="ds-filter-toggle" aria-expanded={filtersOpen}
            onClick={()=>setFiltersOpen(value=>!value)}>⚙ Filtros del periodo {filtersOpen?"▴":"▾"}</button>
    <div className="ds-controls">
      <div className="ds-tabs" role="group" aria-label="Periodo">
        {[["weekly","Semanal"],["monthly","Mensual"],["all","General"]].map(([value,label])=>
          <button type="button" key={value} className={period===value?"active":""}
            aria-pressed={period===value} onClick={()=>setPeriod(value)}>{label}</button>)}
      </div>
      {period==="weekly" && <label>Semana
        <select value={weekId} onChange={event=>setWeekId(event.target.value)}>
          {state.weeks.map(week=><option key={week.id} value={week.id}>{week.label} · {week.startDate}</option>)}
        </select></label>}
      {period==="monthly" && <label>Mes
        <input type="month" value={month} onChange={event=>setMonth(event.target.value)}/>
      </label>}
      <label>Especialidad
        <select value={specialty} onChange={event=>setSpecialty(event.target.value)}>
          <option value="">Todas</option>{specialties.map(value=><option key={value}>{value}</option>)}
        </select>
      </label>
      <label>Empresa
        <select value={company} onChange={event=>setCompany(event.target.value)}>
          <option value="">Todas</option>{companies.map(value=><option key={value}>{value}</option>)}
        </select>
      </label>
    </div>

        </div>
    <div className="ds-results" key={viewKey+section}>
    <h2 className="ds-current-heading">{STAT_SECTIONS.find(([id])=>id===section)?.[1]}</h2>
    {section==="summary"&&<>
    <div className="ds-kpis">
      <Metric name="Alumnos activos" value={fmt(data.students.length)}/>
      <Metric name="Horas registradas" value={hours(data.totalMinutes/60)}/>
      <Metric name="Jornadas con falta" value={fmt(data.daily.falta)}/>
       <Metric name="Días sin labores" value={fmt(data.daily.sin_labores)}/>
       <Metric name="Días inhábiles" value={fmt(data.daily.inhabil)}/>
      <Metric name="Uso identificado" value={percent(data.usage.used,data.students.length)+"%"}/>
    </div>
    <section className="ds-panel ds-interpretations" aria-label="Interpretación del periodo">
      <h2>Resumen del periodo</h2>
      <div className="ds-insight-explainer-grid">
        <p><strong>Entregas.</strong> {interpretation.deliveries}</p>
        <p><strong>Jornadas.</strong> {interpretation.attendance}</p>
        <p><strong>Horas.</strong> {interpretation.hours}</p>
        <p><strong>Faltas.</strong> {interpretation.causes}</p>
        <p><strong>Sin labores e inhábiles.</strong> {interpretation.nonWorking}</p>
        <p><strong>Empresas.</strong> {interpretation.companies}</p>
        <p><strong>Grupos.</strong> {interpretation.groups}</p>
      </div>
    </section>
    <section className="ds-panel">
      <div className="ds-panel-head">
        <h2>Actividad de formación</h2>
        <div className="ds-tabs small" role="group" aria-label="Visualización">
          <button type="button" className={metric==="hours"?"active":""} aria-pressed={metric==="hours"} onClick={()=>setMetric("hours")}>Horas</button>
          <button type="button" className={metric==="days"?"active":""} aria-pressed={metric==="days"} onClick={()=>setMetric("days")}>Jornadas</button>
        </div>
      </div>
      <div className="ds-chart-in" key={metric}>
      {metric==="hours" ? <>
        <div className="ds-feature-number"><AnimatedValue value={hours(data.totalMinutes/60)}/></div>
        <div className="ds-columns">
          {trend.map((row,i)=><div className="ds-column" key={row.label+i}>
            <strong><AnimatedValue value={hours(row.minutes/60)} duration={720}/></strong>
            <div className="ds-column-track"><span style={{height:100*row.minutes/highest+"%"}}/></div>
            <small>{row.label}</small>
          </div>)}
        </div>
      </> : <Breakdown items={daily}/>}
      </div>
      {!data.weeksWithStatistics && <p className="ds-empty">Sin jornadas capturadas en este periodo.</p>}
    </section>

    </>}
    {section==="attendance"&&<div className="ds-two-column">
      <section className="ds-panel"><h2>Asistencia y jornadas</h2><Breakdown items={daily}/></section>
      <section className="ds-panel"><h2>Entregas</h2><Breakdown items={deliveries}/></section>
      <Bars title="Motivos de inasistencia" rows={data.causesAbsence.map(item=>({label:item.label,value:item.count}))}/>
      <Bars title="Días sin labores" rows={data.causesNonWorking.map(item=>({label:item.label,value:item.count}))}/>
    </div>}
    {section==="groups"&&<div className="ds-two-column">
      <section className="ds-panel"><h2>Utilización del generador</h2><Breakdown items={usage}/></section>
      <section className="ds-panel"><h2>Género del alumnado</h2><Breakdown items={genders}/></section>
      <Bars title="Horas por especialidad" unit=" h" rows={data.bySpecialty.map(item=>({label:item.label,value:item.minutes/60}))}/>
    </div>}
    {section==="companies"&&<>
      <Bars title="Horas por empresa" unit=" h" rows={data.byCompany.map(item=>({label:item.label,value:item.minutes/60}))}/>

    <section className="ds-panel ds-comparison" aria-label="Estadísticas por empresa">
      <div className="ds-panel-head"><h2>Comparación por empresa</h2>
        <span className="ds-lifetime-caption">Semanas del periodo seleccionado</span></div>
      <div className="ds-comparison-leaders">
        <Leader label="Más horas registradas" row={data.companyLeaders.mostHours} field="hours"/>
        <Leader label="Menos horas registradas" row={data.companyLeaders.comparable>1?
          data.companyLeaders.leastHours:null} field="hours"/>
        <Leader label="Más faltas registradas" row={data.companyLeaders.mostAbsences} field="absences"/>
        <Leader label="Mayor tasa de faltas" row={data.companyLeaders.highestAbsenceRate} field="rate"/>
        <Leader label="Menor tasa de faltas" row={data.companyLeaders.rateComparable>1?
          data.companyLeaders.lowestAbsenceRate:null} field="rate"/>
      </div>
      <PerformanceTable rows={data.byCompanyPerformance} type="company"/>
      <p className="ds-comparison-note">Horas totales y promedio por alumno con jornadas registradas. Las empresas sin jornadas capturadas no participan en los extremos. La tasa de faltas considera solo jornadas con labores y faltas; muestra el tamaño de su base. Una tasa de 0% es válida cuando existen jornadas computables, pero no cuando faltan datos.</p>
    </section>
    </>}
    {section==="groups"&&<section className="ds-panel ds-comparison" aria-label="Estadísticas por grupo">
      <div className="ds-panel-head"><h2>Grupos y proporción del alumnado</h2>
        <span className="ds-lifetime-caption">{fmt(data.students.length)} alumnos activos en la selección</span></div>
      <div className="ds-comparison-proportions">
        {data.byGroupPerformance.filter(row=>row.activeStudents>0).map((row,index)=>
          <div className="ds-comparison-proportion" key={row.label}>
            <div><strong>Grupo {row.label}</strong><span>{fmt(row.activeStudents)} alumnos · {displayPercent(row.share)}</span></div>
            <div className="ds-track"><i style={{width:row.share+"%",background:COLORS[index%COLORS.length]}}/></div>
          </div>)}
      </div>
      <PerformanceTable rows={data.byGroupPerformance} type="group"/>
      <p className="ds-comparison-note">La proporción corresponde a alumnos activos; las jornadas registradas del periodo determinan horas, faltas, días sin labores e inhábiles. Un grupo sin datos no equivale a cero faltas.</p>
    </section>}
    {section==="attendance"&&<>
    <div className="ds-kpis ds-small-kpis">
      <Metric name="Cumplimiento de entrega" value={data.deliveryRate+"%"}/>
      <Metric name="Entregas puntuales" value={data.onTimeRate+"%"}/>
      <Metric name="Asistencia" value={data.attendanceRate+"%"}/>
      <Metric name="Cobertura de jornadas" value={data.coverage+"%"}/>
      <Metric name="Promedio por registro" value={hours(data.avgHours)}/>
      <Metric name="Registros con jornadas" value={fmt(data.weeksWithStatistics)}/>
    </div>
    {data.pendingWithStatistics>0 && <section className="ds-panel ds-pending-hours">
      <h2>Jornadas pendientes de entrega</h2>
      <p>{fmt(data.pendingWithStatistics)} entregas pendientes con {hours(data.pendingMinutes/60)} registradas.</p>
    </section>}

    </>}
    {section==="history"&&<section className="ds-lifetime" aria-label="Acumulado de Educación Dual">
      <div className="ds-lifetime-heading">
        <div><span className="delivery-kicker">Histórico · todas las semanas</span><h2>Acumulado de Educación Dual</h2></div>
        <span className="ds-lifetime-caption">{fmt(lifetime.studentsWithData)} alumnos</span>
      </div>
      <div className="ds-kpis ds-lifetime-kpis">
        {[
          ["Horas totales",hours(lifetime.totalHours)],
          ["Promedio por alumno",hours(lifetime.averageHours)],
          ["Mínimo",hours(lifetime.minHours)],
          ["Máximo",hours(lifetime.maxHours)],
          ["Rango",hours(lifetime.rangeHours)],
          ["Mediana",hours(lifetime.medianHours)],
        ].map(([name,value])=><Metric name={name} value={value} key={name}/>)}
      </div>
      <div className="ds-two-column">
        <section className="ds-panel">
          <h2>Proporción por especialidad</h2>
          <p className="ds-lifetime-caption">{fmt(lifetime.activeStudents)} alumnos activos</p>
          {lifetime.bySpecialty.filter(item=>item.students>0).length ?
            lifetime.bySpecialty.filter(item=>item.students>0).map(item=><div className="ds-specialty-row" key={item.label}>
              <div className="ds-specialty-heading"><span>{item.label}</span><strong>{fmt(item.proportion,1)}%</strong></div>
              <div className="ds-track"><i style={{width:item.proportion+"%"}}/></div>
              <span className="ds-lifetime-caption">{fmt(item.students)} alumnos</span>
            </div>) : <p className="ds-empty">Sin alumnos activos en esta selección.</p>}
        </section>
        <section className="ds-panel">
          <h2>Horas por especialidad · histórico</h2>

          {lifetime.bySpecialty.filter(item=>item.minutes>0).length ?
            lifetime.bySpecialty.filter(item=>item.minutes>0).map(item=><div className="ds-specialty-row" key={item.label}>
              <div className="ds-specialty-heading"><span>{item.label}</span><strong>{hours(item.hours)}</strong></div>
              <div className="ds-track"><i style={{width:item.hoursProportion+"%"}}/></div>
              <span className="ds-lifetime-caption">{fmt(item.hoursProportion,1)}% de las horas</span>
            </div>) : <p className="ds-empty">Sin horas capturadas en esta selección.</p>}
        </section>
      </div>
      <p className="ds-lifetime-caption">Histórico de todas las semanas, incluidas las pendientes y las de alumnos desistidos.</p>
    </section>}
    {section==="students"&&<StudentInsights state={state} period={period} weekId={weekId} month={month}
      specialty={specialty} company={company} onReportStudent={onReportStudent}/>}
    </div>
      </div>
    </div>
  </div>;
}
