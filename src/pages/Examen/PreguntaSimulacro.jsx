import { useMemo, useState } from "react";
import LatexText from "../../components/LatexText";
import {
  claveCombinacion,
  combinacionCorrectaVF,
  formatearCombinacionVF,
  generarAlternativasVF,
  respuestaVFCompleta,
} from "../../lib/verdaderoFalso";
const LETRAS_ALTERNATIVAS = ["A", "B", "C", "D", "E"];
// Cantidad de letras que se pueden asignar en Relacionar: una por cada
// elemento de la columna B (máximo A–E).
function cantidadLetrasRelacionar(pregunta) {
  const n = (pregunta.columnaB || []).length;
  return n > 0
    ? Math.min(n, LETRAS_ALTERNATIVAS.length)
    : LETRAS_ALTERNATIVAS.length;
}
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
  const alternativasVF = useMemo(() => {
    if (pregunta.tipo !== "verdadero_falso") return [];
    return (
      pregunta.alternativasVF ||
      generarAlternativasVF(pregunta.proposiciones || [])
    );
  }, [pregunta]);
  // Marcas visuales (Verdadero/Falso y Relacionar). Solo visuales: no afectan
  // la respuesta, las alternativas A–E ni la calificación.
  // Verdadero/Falso: marcas[i] = "verde" | "rojo" (sin clave = sin color).
  // Relacionar: marcas[i] = índice de letra (0 = A ... 4 = E), sin clave = sin marcar.
  // Las marcas pertenecen a la pregunta en pantalla: si cambia, empiezan vacías.
  const [estadoMarcas, setEstadoMarcas] = useState({
    pregunta: null,
    marcas: {},
  });
  const marcas =
    estadoMarcas.pregunta === pregunta
      ? estadoMarcas.marcas
      : {};
  function actualizarMarcas(actualizador) {
    setEstadoMarcas((prev) => {
      const base =
        prev.pregunta === pregunta ? prev.marcas : {};
      return {
        pregunta,
        marcas: actualizador(base),
      };
    });
  }
  function alternarMarcaVF(i) {
    actualizarMarcas((prev) => {
      const siguiente = { ...prev };
      if (prev[i] === undefined) {
        siguiente[i] = "verde";
      } else if (prev[i] === "verde") {
        siguiente[i] = "rojo";
      } else {
        delete siguiente[i];
      }
      return siguiente;
    });
  }
  function alternarMarcaRel(i) {
    actualizarMarcas((prev) => {
      const siguiente = { ...prev };
      const actual =
        prev[i] === undefined ? -1 : prev[i];
      let nueva = null;
      // Busca la siguiente letra libre (A → B → C → D → E); nunca duplica.
      for (
        let n = actual + 1;
        n < cantidadLetrasRelacionar(pregunta);
        n++
      ) {
        const ocupada = Object.keys(prev).some(
          (k) => Number(k) !== i && prev[k] === n
        );
        if (!ocupada) {
          nueva = n;
          break;
        }
      }
      if (nueva === null) {
        delete siguiente[i];
      } else {
        siguiente[i] = nueva;
      }
      return siguiente;
    });
  }
  // ==========================================================================
  // VERDADERO / FALSO (alternativas A–E como en QuestionCard / TemaExamenView)
  // ==========================================================================
  if (pregunta.tipo === "verdadero_falso") {
    const proposiciones = pregunta.proposiciones || [];
    const correcta = combinacionCorrectaVF(proposiciones);
    const claveCorrecta = claveCombinacion(correcta);
    const respondida = respuestaVFCompleta(proposiciones, respuesta);
    const claveRespuesta = respondida ? claveCombinacion(respuesta) : null;
    // Si la respuesta guardada no está entre las alternativas (exámenes
    // antiguos), se agrega para que siempre aparezca en los resultados.
    const lista = alternativasVF.some((c) => claveCombinacion(c) === claveRespuesta)
      || !respondida
      ? alternativasVF
      : [...alternativasVF.filter((c) => claveCombinacion(c) !== claveCorrecta), correcta, respuesta];
    const alternativas = lista.filter(
      (c, i, arr) =>
        arr.findIndex((o) => claveCombinacion(o) === claveCombinacion(c)) === i
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
            const marca = marcas[i];
            let claseMarca = "";
            if (!modoResultado) {
              if (marca === "verde") {
                claseMarca = " is-correct is-marca-v";
              } else if (marca === "rojo") {
                claseMarca = " is-wrong is-marca-f";
              }
            }
            return (
              <li
                key={i}
                className={`question-card__vf-row${
                  modoResultado
                    ? ""
                    : " question-card__vf-row--marcable"
                }${claseMarca}`}
                onClick={
                  modoResultado
                    ? undefined
                    : () => alternarMarcaVF(i)
                }
              >
                <span className="question-card__vf-texto">
                  <LatexText>{prop.texto}</LatexText>
                </span>
                {modoResultado && (
                  <span className="question-card__vf-correcta">
                    Correcta: {prop.correct ? "Verdadero" : "Falso"}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
        <div className="question-card__options question-card__options--completar">
          {alternativas.map((combinacion, i) => {
            const clave = claveCombinacion(combinacion);
            const esCorrecta = clave === claveCorrecta;
            const esMarcada = clave === claveRespuesta;
            if (modoResultado && !esCorrecta && !esMarcada) return null;
            const claseResultado = modoResultado
              ? esCorrecta
                ? "is-correct"
                : "is-wrong"
              : "";
            return (
              <button
                key={clave}
                type="button"
                disabled={modoResultado}
                onClick={() => onCambiar(combinacion)}
                className={`question-card__opt ${
                  esMarcada && !modoResultado ? "is-selected" : ""
                } ${claseResultado}`}
              >
                <span className="question-card__opt-letter">
                  {LETRAS_ALTERNATIVAS[i] || String.fromCharCode(65 + i)}
                </span>
                <span className="question-card__opt-text">
                  {formatearCombinacionVF(combinacion)}
                </span>
              </button>
            );
          })}
        </div>
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
        <div className="question-card__options question-card__options--completar">
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
            {(pregunta.columnaA || []).map((item, i) => {
              const letraIdx = marcas[i];
              const marcado =
                !modoResultado && letraIdx !== undefined;
              return (
                <li
                  key={i}
                  className={`${
                    modoResultado
                      ? ""
                      : "question-card__match-item"
                  }${marcado ? ` is-marcado is-color-${i % 5}` : ""}`.trim() || undefined}
                  onClick={
                    modoResultado
                      ? undefined
                      : () => alternarMarcaRel(i)
                  }
                >
                  {marcado && (
                    <strong className="question-card__match-letra">
                      {LETRAS_ALTERNATIVAS[letraIdx]})
                    </strong>
                  )}
                  <LatexText>{item}</LatexText>
                </li>
              );
            })}
          </ul>
          <ul className="question-card__match-col">
            {(pregunta.columnaB || []).map((item, i) => {
              const duenio = Object.keys(marcas).find(
                (k) => marcas[k] === i
              );
              const asignada = !modoResultado && duenio !== undefined;
              return (
                <li
                  key={i}
                  className={
                    asignada
                      ? `question-card__match-par is-color-${Number(duenio) % 5}`
                      : undefined
                  }
                >
                  <LatexText>{item}</LatexText>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="question-card__options question-card__options--relacionar">
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