import {useMemo,useState} from "react";
import {calculateStudentInsights} from "../services/student-insights.js";

const number=value=>Number(value||0).toLocaleString("es-MX",{maximumFractionDigits:1});
const suffix=(v,singular,plural)=>v===1?singular:plural;

function PersonCard({item,index,value,detail,onOpen}) {
  return <article className="ds-person" key={item.id}>
    <span className="ds-person-index" aria-hidden="true">{index+1}</span>
    <div className="ds-person-body">
      <button className="ds-person-link" type="button" onClick={()=>onOpen(item.id)}
        aria-label={"Abrir reporte de "+item.name}>{item.name}</button>
      <small>{item.specialty} · {item.company}{item.group!=="Sin especificar"?" · Grupo "+item.group:""}</small>
      <span>{detail(item)}</span>
    </div>
    <b className="ds-person-value">{value(item)}</b>
  </article>;
}

function Ranking({title,description,items,value,detail,empty,notice,onOpen}) {
  const [expanded,setExpanded]=useState(false);
  const shown=expanded?items:items.slice(0,3);
  return <section className="ds-panel ds-people-panel">
    <div className="ds-insight-heading"><h3>{title}</h3><p>{description}</p></div>
    {shown.length ? <div className="ds-person-list">
      {shown.map((item,index)=><PersonCard key={item.id} item={item} index={index}
        value={value} detail={detail} onOpen={onOpen}/>)}
    </div> : <p className="ds-empty">{empty}</p>}
    {notice && <p className="ds-insight-notice">{notice}</p>}
    {items.length>3 && <button type="button" className="btn ds-more"
      aria-expanded={expanded} onClick={()=>setExpanded(current=>!current)}>
      {expanded?"Ver solo los tres primeros":"Mostrar "+number(items.length-3)+" personas más"}
    </button>}
  </section>;
}

