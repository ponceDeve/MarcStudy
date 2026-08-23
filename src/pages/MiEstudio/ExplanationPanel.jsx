import { useEffect, useState } from "react";

import LatexText from "../../components/LatexText";

import { reemplazarSimbolosParaVoz } from "../../lib/simbolosNotacion";

const mensajesIncorrectos = [
  <>
    <i className="bi bi-lightbulb-off"></i>{" "}
    Uy, qué sabio… tu respuesta fue digna de un manual de errores.{" "}
    <i className="bi bi-emoji-smirk-fill"></i>
  </>,

  <>
    <i className="bi bi-emoji-dizzy-fill"></i>{" "}
    ¿Segundo intento y todavía nada? Anda, piensa un poquito.{" "}
    <i className="bi bi-emoji-laughing-fill"></i>
  </>,

  <>
    <i className="bi bi-emoji-dizzy-fill"></i>{" "}
    Tres intentos y seguimos igual… esto ya se está poniendo preocupante.{" "}
    <i className="bi bi-emoji-laughing-fill"></i>
  </>,

  <>
    <i className="bi bi-emoji-dizzy-fill"></i>{" "}
    Ya van cuatro. La respuesta está ahí mismo y tú haciendo turismo.{" "}
    <i className="bi bi-emoji-laughing-fill"></i>
  </>,

  <>
    <i className="bi bi-emoji-dizzy-fill"></i>{" "}
    Hermano, la pregunta ya te conoce mejor que tú a ella.{" "}
    <i className="bi bi-emoji-laughing-fill"></i>
  </>,
];

function respuestaCorrectaTexto(pregunta) {
  if (pregunta.tipo === "verdadero_falso") {
    return null;
  }

  if (pregunta.tipo === "completar") {
    return (pregunta.opts[pregunta.correct] || []).join(" · ");
  }

  return pregunta.opts[pregunta.correct];
}

