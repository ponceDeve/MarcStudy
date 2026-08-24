import { useState } from "react";

// Versión genérica del tutorial paso a paso de Mi Estudio, sin el paso
// de pedir nombre (ya se pide una sola vez, allá). Se usa en Pomodoro
// y Repaso, cada uno con sus propios pasos y su propia clave de
// localStorage (pasada por el padre).
export default function StepsWelcomeModal({ open, pasos, onFinish, labelFinal = "Entendido" }) {
  const [paso, setPaso] = useState(0);

  if (!open) return null;

  const total = pasos.length;
  const actual = pasos[paso];
  const esUltimo = paso === total - 1;

  function siguiente() {
    if (esUltimo) {
      onFinish();
      return;
    }
    setPaso((p) => Math.min(p + 1, total - 1));
  }

  function anterior() {
    setPaso((p) => Math.max(p - 1, 0));
  }

  return (
    <div className="welcome-overlay">
      <div className="welcome-card">
        <div className="welcome-dots">
          {pasos.map((_, i) => (
            <div key={i} className={`welcome-dot ${i === paso ? "is-active" : ""}`} />
          ))}
        </div>

        <div className="welcome-icon-ring">
          <i className={actual.icon} />
        </div>
        <h2 className="welcome-titulo">{actual.titulo}</h2>
        <p className="welcome-texto">{actual.texto}</p>

        <div className="welcome-nav">
          {paso > 0 && (
            <button className="welcome-btn is-back" onClick={anterior}>
              <i className="fa-solid fa-caret-left" />
            </button>
          )}
          <button className="welcome-btn is-next btn-primary" onClick={siguiente}>
            {esUltimo ? labelFinal : "Siguiente"}
          </button>
        </div>
      </div>
    </div>
  );
}