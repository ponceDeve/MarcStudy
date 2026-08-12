import { useState } from "react";

// Cada paso del tutorial: ícono + título + texto corto.
// El último paso ("nombre") es especial: en vez de ícono, pide el nombre.
const PASOS = [
  {
    icon: "fa-solid fa-graduation-cap",
    titulo: "¡Bienvenido a Mi Estudio!",
    texto: "Antes de empezar, un repaso rápido de cómo se usa. Son varios pasos cortos.",
  },
  {
    icon: "fa-solid fa-sync-alt",
    titulo: "El botón del centro",
    texto: "Ese botón redondo de en medio voltea la tarjeta: pasa de la teoría a la pregunta.",
  },
  {
    icon: "fa-solid fa-caret-right",
    titulo: "Avanzar y retroceder",
    texto: "Las flechas de los costados mueven la tarjeta. La de avanzar se activa recién cuando respondes bien.",
  },
  {
    icon: "fa-solid fa-rotate-left",
    titulo: "Si te equivocas",
    texto: "Puedes intentarlo de nuevo las veces que quieras. No se te muestra la respuesta correcta hasta que aciertes.",
  },
  {
    icon: "fa-solid fa-flag-checkered",
    titulo: "Modo niveles",
    texto: "Al terminar la teoría entras al examen por niveles. Tienes vidas: si llegan a 0, se reinicia el progreso del tema.",
  },
  {
    icon: "fa-solid fa-magnifying-glass",
    titulo: "Buscador",
    texto: "La lupa te lleva directo a cualquier tema o curso, sin salir de donde estás.",
  },
  {
    icon: "fa-solid fa-clock",
    titulo: "Mini cronómetro",
    texto: "Un cronómetro rápido que puedes abrir sin salir del tema, para controlar tu tiempo de estudio.",
  },
  {
    icon: "fa-solid fa-calendar-alt",
    titulo: "Pomodoro",
    texto: "Te lleva al Pomodoro de este curso: sesiones de estudio con descansos programados.",
  },
  {
    icon: "fa-solid fa-brain",
    titulo: "Repaso",
    texto: "Aquí ves los repasos programados por repetición espaciada, para que no se te olvide lo que ya estudiaste.",
  },
  { nombre: true },
];

export default function WelcomeModal({ open, onSubmit }) {
  const [paso, setPaso] = useState(0);
  const [nombre, setNombre] = useState("");

  if (!open) return null;

  const total = PASOS.length;
  const actual = PASOS[paso];

  function siguiente() {
    if (actual.nombre) {
      const limpio = nombre.trim();
      if (!limpio) return;
      onSubmit(limpio);
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
          background: rgba(4, 8, 12, 0.85);
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
        .welcome-input {
          width: 100%;
          box-sizing: border-box;
          padding: 12px 14px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-strong);
          background: var(--bg);
          color: var(--ink);
          font-size: 1rem;
          text-align: center;
        }
        .welcome-input:focus {
          outline: none;
          border-color: var(--primary);
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
        .welcome-btn.is-next:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>

      <div className="welcome-card">
        <div className="welcome-dots">
          {PASOS.map((_, i) => (
            <div key={i} className={`welcome-dot ${i === paso ? "is-active" : ""}`} />
          ))}
        </div>

        {actual.nombre ? (
          <>
            <div className="welcome-icon-ring">
              <i className="fa-solid fa-user" />
            </div>
            <h2 className="welcome-titulo">¿Cómo te llamas?</h2>
            <p className="welcome-texto">Lo usamos para saludarte y en tus resultados.</p>
            <input
              type="text"
              name="name"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="words"
              spellCheck={false}
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && siguiente()}
              placeholder="Tu nombre..."
              className="welcome-input"
            />
          </>
        ) : (
          <>
            <div className="welcome-icon-ring">
              <i className={actual.icon} />
            </div>
            <h2 className="welcome-titulo">{actual.titulo}</h2>
            <p className="welcome-texto">{actual.texto}</p>
          </>
        )}

        <div className="welcome-nav">
          {paso > 0 && (
            <button className="welcome-btn is-back" onClick={anterior}>
              <i className="fa-solid fa-caret-left" />
            </button>
          )}
          <button
            className="welcome-btn is-next btn-primary"
            onClick={siguiente}
            disabled={actual.nombre && !nombre.trim()}
          >
            {actual.nombre ? "Empezar a estudiar" : "Siguiente"}
          </button>
        </div>
      </div>
    </div>
  );
}