export default function ExplanationPanel({
  pregunta,
  isCorrect,
  onSiguiente,
  onReintentar,
}) {
  const [rendido, setRendido] = useState(false);

  const [mostrarModalRendirse, setMostrarModalRendirse] =
    useState(false);

  /*
   * Cantidad de intentos de ESTA pregunta.
   */
  const [intentos, setIntentos] = useState(0);

  /*
   * Cada vez que cambia la pregunta,
   * empezamos nuevamente desde 0.
   */
  useEffect(() => {
    setIntentos(0);
    setRendido(false);
    setMostrarModalRendirse(false);
  }, [pregunta]);

  /*
   * Detectamos una respuesta incorrecta.
   *
   * IMPORTANTE:
   * Solo incrementamos cuando realmente aparece
   * una respuesta incorrecta.
   */
  useEffect(() => {
    if (!isCorrect && !rendido) {
      setIntentos((prev) => prev + 1);
    }
  }, [isCorrect, rendido]);

  const respuestaCorrecta = isCorrect
    ? respuestaCorrectaTexto(pregunta)
    : null;

  /*
   * Como el estado se actualiza después del render,
   * usamos al menos 1 para mostrar el primer fallo.
   */
  const intentosActuales = Math.max(intentos, 1);

  /*
   * Seleccionar mensaje según intento.
   *
   * 1 → mensaje 1
   * 2 → mensaje 2
   * 3 → mensaje 3
   * 4 → mensaje 4
   * 5+ → mensaje 5
   */
  const indiceMensajeIncorrecto = Math.min(
    intentosActuales - 1,
    mensajesIncorrectos.length - 1
  );

  const mensajeIncorrecto =
    mensajesIncorrectos[indiceMensajeIncorrecto];

  /*
   * Mensaje del modal.
   */
  const mensajeRendirse =
    intentosActuales === 1
      ? "¿Ya te rindes? Solo fue un intento."
      : `¿Ya te rindes? Solo llevas ${intentosActuales} intentos.`;

  /*
   * ================================
   * LECTURA POR VOZ
   * ================================
   */

  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();

    let base;

    if (isCorrect) {
      base = respuestaCorrecta
        ? `Correcto. La respuesta correcta es: ${respuestaCorrecta}. ${pregunta.explicacion}`
        : `Correcto. ${pregunta.explicacion}`;
    } else if (rendido) {
      base = pregunta.explicacion;
    } else {
      base = "Incorrecto. Inténtalo de nuevo.";
    }

    const utter = new SpeechSynthesisUtterance(
      reemplazarSimbolosParaVoz(base)
    );

    utter.lang = "es-PE";

    let cancelado = false;

    const timeoutId = setTimeout(() => {
      if (!cancelado) {
        window.speechSynthesis.speak(utter);
      }
    }, 80);

    return () => {
      cancelado = true;
      clearTimeout(timeoutId);
      window.speechSynthesis.cancel();
    };
  }, [
    pregunta,
    isCorrect,
    rendido,
    respuestaCorrecta,
  ]);

  return (
    <>
      <div
        className={`explanation-panel animate-fade-in ${
          isCorrect ? "is-correct" : "is-wrong"
        }`}
      >
        <h4
          className={`explanation-panel__title ${
            isCorrect ? "is-correct" : "is-wrong"
          }`}
        >
          <i
            className={
              isCorrect
                ? "fas fa-check-circle"
                : "fas fa-exclamation-triangle"
            }
          />

          {isCorrect
            ? "¡Respuesta correcta!"
            : "Respuesta incorrecta"}
        </h4>

        {isCorrect ? (
          <>
            {respuestaCorrecta && (
              <p className="explanation-panel__answer">
                La alternativa correcta es{" "}
                <strong>
                  <LatexText>
                    {respuestaCorrecta}
                  </LatexText>
                </strong>
              </p>
            )}

            <div className="explanation-panel__text">
              <LatexText>
                {pregunta.explicacion}
              </LatexText>
            </div>
          </>
        ) : rendido ? (
          <div className="explanation-panel__text">
            <LatexText>
              {pregunta.explicacion}
            </LatexText>
          </div>
        ) : (
          <p className="explanation-panel__text">
            {mensajeIncorrecto}
          </p>
        )}

        <div className="explanation-panel__actions">
          {isCorrect ? (
            <button
              onClick={onSiguiente}
              className="explanation-panel__btn is-next"
            >
              Siguiente{" "}
              <i className="fas fa-arrow-right" />
            </button>
          ) : rendido ? (
            <button
              onClick={onReintentar}
              className="explanation-panel__btn is-neutral"
            >
              Repetir{" "}
              <i className="fas fa-rotate-left" />
            </button>
          ) : (
            <>
              <button
                onClick={() =>
                  setMostrarModalRendirse(true)
                }
                className="explanation-panel__btn is-neutral"
              >
                Rendirse{" "}
                <i className="fas fa-flag" />
              </button>

              <button
                onClick={onReintentar}
                className="explanation-panel__btn is-neutral"
              >
                Repetir{" "}
                <i className="fas fa-rotate-left" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* =================================
          MODAL DE RENDIRSE
          ================================= */}

      {mostrarModalRendirse && (
        <div
          className="rendirse-modal-overlay"
          onClick={() =>
            setMostrarModalRendirse(false)
          }
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
              {mensajeRendirse}
            </p>

            <div className="rendirse-modal__actions">
              <button
                type="button"
                className="rendirse-modal__btn is-cancel"
                onClick={() =>
                  setMostrarModalRendirse(false)
                }
              >
                Seguir intentando{" "}
                <i className="fas fa-brain" />
              </button>

              <button
                type="button"
                className="rendirse-modal__btn is-confirm"
                onClick={() => {
                  setMostrarModalRendirse(false);
                  setRendido(true);
                }}
              >
                Rendirme{" "}
                <i className="fas fa-flag" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}