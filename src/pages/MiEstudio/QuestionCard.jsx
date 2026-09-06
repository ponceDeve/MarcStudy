/* ============================================================
   QuestionCard.jsx
   ============================================================ */

import {
  useState,
  useRef,
  useMemo,
  useEffect,
} from "react";

import { shuffle } from "../../lib/shuffle";
import LatexText from "../../components/LatexText";
import { reemplazarSimbolosParaVoz } from "../../lib/simbolosNotacion";
import RendirseModal from "../../components/RendirseModal";
import { useAvisoBloqueo } from "../../hooks/useAvisoBloqueo";

// ============================================================================
// UTILIDADES
// ============================================================================

function partirEnEspacios(textoConEspacios) {
  const texto = textoConEspacios || "";
  const partes = [];

  // Acepta:
  // ___1___
  // ***1***
  // ---1---
  //
  // También acepta combinaciones entre delimitadores y espacios
  // alrededor del número.
  const regex =
    /(?:___|\*\*\*|---)\s*\d{1,2}\s*(?:___|\*\*\*|---)/g;

  let ultimoIndex = 0;
  let match;

  while ((match = regex.exec(texto)) !== null) {
    if (match.index > ultimoIndex) {
      partes.push({
        tipo: "texto",
        valor: texto.slice(ultimoIndex, match.index),
      });
    }

    partes.push({
      tipo: "espacio",
    });

    ultimoIndex = match.index + match[0].length;
  }

  if (ultimoIndex < texto.length) {
    partes.push({
      tipo: "texto",
      valor: texto.slice(ultimoIndex),
    });
  }

  return partes;
}

// ============================================================================
// LECTURA POR VOZ
// ============================================================================

