import LatexText from "../../components/LatexText";

const LETRAS_ALTERNATIVAS = ["A", "B", "C", "D", "E"];

// ============================================================================
// DETECTAR ESPACIOS DE COMPLETAR
// ============================================================================

function partirEnEspacios(textoConEspacios) {
  const texto = textoConEspacios || "";
  const partes = [];
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
// COMPONENTE PRINCIPAL
// ============================================================================

export default function PreguntaSimulacro({
  pregunta,
  respuesta,
  onCambiar,
  modoResultado = false,
}) {
  // ==========================================================================
  // VERDADERO / FALSO
  // ==========================================================================

  if (pregunta.tipo === "verdadero_falso") {
    const marcas =
      respuesta ||
      Array(pregunta.proposiciones?.length || 0).fill(null);

    function marcar(i, valor) {
      if (modoResultado) return;

      const copia = [...marcas];
      copia[i] = valor;
      onCambiar(copia);
    }

    return (
      <>
        {pregunta.q && (
          <h3 className="question-card__q">
            <LatexText>{pregunta.q}</LatexText>
          </h3>
        )}

        <ol className="question-card__vf-list">
          {(pregunta.proposiciones || []).map((prop, i) => {
            const marcada = marcas[i];

            const respondida =
              marcada === true || marcada === false;

            const filaEstado = modoResultado
              ? !respondida
                ? ""
                : marcada === prop.correct
                  ? "is-correct"
                  : "is-wrong"
              : "";

            return (
              <li
                key={i}
                className={`question-card__vf-row ${filaEstado}`}
              >
                <span className="question-card__vf-texto">
                  <LatexText>{prop.texto}</LatexText>
                </span>

                <div className="question-card__vf-btns">
                  <button
                    type="button"
                    disabled={modoResultado}
                    onClick={() => marcar(i, true)}
                    className={`question-card__vf-btn ${
                      marcas[i] === true ? "is-selected" : ""
                    }`}
                  >
                    V
                  </button>

                  <button
                    type="button"
                    disabled={modoResultado}
                    onClick={() => marcar(i, false)}
                    className={`question-card__vf-btn ${
                      marcas[i] === false ? "is-selected" : ""
                    }`}
                  >
                    F
                  </button>
                </div>

                {modoResultado && !respondida && (
                  <span className="question-card__vf-correcta">
                    Correcta:{" "}
                    {prop.correct ? "Verdadero" : "Falso"}
                  </span>
                )}

                {modoResultado &&
                  respondida &&
                  marcada !== prop.correct && (
                    <span className="question-card__vf-correcta">
                      Correcta:{" "}
                      {prop.correct ? "Verdadero" : "Falso"}
                    </span>
                  )}
              </li>
            );
          })}
        </ol>
      </>
    );
  }

  // ==========================================================================
  // COMPLETAR
  // ==========================================================================

  if (pregunta.tipo === "completar") {
    const partes = partirEnEspacios(
      pregunta.textoConEspacios || ""
    );

    const opciones = pregunta.opciones || [];

    const idxAMostrar = modoResultado
      ? pregunta.correctoIdx
      : respuesta;

    const palabrasElegidas =
      idxAMostrar !== null &&
      idxAMostrar !== undefined &&
      opciones[idxAMostrar]
        ? opciones[idxAMostrar]
        : null;

    let espacioIdx = -1;

    return (
      <>
        <p className="question-card__q">
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

            const texto =
              palabrasElegidas &&
              palabrasElegidas[idx] !== undefined
                ? palabrasElegidas[idx]
                : "";

            return (
              <span
                key={i}
                className={`question-card__cloze-input ${
                  texto ? "has-value" : ""
                } ${
                  modoResultado ? "is-correct" : ""
                }`}
              >
                {texto ? (
                  <LatexText>{texto}</LatexText>
                ) : (
                  "\u00A0"
                )}
              </span>
            );
          })}
        </p>

        <div className="question-card__options">
          {opciones.map((combo, i) => {
            if (modoResultado) {
              const esCorrecta =
                i === pregunta.correctoIdx;

              const esMarcada =
                i === respuesta;

              const estaEnBlanco =
                respuesta === null ||
                respuesta === undefined;

              if (
                respuesta === pregunta.correctoIdx &&
                !esCorrecta
              ) {
                return null;
              }

              if (estaEnBlanco && !esCorrecta) {
                return null;
              }

              if (
                !estaEnBlanco &&
                respuesta !== pregunta.correctoIdx &&
                !esCorrecta &&
                !esMarcada
              ) {
                return null;
              }
            }

            const claseResultado = modoResultado
              ? i === pregunta.correctoIdx
                ? "is-correct"
                : i === respuesta
                  ? "is-wrong"
                  : ""
              : "";

            return (
              <button
                key={i}
                type="button"
                disabled={modoResultado}
                onClick={() => onCambiar(i)}
                className={`question-card__opt ${
                  respuesta === i && !modoResultado
                    ? "is-selected"
                    : ""
                } ${claseResultado}`}
              >
                <span className="question-card__opt-letter">
                  {LETRAS_ALTERNATIVAS[i] ||
                    String.fromCharCode(65 + i)}
                </span>

                <span className="question-card__opt-text">
                  <LatexText>
                    {Array.isArray(combo)
                      ? combo.join(" · ")
                      : combo}
                  </LatexText>
                </span>
              </button>
            );
          })}
        </div>
      </>
    );
  }

  // ==========================================================================
  // RELACIONAR
  // ==========================================================================

  if (pregunta.tipo === "relacionar") {
    return (
      <>
        {pregunta.q && (
          <h3 className="question-card__q">
            <LatexText>{pregunta.q}</LatexText>
          </h3>
        )}

        <div className="question-card__match">
          <ul className="question-card__match-col">
            {(pregunta.columnaA || []).map((item, i) => (
              <li key={i}>
                <LatexText>{item}</LatexText>
              </li>
            ))}
          </ul>

          <ul className="question-card__match-col">
            {(pregunta.columnaB || []).map((item, i) => (
              <li key={i}>
                <LatexText>{item}</LatexText>
              </li>
            ))}
          </ul>
        </div>

        <div className="question-card__options">
          {(pregunta.opciones || []).map((combo, i) => {
            if (modoResultado) {
              const esCorrecta =
                i === pregunta.correctoIdx;

              const esMarcada =
                i === respuesta;

              const estaEnBlanco =
                respuesta === null ||
                respuesta === undefined;

              if (
                respuesta === pregunta.correctoIdx &&
                !esCorrecta
              ) {
                return null;
              }

              if (estaEnBlanco && !esCorrecta) {
                return null;
              }

              if (
                !estaEnBlanco &&
                respuesta !== pregunta.correctoIdx &&
                !esCorrecta &&
                !esMarcada
              ) {
                return null;
              }
            }

            const claseResultado = modoResultado
              ? i === pregunta.correctoIdx
                ? "is-correct"
                : i === respuesta
                  ? "is-wrong"
                  : ""
              : "";

            return (
              <button
                key={i}
                type="button"
                disabled={modoResultado}
                onClick={() => onCambiar(i)}
                className={`question-card__opt ${
                  respuesta === i && !modoResultado
                    ? "is-selected"
                    : ""
                } ${claseResultado}`}
              >
                <span className="question-card__opt-letter">
                  {LETRAS_ALTERNATIVAS[i] ||
                    String.fromCharCode(65 + i)}
                </span>

                <span className="question-card__opt-text">
                  <LatexText>{combo}</LatexText>
                </span>
              </button>
            );
          })}
        </div>
      </>
    );
  }

  // ==========================================================================
  // OPCIÓN MÚLTIPLE
  // ==========================================================================

  const parrafosQ = (pregunta.q || "")
    .split(/\n\s*\n/)
    .filter((p) => p.trim() !== "");

  return (
    <>
      <div className="question-card__q">
        {parrafosQ.map((parrafo, i) => (
          <p
            key={i}
            className="question-card__q-prop"
          >
            <LatexText>{parrafo}</LatexText>
          </p>
        ))}
      </div>

      <div className="question-card__options">
        {(pregunta.opciones || []).map((texto, i) => {
          if (modoResultado) {
            const esCorrecta =
              i === pregunta.correctoIdx;

            const esMarcada =
              i === respuesta;

            const estaEnBlanco =
              respuesta === null ||
              respuesta === undefined;

            if (
              respuesta === pregunta.correctoIdx &&
              !esCorrecta
            ) {
              return null;
            }

            if (estaEnBlanco && !esCorrecta) {
              return null;
            }

            if (
              !estaEnBlanco &&
              respuesta !== pregunta.correctoIdx &&
              !esCorrecta &&
              !esMarcada
            ) {
              return null;
            }
          }

          const claseResultado = modoResultado
            ? i === pregunta.correctoIdx
              ? "is-correct"
              : i === respuesta
                ? "is-wrong"
                : ""
            : "";

          return (
            <button
              key={i}
              type="button"
              disabled={modoResultado}
              onClick={() => onCambiar(i)}
              className={`question-card__opt ${
                respuesta === i && !modoResultado
                  ? "is-selected"
                  : ""
              } ${claseResultado}`}
            >
              <span className="question-card__opt-letter">
                {LETRAS_ALTERNATIVAS[i] ||
                  String.fromCharCode(65 + i)}
              </span>

              <span className="question-card__opt-text">
                <LatexText>{texto}</LatexText>
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}