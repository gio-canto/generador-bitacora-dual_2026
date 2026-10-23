import {useMemo,useState} from "react";
import {buildStudentDossier} from "../services/student-dossier.js";

const count=n=>Number(n||0).toLocaleString("es-MX",{maximumFractionDigits:1});
const hours=n=>n==null?"Sin datos":count(n)+" h";
const rate=n=>n==null?"Sin base de cálculo":count(n)+"%";
const weekStatus={
  a_tiempo:"Entregada a tiempo",
  tarde:"Entregada a destiempo",
  vencida:"Pendiente vencida",
  en_plazo:"Pendiente · en plazo",
  no_aplica:"No aplica",
};
const dayStatus={
  laboral:"Con labores",falta:"Falta",sin_labores:"Sin labores",inhabil:"Día inhábil",
};
const weekdays=["Martes","Miércoles","Jueves","Viernes"];

function Indicator({label,value,note}) {
  return <article className="ds-dossier-indicator">
    <span>{label}</span><strong>{value}</strong>{note&&<small>{note}</small>}
  </article>;
}
function WeekDetail({week}) {
  return <details className="ds-dossier-week" key={week.id}>
    <summary>
      <span className="ds-dossier-week-title">
        <strong>{week.label||week.startDate||"Semana"}</strong>
        <small>{week.startDate}{week.endDate&&" a "+week.endDate}</small>
      </span>
      <span className={"ds-dossier-state ds-dossier-state-"+week.state}>
        {weekStatus[week.state]}
      </span>
      <b>{week.statsKnown?hours(week.hours):"Sin jornadas"}</b>
      <span className="ds-dossier-chevron" aria-hidden="true">⌄</span>
    </summary>
    <div className="ds-dossier-week-body">
      <dl>
        <div><dt>Fecha límite</dt><dd>{week.dueAt||"No especificada"}</dd></div>
        <div><dt>Registro</dt><dd>{week.registeredAt||"Sin entrega registrada"}</dd></div>
        <div><dt>Método</dt><dd>{week.method}</dd></div>
      </dl>
      {week.statsKnown ? <div className="ds-table-scroll">
        <table className="ds-table ds-dossier-days">
          <thead><tr><th scope="col">Día</th><th scope="col">Jornada</th>
            <th scope="col">Horas</th><th scope="col">Motivo registrado</th></tr></thead>
          <tbody>{week.days.map(day=><tr key={day.index}>
            <th scope="row">{weekdays[day.index]||"Día "+(day.index+1)}</th>
            <td>{dayStatus[day.status]||"Sin especificar"}</td>
            <td>{day.status==="laboral"?hours(day.minutes/60):"—"}</td>
            <td>{day.reason||"—"}</td>
          </tr>)}</tbody>
        </table>
      </div> : <p className="ds-empty">No hay estadísticas de jornadas para este periodo. Esto no significa que hubo cero faltas u horas trabajadas.</p>}
    </div>
  </details>;
}

