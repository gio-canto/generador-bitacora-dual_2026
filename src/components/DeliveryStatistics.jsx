import { useMemo, useState } from "react";
import { summarizeWeekStatistics, causeLabel } from "../services/matrix-statistics.js";
import { studentIsActive } from "../services/delivery-registry.js";
import "../delivery-statistics.css";

const number = (value) => Number(value || 0).toLocaleString("es-MX");
const genderLabels = {
  male: "Hombres", female: "Mujeres", nonbinary: "No binario",
  other: "Otro", undisclosed: "Prefiero no responder", "": "Sin dato",
};
const percent = (value, total) => total ? Math.round(value / total * 100) : 0;

function downloadCsv(rows) {
  const escape = (value) => {
    let text = String(value ?? "");
    if (/^[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  const content = "\uFEFF" + rows.map((row) => row.map(escape).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "estadisticas-dual-" + new Date().toISOString().slice(0, 10) + ".csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function Breakdown({ items, empty = "Sin datos" }) {
  const total = items.reduce((a, b) => a + b.value, 0);
  return (
    <>
      {total ? (
        <div className="ds-stack" aria-label="Distribución">
          {items.filter(item => item.value).map(item => (
            <span key={item.label} style={{ width: (item.value / total * 100) + "%", background: item.color }} title={item.label + ": " + item.value} />
          ))}
        </div>
      ) : <p className="ds-empty">{empty}</p>}
      <div className="ds-legend">
        {items.map(item => (
          <div key={item.label} className="ds-legend-row">
            <span className="ds-color-dot" style={{ background: item.color }} />
            <span>{item.label}</span><strong>{number(item.value)}</strong>
          </div>
        ))}
      </div>
    </>
  );
}

function CauseBars({ title, rows }) {
  const total = rows.reduce((acc, row) => acc + row.value, 0);
  const top = [...rows].sort((a,b) => b.value - a.value).slice(0, 6);
  return (
    <section className="ds-panel">
      <h2>{title}</h2>
      {total ? top.map(row => (
        <div className="ds-cause" key={row.key}>
          <div className="ds-cause-label"><span>{row.label}</span><strong>{number(row.value)}</strong></div>
          <div className="ds-track"><i style={{ width: percent(row.value, top[0].value) + "%" }} /></div>
        </div>
      )) : <p className="ds-empty">Sin registros en el periodo.</p>}
    </section>
  );
}

export default function DeliveryStatistics({ state, onBack }) {
  const [period, setPeriod] = useState("weekly");
  const [weekId, setWeekId] = useState(state.weeks.at(-1)?.id || "");
  const [month, setMonth] = useState(state.weeks.at(-1)?.startDate?.slice(0,7) || new Date().toISOString().slice(0,7));
  const [specialty, setSpecialty] = useState("");
  const [company, setCompany] = useState("");
  const [metric, setMetric] = useState("hours");
  const specialties = [...new Set(state.students.map(s => s.specialty).filter(Boolean))].sort();
  const companies = [...new Set(state.students.map(s => s.company).filter(Boolean))].sort();
  const display = useMemo(() => {
    const students = state.students.filter(s =>
      (!specialty || s.specialty === specialty) && (!company || s.company === company)
    );
    const byId = new Map(students.map(s => [s.id, s]));
    const weeks = state.weeks.filter(w =>
      period === "all" || (period === "monthly" ? w.startDate?.startsWith(month) : w.id === weekId)
    ).sort((a,b) => a.startDate.localeCompare(b.startDate));
    const daily = { laboral: 0, falta: 0, sin_labores: 0, inhabil: 0 };
    const causes = { falta: new Map(), sin_labores: new Map() };
    const people = new Map(students.map(s => [s.id, { student: s, minutes: 0, absences: 0, reportedWeeks: 0 }]));
    const knownUsers = new Set();
    let totalMinutes = 0;
    let scannedWeeks = 0;
    const detail = [];
    const trend = [];
    for (const week of weeks) {
      let weekMinutes = 0, weekDays = 0;
      for (const [id, delivery] of Object.entries(week.deliveries || {})) {
        const person = byId.get(id);
        if (!person || !delivery || delivery.status === "no_aplica") continue;
        if (delivery.matrixVersion > 0 && delivery.source === "camera") knownUsers.add(id);
        const summary = summarizeWeekStatistics(delivery.statistics);
        if (!summary) continue;
        scannedWeeks++;
        const individual = people.get(id);
        individual.minutes += summary.minutes;
        individual.absences += summary.absent;
        individual.reportedWeeks++;
        totalMinutes += summary.minutes;
        weekMinutes += summary.minutes;
        weekDays += 4;
        for (const day of delivery.statistics.entries) {
          daily[day.status]++;
          if (day.status === "falta" || day.status === "sin_labores") {
            const map = causes[day.status];
            const key = day.reasonCode;
            map.set(key, (map.get(key) || 0) + 1);
          }
        }
        detail.push({
          student: person, week: week.label, startDate: week.startDate,
          minutes: summary.minutes, absences: summary.absent,
          nonWorking: summary.nonWorking, holidays: summary.holidays,
          delivery: delivery.status,
        });
      }
      trend.push({ label: week.label, minutes: weekMinutes, days: weekDays });
    }
    const population = students.filter(studentIsActive);
    const used = population.filter(s => knownUsers.has(s.id)).length;
    const other = population.filter(s => s.usageMode === "other" && !knownUsers.has(s.id)).length;
    const genderCounts = new Map();
    for (const student of population) {
      const key = student.gender || "";
      genderCounts.set(key, (genderCounts.get(key) || 0) + 1);
    }
    const causeRows = type => [...causes[type]].map(([key,value])=>({
      key, value, label: causeLabel(type, key)
    }));
    return {
      population, daily, totalMinutes, scannedWeeks, trend, detail, people,
      used, other, unknown: population.length - used - other,
      genderCounts, causeAbsence: causeRows("falta"), causeNonWorking: causeRows("sin_labores"),
    };
  }, [state, period, weekId, month, specialty, company]);

  const dayItems = [
    {label:"Con labores",value:display.daily.laboral,color:"#0071e3"},
    {label:"Faltas",value:display.daily.falta,color:"#e76b6b"},
    {label:"Sin labores",value:display.daily.sin_labores,color:"#e5a547"},
    {label:"Días inhábiles",value:display.daily.inhabil,color:"#969eac"},
  ];
  const genders = [
    {label:genderLabels.male,value:display.genderCounts.get("male") || 0,color:"#0071e3"},
    {label:genderLabels.female,value:display.genderCounts.get("female") || 0,color:"#e78da1"},
    {label:genderLabels.nonbinary,value:display.genderCounts.get("nonbinary") || 0,color:"#9a7bdd"},
    {label:genderLabels.other,value:display.genderCounts.get("other") || 0,color:"#26a69a"},
    {label:genderLabels.undisclosed,value:display.genderCounts.get("undisclosed") || 0,color:"#c2b6ab"},
    {label:genderLabels[""],value:display.genderCounts.get("") || 0,color:"#a3a8b0"},
  ];
  const uses = [
    {label:"Uso identificado",value:display.used,color:"#0071e3"},
    {label:"Otro método",value:display.other,color:"#96a7bf"},
    {label:"Sin información",value:display.unknown,color:"#d9dce2"},
  ];
  const trend = period === "weekly"
    ? [
      ...["Martes","Miércoles","Jueves","Viernes"].map((label, index) => {
        let minutes = 0;
        for (const d of display.detail) {
          const week = state.weeks.find(w => w.label === d.week && w.startDate === d.startDate);
          const delivery = week?.deliveries?.[state.students.find(s => s.id === d.student.id)?.id];
          minutes += delivery?.statistics?.entries?.[index]?.minutes || 0;
        }
        return {label, minutes};
      })
    ]
    : display.trend;
  const maxTrend = Math.max(1, ...trend.map(v => v.minutes));
  const exportStatistics = () => {
    const rows = [["Alumno","Especialidad","Empresa","Género","Semana","Inicio","Horas","Faltas","Sin labores","Días inhábiles","Entrega"]];
    for (const row of display.detail) rows.push([
      row.student.name,row.student.specialty,row.student.company,
      genderLabels[row.student.gender || ""],row.week,row.startDate,
      (row.minutes / 60).toFixed(2),row.absences,row.nonWorking,row.holidays,row.delivery,
    ]);
    downloadCsv(rows);
  };
  return (
    <div className="delivery-analytics-container">
      <div className="ds-header">
        <button type="button" className="btn" onClick={onBack}>← Volver</button>
        <span className="delivery-kicker">Registro de entrega</span>
        <h1>Estadísticas</h1>
      </div>
      <div className="ds-controls">
        <div className="ds-tabs" role="group" aria-label="Periodo">
          {[["weekly","Semanal"],["monthly","Mensual"],["all","General"]].map(([value,label]) =>
            <button type="button" key={value} className={period === value ? "active" : ""} onClick={() => setPeriod(value)}>{label}</button>
          )}
        </div>
        {period === "weekly" && <label>Semana
          <select value={weekId} onChange={e => setWeekId(e.target.value)}>
            {state.weeks.map(w => <option key={w.id} value={w.id}>{w.label} · {w.startDate}</option>)}
          </select></label>}
        {period === "monthly" && <label>Mes <input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></label>}
        <label>Especialidad
          <select value={specialty} onChange={e=>setSpecialty(e.target.value)}>
            <option value="">Todas</option>
            {specialties.map(x=><option key={x} value={x}>{x}</option>)}
          </select></label>
        <label>Empresa
          <select value={company} onChange={e=>setCompany(e.target.value)}>
            <option value="">Todas</option>
            {companies.map(x=><option key={x} value={x}>{x}</option>)}
          </select></label>
      </div>
      <div className="ds-kpis">
        {[
          ["Alumnos activos",number(display.population.length)],
          ["Horas realizadas",number((display.totalMinutes / 60).toFixed(1)) + " h"],
          ["Jornadas con falta",number(display.daily.falta)],
          ["Uso identificado",percent(display.used,display.population.length) + "%"],
        ].map(([label,value]) =>
          <article className="ds-kpi" key={label}><strong>{value}</strong><span>{label}</span></article>)}
      </div>
      <section className="ds-panel">
        <div className="ds-panel-head">
          <h2>Actividad de formación</h2>
          <div className="ds-tabs small">
            <button type="button" onClick={() => setMetric("hours")} className={metric==="hours"?"active":""}>Horas</button>
            <button type="button" onClick={() => setMetric("days")} className={metric==="days"?"active":""}>Jornadas</button>
          </div>
        </div>
        {metric === "hours" ? (
          <>
            <div className="ds-feature-number">{number((display.totalMinutes/60).toFixed(1))} h</div>
            <div className="ds-columns">
              {trend.map((item,i) => (
                <div className="ds-column" key={i}>
                  <strong>{item.minutes ? number((item.minutes / 60).toFixed(1))+" h" : "0"}</strong>
                  <div className="ds-column-track"><span style={{height: percent(item.minutes,maxTrend) + "%"}} /></div>
                  <small>{item.label}</small>
                </div>
              ))}
            </div>
          </>
        ) : <Breakdown items={dayItems}/>}
        {!display.scannedWeeks && <p className="ds-empty">Aún no hay jornadas con datos estadísticos para este periodo.</p>}
      </section>
      <div className="ds-two-column">
        <section className="ds-panel"><h2>Asistencia y jornadas</h2><Breakdown items={dayItems}/></section>
        <CauseBars title="Motivos de inasistencia" rows={display.causeAbsence}/>
        <CauseBars title="Días sin labores" rows={display.causeNonWorking}/>
        <section className="ds-panel"><h2>Utilización del sistema</h2><Breakdown items={uses}/></section>
        <section className="ds-panel"><h2>Género del alumnado</h2><Breakdown items={genders}/></section>
      </div>
      <section className="ds-panel">
        <div className="ds-panel-head">
          <h2>Alumnos</h2>
          <div className="ds-export">
            <button className="btn" type="button" onClick={exportStatistics}>Descargar CSV</button>
            <button className="btn" type="button" onClick={() => window.print()}>Imprimir / PDF</button>
          </div>
        </div>
        <div className="ds-table-scroll">
          <table className="ds-table">
            <thead><tr><th>Alumno</th><th>Empresa</th><th>Horas</th><th>Faltas</th><th>Semanas con datos</th></tr></thead>
            <tbody>{[...display.people.values()].filter(v=>studentIsActive(v.student)||v.reportedWeeks)
              .sort((a,b)=>a.student.name.localeCompare(b.student.name,"es"))
              .map(v=><tr key={v.student.id}>
                <td>{v.student.name}</td><td>{v.student.company}</td>
                <td>{number((v.minutes/60).toFixed(1))} h</td><td>{v.absences}</td>
                <td>{v.reportedWeeks}</td>
              </tr>)}</tbody>
          </table>
        </div>
        {!display.population.length && <p className="ds-empty">No hay alumnos en el filtro seleccionado.</p>}
      </section>
    </div>
  );
}
