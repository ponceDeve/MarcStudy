import React, { useMemo } from "react";

// Banco de mensajes de la confirmación "¿Te vas a rendir?", agrupados
// por la cantidad de vidas que le quedan al usuario en ese momento.
// Cada vez que se abre el modal se elige uno al azar del grupo que
// corresponde, para que no se sienta repetitivo si el usuario se rinde
// varias veces seguidas, pero el mensaje siempre tiene que ver con
// cuántas vidas le quedan.
//
// Rendirse ya NO cuesta una vida: esto es solo tono/humor, no una
// advertencia de que vaya a perder algo.
const mensajesRendirse = {
  5: [
    "¿Ya tiras la toalla? Si estás entero, no seas palta.",
    "Vidas completas y ya quieres rendirte. Inténtalo una vez más.",
    "Recién empezamos y ya bajas los brazos, mi loco.",
  ],
  4: [
    "Cuatro vidas aún. No te achiques tan rápido.",
    "Todavía tienes margen de sobra para intentarlo de nuevo.",
    "Con cuatro vidas de colchón, no hay apuro para rendirse.",
  ],
  3: [
    "Quedan tres vidas. La presión empieza a subir…",
    "Tres vidas todavía. Un intento más no te cuesta nada.",
    "Vas a la mitad. Piénsalo dos veces antes de rendirte.",
  ],
  2: [
    "Dos vidas y sigues igual. Esto se pone difícil.",
    "Con dos vidas ya se siente la presión, pero rendirte no te quita nada.",
    "Dos vidas restantes: tranqui, ver la respuesta no te cuesta ninguna.",
    "Ya vas quedando con poco margen, pero al menos rendirte es gratis.",
  ],
  1: [
    "Una vida. Esta es tu última oportunidad… para responder, no para rendirte.",
    "Con una vida en el marcador, rendirte sigue sin costarte nada.",
    "Última vida restante. Si prefieres ver la respuesta, adelante.",
    "Queda solo una vida, pero tranquilo: rendirte no te la quita.",
  ],
  0: [
    "Sin vidas en el marcador. Al menos aprende algo con la respuesta.",
    "Ya se acabaron las vidas de este intento. Revisa la respuesta con calma.",
    "Sin vidas visibles, pero rendirte sigue siendo gratis: aprovecha para aprender.",
  ],
};

function elegirMensaje(cantidadVidas) {
  const grupo =
    mensajesRendirse[cantidadVidas] || mensajesRendirse[5];

  return grupo[Math.floor(Math.random() * grupo.length)];
}

export default function RendirseModal({
  abierto,
  vidas = 5,
  corazones,
  lives,
  onContinuar,
  onRendirse,
}) {
  // Usa cualquier prop de vidas que maneje tu app o 5 por defecto
  const cantidadVidas = corazones ?? lives ?? vidas ?? 5;

  // Se recalcula cada vez que el modal se abre (cambia "abierto" o la
  // cantidad de vidas), no en cada render, para que el mensaje no
  // cambie solo mientras el usuario lo está leyendo.
  const mensaje = useMemo(
    () => elegirMensaje(cantidadVidas),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [abierto, cantidadVidas]
  );

  if (!abierto) return null;

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
