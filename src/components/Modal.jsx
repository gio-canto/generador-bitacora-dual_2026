import { useEffect, useRef } from "react";
export default function Modal({ title, onClose, children }) {
  const ref = useRef();
  useEffect(() => {
    const previous = document.activeElement,
      d = ref.current;
    d.showModal();
    return () => {
      d.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-labelledby="dialog-title"
    >
      <div className="modal-head">
        <h2 id="dialog-title">{title}</h2>
        <button onClick={onClose} aria-label="Cerrar ventana">
          Cerrar
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
