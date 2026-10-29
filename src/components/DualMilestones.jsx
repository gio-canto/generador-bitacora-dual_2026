import {calculateDualMilestones} from "../services/dual-milestones.js";
import "../delivery-milestones.css";

const number=(n,digits=0)=>Number(n).toLocaleString("es-MX",{maximumFractionDigits:digits});
const asHours=n=>number(n,1)+" h";

export default function DualMilestones({state,specialty="",company="",onReportStudent}){
 const model=calculateDualMilestones(state,{specialty,company});
 return <section className="ds-milestones" aria-label="Hitos de horas de Educación Dual">
   <div className="ds-milestones-heading">
     <div>
       <h2>Hitos de horas</h2>
       <p>Acumulado de todas las semanas con jornadas registradas.</p>
     </div>
     <span className="ds-milestone-count">{number(model.totalStudents)} alumnos</span>
   </div>
   <div className="ds-milestones-summary">
     <article className="ds-milestone-summary-card">
       <span>Hito 1 · Servicio social</span>
       <strong>{number(model.socialReached)} <small>/ {number(model.totalStudents)}</small></strong>
       <div className="ds-milestone-progress" role="progressbar"
         aria-label="Alumnos que alcanzaron las 480 horas"
         aria-valuenow={model.socialReached} aria-valuemin={0}
         aria-valuemax={model.totalStudents||1}>
         <span style={{width:100*model.socialReached/Math.max(1,model.totalStudents)+"%"}}/>
       </div>
       <p>480 horas acumuladas</p>
     </article>
     <article className="ds-milestone-summary-card ds-milestone-professional">
       <span>Hito 2 · Prácticas profesionales</span>
       <strong>{number(model.professionalReached)} <small>/ {number(model.totalStudents)}</small></strong>
       <div className="ds-milestone-progress" role="progressbar"
         aria-label="Alumnos que alcanzaron las 840 horas"
         aria-valuenow={model.professionalReached} aria-valuemin={0}
         aria-valuemax={model.totalStudents||1}>
         <span style={{width:100*model.professionalReached/Math.max(1,model.totalStudents)+"%"}}/>
       </div>
       <p>840 horas en total · 480 + 360 adicionales</p>
     </article>
   </div>
   <div className="ds-milestones-metadata">
     <span>{number(model.socialOnly)} completaron solo el primer hito</span>
     <span>{number(model.studentsWithData)} con jornadas registradas</span>
   </div>
   <section className="ds-panel ds-milestones-list">
     <div className="ds-panel-head">
       <h2>Seguimiento por alumno</h2>
       <span className="ds-lifetime-caption">Ordenados por horas acumuladas</span>
     </div>
     {model.students.length?model.students.map(row=>{
       const status=row.professionalReached?"840 h alcanzadas":
         row.socialReached?"480 h alcanzadas":row.hasData?"En progreso":"Sin registros";
       return <article className="ds-milestone-person" key={row.id}>
         <div className="ds-milestone-person-top">
           <div className="ds-milestone-person-identity">
             {onReportStudent?<button type="button"
               className="ds-milestone-person-name"
               onClick={()=>onReportStudent(row.id)}>{row.name}</button>
              :<strong>{row.name}</strong>}
             <span>{row.company||"Sin empresa"}{row.specialty?" · "+row.specialty:""}</span>
           </div>
           <div className="ds-milestone-person-hours">
             <strong>{asHours(row.hours)}</strong>
             <span className={"ds-milestone-stage"+(row.professionalReached?" done":row.socialReached?" social":"")}>{status}</span>
           </div>
         </div>
         <div className="ds-milestone-progress" role="progressbar"
           aria-label={"Avance de "+row.name+" hacia "+row.nextTargetHours+" horas"}
           aria-valuenow={Math.min(row.hours,row.nextTargetHours)} aria-valuemin={0}
           aria-valuemax={row.nextTargetHours}>
           <span style={{width:row.progressPercent+"%"}}/>
         </div>
         <div className="ds-milestone-person-bottom">
           <span>{row.professionalReached?"Ambos hitos completados":
             row.socialReached?asHours(row.professionalRemainingHours)+" para el segundo hito":
             asHours(row.socialRemainingHours)+" para el primer hito"}</span>
           <span>{number(row.weeksWithData)} semanas con datos</span>
         </div>
       </article>;
     }):<p className="ds-empty">No hay alumnos para esta selección.</p>}
   </section>
   <p className="ds-milestone-footnote">Los hitos son referencias de horas registradas; su reconocimiento oficial depende de las disposiciones y validaciones del plantel. El cálculo histórico no cambia al seleccionar una semana o mes, pero sí respeta los filtros de especialidad y empresa.</p>
 </section>;
}
