export default function PomodoroAlarmModal({ open, label, onIrAPomodoro }) {
  return (
    <div className={`pomo-alarm-overlay ${open ? "" : "is-closed"}`} aria-hidden={!open}>
      <div className="pomo-alarm-card">
        <i className="fa-solid fa-bell pomo-alarm-icon" />
        <h2 className="pomo-alarm-titulo">¡Se acabó el tiempo!</h2>
        {label && <p className="pomo-alarm-label">{label}</p>}
        <button className="pomo-alarm-btn btn-primary" onClick={onIrAPomodoro}>
          Ir a Pomodoro
        </button>
      </div>
    </div>
  );
}
