import React from "react";

const mensajesRendirse = {
  3: "¿Tan difícil era? Primer intento y ya te caíste…",
  2: "Dos veces y nada… ¿seguro que estudiaste?",
  1: "Tercer intento y sigues patinando. Ya parece deporte.",
  0: "Ya perdí la cuenta… ¿vas a seguir o te rindes? ",
};

export default function RendirseModal({
  abierto,
  vidas = 3,
  corazones,
  lives,
  onContinuar,
  onRendirse,
}) {
  if (!abierto) return null;

  // Usa cualquier prop de vidas que maneje tu app o 3 por defecto
  const cantidadVidas = corazones ?? lives ?? vidas ?? 3;

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