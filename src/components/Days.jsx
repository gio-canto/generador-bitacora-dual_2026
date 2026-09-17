import Field from "./Field.jsx";
import { withStatus } from "../domain/records.js";
export default function Days({ record, patch, errors, generate }) {
  const edit = (i, k, v) =>
    patch(
      "entries",
      record.entries.map((e, j) =>
        j === i ? (k === "status" ? withStatus(e, v) : { ...e, [k]: v }) : e,
      ),
    );
  return (
    <>
      <div className="fields three">
        <Field
          label="Fecha de referencia"
          type="date"
          value={record.weekDate}
          onChange={(v) => patch("weekDate", v)}
          hint="Se generan martes a viernes de esa semana."
        />
        <Field
          label="Entrada habitual"
          type="time"
          value={record.defaultStart}
          onChange={(v) => patch("defaultStart", v)}
        />
        <Field
          label="Salida habitual"
          type="time"
          value={record.defaultEnd}
          onChange={(v) => patch("defaultEnd", v)}
        />
      </div>
      <button onClick={generate}>
        {record.entries.length ? "Cambiar semana" : "Generar semana"}
      </button>
      {errors.entries && (
        <p className="error" role="alert">
          {errors.entries}
        </p>
      )}
      {!record.entries.length && (
        <p className="empty">
          Elige la semana para empezar a registrar tus actividades.
        </p>
      )}
      {record.entries.map((e, i) => (
        <section className="day" key={i}>
          <div className="section-heading">
            <h3>Jornada {i + 1}</h3>
            <span>{e.date}</span>
          </div>
          <div className="fields">
            <Field
              label="Fecha"
              type="date"
              value={e.date}
              onChange={(v) => edit(i, "date", v)}
              error={errors[`entries.${i}.date`]}
            />
            <Field
              label="Tipo de jornada"
              value={e.status}
              options={[
                { value: "laboral", label: "Con labores" },
                { value: "sin_labores", label: "Sin labores" },
                { value: "inhabil", label: "Día inhábil" },
                { value: "falta", label: "Falta" },
              ]}
              onChange={(v) => edit(i, "status", v)}
            />
            {e.status === "laboral" ? (
              <>
                <Field
                  label="Entrada"
                  type="time"
                  value={e.start}
                  onChange={(v) => edit(i, "start", v)}
                  error={errors[`entries.${i}.start`]}
                />
                <Field
                  label="Salida"
                  type="time"
                  value={e.end}
                  onChange={(v) => edit(i, "end", v)}
                  error={errors[`entries.${i}.end`]}
                />
                <Field
                  className="full"
                  label="Área o departamento"
                  value={e.area}
                  onChange={(v) => edit(i, "area", v)}
                  maxLength={150}
                  error={errors[`entries.${i}.area`]}
                />
              </>
            ) : (
              <p className="note full">
                {e.status === "falta"
                  ? "Registra una falta solo si no asististe. Explica el motivo y consulta cómo justificarla con tu plantel."
                  : e.status === "sin_labores"
                    ? "Úsalo cuando la empresa no tuvo actividades. Explica el motivo."
                    : "Verifica que la fecha sea inhábil en el calendario escolar vigente. La justificación se incluye automáticamente."}
              </p>
            )}
            <Field
              className="full"
              label={
                e.status === "laboral"
                  ? "Actividades realizadas"
                  : "Justificación"
              }
              multiline
              value={e.activity}
              readOnly={e.status === "inhabil"}
              onChange={(v) => edit(i, "activity", v)}
              error={errors[`entries.${i}.activity`]}
              maxLength={900}
              hint={`${e.activity.length}/900 caracteres. ${e.status === "inhabil" ? "Texto automático." : "Describe qué hiciste y el resultado; admite **negritas** y listas."}`}
            />
          </div>
        </section>
      ))}
    </>
  );
}
