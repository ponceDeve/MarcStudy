import React from "react";

const mensajesRendirse = {
  5: "¿Ya tiras la toalla? Si estás entero, no seas palta.",
  4: "Cuatro vidas aún. No te achiques tan rápido.",
  3: "Quedan tres vidas. La presión empieza a subir…",
  2: "Dos vidas y sigues igual. Esto se pone difícil.",
  1: "Una vida. Esta es tu última oportunidad.",
  0: "Ya perdiste todas. Al menos aprendiste algo.",

};

export default function RendirseModal({
  abierto,
  vidas = 5,
  corazones,
  lives,
  onContinuar,
  onRendirse,
}) {
  if (!abierto) return null;

  // Usa cualquier prop de vidas que maneje tu app o 5 por defecto
  const cantidadVidas = corazones ?? lives ?? vidas ?? 5;

  const mensaje =
    mensajesRendirse[cantidadVidas] ||
    "Si te rindes, se mostrará la explicación de esta pregunta.";

  return (
    <div
      className="rendirse-modal-overlay"
      onClick={onContinuar}
    >
      <div
        className="rendirse-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rendirse-modal__icon">
          <i className="fas fa-flag" />
        </div>

        <h3 className="rendirse-modal__title">
          ¿Te vas a rendir?
        </h3>

        <p className="rendirse-modal__text">
          {mensaje}
        </p>

        <div className="rendirse-modal__actions">
          <button
            type="button"
            className="rendirse-modal__btn is-cancel"
            onClick={onContinuar}
          >
            Continuar
          </button>

          <button
            type="button"
            className="rendirse-modal__btn is-confirm"
            onClick={onRendirse}
          >
            Rendirse
          </button>
        </div>
      </div>
    </div>
  );
}