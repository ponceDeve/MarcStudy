import { useEffect, useState } from "react";
import LatexText from "../../components/LatexText";
import { reemplazarSimbolosParaVoz } from "../../lib/simbolosNotacion";
import RendirseModal from "../../components/RendirseModal";

const mensajesIncorrectos = {
  5: [
    <>
      <i className="bi bi-lightbulb-off"></i>{" "}
      Uy, qué sabio… tu respuesta fue digna de un manual de errores.{" "}
      <i className="bi bi-emoji-smirk-fill"></i>
    </>,
  ],
  4: [
    <>
      <i className="bi bi-emoji-dizzy-fill"></i>{" "}
      Dos veces y nada… ¿seguro que estudiaste?{" "}
      <i className="bi bi-emoji-laughing-fill"></i>
    </>,
  ],
  3: [
    <>
      <i className="bi bi-emoji-dizzy-fill"></i>{" "}
      Tres intentos y seguimos igual… esto ya se está poniendo preocupante.{" "}
      <i className="bi bi-emoji-laughing-fill"></i>
    </>,
  ],
  2: [
    <>
      <i className="bi bi-emoji-dizzy-fill"></i>{" "}
      Ya van cuatro. La respuesta está ahí mismo y tú haciendo turismo.{" "}
      <i className="bi bi-emoji-laughing-fill"></i>
    </>,
  ],
  1: [
    <>
      <i className="bi bi-emoji-dizzy-fill"></i>{" "}
      Hermano, la pregunta ya te conoce mejor que tú a ella.{" "}
      <i className="bi bi-emoji-laughing-fill"></i>
    </>,
  ],
  0: [
    <>
      <i className="bi bi-emoji-dizzy-fill"></i>{" "}
      Ya perdió toda esperanza, pero aquí va el último intento.{" "}
      <i className="bi bi-emoji-laughing-fill"></i>
    </>,
  ],
};

// Mensajes cuando se rinde según vidas restantes
const mensajesRendirse = {
  5: {
    titulo: "¿Ya te quieres rendir?",
    explicacion: "Recién estamos empezando, aquí está la respuesta:"
  },
  4: {
    titulo: "Quedan cuatro vidas",
    explicacion: "Aún tienes chances, pero léelo bien:"
  },
  3: {
    titulo: "Quedan tres vidas",
    explicacion: "La presión sube, concentración a esto:"
  },
  2: {
    titulo: "Quedan dos vidas",
    explicacion: "Esto se pone difícil, aprende esto:"
  },
  1: {
    titulo: "Última vida",
    explicacion: "Esta es tu última oportunidad, pón atención:"
  },
  0: {
    titulo: "Se acabó",
    explicacion: "Al menos aprende esto para la próxima:"
  }
};

export default function ExplanationPanel({
  pregunta,
  isCorrect,
  onSiguiente,
  onReintentar,
  intentos = 0,
  rendido = false,
  onRendirse,
  vidas = 5,
  vidasActuales,
  corazones,
  lives,
}) {
  const [mostrarModalRendirse, setMostrarModalRendirse] = useState(false);
  
  const cantVidas = corazones ?? lives ?? vidas ?? 5;
  const cantVidasActuales = vidasActuales ?? cantVidas;

  const infoRendirse = rendido 
    ? mensajesRendirse[cantVidas] || mensajesRendirse[5]
    : null;

  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();

    let base;

    if (isCorrect) {
      base = `Correcto. ${pregunta.explicacion}`;
    } else if (rendido) {
      base = `${infoRendirse?.explicacion} ${pregunta.explicacion}`;
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
  }, [pregunta, isCorrect, rendido, infoRendirse]);

  const intentosActuales = Math.max(intentos, 1);

  const mensajeIncorrecto =
    mensajesIncorrectos[cantVidas]?.[0] ||
    mensajesIncorrectos[5]?.[0];

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
          : rendido
            ? infoRendirse?.titulo || "Respuesta incorrecta"
            : "Respuesta incorrecta"}
      </h4>

      {isCorrect ? (
        <div className="explanation-panel__text">
          <LatexText>{pregunta.explicacion}</LatexText>
        </div>
      ) : rendido ? (
        <>
          {infoRendirse && (
            <p className="explanation-panel__text explanation-panel__text--rendirse">
              {infoRendirse.explicacion}
            </p>
          )}
          <div className="explanation-panel__text">
            <LatexText>{pregunta.explicacion}</LatexText>
          </div>
        </>
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

            {!rendido && cantVidasActuales > 1 && (
              <button
                type="button"
                onClick={() =>
                  setMostrarModalRendirse(true)
                }
                className="explanation-panel__btn is-neutral"
              >
                Rendirse <i className="fas fa-flag" />
              </button>
            )}
          </>
        )}
      </div>

      <RendirseModal
        abierto={mostrarModalRendirse}
        vidas={cantVidasActuales}
        onContinuar={() =>
          setMostrarModalRendirse(false)
        }
        onRendirse={() => {
          setMostrarModalRendirse(false);
          onRendirse?.();
        }}
      />
    </div>
  );
}