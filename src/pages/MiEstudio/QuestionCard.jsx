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

function partirEnEspacios(textoConEspacios) {
  const texto = textoConEspacios || "";
  const partes = [];

  // Gemini debería usar siempre ___1___, pero a veces no respeta el
  // formato exacto y entrega ***1*** o ---1--- (o mezcla los tres
  // estilos entre la apertura y el cierre). Esta regex acepta
  // cualquiera de los 3 delimitadores, en cualquier combinación, con
  // o sin espacios pegados al número.
  const regex = /(?:___|\*\*\*|---)\s*\d{1,2}\s*(?:___|\*\*\*|---)/g;

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

function OpcionMultiple({ pregunta, onRespondido }) {
  const [answered, setAnswered] = useState(false);
  const [chosenIdx, setChosenIdx] = useState(null);
  const [wasCorrect, setWasCorrect] = useState(false);
  const hurraRef = useRef(null);

  const shuffled = useMemo(
    () =>
      shuffle(
        (pregunta.opts || []).map((text, originalIndex) => ({
          text,
          originalIndex,
        }))
      ),
    [pregunta]
  );

  useLecturaVoz(pregunta.q);

  function elegirOpcion(idx) {
    if (answered) return;
    setChosenIdx(idx);
  }

  function confirmarRespuesta() {
    if (answered || chosenIdx === null) return;

    const correct =
      shuffled[chosenIdx].originalIndex === pregunta.correct;

    setWasCorrect(correct);
    setAnswered(true);

    if (correct && hurraRef.current) {
      hurraRef.current.currentTime = 0;
      hurraRef.current.play().catch(() => { });
    }

    onRespondido(correct);
  }

  const lineasQ = (pregunta.q || "")
    .split("\n")
    .filter((linea) => linea.trim() !== "");

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
              <p key={i} className="question-card__q-prop">
                <LatexText>{linea}</LatexText>
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="question-card__options">
        {shuffled.map((opt, i) => {
          const isChosen = chosenIdx === i;

          const isTheCorrectOne =
            answered &&
            wasCorrect &&
            opt.originalIndex === pregunta.correct;

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
              onClick={() => elegirOpcion(i)}
              disabled={answered}
              className={`question-card__opt ${cls}`}
            >
              <LatexText>{opt.text}</LatexText>
            </button>
          );
        })}
      </div>

      {!answered && (
        <div className="question-card__type-wrap">
          <button
            onClick={confirmarRespuesta}
            disabled={chosenIdx === null}
            className="question-card__submit"
          >
            Responder
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

function VerdaderoFalso({ pregunta, onRespondido }) {
  const proposiciones = pregunta.proposiciones || [];

  const [respuestas, setRespuestas] = useState(() =>
    Array(proposiciones.length).fill(null)
  );

  const [answered, setAnswered] = useState(false);
  const hurraRef = useRef(null);

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
    if (
      answered ||
      respuestas.some((r) => r === null)
    ) {
      return;
    }

    const correcto = respuestas.every(
      (r, i) => r === proposiciones[i].correct
    );

    setAnswered(true);

    if (correcto && hurraRef.current) {
      hurraRef.current.currentTime = 0;
      hurraRef.current.play().catch(() => { });
    }

    onRespondido(correcto);
  }

  const todasRespondidas = respuestas.every(
    (r) => r !== null
  );

  return (
    <>
      {pregunta.q && (
        <h3 className="question-card__q">
          <LatexText>{pregunta.q}</LatexText>
        </h3>
      )}

      <ol className="question-card__vf-list">
        {proposiciones.map((prop, i) => {
          const propAcertada =
            answered &&
            respuestas[i] === prop.correct;

          const propFallada =
            answered &&
            respuestas[i] !== prop.correct;

          return (
            <li
              key={i}
              className={`question-card__vf-row ${propAcertada ? "is-correct" : ""
                } ${propFallada ? "is-wrong" : ""}`}
            >
              <span className="question-card__vf-texto">
                <LatexText>{prop.texto}</LatexText>
              </span>

              <div className="question-card__vf-btns">
                <button
                  disabled={answered}
                  onClick={() => marcar(i, true)}
                  className={`question-card__vf-btn ${respuestas[i] === true
                      ? "is-selected"
                      : ""
                    }`}
                >
                  V
                </button>

                <button
                  disabled={answered}
                  onClick={() => marcar(i, false)}
                  className={`question-card__vf-btn ${respuestas[i] === false
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
        })}
      </ol>

      {!answered && (
        <button
          onClick={calificar}
          disabled={!todasRespondidas}
          className="question-card__submit"
        >
          Calificar
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

function Completar({ pregunta, onRespondido }) {
  const partes = useMemo(
    () =>
      partirEnEspacios(
        pregunta.textoConEspacios || ""
      ),
    [pregunta]
  );

  const [answered, setAnswered] = useState(false);
  const [chosenIdx, setChosenIdx] = useState(null);
  const [wasCorrect, setWasCorrect] = useState(false);
  const hurraRef = useRef(null);

  useLecturaVoz(
    pregunta.q || "Completa los espacios en blanco."
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
    if (answered || chosenIdx === null) return;

    const correct =
      shuffled[chosenIdx].originalIndex ===
      pregunta.correct;

    setWasCorrect(correct);
    setAnswered(true);

    if (correct && hurraRef.current) {
      hurraRef.current.currentTime = 0;
      hurraRef.current.play().catch(() => { });
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
          <LatexText>{pregunta.q}</LatexText>
        </h3>
      )}

      <p className="question-card__cloze">
        {partes.map((parte, i) => {
          if (parte.tipo === "texto") {
            return (
              <span key={i}>
                <LatexText>{parte.valor}</LatexText>
              </span>
            );
          }

          espacioIdx += 1;

          const idx = espacioIdx;

          const texto = palabrasElegidas
            ? palabrasElegidas[idx]
            : "";

          let statusClass = "";

          if (answered) {
            statusClass = wasCorrect
              ? "is-correct"
              : "is-wrong";
          }

          return (
            <span
              key={i}
              className={`question-card__cloze-input ${statusClass}`}
            >
              {texto ? (
                <LatexText>{texto}</LatexText>
              ) : (
                "______"
              )}
            </span>
          );
        })}
      </p>

      <div className="question-card__options">
        {shuffled.map((opt, i) => {
          const isChosen = chosenIdx === i;

          const isTheCorrectOne =
            answered &&
            wasCorrect &&
            opt.originalIndex === pregunta.correct;

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
              onClick={() => elegirOpcion(i)}
              disabled={answered}
              className={`question-card__opt ${cls}`}
            >
              <LatexText>
                {opt.palabras.join(" · ")}
              </LatexText>
            </button>
          );
        })}
      </div>

      {!answered && (
        <div className="question-card__type-wrap">
          <button
            onClick={confirmarRespuesta}
            disabled={chosenIdx === null}
            className="question-card__submit"
          >
            Responder
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

function Relacionar({ pregunta, onRespondido }) {
  const [answered, setAnswered] = useState(false);
  const [chosenIdx, setChosenIdx] = useState(null);
  const [wasCorrect, setWasCorrect] = useState(false);
  const hurraRef = useRef(null);

  useLecturaVoz(
    pregunta.q || "Relaciona ambas columnas."
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
    if (answered || chosenIdx === null) return;

    const correct =
      shuffled[chosenIdx].originalIndex ===
      pregunta.correct;

    setWasCorrect(correct);
    setAnswered(true);

    if (correct && hurraRef.current) {
      hurraRef.current.currentTime = 0;
      hurraRef.current.play().catch(() => { });
    }

    onRespondido(correct);
  }

  return (
    <>
      {pregunta.q && (
        <h3 className="question-card__q">
          <LatexText>{pregunta.q}</LatexText>
        </h3>
      )}

      <div className="question-card__match">
        <ul className="question-card__match-col">
          {(pregunta.columnaA || []).map(
            (item, i) => (
              <li key={i}>
                <LatexText>{item}</LatexText>
              </li>
            )
          )}
        </ul>

        <ul className="question-card__match-col">
          {(pregunta.columnaB || []).map(
            (item, i) => (
              <li key={i}>
                <LatexText>{item}</LatexText>
              </li>
            )
          )}
        </ul>
      </div>

      <div className="question-card__options">
        {shuffled.map((opt, i) => {
          const isChosen = chosenIdx === i;

          const isTheCorrectOne =
            answered &&
            wasCorrect &&
            opt.originalIndex === pregunta.correct;

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
              onClick={() => elegirOpcion(i)}
              disabled={answered}
              className={`question-card__opt ${cls}`}
            >
              <LatexText>{opt.combo}</LatexText>
            </button>
          );
        })}
      </div>

      {!answered && (
        <div className="question-card__type-wrap">
          <button
            onClick={confirmarRespuesta}
            disabled={chosenIdx === null}
            className="question-card__submit"
          >
            Responder
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

export default function QuestionCard({
  pregunta,
  onRespondido,
  onRendirse,
  vidas,
  corazones,
  lives,
}) {
  const [intentos, setIntentos] = useState(0);
  const [mostrarModalRendirse, setMostrarModalRendirse] =
    useState(false);

  const cantVidas = corazones ?? lives ?? vidas ?? 3;

  useEffect(() => {
    setIntentos(0);
    setMostrarModalRendirse(false);
  }, [pregunta]);

  function manejarRespuesta(correct) {
    if (correct) {
      onRespondido(true, intentos);
      return;
    }

    const nuevoIntento = intentos + 1;

    setIntentos(nuevoIntento);
    onRespondido(false, nuevoIntento);
  }

  let Contenido = OpcionMultiple;

  if (pregunta.tipo === "verdadero_falso") {
    Contenido = VerdaderoFalso;
  } else if (pregunta.tipo === "completar") {
    Contenido = Completar;
  } else if (pregunta.tipo === "relacionar") {
    Contenido = Relacionar;
  }

  return (
    <div
      className="arcade-game-container question-card"
      style={{ position: "relative" }}
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
          cursor: "pointer",
          fontSize: "1.2rem",
          color: "#94a3b8",
        }}
      >
        <i className="fas fa-flag" />
      </button>

      <div className="arcade-grid" />

      <div className="question-card__inner">
        <Contenido
          key={JSON.stringify(pregunta)}
          pregunta={pregunta}
          onRespondido={manejarRespuesta}
        />
      </div>

      <RendirseModal
        abierto={mostrarModalRendirse}
        vidas={cantVidas}
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