export default function StudentDossier({state,studentId}) {
  const [weekFilter,setWeekFilter]=useState("all");
  const dossier=useMemo(()=>studentId?
    buildStudentDossier(state,studentId):null,[state,studentId]);
  if(!dossier)return <div className="ds-dossier-welcome">
    Selecciona un alumno para consultar su historial escolar de entregas y jornadas.
  </div>;
  const timeline=dossier.timeline.filter(w=>weekFilter==="all"||
    (weekFilter==="pending"?w.state==="vencida":
      weekFilter==="submitted"?["a_tiempo","tarde"].includes(w.state):
      weekFilter==="known"?w.statsKnown:w.state===weekFilter));
  const monthMax=Math.max(1,...dossier.monthly.map(m=>m.minutes));
  return <div className="ds-dossier-record" key={studentId}>
    <header className="ds-dossier-identity">
      <div>
        <span className="delivery-kicker">Historial individual · Educación Dual</span>
        <h3>{dossier.name}</h3>
        <p>{dossier.specialty} · {dossier.company} · Grupo {dossier.group}</p>
        <small>{dossier.active?"Alumno activo":"Historial de alumno desistido"} · {dossier.dateFrom||"Sin periodos"}{dossier.dateTo?" — "+dossier.dateTo:""}</small>
      </div>
      <div className="ds-dossier-summary">
        <strong>{rate(dossier.deliveryRate)}</strong>
        <span>Cumplimiento de entrega</span>
        <small>{count(dossier.submitted)} de {count(dossier.due)} semanas vencidas</small>
      </div>
    </header>
    <div className="ds-dossier-indicators">
      <Indicator label="Entregas vencidas" value={count(dossier.due)}
        note="Base del cumplimiento"/>
      <Indicator label="Entregadas" value={count(dossier.submitted)}
        note={count(dossier.onTime)+" a tiempo · "+count(dossier.late)+" tarde"}/>
      <Indicator label="Pendientes vencidas" value={count(dossier.pending)}
        note={count(dossier.upcoming)+" aún en plazo"}/>
      <Indicator label="Puntualidad" value={rate(dossier.onTimeRate)}
        note="Entregas a tiempo entre vencidas"/>
      <Indicator label="Horas registradas" value={hours(dossier.totalHours)}
        note={count(dossier.weeksWithStats)+" semanas con jornadas"}/>
      <Indicator label="Promedio por semana con datos" value={hours(dossier.averageHours)}/>
      <Indicator label="Horas mínima / máxima" value={dossier.weeksWithStats?
        hours(dossier.minHours)+" / "+hours(dossier.maxHours):"Sin datos"}/>
      <Indicator label="Asistencia" value={rate(dossier.attendanceRate)}
        note="Días con labores frente a días con labores y faltas"/>
      <Indicator label="Faltas registradas" value={count(dossier.absences)}
        note={count(dossier.knownDays)+" jornadas con datos"}/>
      <Indicator label="Días sin labores / inhábiles"
        value={count(dossier.nonWorkingDays)+" / "+count(dossier.offDays)}/>
    </div>

    <div className="ds-dossier-columns">
      <section className="ds-dossier-section">
        <h4>Evolución por mes</h4>
        <p>Horas verificadas y semanas pendientes. Los meses sin datos no se presuponen trabajados.</p>
        {dossier.monthly.length? <div className="ds-dossier-month-list">
          {dossier.monthly.map(row=><div className="ds-dossier-month" key={row.month}>
            <div><strong>{row.month}</strong>
              <span>{hours(row.minutes/60)} · {count(row.submitted)}/{count(row.due)} entregas vencidas
                {row.pending>0?" · "+count(row.pending)+" pendientes":""}</span></div>
            <div className="ds-track"><i style={{width:(row.minutes/monthMax*100)+"%"}}/></div>
          </div>)}
        </div> : <p className="ds-empty">Sin semanas registradas.</p>}
      </section>
      <section className="ds-dossier-section">
        <h4>Motivos de faltas documentadas</h4>
        <p>Las faltas pueden estar justificadas. Este resumen no emite juicios disciplinarios.</p>
        {dossier.byCause.length?<div className="ds-dossier-causes">
          {dossier.byCause.map(row=><div key={row.label}>
            <span>{row.label}</span><strong>{count(row.count)}</strong>
          </div>)}
        </div>:<p className="ds-empty">{dossier.weeksWithStats?
          "No hay faltas registradas en las jornadas conocidas.":
          "No hay suficientes datos de jornadas para evaluar las faltas."}</p>}
        <p className="ds-dossier-mini">Total de jornadas conocidas: {count(dossier.knownDays)} ·
          {count(dossier.workDays)} con labores · {count(dossier.absences)} faltas</p>
      </section>
    </div>

    <section className="ds-dossier-section">
      <div className="ds-panel-head">
        <div><h4>Historial de todas las semanas</h4>
          <p>Abre cualquier semana para revisar la entrega, las horas y el motivo de cada jornada.</p></div>
        <label className="ds-dossier-week-filter">Mostrar
          <select value={weekFilter} onChange={e=>setWeekFilter(e.target.value)}>
            <option value="all">Todas las semanas</option>
            <option value="pending">Pendientes vencidas</option>
            <option value="submitted">Entregadas</option>
            <option value="known">Con datos de jornadas</option>
            <option value="en_plazo">Aún en plazo</option>
            <option value="no_aplica">No aplica</option>
          </select>
        </label>
      </div>
      {timeline.length?<div className="ds-dossier-weeks">{timeline.map(week=>
        <WeekDetail key={week.id} week={week}/>)}</div>:
        <p className="ds-empty">No hay semanas que correspondan al filtro seleccionado.</p>}
      <p className="ds-lifetime-caption">El cumplimiento se calcula solo con periodos vencidos. Una entrega tardía sigue contando como entregada; «No aplica» se excluye. El historial cambia al corregir las entregas. Información interna del plantel: no representa una puntuación crediticia.</p>
    </section>
  </div>;
}
