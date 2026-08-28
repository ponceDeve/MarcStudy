import { useMemo, useState } from "react";
import preguntasFrecuentes from "../data/preguntasFrecuentes.json";
import { resolverPreguntaDinamica } from "../lib/faqDinamico";

// Búsqueda propia de esta sección: simple, sin tildes y sin tolerancia
// a errores de tipeo. A propósito NO reutiliza lib/buscador.js (esa es
// la lógica del buscador semántico de teoría) para que esta sección
// quede totalmente independiente y fácil de mantener sola.
function sinTildes(texto) {
  return (texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function coincide(pregunta, queryNorm) {
  if (sinTildes(pregunta.pregunta).includes(queryNorm)) return true;
  return (pregunta.variantes || []).some((variante) =>
    sinTildes(variante).includes(queryNorm)
  );
}

const CANTIDAD_DESTACADAS = 10;

const PREGUNTAS_DESTACADAS = preguntasFrecuentes
  .filter((p) => p.destacada)
  .slice(0, CANTIDAD_DESTACADAS);

export default function PreguntasFrecuentes() {
  const [busqueda, setBusqueda] = useState("");

  const queryNorm = sinTildes(busqueda);

  const respuestaDinamica = useMemo(
    () => resolverPreguntaDinamica(queryNorm),
    [queryNorm]
  );

  const preguntasAMostrar = useMemo(() => {
    if (!queryNorm) return PREGUNTAS_DESTACADAS;
    return preguntasFrecuentes.filter((p) => coincide(p, queryNorm));
  }, [queryNorm]);

  return (
    <section className="faq-section">
      <div className="faq-section__inner container">
        <h2 className="faq-section__title">Preguntas frecuentes</h2>

        <p className="faq-section__lead">
          Resuelve tus dudas sobre cómo funciona Mi Estudio: vidas,
          repasos, Pomodoro y más. Busca la tuya o revisa las más
          consultadas.
        </p>

        <div className="faq-section__buscador">
          <i className="fa-solid fa-magnifying-glass faq-section__buscador-icono" />
          <input
            type="text"
            className="faq-section__buscador-input"
            placeholder="Busca tu pregunta..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="faq-section__lista">
          {respuestaDinamica ? (
            <div className="faq-section__respuesta-directa">
              <i className="fa-solid fa-circle-check faq-section__respuesta-directa-icono" />
              <p>{respuestaDinamica}</p>
            </div>
          ) : preguntasAMostrar.length > 0 ? (
            preguntasAMostrar.map((p) => (
              <details key={p.id} className="faq-section__item">
                <summary className="faq-section__pregunta">
                  {p.pregunta}
                </summary>
                <p className="faq-section__respuesta">{p.respuestas[0]}</p>
              </details>
            ))
          ) : (
            <p className="faq-section__vacio">
              No puedo responder a esa pregunta. Prueba con otras
              palabras.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
