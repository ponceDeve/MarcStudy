import { useState, useEffect, useRef } from "react";
import { comprimirFotoUsuario } from "../utils/imagen";

export default function EditarNombreModal({
  open,
  nombreActual = "",
  fotoActual = null,
  onGuardar,
  onCancelar,
}) {
  const [nombre, setNombre] = useState(nombreActual);
  const [foto, setFoto] = useState(fotoActual);
  const inputFotoRef = useRef(null);

  useEffect(() => {
    if (open) {
      setNombre(nombreActual);
      setFoto(fotoActual);
    }
  }, [open, nombreActual, fotoActual]);

  if (!open) return null;

  function guardar() {
    const limpio = nombre.trim();
    if (!limpio) return;
    onGuardar(limpio, foto);
  }

  async function elegirFoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const comprimida = await comprimirFotoUsuario(file);
      setFoto(comprimida);
    } catch {
      // Si falla la compresión (imagen corrupta, etc.), no se cambia la foto.
    }
  }

  return (
    <div className="welcome-overlay editar-nombre-overlay">
      <div className="welcome-card editar-nombre-card">
        <button
          type="button"
          className="editar-nombre-foto"
          onClick={() => inputFotoRef.current?.click()}
          title="Cambiar foto"
        >
          {foto ? (
            <img src={foto} alt="Tu foto" className="editar-nombre-foto__img" />
          ) : (
            <i className="fa-solid fa-user" />
          )}
          <span className="editar-nombre-foto__lapiz">
            <i className="fa-solid fa-plus" />
          </span>
        </button>

        <input
          ref={inputFotoRef}
          type="file"
          accept="image/*"
          onChange={elegirFoto}
          style={{ display: "none" }}
        />

        {foto && (
          <button
            type="button"
            className="editar-nombre-foto__quitar"
            onClick={() => setFoto(null)}
          >
            Quitar foto
          </button>
        )}

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
