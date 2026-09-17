import { useState } from "react";
import questions from "../data/faq.json";
import { VERSION, RELEASE } from "../domain/records.js";
const normalize = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export default function Faq() {
  const [query, setQuery] = useState("");
  const items = questions.filter((q) =>
    normalize(q.title + " " + q.keywords + " " + q.html).includes(
      normalize(query),
    ),
  );
  return (
    <div className="shell faq">
      <header className="topbar">
        <a className="brand" href="../">
          <img src="../Assets/Edu.png" alt="Educación" />
          <span>Bitácora Dual</span>
        </a>
        <a className="button" href="../">
          Volver al generador
        </a>
      </header>
      <div className="intro">
        <div>
          <p className="version">
            Beta {VERSION} · {RELEASE}
          </p>
          <h1>Resuelve tus dudas.</h1>
          <p>Ayuda práctica para completar y entregar tu bitácora.</p>
        </div>
      </div>
      <label className="field">
        Buscar una pregunta
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Firmas, horarios, respaldo…"
        />
      </label>
      <p role="status">{items.length} preguntas</p>
      <main>
        {items.map((q) => (
          <details key={q.title}>
            <summary>{q.title}</summary>
            <div
              className="answer"
              dangerouslySetInnerHTML={{ __html: q.html }}
            />
          </details>
        ))}
        {!items.length && (
          <p className="empty">
            No encontramos esa pregunta. Prueba con otra palabra.
          </p>
        )}
      </main>
      <section className="note">
        <h2>Anti-fool upgrate</h2>
        <p>
          React, catálogos editables, validaciones por campo, notificaciones
          Sileo y recuperación de datos de la beta anterior.
        </p>
        <a href="https://github.com/gio-canto/generador-bitacora-dual_2026/blob/main/CHANGELOG.md">
          Consultar todas las notas de versión
        </a>
      </section>
    </div>
  );
}
