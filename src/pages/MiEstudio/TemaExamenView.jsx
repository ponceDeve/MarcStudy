/* ============================================================
   TemaExamenView.jsx
   ------------------------------------------------------------
   Modo "examen" para las preguntas de un tema: se activa al
   elegir "Omitir" en el modal inicial o al presionar
   "Ir al Examen". Se comporta como el Examen real:

     - Sin vidas.

     - Sin corrección en tiempo real (nunca se sabe si acertó
       mientras responde).

     - El botón "Siguiente" siempre está visible, se puede dejar
       la pregunta en blanco.

     - "Rendirse" muestra la explicación en color neutro y
       cuenta como derrota, pero se puede seguir intentando
       después sin que eso cambie el puntaje.

     - El puntaje solo se calcula con el primer intento de cada
       pregunta (el momento en que se presiona "Siguiente" o
       "Rendirse" por primera vez en esa pregunta).

     - Al terminar (completando todas o saliendo antes), se
       muestra una pantalla de resultados agrupada por el título
       de la sección de teoría de cada pregunta.

     - Incluye un cronómetro que se pone en rojo si esta vez se
       tarda más que la última vez que se hizo este mismo examen.
   ============================================================ */

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from "react";

import LatexText from "../../components/LatexText";
import { shuffle } from "../../lib/shuffle";
import { puntosDeEstado } from "../../lib/simulacroExamen";

const LETRAS_ALTERNATIVAS = ["A", "B", "C", "D", "E"];

/*
 * Mensajes de rendición para este modo. A diferencia de los que
 * ya existen en RendirseModal.jsx / ExplanationPanel.jsx, estos
 * NO mencionan vidas, porque en este modo no existen.
 */
const MENSAJES_RENDIRSE_SIN_VIDAS = [
  "Tranquilo, aquí tienes la explicación.",
  "No pasa nada, sigamos con la explicación.",
  "Sin problema, revisemos por qué es así.",
  "Vamos a ver juntos la respuesta correcta."
];

function elegirMensajeRendirse() {
  const i = Math.floor(
    Math.random() * MENSAJES_RENDIRSE_SIN_VIDAS.length
  );

  return MENSAJES_RENDIRSE_SIN_VIDAS[i];
}

/* ============================================================
   UTILIDAD: separar texto con espacios en blanco (completar)
   (copia local de la de QuestionCard.jsx, para no tocar ese
   archivo)
   ============================================================ */

function partirEnEspacios(textoConEspacios) {
  const texto = textoConEspacios || "";
  const partes = [];

  const regex =
    /(?:___|\*\*\*|---)\s*\d+\s*(?:___|\*\*\*|---)/g;

  let ultimoIndex = 0;
  let match;

  while ((match = regex.exec(texto)) !== null) {
    if (match.index > ultimoIndex) {
      partes.push({
        tipo: "texto",
        valor: texto.slice(ultimoIndex, match.index)
      });
    }

    partes.push({ tipo: "espacio" });
    ultimoIndex = match.index + match[0].length;
  }

  if (ultimoIndex < texto.length) {
    partes.push({
      tipo: "texto",
      valor: texto.slice(ultimoIndex)
    });
  }

  return partes;
}

/* ============================================================
   CALIFICACIÓN
   ============================================================ */

function calificarPreguntaTema(pregunta, respuesta) {
  if (pregunta.tipo === "verdadero_falso") {
    const marcas = respuesta || [];
    const proposiciones = pregunta.proposiciones || [];

    const todasMarcadas =
      proposiciones.length > 0 &&
      proposiciones.every(
        (_, i) =>
          marcas[i] === true ||
          marcas[i] === false
      );

    if (!todasMarcadas) {
      return "blanco";
    }

    const todasCorrectas = proposiciones.every(
      (prop, i) =>
        marcas[i] === prop.correct
    );

    return todasCorrectas
      ? "correcta"
      : "incorrecta";
  }

  if (
    respuesta === null ||
    respuesta === undefined
  ) {
    return "blanco";
  }

  return respuesta === pregunta.correct
    ? "correcta"
    : "incorrecta";
}

/* ============================================================
   TIEMPO
   ============================================================ */

