export default function PomodoroAlarmModal({ open, label, onIrAPomodoro }) {
  if (!open) return null;

  return (
    <div className="welcome-overlay">
      <style>{`
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
        .pomo-alarm-btn {
          width: 100%;
          padding: 14px;
          border-radius: var(--radius-md);
          border: none;
          background: var(--primary);
          color: #fff;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
        }
      `}</style>

      <div className="pomo-alarm-card">
        <i className="fa-solid fa-bell pomo-alarm-icon" />
        <h2 className="pomo-alarm-titulo">¡Se acabó el tiempo!</h2>
        {label && <p style={{ margin: 0, color: "var(--ink-soft)", fontSize: "0.9rem" }}>{label}</p>}
        <button className="pomo-alarm-btn" onClick={onIrAPomodoro}>
          Ir a Pomodoro
        </button>
      </div>
    </div>
  );
}