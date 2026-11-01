import { useEffect, useRef, useState } from "react";
import { Bell, CheckCircle, WarningCircle, X } from "@phosphor-icons/react";
import { pendingReasonReviews, reasonsForReview } from "../services/reason-reviews.js";
import "../delivery-reason-inbox.css";

function ReviewItem({ item, onReview }) {
  const [selected, setSelected] = useState("63");
  const reasons = reasonsForReview(item.status);
  return <li className="dual-inbox-item">
    <div className="dual-inbox-entry-heading">
      <strong>{item.student}</strong>
      <span>{item.week} · {item.day}</span>
    </div>
    <p>{item.status === "falta" ? "Falta" : "Sin labores"} · Otro motivo</p>
    <label>
      <span>Clasificación después de revisar la bitácora</span>
      <select value={selected} onChange={event=>setSelected(event.target.value)}
        aria-label={"Clasificar motivo de " + item.student + " · " + item.day}>
        <option value="63">Conservar como Otro motivo</option>
        {reasons.map(reason=><option key={reason.id} value={String(reason.code)}>{reason.label}</option>)}
      </select>
    </label>
    <button type="button" className="btn primary"
      onClick={()=>onReview({...item,code:Number(selected)})}>
      {selected === "63" ? "Revisado: conservar Otro motivo" : "Guardar clasificación"}
    </button>
  </li>;
}

export default function ReasonInbox({ state, backupPending = false, onReview, onBackup }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef(null), panel = useRef(null);
  const reviews = pendingReasonReviews(state);
  const total = reviews.length + (backupPending ? 1 : 0);
  useEffect(()=>{
    if (!open) return;
    const keydown = event=>{if(event.key === "Escape")setOpen(false);};
    document.addEventListener("keydown", keydown);
    panel.current?.focus({preventScroll:true});
    return ()=>document.removeEventListener("keydown",keydown);
  },[open]);
  return <>
    <button ref={trigger} type="button" className="btn dual-inbox-trigger"
      aria-label={"Avisos internos" + (total ? ": " + total + " pendiente(s)" : "")}
      aria-haspopup="dialog" aria-expanded={open}
      title="Avisos internos" onClick={()=>setOpen(value=>!value)}>
      <Bell size={19} aria-hidden="true"/>
      {total > 0 && <span className="dual-inbox-counter">{total > 99 ? "99+" : total}</span>}
    </button>
    {open && <div className="dual-inbox-backdrop" onMouseDown={event=>{
      if(event.target === event.currentTarget) {setOpen(false);trigger.current?.focus();}
    }}>
      <section className="dual-inbox-panel" role="dialog" aria-modal="true"
        aria-label="Avisos internos" ref={panel} tabIndex={-1}>
        <header className="dual-inbox-header">
          <div><span className="delivery-kicker">Registro Dual</span><h2>Avisos internos</h2></div>
          <button type="button" className="btn" onClick={()=>{setOpen(false);trigger.current?.focus();}}
            aria-label="Cerrar avisos"><X size={18}/></button>
        </header>
        <div className="dual-inbox-content">
          {backupPending && <div className="dual-inbox-backup">
            <WarningCircle size={21}/><div><strong>Respaldo pendiente</strong>
            <p>Descarga una copia JSON del registro para conservar tus cambios.</p>
            <button type="button" className="btn" onClick={onBackup}>Guardar respaldo</button></div>
          </div>}
          {reviews.length ? <>
            <p className="dual-inbox-explanation">
              {reviews.length} jornada{reviews.length === 1 ? "" : "s"} por revisar.
              El Data Matrix conserva el código «Otro motivo», pero no el texto de la justificación.
              Consulta la bitácora antes de cambiar su clasificación.
            </p>
            <ul className="dual-inbox-list">
              {reviews.map(item=><ReviewItem key={item.key} item={item} onReview={onReview}/>)}
            </ul>
          </> : <div className="dual-inbox-empty" role="status">
            <CheckCircle size={26}/><p>No hay motivos «Otros» pendientes de revisión.</p>
          </div>}
        </div>
      </section>
    </div>}
  </>;
}