export default function StudentInsights({state,period,weekId,month,specialty,company,onReportStudent}) {
  const [group,setGroup]=useState("");
  const [breakdown,setBreakdown]=useState("specialty");
  const [search,setSearch]=useState("");
  const [pendingLevel,setPendingLevel]=useState("all");
  const [showAllLedger,setShowAllLedger]=useState(false);
  const availableGroups=useMemo(()=>
    [...new Set((state.students||[]).map(s=>s.group).filter(Boolean))]
      .sort((a,b)=>a.localeCompare(b,"es")), [state.students]);
  const insights=useMemo(()=>calculateStudentInsights(state,{
    period,weekId,month,specialty,company,group
  }),[state,period,weekId,month,specialty,company,group]);
  const labelScope=period==="all"?"histórico general":period==="monthly"?"mes seleccionado":"semana seleccionada";
  const name=(item)=>item.name;
  const pending=useMemo(()=>insights.ledger.filter(item=>item.pending>=2).filter(item=>{
    const query=search.trim().toLocaleLowerCase("es-MX");
    if(query && ![item.name,item.specialty,item.company,item.group]
      .some(value=>value.toLocaleLowerCase("es-MX").includes(query)))return false;
    return pendingLevel==="all"||
      (pendingLevel==="3plus"?item.pending>=3:item.pending===Number(pendingLevel));
  }),[insights,search,pendingLevel]);
  const rows=breakdown==="company"?insights.byCompany:
    breakdown==="group"?insights.byGroup:insights.bySpecialty;
  const tiedNotice=insights.fewestTiedCount>3
    ? number(insights.fewestTiedCount)+" personas comparten el mínimo de "+
      number(insights.fewestAbsences[0]?.absences)+" faltas. Se muestran tres inicialmente."
    : "";
  return <section className="ds-insights" aria-label="Estadísticas por alumno">
    <header className="ds-insights-top">
      <div>
        <span className="delivery-kicker">Seguimiento nominal · {labelScope}</span>
        <h2>Estadísticas por alumno</h2>

      </div>
      <label className="ds-insight-group">Grupo
        <select value={group} onChange={e=>setGroup(e.target.value)}>
          <option value="">Todos los grupos</option>
          {availableGroups.map(item=><option key={item} value={item}>{item}</option>)}
        </select>
      </label>
    </header>
    <div className="ds-kpis ds-insight-kpis">
      <article className="ds-kpi"><strong>{number(insights.coveredStudents)}</strong><span>Alumnos en el análisis</span></article>
      <article className="ds-kpi"><strong>{number(insights.withAttendanceData)}</strong><span>Con jornadas registradas</span></article>
      <article className="ds-kpi"><strong>{number(insights.totalDue)}</strong><span>Entregas cuyo plazo venció</span></article>
      <article className="ds-kpi"><strong>{number(insights.totalPending)}</strong><span>Bitácoras vencidas pendientes</span></article>
    </div>
    <div className="ds-two-column">
      <Ranking title="Menor cumplimiento de entrega" onOpen={onReportStudent}
        description="Entregas recibidas frente a vencidas."
        items={insights.leastCompliant}
        value={item=>number(item.fulfillmentRate)+"%"}
        detail={item=>number(item.pending)+" pendientes de "+number(item.due)+" semanas vencidas"}
        empty="No hay plazos de entrega vencidos en esta selección."/>
      <Ranking title="Más faltas registradas" onOpen={onReportStudent}
        description="Según las jornadas registradas."
        items={insights.mostAbsences}
        value={item=>number(item.absences)}
        detail={item=>number(item.knownDays)+" jornadas con datos · "+number(item.absenceRate||0)+"% entre días laborales y faltas"}
        empty="Sin faltas registradas."/>
      <Ranking title="Menos faltas registradas" onOpen={onReportStudent}
        description="Solo alumnos con jornadas registradas."
        items={insights.fewestAbsences}
        value={item=>number(item.absences)}
        detail={item=>number(item.knownDays)+" jornadas con datos"}
        notice={tiedNotice}
        empty="Todavía no hay alumnos con jornadas registradas."/>
      <Ranking title="Mayor puntualidad" onOpen={onReportStudent}
        description="Entregas puntuales frente a vencidas."
        items={insights.mostPunctual}
        value={item=>number(item.onTimeRate)+"%"}
        detail={item=>number(item.onTime)+" a tiempo de "+number(item.due)+" semanas vencidas"}
        empty="No hay entregas realizadas en semanas vencidas."/>
      <Ranking title="Más horas registradas" onOpen={onReportStudent}
        description="Horas registradas en el periodo."
        items={insights.mostHours}
        value={item=>number(item.hours)+" h"}
        detail={item=>number(item.periodsWithStats)+" semanas con estadísticas"}
        empty="No hay horas registradas en este periodo."/>
      <section className="ds-panel ds-insight-explainer">
        <h3>Cómo se interpretan las comparaciones</h3>
        <p>Las faltas pueden estar justificadas. «No aplica» queda fuera del cumplimiento y las jornadas sin datos no cuentan como cero faltas.</p>
      </section>
    </div>

    <section className="ds-panel ds-insight-breakdown">
      <div className="ds-panel-head">
        <div className="ds-insight-heading"><h3>Comparación por área</h3></div>
        <label>Desglosar por
          <select value={breakdown} onChange={e=>setBreakdown(e.target.value)}>
            <option value="specialty">Especialidad</option>
            <option value="company">Empresa</option>
            <option value="group">Grupo</option>
          </select>
        </label>
      </div>
      {rows.length ? <div className="ds-table-scroll">
        <table className="ds-table ds-insight-table">
          <thead><tr><th scope="col">{breakdown==="company"?"Empresa":breakdown==="group"?"Grupo":"Especialidad"}</th>
            <th scope="col">Alumnos</th><th scope="col">Vencidas</th>
            <th scope="col">Pendientes</th><th scope="col">Cumplimiento</th><th scope="col">Faltas con datos</th></tr></thead>
          <tbody>{rows.map(row=><tr key={row.label}>
            <th scope="row">{row.label}</th><td>{number(row.students)}</td>
            <td>{number(row.due)}</td><td>{number(row.pending)}</td>
            <td>{row.fulfillmentRate==null?"—":number(row.fulfillmentRate)+"%"}</td>
            <td>{number(row.absences)} <small>({number(row.knownDays)} jornadas)</small></td>
          </tr>)}</tbody>
        </table>
      </div> : <p className="ds-empty">Sin alumnos en esta selección.</p>}
    </section>

    {period==="all" && <section className="ds-panel ds-overdue-ledger" aria-label="Historial global de pendientes">
      <header className="ds-overdue-head">
        <div className="ds-insight-heading">
          <span className="delivery-kicker">Control interno · histórico general</span>
          <h3>Historial de entregas pendientes</h3><p>Alumnos con dos o más entregas vencidas.</p>

        </div>
        <div className="ds-overdue-totals"><strong>{number(insights.ledger.filter(p=>p.pending>=2).length)}</strong><span>alumnos con 2 o más pendientes</span></div>
      </header>
      <div className="ds-overdue-filters">
        <label>Buscar alumno
          <input value={search} onChange={e=>setSearch(e.target.value)}
            type="search" placeholder="Nombre, empresa, especialidad o grupo"/>
        </label>
        <label>Semanas vencidas sin entregar
          <select value={pendingLevel} onChange={e=>setPendingLevel(e.target.value)}>
            <option value="all">Todas las cantidades</option>
            <option value="2">Dos pendientes</option>
            <option value="3plus">Tres o más pendientes</option>
          </select>
        </label>
      </div>
      {pending.length ? <div className="ds-overdue-list">
        {(showAllLedger?pending:pending.slice(0,12)).map(item=><article className="ds-overdue-person" key={item.id}>
          <div className="ds-overdue-person-main">
            <button className="ds-person-link" type="button"
              onClick={()=>onReportStudent?.(item.id)}>{name(item)}</button>
            <small>{item.specialty} · {item.company} · Grupo {item.group}</small>
            <span>{number(item.submitted)} de {number(item.due)} semanas vencidas entregadas · {number(item.fulfillmentRate||0)}% de cumplimiento</span>
            <p>{item.overdue.map(week=>week.label+" ("+week.startDate+")").join(" · ")}</p>
          </div>
          <div className="ds-overdue-count"><strong>{item.pending}</strong><span>{suffix(item.pending,"pendiente","pendientes")}</span></div>
        </article>)}
      </div> : <p className="ds-empty">No hay alumnos con dos o más pendientes en esta selección.</p>}
      {pending.length>12 && <button type="button" className="btn ds-more"
        onClick={()=>setShowAllLedger(v=>!v)}>{showAllLedger?"Mostrar primeros 12":"Ver los "+number(pending.length)+" alumnos"}</button>}
    </section>}
  </section>;
}
