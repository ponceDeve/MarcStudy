import { useEffect, useMemo, useState } from "react";
import QuestionCard from "./QuestionCard";
import ExplanationPanel from "./ExplanationPanel";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Mini-quiz interactivo con las preguntas de las tarjetas de teoría
// que ya viste en este tema (no las del examen) — se arma una lista
// mezclada apenas se abre el modal y se responde una por una, igual
// que en el flujo normal de estudio.
export default function SeenQuestionsModal({
  open,
  onClose,
  preguntasVistas = {},
  flatPuntos = [],
}) {
  const [pos, setPos] = useState(0);
  const [questionResult, setQuestionResult] = useState(null);
  const [attemptKey, setAttemptKey] = useState(0);

  const preguntas = useMemo(() => {
    if (!open) return [];
    const indices = Object.keys(preguntasVistas).map(Number);
    return shuffle(
      indices
        .map((i) => flatPuntos[i]?.pregunta)
        .filter(Boolean),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Al abrir el modal de nuevo, arrancar siempre desde la primera.
  useEffect(() => {
    if (open) {
      setPos(0);
      setQuestionResult(null);
      setAttemptKey(0);
    }
  }, [open]);

  if (!open) return null;

  const preguntaActual = preguntas[pos];

  function siguiente() {
    if (pos < preguntas.length - 1) {
      setPos((p) => p + 1);
      setQuestionResult(null);
      setAttemptKey(0);
    } else {
      onClose();
    }
  }

  function reintentar() {
    setQuestionResult(null);
    setAttemptKey((k) => k + 1);
  }

  return (
    <div className="levels-modal" onClick={onClose}>
      <div className="levels-modal__inner" onClick={(e) => e.stopPropagation()}>
        <h2 className="levels-modal__title">Preguntas vistas</h2>

        {preguntas.length === 0 ? (
          <p style={{ color: "var(--ink-soft)", marginBottom: "20px" }}>
            Todavía no has respondido ninguna pregunta de este tema.
          </p>
        ) : (
          <>
            <p style={{ color: "var(--ink-soft)", fontSize: "14px", marginBottom: "12px" }}>
              Pregunta {pos + 1} de {preguntas.length}
            </p>

            <QuestionCard
              key={`${pos}-${attemptKey}`}
              pregunta={preguntaActual}
              onRespondido={(correcto) => setQuestionResult({ isCorrect: correcto })}
            />

            {questionResult && (
              <ExplanationPanel
                pregunta={preguntaActual}
                isCorrect={questionResult.isCorrect}
                onSiguiente={siguiente}
                onReintentar={reintentar}
              />
            )}
          </>
        )}

        <button onClick={onClose} className="levels-modal__close">
          <i className="fas fa-times" /> Cerrar
        </button>
      </div>
    </div>
  );
}