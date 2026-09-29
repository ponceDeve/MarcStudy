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
// ESCRIBIR (respuesta escrita: curso de Inglés)
// Cubre escribir palabra, completar, traducir, transformar, ordenar,
// responder, dictado, deletrear y oración libre. Se compara contra
// pregunta.respuestas, ignorando mayúsculas, espacios y punto final.
// ============================================================================
function normalizarRespuestaEscrita(texto, deletreo) {
  let t = String(texto || "")
    .replace(/[’‘`´]/g, "'")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.!?]+$/, "");
  if (deletreo) t = t.replace(/[-\s]+/g, "-");
  return t;
}
function esRespuestaEscritaCorrecta(pregunta, texto) {
  const deletreo = pregunta.subtipo === "deletrear";
  const dada = normalizarRespuestaEscrita(texto, deletreo);
  if (!dada) return false;
  const v = pregunta.validacion;
  if (v) {
    const palabras = dada.split(" ").filter(Boolean);
    if (palabras.length < (v.minimoPalabras || 1)) return false;
    const contiene = (v.debeContener || []).every((w) =>
      dada.includes(String(w).toLowerCase())
    );
    if (!contiene) return false;
    if (v.patron) {
      try {
        return new RegExp(v.patron, "i").test(dada);
      } catch {
        return true;
      }
    }
    return true;
  }
  return (pregunta.respuestas || []).some(
    (r) => normalizarRespuestaEscrita(r, deletreo) === dada
  );
}
function Escribir({ pregunta, onRespondido, onReintentar }) {
  const [texto, setTexto] = useState("");
  const [answered, setAnswered] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const hurraRef = useRef(null);
  const [avisoVisible, mostrarAviso] = useAvisoBloqueo();
  function escuchar() {
    const a = pregunta.audio;
    if (!a || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const voz = new SpeechSynthesisUtterance(a.texto);
    voz.lang = a.idioma || "en-US";
    window.speechSynthesis.speak(voz);
  }
  useEffect(() => () => window.speechSynthesis?.cancel(), []);
  function confirmar() {
    if (answered) return;
    if (!texto.trim()) {
      mostrarAviso();
      return;
    }
    const correct = esRespuestaEscritaCorrecta(pregunta, texto);
    setWasCorrect(correct);
    setAnswered(true);
    if (correct && hurraRef.current) {
      hurraRef.current.currentTime = 0;
      hurraRef.current.play().catch(() => {});
    }
    onRespondido(correct);
  }
  const mostrarRespuesta =
    answered && !wasCorrect && (pregunta.respuestas || [])[0];
  return (
    <>
      <div className="question-card__q">
        <p className="question-card__q-intro">
          <LatexText>{pregunta.q || ""}</LatexText>
        </p>
      </div>
      {pregunta.audio && (
        <div className="question-card__type-wrap">
          <button
            type="button"
            onClick={escuchar}
            className="question-card__submit is-retry"
          >
            <i className="fas fa-volume-high" /> Escuchar
          </button>
        </div>
      )}
      <div className="question-card__type-wrap">
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && confirmar()}
          disabled={answered}
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="Escribe tu respuesta"
          className={`question-card__input ${
            answered ? (wasCorrect ? "is-correct" : "is-wrong") : ""
          }`}
        />
        {mostrarRespuesta && (
          <p className="question-card__q-prop">
            Respuesta: <strong>{pregunta.respuestas[0]}</strong>
          </p>
        )}
        {!answered && (
          <>
            {avisoVisible && (
              <span className="aviso-bloqueo">
                Escribe algo antes de responder
              </span>
            )}
            <button
              type="button"
              onClick={confirmar}
              className="question-card__submit"
            >
              Responder
            </button>
          </>
        )}
        {answered && !wasCorrect && onReintentar && (
          <button
            type="button"
            onClick={onReintentar}
            className="question-card__submit is-retry"
          >
            Repetir <i className="fas fa-rotate-left" />
          </button>
        )}
      </div>
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
  } else if (pregunta.tipo === "escribir") {
    Contenido = Escribir;
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

// ============================================================================
// LECCIÓN DE INGLÉS (estilo Duolingo: una pantalla a la vez)
// Cada sección muestra su teoría y enseguida sus ejercicios. Los ejercicios
// fallados se repiten al final. Reutiliza Escribir y OpcionMultiple.
// ============================================================================
function hablarIngles(texto) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const v = new SpeechSynthesisUtterance(texto);
  v.lang = "en-US";
  window.speechSynthesis.speak(v);
}
function BotonAudio({ texto }) {
  return (
    <button
      type="button"
      className="leccion__audio"
      title="Escuchar"
      onClick={() => hablarIngles(texto)}
    >
      <i className="fas fa-volume-high" />
    </button>
  );
}
function TeoriaLeccion({ paso }) {
  return (
    <div className="leccion__tip">
      <h2 className="leccion__titulo">{paso.titulo}</h2>
      {paso.regla && <p className="leccion__regla">{paso.regla}</p>}
      {paso.ejemplos.map((e, i) => (
        <div key={i} className="leccion__ejemplo">
          <BotonAudio texto={e.en} />
          <div>
            <div className="leccion__ejemplo-en">{e.en}</div>
            <div className="leccion__ejemplo-es">{e.es}</div>
          </div>
        </div>
      ))}
      {paso.vocab.length > 0 && (
        <div className="leccion__vocab">
          {paso.vocab.map((v, i) => (
            <div key={i} className="leccion__palabra">
              <BotonAudio texto={v.en} />
              <div>
                <div className="leccion__ejemplo-en">
                  {v.en} <span className="leccion__ipa">{v.ipa}</span>
                </div>
                <div className="leccion__ejemplo-es">{v.es}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
// Une cada teoría con los ejercicios que la siguen: la teoría se queda a la
// izquierda mientras se resuelven sus ejercicios (a la derecha). Una teoría
// sin ejercicios después sigue siendo una pantalla propia.
function prepararLeccion(leccion) {
  const salida = [];
  let teoriaActual = null;
  for (let k = 0; k < leccion.length; k++) {
    const p = leccion[k];
    if (p.t === "teoria") {
      const sig = leccion[k + 1];
      if (sig && sig.t === "ej") {
        teoriaActual = p;
      } else {
        teoriaActual = null;
        salida.push(p);
      }
    } else {
      salida.push(teoriaActual ? { ...p, _teoria: teoriaActual } : p);
    }
  }
  return salida;
}
export function LeccionInglesa({ data, onSalir, onSiguiente }) {
  const inicial = prepararLeccion(data.leccion || []);
  const totalEjercicios = inicial.filter((p) => p.t === "ej").length;
  const [cola, setCola] = useState(inicial);
  const [i, setI] = useState(0);
  const [resultado, setResultado] = useState(null);
  const [errores, setErrores] = useState(0);
  const repetidos = useRef(new Set());
  const terminado = i >= cola.length;
  const paso = cola[i];
  const precision =
    totalEjercicios === 0 ? 1 : Math.max(0, 1 - errores / totalEjercicios);
  const estrellas = precision >= 0.9 ? 3 : precision >= 0.7 ? 2 : 1;
  useEffect(() => {
    if (!terminado) return;
    try {
      const clave = `${data.curso}_${data.tema}`;
      const todas = JSON.parse(localStorage.getItem("estrellasTemas") || "{}");
      const previo = todas[clave]?.estrellas || 0;
      if (estrellas >= previo) {
        todas[clave] = {
          estrellas,
          correctas: totalEjercicios - errores,
          total: totalEjercicios,
        };
        localStorage.setItem("estrellasTemas", JSON.stringify(todas));
      }
    } catch {
      /* sin almacenamiento */
    }
  }, [terminado]);
  function continuar() {
    if (paso.t === "ej" && resultado === false && !repetidos.current.has(paso.id)) {
      repetidos.current.add(paso.id);
      setErrores((e) => e + 1);
      setCola((c) => [...c, paso]);
    }
    setResultado(null);
    setI(i + 1);
  }
  let cuerpo = null;
  let pie = null;
  if (terminado) {
    cuerpo = (
      <div className="leccion__tip leccion__fin">
        <h2 className="leccion__titulo">¡Lección completada!</h2>
        <div className="leccion__estrellas">
          {[1, 2, 3].map((n) => (
            <i key={n} className={`fas fa-star${n <= estrellas ? " is-on" : ""}`} />
          ))}
        </div>
        <p className="leccion__regla">
          Precisión: {Math.round(precision * 100)}% ({totalEjercicios - errores} de{" "}
          {totalEjercicios} a la primera)
        </p>
      </div>
    );
    pie = (
      <div className="leccion__pie">
        <div className="leccion__pie-inner">
          <button type="button" className="leccion__btn is-sec" onClick={onSalir}>
            Salir
          </button>
          {onSiguiente && (
            <button type="button" className="leccion__btn" onClick={onSiguiente}>
              Siguiente lección
            </button>
          )}
        </div>
      </div>
    );
  } else if (paso.t === "teoria") {
    cuerpo = <TeoriaLeccion paso={paso} />;
    pie = (
      <div className="leccion__pie">
        <div className="leccion__pie-inner">
          <span />
          <button type="button" className="leccion__btn" onClick={continuar}>
            Continuar
          </button>
        </div>
      </div>
    );
  } else {
    const Contenido = paso.tipo === "escribir" ? Escribir : OpcionMultiple;
    const ejercicio = (
      <div className="leccion__ejercicio question-card__inner">
        <Contenido
          key={`${i}-${paso.id}`}
          pregunta={paso}
          onRespondido={(ok) => setResultado(ok)}
        />
      </div>
    );
    cuerpo = paso._teoria ? (
      <div className="leccion__dos">
        <div className="leccion__col leccion__col--teoria">
          <TeoriaLeccion paso={paso._teoria} />
        </div>
        <div className="leccion__col leccion__col--ejercicio">{ejercicio}</div>
      </div>
    ) : (
      ejercicio
    );
    if (resultado !== null) {
      const correcta =
        paso.tipo === "opcion_multiple" ? paso.opts[paso.correct] : null;
      pie = (
        <div className={`leccion__pie ${resultado ? "is-ok" : "is-mal"}`}>
          <div className="leccion__pie-inner">
            <div className="leccion__msg">
              <strong>{resultado ? "¡Correcto!" : "Incorrecto"}</strong>
              {!resultado && correcta && <div>Respuesta correcta: {correcta}</div>}
              {!resultado && paso.explicacion && <div>{paso.explicacion}</div>}
            </div>
            <button type="button" className="leccion__btn" onClick={continuar}>
              Continuar
            </button>
          </div>
        </div>
      );
    }
  }
  return (
    <div className="leccion">
      <div className="leccion__top">
        <button type="button" className="leccion__cerrar" title="Salir" onClick={onSalir}>
          <i className="fas fa-xmark" />
        </button>
        <div className="leccion__barra">
          <div
            className="leccion__barra-relleno"
            style={{ width: `${terminado ? 100 : (i / cola.length) * 100}%` }}
          />
        </div>
      </div>
      <div
        className={`leccion__cuerpo${
          !terminado && paso._teoria ? " leccion__cuerpo--ancho" : ""
        }`}
      >
        {cuerpo}
      </div>
      {pie}
    </div>
  );
}
