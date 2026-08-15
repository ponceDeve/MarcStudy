import { useState, useRef, useMemo, useEffect } from "react";
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

function normalizeWord(w) {
  return w
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w]/g, "");
}

function getWords(str) {
  return (str || "")
    .split(/\s+/)
    .map(normalizeWord)
    .filter((w) => w.length > 2);
}

function respuestaSeParece(typed, correctText) {
  const correctWords = getWords(correctText);
  if (correctWords.length === 0) {
    return normalizeWord(typed) === normalizeWord(correctText);
  }
  const typedWords = new Set(getWords(typed));
  const coincidencias = correctWords.filter((w) => typedWords.has(w)).length;
  return coincidencias / correctWords.length >= 0.5;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Parte un texto tipo "La capital de ___1___ es ___2___." en fragmentos de
// texto plano y marcadores de espacio en blanco, en orden.
function partirEnEspacios(textoConEspacios) {
  const partes = [];
  const regex = /___\d+___/g;
  let ultimoIndex = 0;
  let match;
  while ((match = regex.exec(textoConEspacios)) !== null) {
    if (match.index > ultimoIndex) {
      partes.push({ tipo: "texto", valor: textoConEspacios.slice(ultimoIndex, match.index) });
    }
    partes.push({ tipo: "espacio" });
    ultimoIndex = match.index + match[0].length;
  }
  if (ultimoIndex < textoConEspacios.length) {
    partes.push({ tipo: "texto", valor: textoConEspacios.slice(ultimoIndex) });
  }
  return partes;
}

function useLecturaVoz(texto) {
  useEffect(() => {
    if (!texto || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(texto);
    utter.lang = "es-PE";
    window.speechSynthesis.speak(utter);
    return () => window.speechSynthesis && window.speechSynthesis.cancel();
  }, [texto]);
}

/* ---------- Tipo 1: opción múltiple (comportamiento original) ---------- */

function OpcionMultiple({ pregunta, onRespondido }) {
  const [answered, setAnswered] = useState(false);
  const [chosenIdx, setChosenIdx] = useState(null);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [typed, setTyped] = useState("");
  const hurraRef = useRef(null);

  const shuffled = useMemo(
    () => shuffle(pregunta.opts.map((text, originalIndex) => ({ text, originalIndex }))),
    [pregunta],
  );

  useLecturaVoz(pregunta.q);

  function resolver(correct, idx) {
    setChosenIdx(idx ?? null);
    setWasCorrect(correct);
    setAnswered(true);
    if (correct && hurraRef.current) {
      hurraRef.current.currentTime = 0;
      hurraRef.current.play().catch(() => { });
    }
    onRespondido(correct);
  }

  function elegirOpcion(idx) {
    if (answered) return;
    const correct = shuffled[idx].originalIndex === pregunta.correct;
    resolver(correct, idx);
  }

  function responderTexto() {
    if (answered || !typed.trim()) return;
    const correct = respuestaSeParece(typed, pregunta.opts[pregunta.correct]);
    const idxCorrecta = shuffled.findIndex((o) => o.originalIndex === pregunta.correct);
    resolver(correct, correct ? idxCorrecta : null);
  }

  const lineasQ = pregunta.q.split("\n").filter((l) => l.trim() !== "");
  const introQ = lineasQ[0] || "";
  const restoQ = lineasQ.slice(1);

  return (
    <>
      <div className="question-card__q">
        <p className="question-card__q-intro">
          <Latex>{introQ}</Latex>
        </p>
        {restoQ.length > 0 && (
          <div className="question-card__q-props">
            {restoQ.map((linea, i) => (
              <p key={i} className="question-card__q-prop">
                <Latex>{linea}</Latex>
              </p>
            ))}
          </div>
        )}
      </div>

      <div className="question-card__options">
        {shuffled.map((opt, i) => {
          const isChosen = answered && chosenIdx === i;
          // Solo se revela cuál era la correcta si el usuario acertó.
          // Si falló, no se marca ninguna como correcta: solo se ve
          // en rojo la que eligió, para no filtrar la respuesta.
          const isTheCorrectOne = answered && wasCorrect && opt.originalIndex === pregunta.correct;
          let cls = "";
          if (answered) {
            if (isTheCorrectOne) cls = "is-correct";
            else if (isChosen) cls = "is-wrong";
            else cls = "is-muted";
          }
          return (
            <button
              key={i}
              onClick={() => elegirOpcion(i)}
              disabled={answered}
              className={`question-card__opt ${cls}`}
            >
              <Latex>{opt.text}</Latex>
            </button>
          );
        })}
      </div>

      {!answered && (
        <div className="question-card__type-wrap">
          <button onClick={responderTexto} className="question-card__submit">
            Responder
          </button>
        </div>
      )}


      <audio ref={hurraRef} src={`${import.meta.env.BASE_URL}sonidos/hurra-bob-esponja.mp3`} preload="auto" />
    </>
  );
}

/* ---------- Tipo 2: verdadero / falso (lista de proposiciones) ---------- */

function VerdaderoFalso({ pregunta, onRespondido }) {
  const proposiciones = pregunta.proposiciones || [];
  const [respuestas, setRespuestas] = useState(() => Array(proposiciones.length).fill(null));
  const [answered, setAnswered] = useState(false);
  const hurraRef = useRef(null);

  useLecturaVoz(pregunta.q || "Indica si cada proposición es verdadera o falsa.");

  function marcar(i, valor) {
    if (answered) return;
    setRespuestas((prev) => {
      const copia = [...prev];
      copia[i] = valor;
      return copia;
    });
  }

  function calificar() {
    if (answered || respuestas.some((r) => r === null)) return;
    const correcto = respuestas.every((r, i) => r === proposiciones[i].correct);
    setAnswered(true);
    if (correcto && hurraRef.current) {
      hurraRef.current.currentTime = 0;
      hurraRef.current.play().catch(() => { });
    }
    onRespondido(correcto);
  }

  const todasRespondidas = respuestas.every((r) => r !== null);

  return (
    <>
      {pregunta.q && (
        <h3 className="question-card__q">
          <Latex>{pregunta.q}</Latex>
        </h3>
      )}

      <ol className="question-card__vf-list">
        {proposiciones.map((prop, i) => {
          const propAcertada = answered && respuestas[i] === prop.correct;
          const propFallada = answered && respuestas[i] !== prop.correct;
          return (
            <li
              key={i}
              className={`question-card__vf-row ${propAcertada ? "is-correct" : ""} ${propFallada ? "is-wrong" : ""}`}
            >
              <span className="question-card__vf-texto">
                <Latex>{prop.texto}</Latex>
              </span>
              <div className="question-card__vf-btns">
                <button
                  disabled={answered}
                  onClick={() => marcar(i, true)}
                  className={`question-card__vf-btn ${respuestas[i] === true ? "is-selected" : ""}`}
                >
                  V
                </button>
                <button
                  disabled={answered}
                  onClick={() => marcar(i, false)}
                  className={`question-card__vf-btn ${respuestas[i] === false ? "is-selected" : ""}`}
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


      <audio ref={hurraRef} src={`${import.meta.env.BASE_URL}sonidos/hurra-bob-esponja.mp3`} preload="auto" />
    </>
  );
}

/* ---------- Tipo 3: completar (texto con espacios en blanco) ---------- */

function Completar({ pregunta, onRespondido }) {
  const partes = useMemo(
    () => partirEnEspacios(pregunta.textoConEspacios || ""),
    [pregunta],
  );
  const [answered, setAnswered] = useState(false);
  const [chosenIdx, setChosenIdx] = useState(null);
  const [wasCorrect, setWasCorrect] = useState(false);
  const hurraRef = useRef(null);

  useLecturaVoz(pregunta.q || "Completa los espacios en blanco.");

  // Cada alternativa es un combo completo (una palabra por espacio),
  // igual que en opción múltiple pero con arrays en vez de strings.
  const shuffled = useMemo(
    () => shuffle(pregunta.opts.map((palabras, originalIndex) => ({ palabras, originalIndex }))),
    [pregunta],
  );

  function elegirOpcion(i) {
    if (answered) return;
    const correct = shuffled[i].originalIndex === pregunta.correct;
    setChosenIdx(i);
    setWasCorrect(correct);
    setAnswered(true);
    if (correct && hurraRef.current) {
      hurraRef.current.currentTime = 0;
      hurraRef.current.play().catch(() => { });
    }
    onRespondido(correct);
  }

  // Igual que en el resto de tipos de pregunta: si falla, el espacio
  // se queda en blanco (solo coloreado en rojo como aviso), no se
  // rellena con la palabra incorrecta que eligió.
  const palabrasElegidas = answered && wasCorrect && chosenIdx !== null ? shuffled[chosenIdx].palabras : null;
  let espacioIdx = -1;

  return (
    <>
      {pregunta.q && (
        <h3 className="question-card__q">
          <Latex>{pregunta.q}</Latex>
        </h3>
      )}

      <p className="question-card__cloze">
        {partes.map((parte, i) => {
          if (parte.tipo === "texto") {
            return (
              <span key={i}>
                <Latex>{parte.valor}</Latex>
              </span>
            );
          }

          espacioIdx += 1;
          const idx = espacioIdx;
          const texto = palabrasElegidas ? palabrasElegidas[idx] : "";

          return (
            <span
              key={i}
              className={`question-card__cloze-input ${answered ? (wasCorrect ? "is-correct" : "is-wrong") : ""}`}
            >
              {texto ? <Latex>{texto}</Latex> : "_________"}
            </span>
          );
        })}
      </p>

      <div className="question-card__options">
        {shuffled.map((opt, i) => {
          const isChosen = answered && chosenIdx === i;
          // Igual que en opción múltiple: solo se revela cuál era la
          // correcta si el usuario acertó.
          const isTheCorrectOne = answered && wasCorrect && opt.originalIndex === pregunta.correct;
          let cls = "";
          if (answered) {
            if (isTheCorrectOne) cls = "is-correct";
            else if (isChosen) cls = "is-wrong";
            else cls = "is-muted";
          }
          return (
            <button
              key={i}
              onClick={() => elegirOpcion(i)}
              disabled={answered}
              className={`question-card__opt ${cls}`}
            >
              <Latex>{opt.palabras.join(" · ")}</Latex>
            </button>
          );
        })}
      </div>

      <audio ref={hurraRef} src={`${import.meta.env.BASE_URL}sonidos/hurra-bob-esponja.mp3`} preload="auto" />
    </>
  );
}

/* ---------- Tipo 4: relacionar (dos columnas para emparejar) ---------- */

function Relacionar({ pregunta, onRespondido }) {
  const [answered, setAnswered] = useState(false);
  const [chosenIdx, setChosenIdx] = useState(null);
  const [wasCorrect, setWasCorrect] = useState(false);
  const hurraRef = useRef(null);

  useLecturaVoz(pregunta.q || "Relaciona ambas columnas.");

  // Igual que en completar: cada alternativa es un combo completo de
  // emparejamientos (ej. "Ia, IIb, IIIc"), no una opción independiente.
  const shuffled = useMemo(
    () => shuffle(pregunta.opts.map((combo, originalIndex) => ({ combo, originalIndex }))),
    [pregunta],
  );

  function elegirOpcion(i) {
    if (answered) return;
    const correct = shuffled[i].originalIndex === pregunta.correct;
    setChosenIdx(i);
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
          <Latex>{pregunta.q}</Latex>
        </h3>
      )}

      <div className="question-card__match">
        <ul className="question-card__match-col">
          {(pregunta.columnaA || []).map((item, i) => (
            <li key={i}>
              <Latex>{item}</Latex>
            </li>
          ))}
        </ul>
        <ul className="question-card__match-col">
          {(pregunta.columnaB || []).map((item, i) => (
            <li key={i}>
              <Latex>{item}</Latex>
            </li>
          ))}
        </ul>
      </div>

      <div className="question-card__options">
        {shuffled.map((opt, i) => {
          const isChosen = answered && chosenIdx === i;
          // Igual que en opción múltiple/completar: solo se revela cuál
          // era la correcta si el usuario acertó.
          const isTheCorrectOne = answered && wasCorrect && opt.originalIndex === pregunta.correct;
          let cls = "";
          if (answered) {
            if (isTheCorrectOne) cls = "is-correct";
            else if (isChosen) cls = "is-wrong";
            else cls = "is-muted";
          }
          return (
            <button
              key={i}
              onClick={() => elegirOpcion(i)}
              disabled={answered}
              className={`question-card__opt ${cls}`}
            >
              {opt.combo}
            </button>
          );
        })}
      </div>

      <audio ref={hurraRef} src={`${import.meta.env.BASE_URL}sonidos/hurra-bob-esponja.mp3`} preload="auto" />
    </>
  );
}

/* ---------- Selector de tipo ---------- */

export default function QuestionCard({ pregunta, onRespondido }) {
  let Contenido = OpcionMultiple;
  if (pregunta.tipo === "verdadero_falso") Contenido = VerdaderoFalso;
  else if (pregunta.tipo === "completar") Contenido = Completar;
  else if (pregunta.tipo === "relacionar") Contenido = Relacionar;

  return (
    <div className="arcade-game-container question-card">
      <div className="arcade-grid" />
      <div className="question-card__inner">
        <Contenido key={JSON.stringify(pregunta)} pregunta={pregunta} onRespondido={onRespondido} />
      </div>
    </div>
  );
}