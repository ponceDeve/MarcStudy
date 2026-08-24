export default function Hud({ current, total, correct, wrong, vidas }) {
  return (
    <div className="hud">
      <span>
        Avance: <span className="hud__progress-value">{current}/{total}</span>
      </span>
      <span className="hud__correct">
        <i className="fas fa-check" /> {correct}
      </span>
      <span className="hud__wrong">
        <i className="fas fa-times" /> {wrong}
      </span>
      {typeof vidas === "number" && (
        <span className="hud__vidas">
          {[...Array(5)].map((_, i) => (
            <i
              key={i}
              className={i < vidas ? "fa-solid fa-heart" : "fa-regular fa-heart hud__vida-icon--lost"}
            />
          ))}
        </span>
      )}
    </div>
  );
}