function useLecturaVoz(texto) {
  useEffect(() => {
    if (!texto || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();

    const utter = new SpeechSynthesisUtterance(
      reemplazarSimbolosParaVoz(texto)
    );

    utter.lang = "es-PE";

    window.speechSynthesis.speak(utter);

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [texto]);
}

// ============================================================================
// LETRAS DE LAS ALTERNATIVAS
// ============================================================================

const LETRAS_ALTERNATIVAS = ["A", "B", "C", "D", "E"];

// ============================================================================
// OPCIÓN MÚLTIPLE
// ============================================================================

function OpcionMultiple({
  pregunta,
  onRespondido,
  onReintentar,
}) {
  const [answered, setAnswered] = useState(false);
  const [chosenIdx, setChosenIdx] = useState(null);
  const [wasCorrect, setWasCorrect] = useState(false);

  const hurraRef = useRef(null);

  const [avisoVisible, mostrarAviso] =
    useAvisoBloqueo();

  const shuffled = useMemo(
    () =>
      shuffle(
        (pregunta.opts || []).map(
          (text, originalIndex) => ({
            text,
            originalIndex,
          })
        )
      ),
    [pregunta]
  );

  useLecturaVoz(pregunta.q);

  function elegirOpcion(idx) {
    if (answered) return;

    setChosenIdx(idx);
  }

  function confirmarRespuesta() {
    if (answered) return;

    if (chosenIdx === null) {
      mostrarAviso();
      return;
    }

    const correct =
      shuffled[chosenIdx].originalIndex ===
      pregunta.correct;

    setWasCorrect(correct);
    setAnswered(true);

    if (correct && hurraRef.current) {
      hurraRef.current.currentTime = 0;

      hurraRef.current
        .play()
        .catch(() => {});
    }

    onRespondido(correct);
  }

  const lineasQ = (pregunta.q || "")
    .split("\n")
    .filter(
      (linea) => linea.trim() !== ""
    );

  const introQ = lineasQ[0] || "";
  const restoQ = lineasQ.slice(1);

  return (
    <>
      <div className="question-card__q">
        <p className="question-card__q-intro">
          <LatexText>{introQ}</LatexText>
        </p>

        {restoQ.length > 0 && (
          <div className="question-card__q-props">
            {restoQ.map((linea, i) => (
              <p
                key={i}
                className="question-card__q-prop"
              >
                <LatexText>{linea}</LatexText>
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="question-card__options">
        {shuffled.map((opt, i) => {
          const isChosen =
            chosenIdx === i;

          const isTheCorrectOne =
            answered &&
            wasCorrect &&
            opt.originalIndex ===
              pregunta.correct;

          let cls = "";

          if (answered) {
            if (isTheCorrectOne) {
              cls = "is-correct";
            } else if (isChosen) {
              cls = "is-wrong";
            } else {
              cls = "is-muted";
            }
          } else if (isChosen) {
            cls = "is-selected";
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() =>
                elegirOpcion(i)
              }
              disabled={answered}
              className={`question-card__opt ${cls}`}
            >
              <span className="question-card__opt-letter">
                {LETRAS_ALTERNATIVAS[i] ||
                  String.fromCharCode(
                    65 + i
                  )}
              </span>

              <span className="question-card__opt-text">
                <LatexText>
                  {opt.text}
                </LatexText>
              </span>
            </button>
          );
        })}
      </div>

      {!answered && (
        <div className="question-card__type-wrap">
          {avisoVisible && (
            <span className="aviso-bloqueo">
              Elige una opción antes de responder
            </span>
          )}

          <button
            type="button"
            onClick={confirmarRespuesta}
            aria-disabled={
              chosenIdx === null
            }
            className="question-card__submit"
          >
            Responder
          </button>
        </div>
      )}

      {answered &&
        !wasCorrect &&
        onReintentar && (
          <div className="question-card__type-wrap">
            <button
              type="button"
              onClick={onReintentar}
              className="question-card__submit is-retry"
            >
              Repetir{" "}
              <i className="fas fa-rotate-left" />
            </button>
          </div>
        )}

      <audio
        ref={hurraRef}
        src={`${import.meta.env.BASE_URL}sonidos/hurra-bob-esponja.mp3`}
        preload="auto"
      />
    </>
  );
}

// ============================================================================
// VERDADERO / FALSO
// ============================================================================

function VerdaderoFalso({
  pregunta,
  onRespondido,
  onReintentar,
}) {
  const proposiciones =
    pregunta.proposiciones || [];

  const [respuestas, setRespuestas] =
    useState(() =>
      Array(proposiciones.length).fill(null)
    );

  const [answered, setAnswered] =
    useState(false);

  const [wasCorrect, setWasCorrect] =
    useState(false);

  const hurraRef = useRef(null);

  const [avisoVisible, mostrarAviso] =
    useAvisoBloqueo();

  useLecturaVoz(
    pregunta.q ||
      "Indica si cada proposición es verdadera o falsa."
  );

  function marcar(i, valor) {
    if (answered) return;

    setRespuestas((prev) => {
      const copia = [...prev];

      copia[i] = valor;

      return copia;
    });
  }

  function calificar() {
    if (answered) return;

    if (
      respuestas.some(
        (r) => r === null
      )
    ) {
      mostrarAviso();
      return;
    }

    const correcto =
      respuestas.every(
        (r, i) =>
          r === proposiciones[i].correct
      );

    setWasCorrect(correcto);
    setAnswered(true);

    if (correcto && hurraRef.current) {
      hurraRef.current.currentTime = 0;

      hurraRef.current
        .play()
        .catch(() => {});
    }

    onRespondido(correcto);
  }

  const todasRespondidas =
    respuestas.every(
      (r) => r !== null
    );

  return (
    <>
      {pregunta.q && (
        <h3 className="question-card__q">
          <LatexText>
            {pregunta.q}
          </LatexText>
        </h3>
      )}

      <ol className="question-card__vf-list">
        {proposiciones.map(
          (prop, i) => {
            const propAcertada =
              answered &&
              respuestas[i] ===
                prop.correct;

            const propFallada =
              answered &&
              respuestas[i] !==
                prop.correct;

            return (
              <li
                key={i}
                className={`question-card__vf-row ${
                  propAcertada
                    ? "is-correct"
                    : ""
                } ${
                  propFallada
                    ? "is-wrong"
                    : ""
                }`}
              >
                <span className="question-card__vf-texto">
                  <LatexText>
                    {prop.texto}
                  </LatexText>
                </span>

                <div className="question-card__vf-btns">
                  <button
                    type="button"
                    disabled={answered}
                    onClick={() =>
                      marcar(i, true)
                    }
                    className={`question-card__vf-btn ${
                      respuestas[i] === true
                        ? "is-selected"
                        : ""
                    }`}
                  >
                    V
                  </button>

                  <button
                    type="button"
                    disabled={answered}
                    onClick={() =>
                      marcar(i, false)
                    }
                    className={`question-card__vf-btn ${
                      respuestas[i] === false
                        ? "is-selected"
                        : ""
                    }`}
                  >
                    F
                  </button>
                </div>

                {propFallada && (
                  <span className="question-card__vf-correcta">
                    Incorrecto — inténtalo de nuevo
                  </span>
                )}
              </li>
            );
          }
        )}
      </ol>

      {!answered && (
        <div className="question-card__type-wrap">
          {avisoVisible && (
            <span className="aviso-bloqueo">
              Marca V o F en todas las proposiciones
            </span>
          )}

          <button
            type="button"
            onClick={calificar}
            aria-disabled={
              !todasRespondidas
            }
            className="question-card__submit"
          >
            Calificar
          </button>
        </div>
      )}

      {answered &&
        !wasCorrect &&
        onReintentar && (
          <button
            type="button"
            onClick={onReintentar}
            className="question-card__submit is-retry"
          >
            Repetir{" "}
            <i className="fas fa-rotate-left" />
          </button>
        )}

      <audio
        ref={hurraRef}
        src={`${import.meta.env.BASE_URL}sonidos/hurra-bob-esponja.mp3`}
        preload="auto"
      />
    </>
  );
}

// ============================================================================
// COMPLETAR
// ============================================================================

function Completar({
  pregunta,
  onRespondido,
  onReintentar,
}) {
  const partes = useMemo(
    () =>
      partirEnEspacios(
        pregunta.textoConEspacios || ""
      ),
    [pregunta]
  );

  const [answered, setAnswered] =
    useState(false);

  const [chosenIdx, setChosenIdx] =
    useState(null);

  const [wasCorrect, setWasCorrect] =
    useState(false);

  const hurraRef = useRef(null);

  const [avisoVisible, mostrarAviso] =
    useAvisoBloqueo();

  useLecturaVoz(
    pregunta.q ||
      "Completa los espacios en blanco."
  );

  const shuffled = useMemo(
    () =>
      shuffle(
        (pregunta.opts || []).map(
          (palabras, originalIndex) => ({
            palabras,
            originalIndex,
          })
        )
      ),
    [pregunta]
  );

  function elegirOpcion(i) {
    if (answered) return;

    setChosenIdx(i);
  }

  function confirmarRespuesta() {
    if (answered) return;

    if (chosenIdx === null) {
      mostrarAviso();
      return;
    }

    const correct =
      shuffled[chosenIdx]
        .originalIndex ===
      pregunta.correct;

    setWasCorrect(correct);
    setAnswered(true);

    if (correct && hurraRef.current) {
      hurraRef.current.currentTime = 0;

      hurraRef.current
        .play()
        .catch(() => {});
    }

    onRespondido(correct);
  }

  const palabrasElegidas =
    chosenIdx !== null
      ? shuffled[chosenIdx].palabras
      : null;

  let espacioIdx = -1;

  return (
    <>
      {pregunta.q && (
        <h3 className="question-card__q">
          <LatexText>
            {pregunta.q}
          </LatexText>
        </h3>
      )}

      <p className="question-card__cloze">
        {partes.map((parte, i) => {
          if (parte.tipo === "texto") {
            return (
              <span key={i}>
                <LatexText>
                  {parte.valor}
                </LatexText>
              </span>
            );
          }

          espacioIdx += 1;

          const idx = espacioIdx;

          const texto =
            palabrasElegidas
              ? palabrasElegidas[idx]
              : "";

          let statusClass = "";

          if (answered) {
            statusClass = wasCorrect
              ? "is-correct"
              : "is-wrong";
          } else if (texto) {
            statusClass = "has-value";
          }

          return (
            <span
              key={i}
              className={`question-card__cloze-input ${statusClass}`}
            >
              {texto ? (
                <LatexText>
                  {texto}
                </LatexText>
              ) : (
                "\u00A0"
              )}
            </span>
          );
        })}
      </p>

      <div className="question-card__options">
        {shuffled.map((opt, i) => {
          const isChosen =
            chosenIdx === i;

          const isTheCorrectOne =
            answered &&
            wasCorrect &&
            opt.originalIndex ===
              pregunta.correct;

          let cls = "";

          if (answered) {
            if (isTheCorrectOne) {
              cls = "is-correct";
            } else if (isChosen) {
              cls = "is-wrong";
            } else {
              cls = "is-muted";
            }
          } else if (isChosen) {
            cls = "is-selected";
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() =>
                elegirOpcion(i)
              }
              disabled={answered}
              className={`question-card__opt ${cls}`}
            >
              <span className="question-card__opt-letter">
                {LETRAS_ALTERNATIVAS[i] ||
                  String.fromCharCode(
                    65 + i
                  )}
              </span>

              <span className="question-card__opt-text">
                <LatexText>
                  {opt.palabras.join(" · ")}
                </LatexText>
              </span>
            </button>
          );
        })}
      </div>

      {!answered && (
        <div className="question-card__type-wrap">
          {avisoVisible && (
            <span className="aviso-bloqueo">
              Elige una opción antes de responder
            </span>
          )}

          <button
            type="button"
            onClick={confirmarRespuesta}
            aria-disabled={
              chosenIdx === null
            }
            className="question-card__submit"
          >
            Responder
          </button>
        </div>
      )}

      {answered &&
        !wasCorrect &&
        onReintentar && (
          <div className="question-card__type-wrap">
            <button
              type="button"
              onClick={onReintentar}
              className="question-card__submit is-retry"
            >
              Repetir{" "}
              <i className="fas fa-rotate-left" />
            </button>
          </div>
        )}

      <audio
        ref={hurraRef}
        src={`${import.meta.env.BASE_URL}sonidos/hurra-bob-esponja.mp3`}
        preload="auto"
      />
    </>
  );
}

// ============================================================================
// RELACIONAR
// ============================================================================

function Relacionar({
  pregunta,
  onRespondido,
  onReintentar,
}) {
  const [answered, setAnswered] =
    useState(false);

  const [chosenIdx, setChosenIdx] =
    useState(null);

  const [wasCorrect, setWasCorrect] =
    useState(false);

  const hurraRef = useRef(null);

  const [avisoVisible, mostrarAviso] =
    useAvisoBloqueo();

  useLecturaVoz(
    pregunta.q ||
      "Relaciona ambas columnas."
  );

  const shuffled = useMemo(
    () =>
      shuffle(
        (pregunta.opts || []).map(
          (combo, originalIndex) => ({
            combo,
            originalIndex,
          })
        )
      ),
    [pregunta]
  );

  function elegirOpcion(i) {
    if (answered) return;

    setChosenIdx(i);
  }

  function confirmarRespuesta() {
    if (answered) return;

    if (chosenIdx === null) {
      mostrarAviso();
      return;
    }

    const correct =
      shuffled[chosenIdx]
        .originalIndex ===
      pregunta.correct;

    setWasCorrect(correct);
    setAnswered(true);

    if (correct && hurraRef.current) {
      hurraRef.current.currentTime = 0;

      hurraRef.current
        .play()
        .catch(() => {});
    }

    onRespondido(correct);
  }

  return (
    <>
      {pregunta.q && (
        <h3 className="question-card__q">
          <LatexText>
            {pregunta.q}
          </LatexText>
        </h3>
      )}

      <div className="question-card__match question-card__match--relacionar">
        <ul className="question-card__match-col">
          {(pregunta.columnaA || []).map(
            (item, i) => (
              <li key={i}>
                <LatexText>
                  {item}
                </LatexText>
              </li>
            )
          )}
        </ul>

        <ul className="question-card__match-col">
          {(pregunta.columnaB || []).map(
            (item, i) => (
              <li key={i}>
                <LatexText>
                  {item}
                </LatexText>
              </li>
            )
          )}
        </ul>
      </div>

      <div className="question-card__options">
        {shuffled.map((opt, i) => {
          const isChosen =
            chosenIdx === i;

          const isTheCorrectOne =
            answered &&
            wasCorrect &&
            opt.originalIndex ===
              pregunta.correct;

          let cls = "";

          if (answered) {
            if (isTheCorrectOne) {
              cls = "is-correct";
            } else if (isChosen) {
              cls = "is-wrong";
            } else {
              cls = "is-muted";
            }
          } else if (isChosen) {
            cls = "is-selected";
          }

          return (
            <button
              key={i}
              type="button"
              onClick={() =>
                elegirOpcion(i)
              }
              disabled={answered}
              className={`question-card__opt ${cls}`}
            >
              <span className="question-card__opt-letter">
                {LETRAS_ALTERNATIVAS[i] ||
                  String.fromCharCode(
                    65 + i
                  )}
              </span>

              <span className="question-card__opt-text">
                <LatexText>
                  {opt.combo}
                </LatexText>
              </span>
            </button>
          );
        })}
      </div>

      {!answered && (
        <div className="question-card__type-wrap">
          {avisoVisible && (
            <span className="aviso-bloqueo">
              Elige una opción antes de responder
            </span>
          )}

          <button
            type="button"
            onClick={confirmarRespuesta}
            aria-disabled={
              chosenIdx === null
            }
            className="question-card__submit"
          >
            Responder
          </button>
        </div>
      )}

      {answered &&
        !wasCorrect &&
        onReintentar && (
          <div className="question-card__type-wrap">
            <button
              type="button"
              onClick={onReintentar}
              className="question-card__submit is-retry"
            >
              Repetir{" "}
              <i className="fas fa-rotate-left" />
            </button>
          </div>
        )}

      <audio
        ref={hurraRef}
        src={`${import.meta.env.BASE_URL}sonidos/hurra-bob-esponja.mp3`}
        preload="auto"
      />
    </>
  );
}

// ============================================================================
// QUESTION CARD
// ============================================================================

export default function QuestionCard({
  pregunta,
  onRespondido,
  onRendirse,
  onReintentar,
  vidas,
  corazones,
  lives,
}) {
  const [intentos, setIntentos] =
    useState(0);

  const [
    mostrarModalRendirse,
    setMostrarModalRendirse,
  ] = useState(false);

  const cantVidas =
    corazones ??
    lives ??
    vidas ??
    3;

  useEffect(() => {
    setIntentos(0);
    setMostrarModalRendirse(false);
  }, [pregunta]);

  function manejarRespuesta(correct) {
    if (correct) {
      onRespondido(
        true,
        intentos
      );

      return;
    }

    const nuevoIntento =
      intentos + 1;

    setIntentos(nuevoIntento);

    onRespondido(
      false,
      nuevoIntento
    );
  }

  let Contenido =
    OpcionMultiple;

  if (
    pregunta.tipo ===
    "verdadero_falso"
  ) {
    Contenido =
      VerdaderoFalso;
  } else if (
    pregunta.tipo ===
    "completar"
  ) {
    Contenido =
      Completar;
  } else if (
    pregunta.tipo ===
    "relacionar"
  ) {
    Contenido =
      Relacionar;
  }

  return (
    <div
      className={`arcade-game-container question-card question-card--${pregunta.tipo || "opcion_multiple"}`}
      style={{
        position: "relative",
      }}
    >
      <button
        type="button"
        onClick={() =>
          setMostrarModalRendirse(true)
        }
        title="Rendirse"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          zIndex: 10,
          background: "transparent",
          border: "none",
          padding: "12px 16px",
          cursor:
            'url("/cursor_pointer.webp"), pointer',
          fontSize: "1.2rem",
          color: "#94a3b8",
        }}
      >
        <i className="fas fa-flag" />
      </button>

      <div className="arcade-grid" />

      <div className="question-card__inner">
        <Contenido
          key={JSON.stringify(
            pregunta
          )}
          pregunta={pregunta}
          onRespondido={
            manejarRespuesta
          }
          onReintentar={
            onReintentar
          }
        />
      </div>

      <RendirseModal
        abierto={
          mostrarModalRendirse
        }
        vidas={cantVidas}
        onContinuar={() =>
          setMostrarModalRendirse(
            false
          )
        }
        onRendirse={() => {
          setMostrarModalRendirse(
            false
          );

          onRendirse?.();
        }}
      />
    </div>
  );
}