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
      <style>{`
        .welcome-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--overlay-strong);
        }
        .welcome-card {
          width: min(360px, 90vw);
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 32px 26px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 16px;
        }
        .welcome-dots {
          display: flex;
          gap: 6px;
          margin-bottom: 4px;
        }
        .welcome-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--border-strong);
        }
        .welcome-dot.is-active {
          width: 16px;
          background: var(--primary);
          border-radius: 3px;
        }
        .welcome-icon-ring {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 26px;
          color: var(--primary);
          background: var(--primary-bg);
        }
        .welcome-titulo {
          margin: 0;
          font-size: 1.1rem;
          color: var(--ink);
          font-weight: 700;
        }
        .welcome-texto {
          margin: 0;
          color: var(--ink-soft);
          font-size: 0.92rem;
          line-height: 1.55;
        }
        .welcome-nav {
          display: flex;
          gap: 10px;
          width: 100%;
          margin-top: 4px;
        }
        .welcome-btn {
          flex: 1;
          padding: 13px;
          border-radius: var(--radius-md);
          border: none;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
        }
        .welcome-btn.is-back {
          flex: 0 0 auto;
          padding: 13px 18px;
          background: var(--surface-alt);
          color: var(--ink-soft);
        }
        .welcome-btn.is-next {
          /* background y color ahora vienen de .btn-primary (styles/_base.scss) */
        }
      `}</style>

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