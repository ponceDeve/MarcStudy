import { useEffect, useMemo, useState } from "react";
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

// Mensajes que se muestran DESPUÉS de rendirse, según cuántas vidas le
// quedaban al usuario en ese momento. Rendirse ya no cuesta una vida:
// esto es solo tono, para que la pantalla de "te rendiste" no se sienta
// siempre igual si el usuario se rinde varias veces en la sesión.
const mensajesRendirse = {
  5: [
    {
      titulo: "¿Ya te quieres rendir?",
      explicacion: "Recién estamos empezando, aquí está la respuesta:",
    },
    {
      titulo: "Vidas completas y ya te rindes",
      explicacion: "Sin drama, esto es lo que tenías que responder:",
    },
    {
      titulo: "Bandera blanca temprano",
      explicacion: "Nada grave, repasa esto y sigue:",
    },
  ],
  4: [
    {
      titulo: "Quedan cuatro vidas",
      explicacion: "Aún tienes chances, pero léelo bien:",
    },
    {
      titulo: "Con margen de sobra",
      explicacion: "No hace falta rendirse tan rápido, pero bueno, aquí está:",
    },
    {
      titulo: "Cuatro vidas en el marcador",
      explicacion: "Toma nota de esto para el próximo intento:",
    },
  ],
  3: [
    {
      titulo: "Quedan tres vidas",
      explicacion: "La presión sube, concentración a esto:",
    },
    {
      titulo: "A mitad de camino",
      explicacion: "Vas por la mitad de tus vidas. Repasa esto:",
    },
    {
      titulo: "Tres vidas todavía",
      explicacion: "No está mal, pero presta atención a esto:",
    },
  ],
  2: [
    {
      titulo: "Quedan dos vidas",
      explicacion: "Esto se pone difícil, aprende esto:",
    },
    {
      titulo: "Solo dos vidas",
      explicacion: "Ya casi no hay margen para las siguientes. Fíjate en esto:",
    },
    {
      titulo: "Dos vidas en el marcador",
      explicacion: "Rendirse no te cuesta nada, pero anota bien esto:",
    },
    {
      titulo: "Quedan dos",
      explicacion: "Con dos vidas conviene ir con más cuidado. Aquí tienes:",
    },
  ],
  1: [
    {
      titulo: "Última vida",
      explicacion: "Esta es tu última oportunidad para responder, pón atención:",
    },
    {
      titulo: "Una vida nada más",
      explicacion: "Rendirte no te la quita, pero de aquí en más ve con cuidado:",
    },
    {
      titulo: "El límite está cerca",
      explicacion: "Con una vida restante, memoriza bien esto:",
    },
    {
      titulo: "Solo una vida",
      explicacion: "Nada de presión por rendirte, pero repasa esto con calma:",
    },
  ],
  0: [
    {
      titulo: "Se acabó",
      explicacion: "Al menos aprende esto para la próxima:",
    },
    {
      titulo: "Sin vidas en el marcador",
      explicacion: "Aprovecha para repasar bien esto:",
    },
    {
      titulo: "Ronda terminada",
      explicacion: "Esto es lo que tenías que responder:",
    },
  ],
};

function elegirInfoRendirse(cantVidas) {
  const grupo = mensajesRendirse[cantVidas] || mensajesRendirse[5];
  return grupo[Math.floor(Math.random() * grupo.length)];
}

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

  const infoRendirse = useMemo(
    () => (rendido ? elegirInfoRendirse(cantVidas) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rendido, pregunta]
  );

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

            {!rendido && (
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