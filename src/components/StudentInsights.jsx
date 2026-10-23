import {useMemo,useState} from "react";
import {calculateStudentInsights} from "../services/student-insights.js";

const number=value=>Number(value||0).toLocaleString("es-MX",{maximumFractionDigits:1});
const suffix=(v,singular,plural)=>v===1?singular:plural;

function PersonCard({item,index,value,detail}) {
  return <article className="ds-person" key={item.id}>
    <span className="ds-person-index" aria-hidden="true">{index+1}</span>
    <div className="ds-person-body">
      <strong>{item.name}</strong>
      <small>{item.specialty} · {item.company}{item.group!=="Sin especificar"?" · Grupo "+item.group:""}</small>
      <span>{detail(item)}</span>
    </div>
    <b className="ds-person-value">{value(item)}</b>
  </article>;
}

function Ranking({title,description,items,value,detail,empty,notice}) {
  const [expanded,setExpanded]=useState(false);
  const shown=expanded?items:items.slice(0,3);
  return <section className="ds-panel ds-people-panel">
    <div className="ds-insight-heading"><h3>{title}</h3><p>{description}</p></div>
    {shown.length ? <div className="ds-person-list">
      {shown.map((item,index)=><PersonCard key={item.id} item={item} index={index}
        value={value} detail={detail}/>)}
    </div> : <p className="ds-empty">{empty}</p>}
    {notice && <p className="ds-insight-notice">{notice}</p>}
    {items.length>3 && <button type="button" className="btn ds-more"
      aria-expanded={expanded} onClick={()=>setExpanded(current=>!current)}>
      {expanded?"Ver solo los tres primeros":"Mostrar "+number(items.length-3)+" personas más"}
    </button>}
  </section>;
}

export default function StudentInsights({state,period,weekId,month,specialty,company}) {
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
  const pending=useMemo(()=>insights.ledger.filter(item=>{
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
        <p>Compara entregas, faltas y puntualidad con el número de semanas y jornadas efectivamente registradas.</p>
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
      <article className="ds-kpi"><strong>{number(insights.withAttendanceData)}</strong><span>Con jornadas verificables</span></article>
      <article className="ds-kpi"><strong>{number(insights.totalDue)}</strong><span>Entregas cuyo plazo venció</span></article>
      <article className="ds-kpi"><strong>{number(insights.totalPending)}</strong><span>Bitácoras vencidas pendientes</span></article>
    </div>
    <div className="ds-two-column">
      <Ranking title="Menor cumplimiento de entrega"
        description="De menor a mayor porcentaje de bitácoras entregadas entre las ya vencidas."
        items={insights.leastCompliant}
        value={item=>number(item.fulfillmentRate)+"%"}
        detail={item=>number(item.pending)+" pendientes de "+number(item.due)+" semanas vencidas"}
        empty="No hay plazos de entrega vencidos en esta selección."/>
      <Ranking title="Más faltas registradas"
        description="Solo se consideran faltas asentadas en jornadas con estadísticas."
        items={insights.mostAbsences}
        value={item=>number(item.absences)}
        detail={item=>number(item.knownDays)+" jornadas con datos · "+number(item.absenceRate||0)+"% entre días laborales y faltas"}
        empty="No hay faltas registradas con datos verificables."/>
      <Ranking title="Menos faltas registradas"
        description="También considera cero faltas, pero nunca confunde ausencia de datos con cero."
        items={insights.fewestAbsences}
        value={item=>number(item.absences)}
        detail={item=>number(item.knownDays)+" jornadas con datos"}
        notice={tiedNotice}
        empty="Todavía no hay alumnos con jornadas registradas."/>
      <Ranking title="Mayor puntualidad"
        description="Porcentaje de entregas a tiempo respecto de las semanas vencidas."
        items={insights.mostPunctual}
        value={item=>number(item.onTimeRate)+"%"}
        detail={item=>number(item.onTime)+" a tiempo de "+number(item.due)+" semanas vencidas"}
        empty="No hay entregas realizadas en semanas vencidas."/>
      <Ranking title="Más horas registradas"
        description="Suma de horas verificadas en el periodo; no incluye jornadas sin datos."
        items={insights.mostHours}
        value={item=>number(item.hours)+" h"}
        detail={item=>number(item.periodsWithStats)+" semanas con estadísticas"}
        empty="No hay horas registradas en este periodo."/>
      <section className="ds-panel ds-insight-explainer">
        <h3>Cómo se interpretan las comparaciones</h3>
        <p>La clasificación muestra nombres únicamente para seguimiento escolar interno. Una falta registrada no es necesariamente injustificada: consulta el motivo antes de tomar decisiones.</p>
        <p>El porcentaje de cumplimiento se calcula por periodos vencidos; <strong>«No aplica» no cuenta</strong>. Las jornadas que aún no tienen estadísticas quedan sin dato, no como cero faltas.</p>
        <p>Los alumnos con menos semanas deben compararse considerando también el denominador que se muestra en cada tarjeta.</p>
      </section>
    </div>

    <section className="ds-panel ds-insight-breakdown">
      <div className="ds-panel-head">
        <div className="ds-insight-heading"><h3>Comparación entre áreas</h3><p>Los filtros superiores y el grupo elegido también afectan este análisis.</p></div>
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
          <h3>Historial de entregas pendientes</h3>
          <p>Seguimiento acumulado de alumnos activos con bitácoras vencidas. Los registros se actualizan cuando entregan; no es un buró de crédito ni una sanción.</p>
        </div>
        <div className="ds-overdue-totals"><strong>{number(insights.pendingStudents)}</strong><span>alumnos con pendientes</span></div>
      </header>
      <div className="ds-overdue-filters">
        <label>Buscar alumno
          <input value={search} onChange={e=>setSearch(e.target.value)}
            type="search" placeholder="Nombre, empresa, especialidad o grupo"/>
        </label>
        <label>Semanas vencidas sin entregar
          <select value={pendingLevel} onChange={e=>setPendingLevel(e.target.value)}>
            <option value="all">Todas las cantidades</option>
            <option value="1">Una pendiente</option>
            <option value="2">Dos pendientes</option>
            <option value="3plus">Tres o más pendientes</option>
          </select>
        </label>
      </div>
      {pending.length ? <div className="ds-overdue-list">
        {(showAllLedger?pending:pending.slice(0,12)).map(item=><article className="ds-overdue-person" key={item.id}>
          <div className="ds-overdue-person-main">
            <strong>{name(item)}</strong>
            <small>{item.specialty} · {item.company} · Grupo {item.group}</small>
            <span>{number(item.submitted)} de {number(item.due)} semanas vencidas entregadas · {number(item.fulfillmentRate||0)}% de cumplimiento</span>
            <p>{item.overdue.map(week=>week.label+" ("+week.startDate+")").join(" · ")}</p>
          </div>
          <div className="ds-overdue-count"><strong>{item.pending}</strong><span>{suffix(item.pending,"pendiente","pendientes")}</span></div>
        </article>)}
      </div> : <p className="ds-empty">No hay alumnos con pendientes que coincidan con los filtros.</p>}
      {pending.length>12 && <button type="button" className="btn ds-more"
        onClick={()=>setShowAllLedger(v=>!v)}>{showAllLedger?"Mostrar primeros 12":"Ver los "+number(pending.length)+" alumnos"}</button>}
      <p className="ds-lifetime-caption">No se incluyen semanas futuras ni entregas marcadas «No aplica». Si una semana aún no tiene fecha límite y no está cerrada, solo se considera vencida tras concluir su periodo. Historial local de uso administrativo.</p>
    </section>}
  </section>;
}
