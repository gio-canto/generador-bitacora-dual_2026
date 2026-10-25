import {ArrowLeft,ArrowUpRight,SlidersHorizontal,Clock,Users,FileArrowDown} from "@phosphor-icons/react";
import AnimatedValue from "./AnimatedValue.jsx";
import {VERSION} from "../domain/records.js";
import "../delivery-statistics-hero.css";

const number=(value,digits=0)=>Number(value||0).toLocaleString("es-MX",{maximumFractionDigits:digits});
const percentage=value=>value==null?"—":number(value)+"%";
const periods=[["weekly","Semanal"],["monthly","Mensual"],["all","General"]];
const logoSrc=()=>typeof window!=="undefined"&&window.location.pathname.includes("/registro-entrega/")
  ?"../Assets/registro-dual-icon-192.png":"Assets/registro-dual-icon-192.png";

function DeliveryRing({data}){
 const total=Number(data.applicable)||0;
 const onTime=total?100*data.delivered/total:0;
 const late=total?100*data.late/total:0;
 const pending=total?100*data.notDelivered/total:0;
 return <div className="ds-hero-ring-wrap">
  <svg className="ds-hero-ring" viewBox="0 0 160 160" role="img"
    aria-label={total?"Entregas aplicables: "+data.delivered+" puntuales, "+data.late+" tardías y "+data.notDelivered+" pendientes":
      "Sin entregas aplicables en el periodo"}>
    <circle cx="80" cy="80" r="66" className="ds-hero-ring-base"/>
    {total>0&&<>
      <circle cx="80" cy="80" r="66" className="ds-hero-ring-segment ds-hero-ring-on-time"
        pathLength="100" strokeDasharray={onTime+" "+(100-onTime)} strokeDashoffset="0"
        transform="rotate(-90 80 80)"/>
      <circle cx="80" cy="80" r="66" className="ds-hero-ring-segment ds-hero-ring-late"
        pathLength="100" strokeDasharray={late+" "+(100-late)} strokeDashoffset={-onTime}
        transform="rotate(-90 80 80)"/>
      <circle cx="80" cy="80" r="66" className="ds-hero-ring-segment ds-hero-ring-pending"
        pathLength="100" strokeDasharray={pending+" "+(100-pending)} strokeDashoffset={-(onTime+late)}
        transform="rotate(-90 80 80)"/>
    </>}
  </svg>
  <div className="ds-hero-ring-center" aria-hidden="true">
    <strong>{total?number(data.delivered+data.late):"—"}</strong>
    <span>recibidas</span>
  </div>
 </div>;
}

export default function StatisticsHero({data,period,onPeriodChange,onBack,onReportStatistics,
 onToggleFilters,filtersOpen,specialty,company,weekLabel,month,section}){
 const hasDeliveries=data.applicable>0;
 const received=data.delivered+data.late;
 const periodDetail=period==="weekly"?(weekLabel||"Sin semana seleccionada"):
   period==="monthly"?(month||"Sin mes seleccionado"):"Todas las semanas";
 const filterCount=Number(Boolean(specialty))+Number(Boolean(company));
 return <header className="ds-premium-hero" aria-label="Presentación de Datos">
   <div className="ds-premium-hero-top">
     <button className="ds-hero-back" type="button" onClick={onBack}>
       <ArrowLeft size={17} weight="bold" aria-hidden="true"/><span>Volver al registro</span>
     </button>
     <div className="ds-premium-hero-actions">
       <span className="ds-hero-edition">REGISTRO DUAL / v{VERSION}</span>
       <div className="ds-hero-logo" role="img" aria-label="Logotipo oficial Dual">
         <img src={logoSrc()} alt="" />
       </div>
     </div>
   </div>
   <div className="ds-hero-intro">
     <span className="ds-hero-eyebrow"><i/> PANORAMA ACADÉMICO <span> / 01</span></span>
     <div className="ds-hero-title-row">
       <div>
         <h1>Datos<span>.</span></h1>
         <p>Una mirada clara al seguimiento de Educación Dual.</p>
       </div>
       <button type="button" className="ds-hero-export" aria-label="Reportes" onClick={onReportStatistics}>
         <FileArrowDown size={18} aria-hidden="true"/><span>Reportes</span><ArrowUpRight size={16} aria-hidden="true"/>
       </button>
     </div>
   </div>
   <div className="ds-hero-filter-row">
     <div className="ds-hero-periods" role="group" aria-label="Periodo de Datos">
       {periods.map(([id,name])=><button type="button" key={id}
         aria-pressed={period===id} className={period===id?"active":""}
         onClick={()=>onPeriodChange(id)}>{name}</button>)}
     </div>
     <button className="ds-hero-filter-button" type="button" aria-label="Filtros" onClick={onToggleFilters}
       aria-expanded={filtersOpen} aria-controls="ds-controls-options">
       <SlidersHorizontal size={18} aria-hidden="true"/>
       <span>Filtros</span>{filterCount>0&&<b>{filterCount}</b>}
     </button>
   </div>
   <div className="ds-hero-context" aria-live="polite">
     <span>{periodDetail}</span>
     {specialty&&<span>Especialidad: {specialty}</span>}
     {company&&<span>Empresa: {company}</span>}
   </div>
   {section==="summary"&&<div className="ds-hero-glass-card" aria-label="Resumen principal de entregas">
     <div className="ds-hero-glass-head">
       <span className="ds-hero-card-eyebrow"><span className="ds-hero-blue-dot"/> SEGUIMIENTO DE ENTREGAS</span>
       <span className="ds-hero-glass-caption">01 / RESUMEN</span>
     </div>
     <div className="ds-hero-glass-body">
       <div className="ds-hero-compliance">
         <span className="ds-hero-metric-label">Cumplimiento de entrega</span>
         <div className="ds-hero-primary-value">
           {hasDeliveries?<AnimatedValue value={percentage(data.deliveryRate)}/>:<span>—</span>}
         </div>
         <p>{hasDeliveries?number(received)+" de "+number(data.applicable)+" registros aplicables recibidos":
           "No hay entregas aplicables en este periodo."}</p>
         <div className="ds-hero-status-list">
           <span><i className="ds-hero-status-on-time"/>{number(data.delivered)} a tiempo</span>
           <span><i className="ds-hero-status-late"/>{number(data.late)} tardías</span>
           <span><i className="ds-hero-status-pending"/>{number(data.notDelivered)} pendientes</span>
         </div>
       </div>
       <DeliveryRing data={data}/>
     </div>
     <div className="ds-hero-mini-stats">
       <div className="ds-hero-mini-stat">
         <span>Horas capturadas</span><strong>{number(data.totalMinutes/60,1)} <small>h</small></strong>
       </div>
       <div className="ds-hero-mini-stat">
         <span>Asistencia</span><strong>{data.daily.laboral+data.daily.falta?percentage(data.attendanceRate):"—"}</strong>
       </div>
       <div className="ds-hero-mini-stat">
         <span>Faltas</span><strong>{data.weeksWithStatistics?number(data.daily.falta):"—"}</strong>
       </div>
       <div className="ds-hero-mini-stat">
         <span>Cobertura</span><strong>{hasDeliveries?percentage(data.coverage):"—"}</strong>
       </div>
     </div>
   </div>}
   <div className="ds-hero-footer">
     <span><Clock size={14} aria-hidden="true"/> {period==="all"?"Vista acumulada":period==="monthly"?"Corte mensual":"Corte semanal"}</span>
     <span><Users size={14} aria-hidden="true"/> {number(data.students.length)} alumnos activos</span>
   </div>
 </header>;
}
