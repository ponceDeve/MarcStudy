// Hud.jsx
//
// HUD del videojuego: avance + estrellas + vidas + bandera, todo en
// la misma fila. Las estrellas solo aparecen si se pasa la prop
// "estrellas" (número 0..3); sin ella el HUD queda como antes.
//
// EstrellasHud también se usa en el HUD del Examen (TemaExamenView).
export function EstrellasHud({ estrellas = 0 }) {
  return (
    <span
      className="hud__estrellas"
      role="img"
      aria-label={`${estrellas} de 3 estrellas`}
    >
      {[1, 2, 3].map((n) => (
        <i
          key={n}
          className={`${
            n <= estrellas ? "fa-solid" : "fa-regular"
          } fa-star hud__estrella ${
            n <= estrellas ? "is-activa" : ""
          }`}
        />
      ))}
    </span>
  );
}
export default function Hud({
  current,
  total,
  correct,
  wrong,
  vidas,
  estrellas,
  onRendirse,
}) {
  const conEstrellas = typeof estrellas === "number";
  return (
    <div className="hud">
      <span className="hud-avances">
        <span className="hud__progress-value">
          {current}/{total}
        </span>
      </span>
      {conEstrellas && <EstrellasHud estrellas={estrellas} />}
      {typeof vidas === "number" && (
        <span className="hud__vidas">
          {[...Array(5)].map((_, i) => (
            <i
              key={i}
              className={
                i < vidas
                  ? "fa-solid fa-heart"
                  : "fa-solid fa-heart-crack hud__vida-icon--lost"
              }
            />
          ))}
        </span>
      )}
      {onRendirse && (
        <button
          type="button"
          onClick={onRendirse}
          title="Rendirse"
          aria-label="Rendirse"
          className="hud__rendirse-btn"
        >
          <i className="fas fa-flag" />
        </button>
      )}
    </div>
  );
}