function formatearTiempo(segundosTotales) {
  const m = Math.floor(segundosTotales / 60);
  const s = segundosTotales % 60;

  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ============================================================
   SELECTOR DE BÚSQUEDA REUTILIZABLE
   ------------------------------------------------------------
   Usa las mismas clases del selector del examen real.
   NO utiliza <select>.
   ============================================================ */

function SelectorCurso({
  grupos,
  tituloSeleccionado,
  onSeleccionar
}) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const selectorRef = useRef(null);

  const grupoActual =
    grupos.find(
      (grupo) =>
        grupo.titulo === tituloSeleccionado
    ) || grupos[0];

  const gruposFiltrados = grupos
    .filter((grupo) =>
      grupo.titulo
        .toLowerCase()
        .includes(busqueda.toLowerCase())
    )
    .sort((a, b) => {
      if (
        a.titulo === grupoActual?.titulo
      ) {
        return -1;
      }

      if (
        b.titulo === grupoActual?.titulo
      ) {
        return 1;
      }

      return 0;
    });

  useEffect(() => {
    function manejarClickFuera(event) {
      if (
        selectorRef.current &&
        !selectorRef.current.contains(event.target)
      ) {
        cerrar();
      }
    }

    if (abierto) {
      document.addEventListener(
        "mousedown",
        manejarClickFuera
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        manejarClickFuera
      );
    };
  }, [abierto]);

  function abrir() {
    setBusqueda("");
    setAbierto(true);
  }

  function cerrar() {
    setBusqueda("");
    setAbierto(false);
  }

  function seleccionar(grupo) {
    onSeleccionar(grupo.titulo);
    cerrar();
  }

  return (
    <div
      ref={selectorRef}
      className={`selector-busqueda ${
        abierto ? "is-abierto" : ""
      }`}
    >
      {!abierto ? (
        <button
          type="button"
          className="selector-busqueda__control"
          onClick={abrir}
          aria-expanded={false}
          aria-haspopup="listbox"
        >
          <span>
            {grupoActual?.titulo ||
              "Seleccionar sección"}
          </span>

          <i className="fas fa-chevron-down" />
        </button>
      ) : (
        <>
          <div className="selector-busqueda__busqueda">
            <i className="fas fa-search" />

            <input
              type="text"
              value={busqueda}
              onChange={(event) =>
                setBusqueda(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  cerrar();
                }
              }}
              placeholder="Buscar sección..."
              autoFocus
              aria-label="Buscar sección"
            />

            {busqueda && (
              <button
                type="button"
                className="selector-busqueda__limpiar"
                onClick={() =>
                  setBusqueda("")
                }
                aria-label="Limpiar búsqueda"
              >
                <i className="fas fa-times" />
              </button>
            )}
          </div>

          <div className="selector-busqueda__menu">
            <div
              className="selector-busqueda__opciones"
              role="listbox"
            >
              {gruposFiltrados.length > 0 ? (
                gruposFiltrados.map((grupo) => (
                  <button
                    type="button"
                    key={grupo.titulo}
                    className={`selector-busqueda__opcion ${
                      grupo.titulo ===
                      grupoActual?.titulo
                        ? "is-seleccionado"
                        : ""
                    }`}
                    onClick={() =>
                      seleccionar(grupo)
                    }
                    role="option"
                    aria-selected={
                      grupo.titulo ===
                      grupoActual?.titulo
                    }
                  >
                    <span>
                      {grupo.titulo}
                    </span>

                    {grupo.titulo ===
                      grupoActual?.titulo && (
                      <i className="fas fa-check" />
                    )}
                  </button>
                ))
              ) : (
                <div className="selector-busqueda__vacio">
                  No se encontró ninguna sección
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ============================================================
   RENDER DE UNA PREGUNTA
   ============================================================ */

function PreguntaExamenTema({
  pregunta,
  respuesta,
  onCambiar,
  rendido
}) {
  const shuffled = useMemo(() => {
    if (
      pregunta.tipo === "verdadero_falso"
    ) {
      return null;
    }

    return shuffle(
      (pregunta.opts || []).map(
        (valor, originalIndex) => ({
          valor,
          originalIndex
        })
      )
    );
  }, [pregunta]);

  const partes = useMemo(() => {
    if (pregunta.tipo !== "completar") {
      return null;
    }

    return partirEnEspacios(
      pregunta.textoConEspacios || ""
    );
  }, [pregunta]);

  const lineasQ = (pregunta.q || "")
    .split("\n")
    .filter(
      (linea) => linea.trim() !== ""
    );

  const introQ = lineasQ[0] || "";
  const restoQ = lineasQ.slice(1);

  /* -------------------- VERDADERO / FALSO -------------------- */

  if (
    pregunta.tipo === "verdadero_falso"
  ) {
    const marcas = respuesta || [];

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
                    onClick={() => {
                      const nuevo = [
                        ...marcas
                      ];

                      nuevo[i] = true;
                      onCambiar(nuevo);
                    }}
                    className={`question-card__vf-btn ${
                      marcas[i] === true
                        ? "is-selected"
                        : ""
                    }`}
                  >
                    V
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const nuevo = [
                        ...marcas
                      ];

                      nuevo[i] = false;
                      onCambiar(nuevo);
                    }}
                    className={`question-card__vf-btn ${
                      marcas[i] === false
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

  /* -------------------- COMPLETAR -------------------- */

  if (
    pregunta.tipo === "completar"
  ) {
    const palabrasElegidas =
      respuesta !== null &&
      respuesta !== undefined
        ? shuffled.find(
            (o) =>
              o.originalIndex === respuesta
          )?.valor
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
          {(partes || []).map(
            (parte, i) => {
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

              return (
                <span
                  key={i}
                  className={`question-card__cloze-input ${
                    texto ? "has-value" : ""
                  }`}
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
            }
          )}
        </p>

        <div className="question-card__options question-card__options--completar">
          {shuffled.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() =>
                onCambiar(
                  opt.originalIndex
                )
              }
              className={`question-card__opt ${
                respuesta ===
                opt.originalIndex
                  ? "is-selected"
                  : ""
              }`}
            >
              <span className="question-card__opt-letter">
                {LETRAS_ALTERNATIVAS[i] ||
                  String.fromCharCode(
                    65 + i
                  )}
              </span>

              <span className="question-card__opt-text">
                <LatexText>
                  {opt.valor.join(" · ")}
                </LatexText>
              </span>
            </button>
          ))}
        </div>
      </>
    );
  }

  /* -------------------- RELACIONAR -------------------- */

  if (
    pregunta.tipo === "relacionar"
  ) {
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
          {shuffled.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() =>
                onCambiar(
                  opt.originalIndex
                )
              }
              className={`question-card__opt ${
                respuesta ===
                opt.originalIndex
                  ? "is-selected"
                  : ""
              }`}
            >
              <span className="question-card__opt-letter">
                {LETRAS_ALTERNATIVAS[i] ||
                  String.fromCharCode(
                    65 + i
                  )}
              </span>

              <span className="question-card__opt-text">
                <LatexText>
                  {opt.valor}
                </LatexText>
              </span>
            </button>
          ))}
        </div>
      </>
    );
  }

  /* -------------------- OPCIÓN MÚLTIPLE -------------------- */

  return (
    <>
      <div className="question-card__q">
        <p className="question-card__q-intro">
          <LatexText>
            {introQ}
          </LatexText>
        </p>

        {restoQ.length > 0 && (
          <div className="question-card__q-props">
            {restoQ.map(
              (linea, i) => (
                <p
                  key={i}
                  className="question-card__q-prop"
                >
                  <LatexText>
                    {linea}
                  </LatexText>
                </p>
              )
            )}
          </div>
        )}
      </div>

      <div className="question-card__options">
        {shuffled.map((opt, i) => (
          <button
            key={i}
            type="button"
            onClick={() =>
              onCambiar(
                opt.originalIndex
              )
            }
            className={`question-card__opt ${
              respuesta ===
              opt.originalIndex
                ? "is-selected"
                : ""
            }`}
          >
            <span className="question-card__opt-letter">
              {LETRAS_ALTERNATIVAS[i] ||
                String.fromCharCode(
                  65 + i
                )}
            </span>

            <span className="question-card__opt-text">
              <LatexText>
                {opt.valor}
              </LatexText>
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

/* ============================================================
   MODAL DE CONFIRMACIÓN "¿TE VAS A RENDIR?"
   ============================================================ */

function ModalConfirmarRendirse({
  abierto,
  onContinuar,
  onRendirse
}) {
  const mensaje = useMemo(
    () => elegirMensajeRendirse(),
    [abierto]
  );

  if (!abierto) {
    return null;
  }

  return (
    <div
      className="rendirse-modal-overlay"
      onClick={onContinuar}
    >
      <div
        className="rendirse-modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <h3 className="rendirse-modal__title">
          ¿Te vas a rendir?
        </h3>

        <p className="rendirse-modal__text">
          {mensaje}
        </p>

        <div className="rendirse-modal__actions">
          <button
            type="button"
            className="rendirse-modal__btn is-confirm"
            onClick={onContinuar}
          >
            Continuar
          </button>

          <button
            type="button"
            className="rendirse-modal__btn is-cancel"
            onClick={onRendirse}
          >
            Rendirse
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   MODAL DE CONFIRMACIÓN DE ENTREGA
   ============================================================ */

function ModalConfirmarEntrega({
  abierto,
  respondidas,
  total,
  onCancelar,
  onEntregar
}) {
  if (!abierto) {
    return null;
  }

  return (
    <div
      className="rendirse-modal-overlay"
      onClick={onCancelar}
    >
      <div
        className="rendirse-modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <h3 className="rendirse-modal__title">
          ¿Entregar examen?
        </h3>

        <p className="rendirse-modal__text">
          {respondidas} / {total} respondidas
        </p>

        <div className="rendirse-modal__actions">
          <button
            type="button"
            className="rendirse-modal__btn is-confirm"
            onClick={onCancelar}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="rendirse-modal__btn is-cancel"
            onClick={onEntregar}
          >
            Entregar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   RENDER DE UNA PREGUNTA EN MODO RESULTADO
   ============================================================ */

function PreguntaResultadoTema({
  pregunta,
  respuesta
}) {
  const lineasQ = (pregunta.q || "")
    .split("\n")
    .filter(
      (linea) => linea.trim() !== ""
    );

  const introQ = lineasQ[0] || "";
  const restoQ = lineasQ.slice(1);

  /* -------------------- VERDADERO / FALSO -------------------- */

  if (
    pregunta.tipo === "verdadero_falso"
  ) {
    const marcas = respuesta || [];

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
          {(pregunta.proposiciones || []).map(
            (prop, i) => {
              const marcada = marcas[i];

              const respondida =
                marcada === true ||
                marcada === false;

              const filaEstado =
                !respondida
                  ? ""
                  : marcada === prop.correct
                    ? "is-correct"
                    : "is-wrong";

              return (
                <li
                  key={i}
                  className={`question-card__vf-row ${filaEstado}`}
                >
                  <span className="question-card__vf-texto">
                    <LatexText>
                      {prop.texto}
                    </LatexText>
                  </span>

                  <div className="question-card__vf-btns">
                    <button
                      type="button"
                      disabled
                      className={`question-card__vf-btn ${
                        marcas[i] === true
                          ? "is-selected"
                          : ""
                      }`}
                    >
                      V
                    </button>

                    <button
                      type="button"
                      disabled
                      className={`question-card__vf-btn ${
                        marcas[i] === false
                          ? "is-selected"
                          : ""
                      }`}
                    >
                      F
                    </button>
                  </div>

                  {(!respondida ||
                    marcada !==
                      prop.correct) && (
                    <span className="question-card__vf-correcta">
                      Correcta:{" "}
                      {prop.correct
                        ? "Verdadero"
                        : "Falso"}
                    </span>
                  )}
                </li>
              );
            }
          )}
        </ol>
      </>
    );
  }

  /* -------------------- COMPLETAR -------------------- */

  if (
    pregunta.tipo === "completar"
  ) {
    const partes = partirEnEspacios(
      pregunta.textoConEspacios || ""
    );

    const opts = pregunta.opts || [];

    const palabrasElegidas =
      opts[pregunta.correct] || null;

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
          {partes.map(
            (parte, i) => {
              if (
                parte.tipo === "texto"
              ) {
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
                palabrasElegidas[idx] !==
                  undefined
                  ? palabrasElegidas[idx]
                  : "";

              return (
                <span
                  key={i}
                  className={`question-card__cloze-input is-correct ${
                    texto
                      ? "has-value"
                      : ""
                  }`}
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
            }
          )}
        </p>

        <div className="question-card__options question-card__options--completar">
          {opts.map(
            (combo, i) => {
              const esCorrecta =
                i === pregunta.correct;

              const esMarcada =
                i === respuesta;

              const estaEnBlanco =
                respuesta === null ||
                respuesta === undefined;

              if (
                respuesta ===
                  pregunta.correct &&
                !esCorrecta
              ) {
                return null;
              }

              if (
                estaEnBlanco &&
                !esCorrecta
              ) {
                return null;
              }

              if (
                !estaEnBlanco &&
                respuesta !==
                  pregunta.correct &&
                !esCorrecta &&
                !esMarcada
              ) {
                return null;
              }

              const claseResultado =
                esCorrecta
                  ? "is-correct"
                  : esMarcada
                    ? "is-wrong"
                    : "";

              return (
                <button
                  key={i}
                  type="button"
                  disabled
                  className={`question-card__opt ${claseResultado}`}
                >
                  <span className="question-card__opt-letter">
                    {LETRAS_ALTERNATIVAS[i] ||
                      String.fromCharCode(
                        65 + i
                      )}
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
            }
          )}
        </div>
      </>
    );
  }

  /* -------------------- RELACIONAR -------------------- */

  if (
    pregunta.tipo === "relacionar"
  ) {
    const opts = pregunta.opts || [];

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
          {opts.map(
            (valor, i) => {
              const esCorrecta =
                i === pregunta.correct;

              const esMarcada =
                i === respuesta;

              const estaEnBlanco =
                respuesta === null ||
                respuesta === undefined;

              if (
                respuesta ===
                  pregunta.correct &&
                !esCorrecta
              ) {
                return null;
              }

              if (
                estaEnBlanco &&
                !esCorrecta
              ) {
                return null;
              }

              if (
                !estaEnBlanco &&
                respuesta !==
                  pregunta.correct &&
                !esCorrecta &&
                !esMarcada
              ) {
                return null;
              }

              const claseResultado =
                esCorrecta
                  ? "is-correct"
                  : esMarcada
                    ? "is-wrong"
                    : "";

              return (
                <button
                  key={i}
                  type="button"
                  disabled
                  className={`question-card__opt ${claseResultado}`}
                >
                  <span className="question-card__opt-letter">
                    {LETRAS_ALTERNATIVAS[i] ||
                      String.fromCharCode(
                        65 + i
                      )}
                  </span>

                  <span className="question-card__opt-text">
                    <LatexText>
                      {valor}
                    </LatexText>
                  </span>
                </button>
              );
            }
          )}
        </div>
      </>
    );
  }

  /* -------------------- OPCIÓN MÚLTIPLE -------------------- */

  const opts = pregunta.opts || [];

  return (
    <>
      <div className="question-card__q">
        <p className="question-card__q-intro">
          <LatexText>
            {introQ}
          </LatexText>
        </p>

        {restoQ.length > 0 && (
          <div className="question-card__q-props">
            {restoQ.map(
              (linea, i) => (
                <p
                  key={i}
                  className="question-card__q-prop"
                >
                  <LatexText>
                    {linea}
                  </LatexText>
                </p>
              )
            )}
          </div>
        )}
      </div>

      <div className="question-card__options">
        {opts.map(
          (valor, i) => {
            const esCorrecta =
              i === pregunta.correct;

            const esMarcada =
              i === respuesta;

            const estaEnBlanco =
              respuesta === null ||
              respuesta === undefined;

            if (
              respuesta ===
                pregunta.correct &&
              !esCorrecta
            ) {
              return null;
            }

            if (
              estaEnBlanco &&
              !esCorrecta
            ) {
              return null;
            }

            if (
              !estaEnBlanco &&
              respuesta !==
                pregunta.correct &&
              !esCorrecta &&
              !esMarcada
            ) {
              return null;
            }

            const claseResultado =
              esCorrecta
                ? "is-correct"
                : esMarcada
                  ? "is-wrong"
                  : "";

            return (
              <button
                key={i}
                type="button"
                disabled
                className={`question-card__opt ${claseResultado}`}
              >
                <span className="question-card__opt-letter">
                  {LETRAS_ALTERNATIVAS[i] ||
                    String.fromCharCode(
                      65 + i
                    )}
                </span>

                <span className="question-card__opt-text">
                  <LatexText>
                    {valor}
                  </LatexText>
                </span>
              </button>
            );
          }
        )}
      </div>
    </>
  );
}

/* ============================================================
   FILA DE RESULTADO
   ============================================================ */

const ICONO_ESTADO = {
  correcta: (
    <i
      className="fas fa-check-circle"
      style={{
        color: "var(--success)"
      }}
    />
  ),

  incorrecta: (
    <i
      className="fas fa-times-circle"
      style={{
        color: "var(--danger)"
      }}
    />
  ),

  blanco: (
    <i
      className="fas fa-minus-circle"
      style={{
        color: "var(--ink-faint)"
      }}
    />
  )
};

const TEXTO_ESTADO = {
  correcta: "Correcta",
  incorrecta: "Incorrecta",
  blanco: "Sin responder"
};

function FilaResultado({
  item,
  numero,
  abierta,
  onToggle
}) {
  const {
    pregunta,
    estado,
    puntos,
    respuesta
  } = item;

  return (
    <li
      className={`resultados-examen__pregunta is-${estado} ${
        abierta ? "is-abierta" : ""
      }`}
    >
      <button
        type="button"
        className="resultados-examen__pregunta-header"
        onClick={onToggle}
      >
        {ICONO_ESTADO[estado]}

        <span className="resultados-examen__pregunta-texto">
          Pregunta {numero} —{" "}
          {TEXTO_ESTADO[estado]}
        </span>

        <span className="resultados-examen__pregunta-puntos">
          {puntos > 0
            ? `+${puntos.toFixed ? puntos.toFixed(2) : puntos}`
            : puntos}
        </span>

        <i
          className={`fas fa-chevron-${
            abierta ? "up" : "down"
          }`}
        />
      </button>

      {abierta && (
        <div className="resultados-examen__explicacion">
          <div
            className={`question-card resultados-examen__detalle-pregunta question-card--${
              pregunta.tipo ||
              "opcion_multiple"
            }`}
          >
            <div className="question-card__inner">
              <PreguntaResultadoTema
                pregunta={pregunta}
                respuesta={respuesta}
              />
            </div>
          </div>

          {pregunta.explicacion && (
            <p className="resultados-examen__explicacion-texto">
              <LatexText>
                {pregunta.explicacion}
              </LatexText>
            </p>
          )}
        </div>
      )}
    </li>
  );
}

/* ============================================================
   COMPONENTE PRINCIPAL
   ============================================================ */

const TemaExamenView = forwardRef(
  function TemaExamenView(
    {
      preguntas,
      titulos,
      claveTiempo,
      onTerminar,
      onFaseChange,
      onVolverTeoria
    },
    ref
  ) {
    const [indice, setIndice] =
      useState(0);

    const [fase, setFase] =
      useState("preguntas");

    const [
      respuestasPorIndice,
      setRespuestasPorIndice
    ] = useState({});

    const [
      resultadosPorIndice,
      setResultadosPorIndice
    ] = useState({});

    const [
      rendidoPorIndice,
      setRendidoPorIndice
    ] = useState({});

    const [
      mensajeRendirsePorIndice,
      setMensajeRendirsePorIndice
    ] = useState({});

    const [
      preguntaAbiertaResultado,
      setPreguntaAbiertaResultado
    ] = useState(null);

    const [
      tituloSeleccionado,
      setTituloSeleccionado
    ] = useState(null);

    const [
      modalRendirseAbierto,
      setModalRendirseAbierto
    ] = useState(false);

    const [
      modalEntregaAbierto,
      setModalEntregaAbierto
    ] = useState(false);

    const [
      toastVisible,
      setToastVisible
    ] = useState(false);

    const tiempoInicioRef =
      useRef(Date.now());

    const toastTimeoutRef =
      useRef(null);

    const [
      tiempoTranscurrido,
      setTiempoTranscurrido
    ] = useState(0);

    const [tiempoAnterior] =
      useState(() => {
        const guardado =
          localStorage.getItem(
            claveTiempo
          );

        return guardado
          ? parseInt(guardado, 10)
          : null;
      });

    /* ========================================================
       FASE
       ======================================================== */

    useEffect(() => {
      onFaseChange?.(fase);
    }, [fase, onFaseChange]);

    /* ========================================================
       CRONÓMETRO
       ======================================================== */

    useEffect(() => {
      if (fase !== "preguntas") {
        return;
      }

      const intervalo =
        setInterval(() => {
          setTiempoTranscurrido(
            Math.floor(
              (Date.now() -
                tiempoInicioRef.current) /
                1000
            )
          );
        }, 1000);

      return () =>
        clearInterval(intervalo);
    }, [fase]);

    useEffect(() => {
      return () => {
        if (toastTimeoutRef.current) {
          clearTimeout(
            toastTimeoutRef.current
          );
        }
      };
    }, []);

    const total = preguntas.length;

    const preguntaActual =
      preguntas[indice];

    /* ========================================================
       TOAST
       ======================================================== */

    function mostrarToastEntrega() {
      setToastVisible(true);

      if (toastTimeoutRef.current) {
        clearTimeout(
          toastTimeoutRef.current
        );
      }

      toastTimeoutRef.current =
        setTimeout(() => {
          setToastVisible(false);
          toastTimeoutRef.current =
            null;
        }, 2000);
    }

    /* ========================================================
       RESULTADOS
       ======================================================== */

    function fijarResultado(
      idx,
      estado
    ) {
      setResultadosPorIndice(
        (prev) =>
          prev[idx]
            ? prev
            : {
                ...prev,
                [idx]: estado
              }
      );
    }

    /* ========================================================
       RESPUESTA
       ======================================================== */

    function manejarCambioRespuesta(
      nuevaRespuesta
    ) {
      setRespuestasPorIndice(
        (prev) => ({
          ...prev,
          [indice]: nuevaRespuesta
        })
      );
    }

    /* ========================================================
       RENDIRSE
       ======================================================== */

    function manejarRendirse() {
      if (rendidoPorIndice[indice]) {
        return;
      }

      setRendidoPorIndice(
        (prev) => ({
          ...prev,
          [indice]: true
        })
      );

      setMensajeRendirsePorIndice(
        (prev) => ({
          ...prev,
          [indice]:
            elegirMensajeRendirse()
        })
      );

      fijarResultado(
        indice,
        "incorrecta"
      );
    }

    /* ========================================================
       NAVEGACIÓN
       ======================================================== */

    function manejarAnterior() {
      if (indice > 0) {
        setIndice((i) => i - 1);
      }
    }

    function manejarSiguiente() {
      if (indice === total - 1) {
        mostrarToastEntrega();
        return;
      }

      if (!resultadosPorIndice[indice]) {
        const respuesta =
          respuestasPorIndice[indice] ??
          null;

        const estado =
          calificarPreguntaTema(
            preguntaActual,
            respuesta
          );

        fijarResultado(
          indice,
          estado
        );
      }

      if (indice < total - 1) {
        setIndice((i) => i + 1);
      }
    }

    /* ========================================================
       TERMINAR
       ======================================================== */

    function terminarPreguntas() {
      const segundosFinal =
        Math.floor(
          (Date.now() -
            tiempoInicioRef.current) /
            1000
        );

      localStorage.setItem(
        claveTiempo,
        String(segundosFinal)
      );

      setFase("resultados");
    }

    /* ========================================================
       FINALIZAR DESDE AFUERA
       ======================================================== */

    function finalizarAhora() {
      setResultadosPorIndice(
        (prev) => {
          const nuevo = {
            ...prev
          };

          preguntas.forEach(
            (pregunta, i) => {
              if (nuevo[i]) {
                return;
              }

              const respuesta =
                respuestasPorIndice[i] ??
                null;

              nuevo[i] =
                calificarPreguntaTema(
                  pregunta,
                  respuesta
                );
            }
          );

          return nuevo;
        }
      );

      terminarPreguntas();
    }

    /* ========================================================
       PREGUNTA RESPONDIDA
       ======================================================== */

    function preguntaEstaRespondida(
      pregunta,
      respuesta
    ) {
      if (
        respuesta === null ||
        respuesta === undefined
      ) {
        return false;
      }

      if (
        pregunta.tipo ===
        "verdadero_falso"
      ) {
        const proposiciones =
          pregunta.proposiciones || [];

        return (
          proposiciones.length > 0 &&
          proposiciones.every(
            (_, i) =>
              respuesta[i] === true ||
              respuesta[i] === false
          )
        );
      }

      return true;
    }

    const cantidadRespondidas =
      preguntas.reduce(
        (cantidad, pregunta, i) =>
          cantidad +
          (preguntaEstaRespondida(
            pregunta,
            respuestasPorIndice[i]
          )
            ? 1
            : 0),
        0
      );

    useImperativeHandle(
      ref,
      () => ({
        finalizarAhora
      })
    );

    /* ========================================================
       TECLADO
       ======================================================== */

    useEffect(() => {
      if (fase !== "preguntas") {
        return;
      }

      if (modalRendirseAbierto) {
        return;
      }

      if (modalEntregaAbierto) {
        return;
      }

      function manejarTecla(event) {
        if (
          event.key === "ArrowRight"
        ) {
          event.preventDefault();
          manejarSiguiente();
        } else if (
          event.key === "ArrowLeft"
        ) {
          event.preventDefault();
          manejarAnterior();
        }
      }

      window.addEventListener(
        "keydown",
        manejarTecla
      );

      return () =>
        window.removeEventListener(
          "keydown",
          manejarTecla
        );
    }, [
      fase,
      modalRendirseAbierto,
      modalEntregaAbierto,
      indice,
      respuestasPorIndice,
      resultadosPorIndice
    ]);

    const tiempoExcedido =
      tiempoAnterior !== null &&
      tiempoTranscurrido >
        tiempoAnterior;

    /* ========================================================
       PANTALLA DE RESULTADOS
       ======================================================== */

    if (fase === "resultados") {
      const detalle = preguntas.map(
        (p, i) => {
          const estado =
            resultadosPorIndice[i] ||
            "blanco";

          return {
            pregunta: p,
            respuesta:
              respuestasPorIndice[i] ??
              null,
            titulo:
              titulos[i] ||
              "Sin título",
            estado,
            puntos:
              puntosDeEstado(estado)
          };
        }
      );

      const puntajeTotal =
        detalle.reduce(
          (acc, d) =>
            acc + d.puntos,
          0
        );

      const porTitulo =
        new Map();

      detalle.forEach(
        (item, i) => {
          if (
            !porTitulo.has(
              item.titulo
            )
          ) {
            porTitulo.set(
              item.titulo,
              {
                titulo:
                  item.titulo,
                items: []
              }
            );
          }

          porTitulo
            .get(item.titulo)
            .items.push({
              ...item,
              numeroGlobal: i + 1
            });
        }
      );

      const grupos =
        Array.from(
          porTitulo.values()
        );

      const totalCorrectas =
        detalle.filter(
          (d) =>
            d.estado ===
            "correcta"
        ).length;

      const grupoSeleccionado =
        grupos.find(
          (grupo) =>
            grupo.titulo ===
            tituloSeleccionado
        ) ||
        grupos[0] ||
        null;

      const puntajeGrupo =
        grupoSeleccionado
          ? grupoSeleccionado.items.reduce(
              (acc, item) =>
                acc + item.puntos,
              0
            )
          : 0;

      return (
        <div className="resultados-examen container">
          {onVolverTeoria && (
            <button
              type="button"
              className="resultados-examen__volver-teoria"
              title="Volver a la teoría"
              onClick={onVolverTeoria}
            >
              <i className="fas fa-arrow-left" />
            </button>
          )}

          <div className="resultados-examen__resumen preguntas-normales">
            <h1 className="resultados-examen__puntaje">
              {puntajeTotal.toFixed(2)}
            </h1>

            <p className="resultados-examen__subtitulo">
              {totalCorrectas}/
              {total} correctas
            </p>
          </div>

          {grupos.length > 1 && (
            <SelectorCurso
              grupos={grupos}
              tituloSeleccionado={
                grupoSeleccionado?.titulo ??
                null
              }
              onSeleccionar={
                setTituloSeleccionado
              }
            />
          )}

          {grupoSeleccionado && (
            <section
              className="resultados-examen__bloque"
              key={
                grupoSeleccionado.titulo
              }
            >
              <div className="resultados-examen__bloque-header">
                <h2 className="resultados-examen__bloque-titulo">
                  {
                    grupoSeleccionado.titulo
                  }
                </h2>

                <span className="resultados-examen__bloque-puntaje">
                  {puntajeGrupo.toFixed(2)} pts
                </span>
              </div>

              <ul className="resultados-examen__lista">
                {grupoSeleccionado.items.map(
                  (item) => (
                    <FilaResultado
                      key={
                        item.numeroGlobal
                      }
                      item={item}
                      numero={
                        item.numeroGlobal
                      }
                      abierta={
                        preguntaAbiertaResultado ===
                        item.numeroGlobal
                      }
                      onToggle={() =>
                        setPreguntaAbiertaResultado(
                          (actual) =>
                            actual ===
                            item.numeroGlobal
                              ? null
                              : item.numeroGlobal
                        )
                      }
                    />
                  )
                )}
              </ul>
            </section>
          )}
        </div>
      );
    }

    /* ========================================================
       PANTALLA DE PREGUNTA
       ======================================================== */

    const rendido = Boolean(
      rendidoPorIndice[indice]
    );

    return (
      <>
        {toastVisible && (
          <div
            className="tema-examen-toast"
            role="status"
          >
            Entrega tu examen
          </div>
        )}

        <div
          className="hud"
          style={{
            marginBottom: "16px"
          }}
        >
          <span>
            Avance:{" "}
            <span className="hud__progress-value">
              {indice + 1}/{total}
            </span>
          </span>

          <span
            style={{
              color: tiempoExcedido
                ? "var(--danger)"
                : "var(--ink-soft)",
              fontWeight: 600
            }}
          >
            <i className="fa-solid fa-stopwatch" />{" "}
            {formatearTiempo(
              tiempoTranscurrido
            )}
          </span>
        </div>

        <div
          className={`arcade-game-container question-card question-card--${
            preguntaActual.tipo ||
            "opcion_multiple"
          }`}
          style={{
            position: "relative"
          }}
        >
          {!rendido && (
            <button
              type="button"
              onClick={() =>
                setModalRendirseAbierto(
                  true
                )
              }
              title="Rendirse"
              className="question-card__rendirse-btn"
            >
              <i className="fas fa-flag" />
            </button>
          )}

          <div className="arcade-grid" />

          <div className="question-card__inner">
            <PreguntaExamenTema
              pregunta={
                preguntaActual
              }
              respuesta={
                respuestasPorIndice[
                  indice
                ] ?? null
              }
              onCambiar={
                manejarCambioRespuesta
              }
              rendido={rendido}
            />
          </div>
        </div>

        {rendido && (
          <div className="mi-estudio__explanation-wrap">
            <div className="explanation-panel animate-fade-in">
              <h4 className="explanation-panel__title">
                <i className="fas fa-flag" />{" "}
                {
                  mensajeRendirsePorIndice[
                    indice
                  ]
                }
              </h4>

              {preguntaActual.explicacion && (
                <div className="explanation-panel__text">
                  <LatexText>
                    {
                      preguntaActual.explicacion
                    }
                  </LatexText>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="examen-page__nav">
          <div className="examen-page__nav-preguntas">
            <button
              type="button"
              onClick={
                manejarAnterior
              }
              disabled={indice === 0}
              className="examen-page__nav-btn"
            >
              <i className="fas fa-arrow-left" />
              Ant.
            </button>

            <button
              type="button"
              onClick={
                manejarSiguiente
              }
              className="examen-page__nav-btn"
            >
              Sig.
              <i className="fas fa-arrow-right" />
            </button>
          </div>

          <button
            type="button"
            className="examen-page__entregar-btn"
            onClick={() =>
              setModalEntregaAbierto(
                true
              )
            }
          >
            Entregar examen
          </button>
        </div>

        <ModalConfirmarRendirse
          abierto={
            modalRendirseAbierto
          }
          onContinuar={() =>
            setModalRendirseAbierto(
              false
            )
          }
          onRendirse={() => {
            setModalRendirseAbierto(
              false
            );
            manejarRendirse();
          }}
        />

        <ModalConfirmarEntrega
          abierto={
            modalEntregaAbierto
          }
          respondidas={
            cantidadRespondidas
          }
          total={total}
          onCancelar={() =>
            setModalEntregaAbierto(
              false
            )
          }
          onEntregar={() => {
            setModalEntregaAbierto(
              false
            );
            finalizarAhora();
          }}
        />
      </>
    );
  }
);

export default TemaExamenView;