import { useState } from "react";

import LatexText from "../../components/LatexText";

const ICONO_CURSO = {
  RVE: "bi-chat-left-text",
  RMA: "bi-calculator",
  ARI: "bi-123",
  GEM: "bi-bounding-box",
  ALG: "bi-asterisk",
  TRI: "bi-triangle",
  LEN: "bi-fonts",
  LIT: "bi-book",
  PSI: "bi-people",
  CIV: "bi-bank",
  HPE: "bi-flag",
  HIS: "bi-globe-americas",
  GEO: "bi-map",
  ECO: "bi-currency-dollar",
  FIL: "bi-lightbulb",
  FIS: "bi-magnet",
  QUI: "bi-droplet",
  BIO: "bi-flower1",
};

const ICONO_ESTADO = {
  correcta: (
    <i
      className="fas fa-check-circle"
      style={{ color: "var(--success)" }}
    />
  ),
  incorrecta: (
    <i
      className="fas fa-times-circle"
      style={{ color: "var(--danger)" }}
    />
  ),
  blanco: (
    <i
      className="fas fa-minus-circle"
      style={{ color: "var(--ink-faint)" }}
    />
  ),
};

const TEXTO_ESTADO = {
  correcta: "Correcta",
  incorrecta: "Incorrecta",
  blanco: "Sin responder",
};

function textoRespuestaCorrecta(pregunta) {
  if (pregunta.tipo === "verdadero_falso") {
    return (pregunta.proposiciones || [])
      .map((p) => (p.correct ? "Verdadero" : "Falso"))
      .join(" · ");
  }

  const opcion = pregunta.opciones?.[pregunta.correctoIdx];

  if (Array.isArray(opcion)) {
    return opcion.join(" · ");
  }

  return opcion ?? "—";
}

function PreguntaResultado({ item, numero }) {
  const [abierta, setAbierta] = useState(false);

  const { pregunta, estado, puntos } = item;

  return (
    <li
      className={`resultados-examen__pregunta is-${estado} ${
        abierta ? "is-abierta" : ""
      }`}
    >
      <button
        type="button"
        className="resultados-examen__pregunta-header"
        onClick={() => setAbierta((v) => !v)}
      >
        {ICONO_ESTADO[estado]}

        <span className="resultados-examen__pregunta-texto">
          Pregunta {numero} — {TEXTO_ESTADO[estado]}
        </span>

        <span className="resultados-examen__pregunta-puntos">
          {puntos > 0 ? `+${puntos}` : puntos}
        </span>

        <i
          className={`fas fa-chevron-${abierta ? "up" : "down"}`}
        />
      </button>

      {abierta && (
        <div className="resultados-examen__explicacion">
          {pregunta.q && (
            <p className="resultados-examen__pregunta-enunciado">
              <LatexText>{pregunta.q}</LatexText>
            </p>
          )}

          <p className="resultados-examen__respuesta-correcta">
            Respuesta correcta:{" "}
            <LatexText>{textoRespuestaCorrecta(pregunta)}</LatexText>
          </p>
        </div>
      )}
    </li>
  );
}

export default function ResultadosExamenPage({
  resultados,
  area,
  nombreArea,
  onSalir,
}) {
  const { puntajeTotal, grupos } = resultados;

  const totalPreguntas = grupos.reduce(
    (acc, g) => acc + g.items.length,
    0
  );

  const totalCorrectas = grupos.reduce(
    (acc, g) =>
      acc +
      g.items.filter((i) => i.estado === "correcta").length,
    0
  );

  return (
    <div className="resultados-examen container">
      <div className="resultados-examen__resumen">
        <h1 className="resultados-examen__puntaje">
          {puntajeTotal.toFixed(2)}
        </h1>

        <p className="resultados-examen__subtitulo">
          Área {area} · {nombreArea} · {totalCorrectas}/
          {totalPreguntas} correctas
        </p>

        <button
          type="button"
          className="resultados-examen__salir"
          onClick={onSalir}
        >
          Volver al inicio
        </button>
      </div>

      {grupos.map((grupo) => {
        const correctasCurso = grupo.items.filter(
          (i) => i.estado === "correcta"
        ).length;

        return (
          <section
            key={grupo.curso}
            className="resultados-examen__bloque"
          >
            <h2 className="resultados-examen__bloque-titulo">
              <i
                className={`bi ${
                  ICONO_CURSO[grupo.curso] || "bi-journal-bookmark"
                }`}
              />{" "}
              {grupo.nombre} (
              {grupo.items.length} pregunta
              {grupo.items.length === 1 ? "" : "s"}
              {" · "}
              {correctasCurso} correcta
              {correctasCurso === 1 ? "" : "s"})
            </h2>

            <ul className="resultados-examen__lista">
              {grupo.items.map((item, index) => (
                <PreguntaResultado
                  key={item.pregunta.id}
                  item={item}
                  numero={index + 1}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}