import { useState, useEffect } from "react";

export default function EditarNombreModal({ open, nombreActual = "", onGuardar, onCancelar }) {
  const [nombre, setNombre] = useState(nombreActual);

  useEffect(() => {
    if (open) setNombre(nombreActual);
  }, [open, nombreActual]);

  if (!open) return null;

  function guardar() {
    const limpio = nombre.trim();
    if (!limpio) return;
    onGuardar(limpio);
  }

  return (
    <div className="welcome-overlay editar-nombre-overlay">
      <div className="welcome-card editar-nombre-card">
        <div className="welcome-icon-ring">
          <i className="fa-solid fa-user" />
        </div>
        <h2 className="welcome-titulo">Editar nombre</h2>
        <input
          type="text"
          name="apodo-usuario"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck={false}
          autoFocus
          maxLength={30}
          value={nombre}
          onChange={(e) => {
            const valor = e.target.value
              .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, "")
              .toUpperCase();

            setNombre(valor);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") guardar();
          }}
          placeholder="TU NOMBRE..."
          className="welcome-input"
        />
        <div className="welcome-nav">
          <button className="welcome-btn is-back" onClick={onCancelar}>
            Cancelar
          </button>
          <button
            className="welcome-btn is-next btn-primary"
            onClick={guardar}
            disabled={!nombre.trim()}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}