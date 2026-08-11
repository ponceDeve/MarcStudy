import { useState, useEffect } from "react";
import Modal from "./Modal";

export default function TemaModal({ open, subject, day, onGuardar, onOmitir }) {
  const [tema, setTema] = useState("");

  useEffect(() => {
    if (open) setTema("");
  }, [open]);

  return (
    <Modal open={open} onClose={onOmitir}>
      <button onClick={onOmitir} className="modal-close-x" aria-label="Cerrar">
        <i className="fa-solid fa-times" />
      </button>
      <h3 className="tema-modal-title">¿Qué tema viste?</h3>
      <p className="tema-modal-subtitle">
        {subject} {day ? `· ${day}` : ""}
      </p>
      <input autoComplete="off"
        autoFocus
        value={tema}
        onChange={(e) => setTema(e.target.value)}
        type="text"
        placeholder="Ej: Fracciones, Segunda Guerra Mundial..."
        className="tema-modal-input"
      />
      <div className="tema-modal-actions">
        <button onClick={() => onOmitir()} className="btn-outline">
          Omitir
        </button>
        <button onClick={() => onGuardar(tema.trim())} className="btn-solid">
          Guardar
        </button>
      </div>
    </Modal>
  );
}