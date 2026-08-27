import { useState } from "react";

// Antes este modal incluía un tutorial fijo de 9 pasos explicando cada
// función de Mi Estudio. Esa explicación se reemplazó por el asistente
// de ayuda global (el ícono de robot, disponible en toda la app), así
// que aquí solo queda lo que sigue siendo necesario de verdad: pedirle
// su nombre al usuario la primera vez que entra.
export default function WelcomeModal({ open, onSubmit }) {
  const [nombre, setNombre] = useState("");

  function confirmar() {
    const limpio = nombre.trim();
    if (!limpio) return;
    onSubmit(limpio);
  }

  return (
    <div
      className={`welcome-overlay welcome-overlay--dark ${
        open ? "" : "is-closed"
      }`}
      aria-hidden={!open}
    >
      <div className="welcome-card">
        <div className="welcome-icon-ring">
          <i className="fa-solid fa-graduation-cap" />
        </div>

        <h2 className="welcome-titulo">¡Bienvenido a Mi Estudio!</h2>

        <p className="welcome-texto">
          Antes de empezar, ¿cómo te llamas? Lo usamos para saludarte y en
          tus resultados.
        </p>

        <input
          type="text"
          name="apodo-usuario"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck={false}
          autoFocus
          maxLength={16}
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

        <p className="welcome-texto welcome-texto--sutil">
          <i className="fa-solid fa-robot" /> ¿Tienes dudas sobre cómo
          funciona la app? Toca el ícono del asistente, abajo, cuando
          quieras.
        </p>

        <div className="welcome-nav">
          <button
            className="welcome-btn is-next btn-primary"
            onClick={confirmar}
            disabled={!nombre.trim()}
          >
            Empezar a estudiar
          </button>
        </div>
      </div>
    </div>
  );
}
