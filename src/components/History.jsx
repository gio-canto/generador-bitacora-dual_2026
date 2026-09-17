import { useState } from "react";
import { titleOf } from "../domain/records.js";
export default function History({
  records,
  onOpen,
  onDuplicate,
  onDelete,
  onImport,
  onExport,
}) {
  const [query, setQuery] = useState("");
  return (
    <>
      <div className="actions">
        <button onClick={onExport}>Exportar respaldo</button>
        <label className="button">
          Importar respaldo
          <input
            className="visually-hidden"
            type="file"
            accept=".json,application/json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImport(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <label className="field">
        Buscar en el historial
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nombre o fecha"
        />
      </label>
      {!records.length && (
        <p className="empty">
          Aún no hay bitácoras guardadas. Completa una y elige Guardar bitácora.
        </p>
      )}
      {records
        .filter((r) =>
          `${r.student} ${titleOf(r)}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        )
        .map((r) => (
          <article className="record" key={r.id}>
            <strong>{titleOf(r)}</strong>
            <p>{r.student}</p>
            <div className="actions">
              <button onClick={() => onOpen(r)}>Abrir</button>
              <button onClick={() => onDuplicate(r)}>Duplicar</button>
              <button className="danger" onClick={() => onDelete(r)}>
                Eliminar
              </button>
            </div>
          </article>
        ))}
    </>
  );
}
