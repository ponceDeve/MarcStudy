export default function ModoEstudioModal({ open, onIrAPomodoro, onCerrar }) {
  return (
    <div className={`modo-estudio-overlay ${open ? "" : "is-closed"}`} aria-hidden={!open}>
      <div className="modo-estudio-card">
        <h2 className="modo-estudio-titulo">Este tema toma tiempo</h2>
        <p className="modo-estudio-texto">
          Contrólalo con Pomodoro.
        </p>
        <div className="modo-estudio-nav">
          <button className="modo-estudio-btn is-omitir" onClick={onCerrar}>
            Ahora no
          </button>
          <button className="modo-estudio-btn is-mostrar btn-primary" onClick={onIrAPomodoro}>
            Ir a Pomodoro
          </button>
        </div>
      </div>
    </div>
  );
}