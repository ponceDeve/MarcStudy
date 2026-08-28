import { useEffect, useRef, useState } from "react";

async function comprimirFotoUsuario(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("El archivo no es una imagen"));
      return;
    }

    const lector = new FileReader();

    lector.onload = () => {
      const img = new Image();

      img.onload = () => {
        const MAX_SIZE = 500;

        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("No se pudo procesar la imagen"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };

      img.onerror = () => reject(new Error("No se pudo leer la imagen"));
      img.src = lector.result;
    };

    lector.onerror = () => reject(new Error("No se pudo leer el archivo"));
    lector.readAsDataURL(file);
  });
}

export default function WelcomeModal({
  open,
  onSubmit,
  nombreActual = "",
  fotoActual = null,
}) {
  const [nombre, setNombre] = useState(nombreActual);
  const [foto, setFoto] = useState(fotoActual);
  const inputFotoRef = useRef(null);

  useEffect(() => {
    if (open) {
      setNombre(nombreActual || "");
      setFoto(fotoActual || null);
    }
  }, [open, nombreActual, fotoActual]);

  function confirmar() {
    const limpio = nombre.trim();

    if (!limpio) return;

    onSubmit(limpio, foto);
  }

  async function elegirFoto(e) {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file) return;

    try {
      const comprimida = await comprimirFotoUsuario(file);
      setFoto(comprimida);
    } catch {
      // No cambiar la foto si ocurre un error.
    }
  }

  return (
    <div
      className={`welcome-overlay welcome-overlay--dark ${
        open ? "" : "is-closed"
      }`}
      aria-hidden={!open}
    >
      <div className="welcome-card">
        <button
          type="button"
          className="editar-nombre-foto"
          onClick={() => inputFotoRef.current?.click()}
          title="Agregar o cambiar foto"
          aria-label="Agregar o cambiar foto"
        >
          {foto ? (
            <img
              src={foto}
              alt="Tu foto"
              className="editar-nombre-foto__img"
            />
          ) : (
            <i className="fa-solid fa-user" />
          )}

          <span className="editar-nombre-foto__lapiz">
            <i className="fa-solid fa-pen" />
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

        <h2 className="welcome-titulo">
          ¿Cómo te llamas?
        </h2>

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
            if (e.key === "Enter") {
              confirmar();
            }
          }}
          placeholder="TU NOMBRE..."
          className="welcome-input"
        />

        <div className="welcome-nav">
          <button
            type="button"
            className="welcome-btn is-next btn-primary"
            onClick={confirmar}
            disabled={!nombre.trim()}
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}