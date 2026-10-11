export default function PomodoroAlarmModal({ open, label, onIrAPomodoro, onClose }) {
  return (
    <div className={`pomo-alarm-overlay ${open ? "" : "is-closed"}`} aria-hidden={!open}>
      <div className="pomo-alarm-card">
        {onClose && (
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <i className="bi bi-x"></i>
          </button>
        )}
        <i className="fa-solid fa-bell pomo-alarm-icon" />
        <h2 className="pomo-alarm-titulo">¡Se acabó el tiempo!</h2>
        {label && <p className="pomo-alarm-label">{label}</p>}
        <button className="pomo-alarm-btn btn-primary" onClick={onIrAPomodoro}>
          Ir a Pomodoro
        </button>
        {onClose && (
          <button className="pomo-alarm-btn pomo-alarm-btn--omitir" onClick={onClose}>
            Omitir
          </button>
        )}
      </div>
    </div>
  );
}
