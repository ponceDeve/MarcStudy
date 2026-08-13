export default function PomodoroAlarmModal({ open, label, onIrAPomodoro }) {
  if (!open) return null;

  return (
    <div className="welcome-overlay">
      <style>{`
        .welcome-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: var(--overlay-strong);
          z-index: 9999;
        }
        .pomo-alarm-card {
          width: min(340px, 90vw);
          background: var(--surface);
          border: 2px solid var(--accent);
          border-radius: 16px;
          padding: 30px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 14px;
        }
        .pomo-alarm-icon {
          font-size: 40px;
          color: var(--accent);
        }
        .pomo-alarm-titulo {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--ink);
        }
        .pomo-alarm-label {
          margin: 0;
          color: var(--ink-soft);
          font-size: 0.9rem;
        }
        .pomo-alarm-btn {
          width: 100%;
          padding: 14px;
          border-radius: var(--radius-md);
          font-size: 0.95rem;
        }
      `}</style>

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
