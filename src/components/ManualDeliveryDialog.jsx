import { useEffect, useRef, useState } from "react";
import {
  MANUAL_DAYS, blankManualDays, manualDaysFromStatistics,
  reasonsForStatus, buildManualStatistics,
} from "../services/manual-statistics.js";

export default function ManualDeliveryDialog({
  student, week, previous, initialStatus, onCancel, onSave,
}) {
  const [status, setStatus] = useState(initialStatus ||
    (["entregado", "entregado_tarde", "no_entregado"].includes(previous?.status) ?
      previous.status : "entregado"));
  const [usageSource, setUsageSource] = useState(previous?.usageSource ||
    (previous?.matrixVersion > 0 ? "generator" : ""));
  const [days, setDays] = useState(() => previous?.statistics ?
    manualDaysFromStatistics(previous.statistics) : blankManualDays());
  const [error, setError] = useState("");
  const panelRef = useRef(null);
  const errorRef = useRef(null);
  const hasCaptured = days.some(day => day.status);

  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = event => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onCancel]);

  const changeDay = (index, change) => {
    setDays(current => current.map((entry, i) =>
      i === index ? { ...entry, ...change } : entry));
    setError("");
  };
  const clearDays = () => {
    if (!hasCaptured || window.confirm("¿Borrar las jornadas capturadas?")) {
      setDays(blankManualDays());
      setError("");
    }
  };

  const save = event => {
    event.preventDefault();
    try {
      if (status !== "no_entregado" && !usageSource)
        throw new Error("Selecciona cómo se elaboró la bitácora.");
      const statistics = buildManualStatistics(days);
      onSave({ status, usageSource: usageSource || "unknown", statistics });
    } catch (err) {
      setError(err?.message || "Revisa los datos de las jornadas.");
      requestAnimationFrame(() => errorRef.current?.scrollIntoView({block:"nearest"}));
    }
  };

  return (
    <div className="delivery-manual-overlay" role="presentation">
      <section
        ref={panelRef} tabIndex={-1}
        className="delivery-manual-card" role="dialog" aria-modal="true"
        aria-labelledby="delivery-manual-title"
      >
        <div className="delivery-manual-heading">
          <div>
            <span className="delivery-kicker">Registro de entrega</span>
            <h2 id="delivery-manual-title">{student.name}</h2>
            <p>{week.label} · {student.specialty}</p>
          </div>
          <button type="button" className="btn" onClick={onCancel} aria-label="Cerrar registro manual">
            Cerrar
          </button>
        </div>
        <form onSubmit={save} className="delivery-manual-form">
          <div className="delivery-manual-scroll">
            <div className="delivery-manual-main">
              <label className="delivery-field">
                <span>Estado de entrega</span>
                <select value={status} onChange={event=>setStatus(event.target.value)}>
                  <option value="entregado">Entregado a tiempo</option>
                  <option value="entregado_tarde">Entregado a destiempo</option>
                  <option value="no_entregado">No entregado</option>
                </select>
              </label>
              <label className="delivery-field">
                <span>Método de elaboración</span>
                <select value={usageSource} onChange={event=>setUsageSource(event.target.value)}
                  required={status !== "no_entregado"}>
                  <option value="">Sin identificar</option>
                  <option value="generator">Generador de Bitácora Dual</option>
                  <option value="other">Otro método</option>
                </select>
              </label>
            </div>
            <div className="delivery-manual-section-heading">
              <div>
                <h3>Horas y jornadas</h3>
                <p>Registra martes a viernes. Si todavía no tienes esos datos, puedes guardar la entrega sin completarlos.</p>
              </div>
              {hasCaptured && <button className="btn" type="button" onClick={clearDays}>Limpiar jornadas</button>}
            </div>
            <div className="delivery-manual-days">
              {MANUAL_DAYS.map((day, index) => (
                <div className="delivery-manual-day" key={day}>
                  <strong>{day}</strong>
                  <label className="delivery-field">
                    <span>Jornada</span>
                    <select value={days[index].status}
                      aria-label={day + " · jornada"}
                      onChange={event => changeDay(index, {
                        status:event.target.value, hours:"", reasonCode:"0",
                      })}>
                      <option value="">Sin capturar</option>
                      <option value="laboral">Con labores</option>
                      <option value="falta">Falta</option>
                      <option value="sin_labores">Sin labores</option>
                      <option value="inhabil">Día inhábil</option>
                    </select>
                  </label>
                  {days[index].status === "laboral" && (
                    <label className="delivery-field">
                      <span>Horas realizadas</span>
                      <input type="number" min="0.0166667" max="24" step="any"
                        inputMode="decimal" value={days[index].hours}
                        aria-label={day + " · horas"}
                        onChange={event=>changeDay(index, {hours:event.target.value})}
                        placeholder="4"/>
                    </label>
                  )}
                  {["falta","sin_labores"].includes(days[index].status) && (
                    <label className="delivery-field">
                      <span>Motivo</span>
                      <select value={days[index].reasonCode}
                        aria-label={day + " · motivo"}
                        onChange={event=>changeDay(index, {reasonCode:event.target.value})}>
                        <option value="0">Sin clasificar</option>
                        {reasonsForStatus(days[index].status).map(reason=>
                          <option key={reason.id} value={String(reason.code)}>{reason.label}</option>)}
                        <option value="63">Otro motivo</option>
                      </select>
                    </label>
                  )}
                </div>
              ))}
            </div>
            {status === "no_entregado" && (
              <p className="delivery-manual-note">Las jornadas se pueden registrar aunque la bitácora no haya sido entregada. Su estado seguirá siendo «No entregado».</p>
            )}
            {error && <p className="ds-error" role="alert" ref={errorRef}>{error}</p>}
          </div>
          <div className="delivery-manual-actions">
            <button type="button" className="btn" onClick={onCancel}>Cancelar</button>
            <button type="submit" className="btn primary">Guardar registro</button>
          </div>
        </form>
      </section>
    </div>
  );
}
