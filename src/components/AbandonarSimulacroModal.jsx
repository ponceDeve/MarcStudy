export default function AbandonarSimulacroModal({
  abierto,
  modo = "abandonar",
  onContinuar,
  onConfirmar,
}) {
  if (!abierto) return null;

  const esEntrega = modo === "entregar";

  const titulo = esEntrega
    ? "¿Entregar el simulacro?"
    : "¿Seguro que quieres abandonar?";

  const texto = esEntrega
    ? "Se calificará con tus respuestas actuales."
    : "Tu progreso se perderá.";

  const textoConfirmar = esEntrega ? "Entregar" : "Abandonar";

  return (
    <div
      className="rendirse-modal-overlay"
      onClick={onContinuar}
    >
      <div
        className="rendirse-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="rendirse-modal__title">
          {titulo}
        </h3>

        <p className="rendirse-modal__text">
          {texto}
        </p>

        <div className="rendirse-modal__actions">
          <button
            type="button"
            className="rendirse-modal__btn is-confirm"
            onClick={onContinuar}
          >
            Continuar
          </button>

          <button
            type="button"
            className="rendirse-modal__btn is-cancel"
            onClick={onConfirmar}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}