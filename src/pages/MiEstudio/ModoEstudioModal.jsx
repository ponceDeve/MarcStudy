export default function ModoEstudioModal({ open, onElegir }) {
  return (
    <div className={`modo-estudio-overlay ${open ? "" : "is-closed"}`} aria-hidden={!open}>
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