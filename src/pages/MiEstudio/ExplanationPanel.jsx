import { useEffect } from "react";
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

export default function ExplanationPanel({
  pregunta,
  isCorrect,
  onSiguiente,
  onReintentar,
  intentos = 0,
  rendido = false,
  onRendirse,
}) {
  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();

    let base;

    if (isCorrect) {
      base = `Correcto. ${pregunta.explicacion}`;
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
  }, [pregunta, isCorrect, rendido]);

  const intentosActuales = Math.max(intentos, 1);

  const indiceMensajeIncorrecto = Math.min(
    intentosActuales - 1,
    mensajesIncorrectos.length - 1
  );

  const mensajeIncorrecto =
    mensajesIncorrectos[indiceMensajeIncorrecto];

  return (
    <div
      className={`explanation-panel animate-fade-in ${
        isCorrect ? "is-correct" : "is-wrong"
      }`}
      style={{ position: "relative" }}
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
        <div className="explanation-panel__text">
          <LatexText>{pregunta.explicacion}</LatexText>
        </div>
      ) : rendido ? (
        <div className="explanation-panel__text">
          <LatexText>{pregunta.explicacion}</LatexText>
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
            Siguiente <i className="fas fa-arrow-right" />
          </button>
        ) : (
          <>
            <button
              onClick={onReintentar}
              className="explanation-panel__btn is-neutral"
            >
              Repetir <i className="fas fa-rotate-left" />
            </button>

            {!rendido && (
              <button
                type="button"
                onClick={onRendirse}
                className="explanation-panel__btn is-neutral"
              >
                Rendirse <i className="fas fa-flag" />
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}