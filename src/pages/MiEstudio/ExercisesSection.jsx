export default function ExercisesSection({
  examenPreguntas,
  onIniciarEjercicios,
  onModoEstudio,
}) {
  if (!examenPreguntas || examenPreguntas.length === 0) {
    return null;
  }

  return (
    <div className="exercises-section">
      <style>{`
        .exercises-section {
          margin-top: 40px;
          padding: 24px;
          background: linear-gradient(135deg, var(--surface) 0%, var(--surface-alt, rgba(255, 255, 255, 0.5)) 100%);
          border-radius: 16px;
          border: 2px dashed var(--accent, #4ecdc4);
        }

        .exercises-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          cursor: pointer;
        }

        .exercises-header-title {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--ink);
          flex: 1;
        }

        .exercises-header-icon {
          font-size: 24px;
          transition: transform 0.3s ease;
        }

        .exercises-header.expandido .exercises-header-icon {
          transform: rotate(180deg);
        }

        .exercises-description {
          margin: 0 0 16px 0;
          color: var(--ink-soft);
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .exercises-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 0;
          overflow: hidden;
          opacity: 0;
          transition: max-height 0.3s ease, opacity 0.3s ease;
        }

        .exercises-list.expandido {
          max-height: 500px;
          opacity: 1;
        }

        .exercises-list-item {
          padding: 12px;
          background: var(--surface);
          border-radius: 8px;
          border: 1px solid var(--border, #e0e0e0);
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s ease;
        }

        .exercises-list-item:hover {
          background: var(--surface-hover, #f5f5f5);
          border-color: var(--accent);
        }

        .exercises-list-number {
          min-width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent);
          color: white;
          border-radius: 50%;
          font-weight: 700;
          font-size: 0.85rem;
        }

        .exercises-list-text {
          flex: 1;
          font-size: 0.9rem;
          color: var(--ink-soft);
        }

        .exercises-buttons {
          display: flex;
          gap: 12px;
          margin-top: 20px;
          flex-wrap: wrap;
        }

        .exercises-btn {
          flex: 1;
          min-width: 150px;
          padding: 12px 16px;
          border-radius: 8px;
          border: none;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .exercises-btn-primary {
          background: var(--accent);
          color: white;
        }

        .exercises-btn-primary:hover {
          opacity: 0.9;
          transform: translateY(-2px);
        }

        .exercises-btn-secondary {
          background: var(--surface-alt, #f0f0f0);
          color: var(--ink);
          border: 1px solid var(--border, #ddd);
        }

        .exercises-btn-secondary:hover {
          background: var(--surface-hover, #e8e8e8);
        }

        .exercises-icon {
          font-size: 1.1em;
        }
      `}</style>

      <div className="exercises-header">
        <h3 className="exercises-header-title">
          📝 Práctica de Ejercicios
        </h3>
      </div>

      <p className="exercises-description">
        Practica con los ejercicios de este tema. Puedes responder uno por uno para reforzar tu comprensión de la teoría.
      </p>

      <div className="exercises-buttons">
        <button
          className="exercises-btn exercises-btn-primary"
          onClick={() => onModoEstudio("solo_preguntas")}
        >
          <span className="exercises-icon">▶</span>
          Comenzar Ejercicios
        </button>
      </div>
    </div>
  );
}