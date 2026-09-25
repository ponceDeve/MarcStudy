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
import RendirseModal from "../../components/RendirseModal";
import { useAvisoBloqueo } from "../../hooks/useAvisoBloqueo";

// ============================================================================
// UTILIDADES
// ============================================================================

function partirEnEspacios(textoConEspacios) {
  const texto = textoConEspacios || "";
  const partes = [];

  // Acepta cualquier combinación de:
  // ___1___
  // ***1***
  // ---1---
  // ___1---
  // ---1___
  // ___1***
  // ***1___
  // ***1---
  // ---1***
  //
  // También acepta espacios alrededor del número:
  // ___ 1 ___
  // *** 1 ---
  // --- 1 ***

  const regex =
    /(?:___|\*\*\*|---)\s*\d+\s*(?:___|\*\*\*|---)/g;

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
// COMBINACIONES VERDADERO / FALSO
// ============================================================================

function generarCombinacionesVF(cantidad) {
  const total = 2 ** cantidad;
  const combinaciones = [];

  for (let numero = 0; numero < total; numero++) {
    const combinacion = [];

    for (let i = cantidad - 1; i >= 0; i--) {
      combinacion.push(
        Boolean((numero >> i) & 1)
      );
    }

    combinaciones.push(combinacion);
  }

  return combinaciones;
}

function distanciaHamming(a, b) {
  let distancia = 0;

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      distancia++;
    }
  }

  return distancia;
}

function claveCombinacion(combinacion) {
  return combinacion
    .map((valor) => (valor ? "V" : "F"))
    .join("");
}

function generarAlternativasVF(proposiciones) {
  const cantidad = proposiciones.length;

  if (cantidad === 0) {
    return [];
  }

  const correcta = proposiciones.map(
    (prop) => prop.correct === true
  );

  const todas = generarCombinacionesVF(
    cantidad
  );

  const otras = todas.filter(
    (combinacion) =>
      claveCombinacion(combinacion) !==
      claveCombinacion(correcta)
  );

  // Para que los distractores sean difíciles de descartar,
  // se priorizan las combinaciones que cambian
  // la menor cantidad posible de proposiciones.
  const agrupadasPorDistancia = new Map();

  otras.forEach((combinacion) => {
    const distancia = distanciaHamming(
      correcta,
      combinacion
    );

    if (!agrupadasPorDistancia.has(distancia)) {
      agrupadasPorDistancia.set(
        distancia,
        []
      );
    }

    agrupadasPorDistancia
      .get(distancia)
      .push(combinacion);
  });

  const alternativas = [correcta];

  const distancias = [
    ...agrupadasPorDistancia.keys(),
  ].sort((a, b) => a - b);

  for (const distancia of distancias) {
    if (alternativas.length >= 5) {
      break;
    }

    const grupo = shuffle(
      agrupadasPorDistancia.get(distancia)
    );

    for (const combinacion of grupo) {
      if (alternativas.length >= 5) {
        break;
      }

      alternativas.push(combinacion);
    }
  }

  return shuffle(alternativas);
}

function formatearCombinacionVF(combinacion) {
  return combinacion
    .map((valor) => (valor ? "V" : "F"))
    .join("  ");
}

// ============================================================================
// LETRAS DE LAS ALTERNATIVAS
// ============================================================================

const LETRAS_ALTERNATIVAS = [
  "A",
  "B",
  "C",
  "D",
  "E",
];

// ============================================================================
// OPCIÓN MÚLTIPLE
// ============================================================================

function OpcionMultiple({
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
                <LatexText>
                  {linea}
                </LatexText>
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

  const alternativas = useMemo(
    () =>
      generarAlternativasVF(
        proposiciones
      ),
    [proposiciones]
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

  const combinacionCorrecta = useMemo(
    () =>
      proposiciones.map(
        (prop) => prop.correct === true
      ),
    [proposiciones]
  );

  function elegirOpcion(i) {
    if (answered) return;
    setChosenIdx(i);
  }

  function calificar() {
    if (answered) return;

    if (chosenIdx === null) {
      mostrarAviso();
      return;
    }

    const seleccion =
      alternativas[chosenIdx];

    const correcto =
      claveCombinacion(seleccion) ===
      claveCombinacion(
        combinacionCorrecta
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
        {proposiciones.map((prop, i) => (
          <li
            key={i}
            className="question-card__vf-row"
          >
            <span className="question-card__vf-texto">
              <LatexText>
                {prop.texto}
              </LatexText>
            </span>
          </li>
        ))}
      </ol>

      <div className="question-card__options question-card__options--vf">
        {alternativas.map(
          (combinacion, i) => {
            const isChosen =
              chosenIdx === i;

            const isCorrect =
              claveCombinacion(
                combinacion
              ) ===
              claveCombinacion(
                combinacionCorrecta
              );

            let cls = "";

            if (answered) {
              if (isCorrect) {
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
                key={claveCombinacion(
                  combinacion
                )}
                type="button"
                disabled={answered}
                onClick={() =>
                  elegirOpcion(i)
                }
                className={`question-card__opt ${cls}`}
              >
                <span className="question-card__opt-letter">
                  {LETRAS_ALTERNATIVAS[i] ||
                    String.fromCharCode(
                      65 + i
                    )}
                </span>

                <span className="question-card__opt-text">
                  {formatearCombinacionVF(
                    combinacion
                  )}
                </span>
              </button>
            );
          }
        )}
      </div>

      {!answered && (
        <div className="question-card__type-wrap">
          {avisoVisible && (
            <span className="aviso-bloqueo">
              Elige una combinación antes de calificar
            </span>
          )}

          <button
            type="button"
            onClick={calificar}
            aria-disabled={
              chosenIdx === null
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

      <div className="question-card__options question-card__options--completar">
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

      <div className="question-card__options question-card__options--relacionar">
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

    window.scrollTo({
      top: 0,
      behavior: "instant",
    });
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
      className={`arcade-game-container question-card question-card--${
        pregunta.tipo ||
        "opcion_multiple"
      }`}
    >
      <button
        type="button"
        onClick={() =>
          setMostrarModalRendirse(true)
        }
        title="Rendirse"
        className="question-card__rendirse-btn"
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