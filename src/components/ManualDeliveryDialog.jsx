import {useState} from "react";
import { MANUAL_DAYS, blankManualDays, manualDaysFromStatistics, reasonsForStatus, buildManualStatistics } from "../services/manual-statistics.js";
export default function ManualDeliveryDialog({student,week,previous,initialStatus,onCancel,onSave}){
  const [status,setStatus]=useState(initialStatus || (previous?.status==="entregado_tarde"?"entregado_tarde":"entregado"));
  const [usageSource,setUsageSource]=useState(previous?.usageSource || (previous?.matrixVersion>0 ? "generator" : ""));
  const [days,setDays]=useState(()=>previous?.statistics?manualDaysFromStatistics(previous.statistics):blankManualDays());
  const [error,setError]=useState("");
  const update=(index,change)=>setDays(current=>current.map((entry,i)=>i===index?{...entry,...change}:entry));
  function save(event){
    event.preventDefault();
    try {
      if(!usageSource)throw Error("Selecciona el método de elaboración.");
      const statistics=buildManualStatistics(days);
      onSave({status,usageSource,statistics});
    } catch(err){setError(err.message);}
  }
  return <div className="delivery-manual-overlay" role="presentation">
    <section className="delivery-manual-card" role="dialog" aria-modal="true" aria-label="Registro manual">
      <div className="delivery-manual-heading">
        <div><span className="delivery-kicker">Registro manual</span><h2>{student.name}</h2><p>{week.label}</p></div>
        <button type="button" className="btn" onClick={onCancel}>Cerrar</button>
      </div>
      <form onSubmit={save}>
        <div className="delivery-manual-main">
          <label className="delivery-field"><span>Entrega</span><select value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="entregado">A tiempo</option><option value="entregado_tarde">A destiempo</option>
          </select></label>
          <label className="delivery-field"><span>Método de elaboración</span>
            <select required value={usageSource} onChange={e=>setUsageSource(e.target.value)}>
              <option value="">Selecciona</option>
              <option value="generator">Generador de Bitácora Dual</option>
              <option value="other">Otro método</option>
            </select>
          </label>
        </div>
        <div className="delivery-manual-days">
          {MANUAL_DAYS.map((day,index)=><div className="delivery-manual-day" key={day}>
            <strong>{day}</strong>
            <label className="delivery-field"><span>Estado</span>
              <select value={days[index].status} onChange={e=>update(index,{status:e.target.value,hours:"",reasonCode:"0"})}>
                <option value="">Sin capturar</option>
                <option value="laboral">Con labores</option>
                <option value="falta">Falta</option>
                <option value="sin_labores">Sin labores</option>
                <option value="inhabil">Día inhábil</option>
              </select>
            </label>
            {days[index].status==="laboral"&&<label className="delivery-field"><span>Horas</span>
              <input type="number" min="0.0166667" max="24" step="any" inputMode="decimal" value={days[index].hours} onChange={e=>update(index,{hours:e.target.value})} placeholder="4"/>
            </label>}
            {["falta","sin_labores"].includes(days[index].status)&&<label className="delivery-field"><span>Causa</span>
              <select value={days[index].reasonCode} onChange={e=>update(index,{reasonCode:e.target.value})}>
                <option value="0">Sin clasificar</option>
                {reasonsForStatus(days[index].status).map(r=><option key={r.id} value={String(r.code)}>{r.label}</option>)}
                <option value="63">Otro motivo</option>
              </select>
            </label>}
          </div>)}
        </div>
        {error&&<p role="alert" className="ds-error">{error}</p>}
        <div className="delivery-manual-actions">
          <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
          <button type="submit" className="btn primary">Guardar registro</button>
        </div>
      </form>
    </section>
  </div>;
}
