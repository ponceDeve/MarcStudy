import LatexText from "../../components/LatexText";

// ============================================================================
// DETECTAR ESPACIOS DE COMPLETAR
// ============================================================================
// Acepta:
// ___1___
// ***1***
// ---1---
// y también mezclas de delimitadores.
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
}) {
  // ==========================================================================
  // VERDADERO / FALSO
  // ==========================================================================

  if (pregunta.tipo === "verdadero_falso") {
    const marcas =
      respuesta ||
      Array(
        pregunta.proposiciones?.length || 0
      ).fill(null);

    function marcar(i, valor) {
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
          {(pregunta.proposiciones || []).map(
            (prop, i) => (
              <li
                key={i}
                className="question-card__vf-row"
              >
                <span className="question-card__vf-texto">
                  <LatexText>
                    {prop.texto}
                  </LatexText>
                </span>

                <div className="question-card__vf-btns">
                  <button
                    type="button"
                    onClick={() =>
                      marcar(i, true)
                    }
                    className={`question-card__vf-btn ${marcas[i] === true
                        ? "is-selected"
                        : ""
                      }`}
                  >
                    V
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      marcar(i, false)
                    }
                    className={`question-card__vf-btn ${marcas[i] === false
                        ? "is-selected"
                        : ""
                      }`}
                  >
                    F
                  </button>
                </div>
              </li>
            )
          )}
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

    const palabrasElegidas =
      respuesta !== null &&
        respuesta !== undefined &&
        opciones[respuesta]
        ? opciones[respuesta]
        : null;

    let espacioIdx = -1;

    return (
      <>
        <p className="question-card__q">
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
              palabrasElegidas &&
                palabrasElegidas[idx] !== undefined
                ? palabrasElegidas[idx]
                : "";

            return (
              <span
                key={i}
                className={`question-card__cloze-input ${texto ? "has-value" : ""
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
          {opciones.map((combo, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onCambiar(i)}
              className={`question-card__opt ${respuesta === i
                  ? "is-selected"
                  : ""
                }`}
            >
              <LatexText>
                {Array.isArray(combo)
                  ? combo.join(" · ")
                  : combo}
              </LatexText>
            </button>
          ))}
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
            <LatexText>
              {pregunta.q}
            </LatexText>
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
          {(pregunta.opciones || []).map(
            (combo, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onCambiar(i)}
                className={`question-card__opt ${respuesta === i
                    ? "is-selected"
                    : ""
                  }`}
              >
                <LatexText>{combo}</LatexText>
              </button>
            )
          )}
        </div>
      </>
    );
  }

  // ==========================================================================
  // OPCIÓN MÚLTIPLE
  // ==========================================================================

  const lineasQ = (pregunta.q || "")
    .split("\n")
    .filter((l) => l.trim() !== "");

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
        {(pregunta.opciones || []).map(
          (texto, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onCambiar(i)}
              className={`question-card__opt ${respuesta === i
                  ? "is-selected"
                  : ""
                }`}
            >
              <LatexText>{texto}</LatexText>
            </button>
          )
        )}
      </div>
    </>
  );
}