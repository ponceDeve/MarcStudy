import { useState } from "react";

export default function StepsWelcomeModal({
  open,
  pasos,
  onFinish,
  labelFinal = "Entendido",
}) {
  const [paso, setPaso] = useState(0);

  if (!open || !pasos?.length) return null;

  const actual = pasos[paso];
  const esUltimo = paso === pasos.length - 1;

  function siguiente() {
    if (esUltimo) {
      onFinish();
      return;
    }

    setPaso((p) => p + 1);
  }

  function anterior() {
    setPaso((p) => Math.max(p - 1, 0));
  }

  return (
    <div className="welcome-overlay">
      <div className="welcome-card">
        {actual.icon && (
          <div className="welcome-icon-ring">
            <i className={actual.icon} />
          </div>
        )}

        {actual.titulo && (
          <h2 className="welcome-titulo">{actual.titulo}</h2>
        )}

        {actual.texto && (
          <p className="welcome-texto">{actual.texto}</p>
        )}

        <div className="welcome-nav">
          {paso > 0 && (
            <button
              type="button"
              className="welcome-btn is-back"
              onClick={anterior}
            >
              <i className="fa-solid fa-caret-left" />
            </button>
          )}

          <button
            type="button"
            className="welcome-btn is-next btn-primary"
            onClick={siguiente}
          >
            {esUltimo ? labelFinal : "Siguiente"}
          </button>
        </div>
      </div>
    </div>
  );
}