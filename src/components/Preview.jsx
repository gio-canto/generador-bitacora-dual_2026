import { useEffect, useRef, useState } from "react";
import { drawPdfPage } from "../services/pdf.js";
export default function Preview({ record, logo }) {
  const ref = useRef();
  const [zoom, setZoom] = useState(false);
  useEffect(() => {
    drawPdfPage(ref.current, 4, record, logo);
  }, [record, logo]);
  return (
    <>
      <div className="section-heading">
        <h3>Vista previa · A4 horizontal</h3>
        <button onClick={() => setZoom(!zoom)} aria-pressed={zoom}>
          {zoom ? "Ajustar" : "Ampliar"}
        </button>
      </div>
      <div
        className={`preview ${zoom ? "zoom" : ""}`}
        tabIndex={0}
        aria-label="Vista previa del PDF, desplaza para revisar el documento ampliado"
      >
        <canvas
          ref={ref}
          role="img"
          aria-label={`Bitácora de ${record.student || "alumno"}, ${record.entries.length} jornadas`}
        />
      </div>
    </>
  );
}
