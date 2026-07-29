export default function ModoEstudioModal({ open, onElegir }) {
  if (!open) return null;

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
          background: rgba(10, 14, 20, 0.55);
          backdrop-filter: blur(10px) saturate(140%);
          -webkit-backdrop-filter: blur(10px) saturate(140%);
        }
        .modo-estudio-card {
          width: min(340px, 90vw);
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 28px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 18px;
        }
        .modo-estudio-titulo {
          margin: 0;
          font-size: 1.1rem;
          color: var(--ink);
          font-weight: 700;
        }
        .modo-estudio-nav {
          display: flex;
          gap: 10px;
          width: 100%;
        }
        .modo-estudio-btn {
          flex: 1;
          padding: 14px;
          border-radius: var(--radius-md);
          border: none;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
        }
        .modo-estudio-btn.is-omitir {
          background: var(--surface-alt);
          color: var(--ink-soft);
          border: 1px solid var(--border-strong);
        }
      `}</style>

      <div className="modo-estudio-card">
        <h2 className="modo-estudio-titulo">¿Quieres ver la teoría?</h2>
        <div className="modo-estudio-nav">
          <button className="modo-estudio-btn is-omitir" onClick={() => onElegir("solo_preguntas")}>
            Omitir
          </button>
          <button className="modo-estudio-btn is-mostrar btn-primary" onClick={() => onElegir("completo")}>
            Mostrar
          </button>
        </div>
      </div>
    </div>
  );
}