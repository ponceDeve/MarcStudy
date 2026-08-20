import { useEffect, useState } from "react";
import LatexText from "../../components/LatexText";

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

  const respuestaCorrecta = isCorrect
    ? respuestaCorrectaTexto(pregunta)
    : null;

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

    const utter =
      new SpeechSynthesisUtterance(base);

    utter.lang = "es-PE";

    window.speechSynthesis.speak(utter);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [
    pregunta,
    isCorrect,
    rendido,
    respuestaCorrecta,
  ]);

  return (
    <div
      className={`explanation-panel animate-fade-in ${
        isCorrect
          ? "is-correct"
          : "is-wrong"
      }`}
    >
      <h4
        className={`explanation-panel__title ${
          isCorrect
            ? "is-correct"
            : "is-wrong"
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
          No te preocupes, inténtalo de nuevo.
          No se muestra la respuesta para que
          la razones tú.
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
                setRendido(true)
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
  );
}