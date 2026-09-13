import { useEffect, useRef, useState } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";

import { useFooterVisibility } from "../../context/FooterVisibilityContext";

import AppHeader from "../../components/AppHeader";

import {
  armarSimulacro,
  calcularResultados,
} from "../../lib/simulacroExamen";

import { AREAS_UNMSM } from "../../data/distribucionExamenUNMSM";

import PreguntaSimulacro from "./PreguntaSimulacro";

import ResultadosExamenPage from "./ResultadosExamenPage";

import AbandonarSimulacroModal from "../../components/AbandonarSimulacroModal";

const DURACION_SEGUNDOS = 3 * 60 * 60;

const STORAGE_KEY = "examen_simulacro_estado";

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

function leerEstadoGuardado(area) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return null;

    const data = JSON.parse(raw);

    if (data.area !== area) return null;

    if (!data.horaFin || data.horaFin <= Date.now()) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

function guardarEstado(estado) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(estado)
    );
  } catch {
    // Si falla el guardado no rompemos el examen, solo no persiste.
  }
}

function limpiarEstadoGuardado() {
  localStorage.removeItem(STORAGE_KEY);
}

function formatearTiempo(segundos) {
  const s = Math.max(0, Math.round(segundos));

  const h = String(
    Math.floor(s / 3600)
  ).padStart(2, "0");

  const m = String(
    Math.floor((s % 3600) / 60)
  ).padStart(2, "0");

  const ss = String(
    s % 60
  ).padStart(2, "0");

  return `${h}:${m}:${ss}`;
}

function SelectorCurso({
  cursos,
  cursoSeleccionado,
  onSeleccionar,
}) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const selectorRef = useRef(null);

  const cursoActual = cursos.find(
    (curso) =>
      String(curso.curso) ===
      String(cursoSeleccionado)
  );

  const cursosFiltrados = [...cursos]
    .filter((curso) =>
      curso.cursoNombre
        .toLowerCase()
        .includes(busqueda.toLowerCase())
    )
    .sort((a, b) => {
      if (
        String(a.curso) ===
        String(cursoSeleccionado)
      ) {
        return -1;
      }

      if (
        String(b.curso) ===
        String(cursoSeleccionado)
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

  function seleccionar(curso) {
    onSeleccionar(curso.curso);
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
          <i
            className={`bi ${
              ICONO_CURSO[cursoActual?.curso] ||
              "bi-journal-bookmark"
            }`}
          />

          <span>
            {cursoActual?.cursoNombre ||
              "Seleccionar curso"}
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
              placeholder="Buscar curso..."
              autoFocus
              aria-label="Buscar curso"
            />

            {busqueda && (
              <button
                type="button"
                className="selector-busqueda__limpiar"
                onClick={() => setBusqueda("")}
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
              {cursosFiltrados.length > 0 ? (
                cursosFiltrados.map((curso) => (
                  <button
                    type="button"
                    key={curso.curso}
                    className={`selector-busqueda__opcion ${
                      String(curso.curso) ===
                      String(cursoSeleccionado)
                        ? "is-seleccionado"
                        : ""
                    }`}
                    onClick={() =>
                      seleccionar(curso)
                    }
                    role="option"
                    aria-selected={
                      String(curso.curso) ===
                      String(cursoSeleccionado)
                    }
                  >
                    <i
                      className={`bi ${
                        ICONO_CURSO[curso.curso] ||
                        "bi-journal-bookmark"
                      }`}
                    />

                    <span>
                      {curso.cursoNombre}
                    </span>

                    {String(curso.curso) ===
                      String(cursoSeleccionado) && (
                      <i className="fas fa-check" />
                    )}
                  </button>
                ))
              ) : (
                <div className="selector-busqueda__vacio">
                  No se encontró ningún curso
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ExamenPage() {
  const [searchParams] = useSearchParams();

  const area =
    searchParams.get("area") || "A";

  const navigate = useNavigate();

  const { setFooterHidden } =
    useFooterVisibility();

  const [etapa, setEtapa] =
    useState("cargando");

  const [preguntas, setPreguntas] =
    useState([]);

  const [respuestas, setRespuestas] =
    useState({});

  const [horaFin, setHoraFin] =
    useState(null);

  /*
   * ============================================================
   * ÍNDICE DEL CURSO
   * ============================================================
   */

  const [indiceCurso, setIndiceCurso] =
    useState(0);

  const [segundosLeft, setSegundosLeft] =
    useState(DURACION_SEGUNDOS);

  const [modal, setModal] =
    useState(null);

  const [resultados, setResultados] =
    useState(null);

  /*
   * ============================================================
   * HEADER / TOPBAR
   * ============================================================
   *
   * topbarVisible controla si la barra superior está visible.
   *
   * topbarRef permite conocer la altura REAL del header.
   * ============================================================
   */

  const [topbarVisible, setTopbarVisible] =
    useState(true);

  const topbarRef = useRef(null);

  /*
   * Ref de respuestas para evitar problemas con estados
   * desactualizados al entregar automáticamente.
   */

  const respuestasRef =
    useRef(respuestas);

  respuestasRef.current = respuestas;

  /*
   * ============================================================
   * OCULTAR TOPBAR CON EL SCROLL
   * ============================================================
   *
   * Funcionamiento:
   *
   * 1. Mientras el scroll no supere la altura del header,
   *    el header permanece visible.
   *
   * 2. Cuando el usuario supera la altura del header y
   *    continúa bajando, el header desaparece.
   *
   * 3. Cuando el usuario empieza a subir, vuelve a aparecer.
   * ============================================================
   */

  useEffect(() => {
    const topbar = topbarRef.current;

    if (!topbar) return;

    let ultimaPosicion = window.scrollY;

    function manejarScroll() {
      const posicionActual = window.scrollY;

      const alturaHeader =
        topbar.offsetHeight;

      /*
       * Si todavía estamos dentro de la altura
       * del header, siempre permanece visible.
       */

      if (posicionActual <= alturaHeader) {
        setTopbarVisible(true);

        ultimaPosicion = posicionActual;

        return;
      }

      /*
       * El usuario está bajando.
       */

      if (posicionActual > ultimaPosicion) {
        setTopbarVisible(false);
      }

      /*
       * El usuario está subiendo.
       */

      else if (posicionActual < ultimaPosicion) {
        setTopbarVisible(true);
      }

      ultimaPosicion = posicionActual;
    }

    window.addEventListener(
      "scroll",
      manejarScroll,
      {
        passive: true,
      }
    );

    return () => {
      window.removeEventListener(
        "scroll",
        manejarScroll
      );
    };
  }, []);

  /*
   * ============================================================
   * FOOTER
   * ============================================================
   */

  useEffect(() => {
    setFooterHidden(true);

    return () =>
      setFooterHidden(false);
  }, [setFooterHidden]);

  /*
   * ============================================================
   * INICIAR / RECUPERAR EXAMEN
   * ============================================================
   */

  useEffect(() => {
    let cancelado = false;

    async function iniciar() {
      const guardado =
        leerEstadoGuardado(area);

      if (guardado) {
        if (cancelado) return;

        setPreguntas(
          guardado.preguntas || []
        );

        setRespuestas(
          guardado.respuestas || {}
        );

        setHoraFin(
          guardado.horaFin
        );

        setSegundosLeft(
          Math.max(
            0,
            Math.round(
              (guardado.horaFin -
                Date.now()) /
                1000
            )
          )
        );

        setEtapa("en_curso");

        return;
      }

      const nuevasPreguntas =
        await armarSimulacro(area);

      if (cancelado) return;

      const fin =
        Date.now() +
        DURACION_SEGUNDOS * 1000;

      setPreguntas(
        nuevasPreguntas
      );

      setRespuestas({});

      setHoraFin(fin);

      setSegundosLeft(
        DURACION_SEGUNDOS
      );

      setEtapa("en_curso");

      guardarEstado({
        area,
        preguntas: nuevasPreguntas,
        respuestas: {},
        horaFin: fin,
      });
    }

    iniciar();

    return () => {
      cancelado = true;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area]);

  /*
   * ============================================================
   * SCROLL ARRIBA AL CAMBIAR DE CURSO
   * ============================================================
   */

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });

    /*
     * Al cambiar de curso, el header vuelve a aparecer.
     */

    setTopbarVisible(true);
  }, [indiceCurso]);

  /*
   * ============================================================
   * CRONÓMETRO
   * ============================================================
   */

  useEffect(() => {
    if (
      etapa !== "en_curso" ||
      !horaFin
    ) {
      return;
    }

    function tick() {
      const restante =
        Math.round(
          (horaFin - Date.now()) /
            1000
        );

      setSegundosLeft(restante);

      if (restante <= 0) {
        entregarExamen();
      }
    }

    tick();

    const id = setInterval(
      tick,
      1000
    );

    return () =>
      clearInterval(id);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapa, horaFin]);

  /*
   * ============================================================
   * ACTUALIZAR RESPUESTA
   * ============================================================
   */

  function actualizarRespuesta(
    preguntaId,
    valor
  ) {
    setRespuestas((prev) => {
      const nuevo = {
        ...prev,
        [preguntaId]: valor,
      };

      guardarEstado({
        area,
        preguntas,
        respuestas: nuevo,
        horaFin,
      });

      return nuevo;
    });
  }

  /*
   * ============================================================
   * ENTREGAR EXAMEN
   * ============================================================
   */

  function entregarExamen() {
    const res =
      calcularResultados(
        preguntas,
        respuestasRef.current
      );

    setResultados(res);

    setEtapa("resultados");

    setModal(null);

    limpiarEstadoGuardado();
  }

  /*
   * ============================================================
   * ABANDONAR EXAMEN
   * ============================================================
   */

  function abandonarExamen() {
    entregarExamen();
  }

  /*
   * ============================================================
   * CARGANDO
   * ============================================================
   */

  if (etapa === "cargando") {
    return (
      <div className="examen-page examen-page--cargando">
        <p>
          Armando tu simulacro del área{" "}
          {area}...
        </p>
      </div>
    );
  }

  /*
   * ============================================================
   * RESULTADOS
   * ============================================================
   */

  if (etapa === "resultados") {
    return (
      <>
        <AppHeader section="examen" />

        <ResultadosExamenPage
          resultados={resultados}
          area={area}
          nombreArea={
            AREAS_UNMSM[area]
          }
          onSalir={() =>
            navigate("/")
          }
        />
      </>
    );
  }

  /*
   * ============================================================
   * AGRUPACIÓN DE PREGUNTAS POR CURSO
   * ============================================================
   */

  const cursos = [];

  const cursosMap = new Map();

  preguntas.forEach((pregunta) => {
    const curso =
      pregunta.curso;

    if (!cursosMap.has(curso)) {
      const grupo = {
        curso,
        cursoNombre:
          pregunta.cursoNombre,
        preguntas: [],
      };

      cursosMap.set(
        curso,
        grupo
      );

      cursos.push(grupo);
    }

    cursosMap
      .get(curso)
      .preguntas.push(pregunta);
  });

  /*
   * ============================================================
   * CURSO ACTUAL
   * ============================================================
   */

  const cursoActual =
    cursos[indiceCurso] ||
    null;

  const preguntasDelCurso =
    cursoActual?.preguntas ||
    [];

  /*
   * ============================================================
   * CONTADOR / PROGRESO
   * ============================================================
   */

  const totalRespondidas =
    Object.keys(respuestas).length;

  /*
   * ============================================================
   * ROTACIÓN DE LA AGUJA
   * ============================================================
   */

  const segundosTranscurridos =
    DURACION_SEGUNDOS -
    segundosLeft;

  const rotacionAguja =
    ((segundosTranscurridos / 60) *
      6) %
    360;

  /*
   * ============================================================
   * CONTEXTO DE TEXTOS RV
   * ============================================================
   */

  const gruposRV = [];

  const gruposRVMap = new Map();

  preguntasDelCurso.forEach(
    (pregunta) => {
      const textoRV =
        pregunta.textoRV;

      if (!textoRV) return;

      const tieneContenido =
        textoRV.titulo ||
        textoRV.texto ||
        textoRV.imagen;

      if (!tieneContenido) return;

      const clave =
        JSON.stringify({
          titulo:
            textoRV.titulo || "",
          texto:
            textoRV.texto || "",
          imagen:
            textoRV.imagen ||
            null,
        });

      if (
        !gruposRVMap.has(clave)
      ) {
        const grupo = {
          clave,
          textoRV,
          preguntas: [],
        };

        gruposRVMap.set(
          clave,
          grupo
        );

        gruposRV.push(grupo);
      }

      gruposRVMap
        .get(clave)
        .preguntas.push(
          pregunta
        );
    }
  );

  /*
   * ============================================================
   * OBTENER CLAVE DEL TEXTO RV
   * ============================================================
   */

  function obtenerClaveTextoRV(
    pregunta
  ) {
    const textoRV =
      pregunta?.textoRV;

    if (!textoRV) return null;

    const tieneContenido =
      textoRV.titulo ||
      textoRV.texto ||
      textoRV.imagen;

    if (!tieneContenido) {
      return null;
    }

    return JSON.stringify({
      titulo:
        textoRV.titulo || "",
      texto:
        textoRV.texto || "",
      imagen:
        textoRV.imagen ||
        null,
    });
  }

  /*
   * ============================================================
   * RENDER DEL TEXTO RV
   * ============================================================
   */

  function renderTextoRV(
    textoRV
  ) {
    if (!textoRV) return null;

    const imagen =
      textoRV.imagen ||
      null;

    const parrafos = (
      textoRV.texto || ""
    )
      .split(/\n\s*\n/)
      .filter(
        (parrafo) =>
          parrafo.trim() !== ""
      );

    return (
      <div className="question-card__inner">
        {textoRV.titulo ? (
          <h3>
            {textoRV.titulo}
          </h3>
        ) : null}

        {textoRV.texto ? (
          <div className="examen-page__rv-texto-contenido">
            {parrafos.map(
              (
                parrafo,
                index
              ) => (
                <p key={index}>
                  {parrafo}
                </p>
              )
            )}
          </div>
        ) : null}

        {imagen ? (
          <img
            src={`${import.meta.env.BASE_URL}${String(
              imagen
            ).replace(
              /^\/+/,
              ""
            )}`}
            alt={
              textoRV.titulo ||
              "Texto de Razonamiento Verbal"
            }
          />
        ) : null}
      </div>
    );
  }

  /*
   * ============================================================
   * RENDER DE UNA TARJETA DE PREGUNTA
   * ============================================================
   */

  function renderTarjetaPregunta(
    pregunta
  ) {
    return (
      <div
        key={pregunta.id}
        className="arcade-game-container question-card examen-page__card"
      >
        <div className="examen-page__curso-tag">
          {cursoActual.cursoNombre}
        </div>

        <div className="question-card__inner">
          <PreguntaSimulacro
            pregunta={pregunta}
            respuesta={
              respuestas[
                pregunta.id
              ] ?? null
            }
            onCambiar={(valor) =>
              actualizarRespuesta(
                pregunta.id,
                valor
              )
            }
          />
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * RENDER DE TODAS LAS PREGUNTAS DEL CURSO
   * ============================================================
   */

  function renderPreguntasDelCurso() {
    if (
      !preguntasDelCurso.length
    ) {
      return (
        <p>
          No se pudo armar el
          simulacro (no hay
          preguntas disponibles
          todavía para esta área).
        </p>
      );
    }

    /*
     * ==========================================================
     * AGRUPAR EN BLOQUES CONSECUTIVOS
     * ==========================================================
     */

    const bloques = [];

    let grupoActual = null;

    preguntasDelCurso.forEach(
      (pregunta) => {
        const claveTextoRV =
          obtenerClaveTextoRV(
            pregunta
          );

        if (claveTextoRV) {
          if (
            grupoActual &&
            grupoActual.clave ===
              claveTextoRV
          ) {
            grupoActual.preguntas.push(
              pregunta
            );

            return;
          }

          grupoActual = {
            clave:
              claveTextoRV,

            textoRV:
              pregunta.textoRV,

            preguntas: [
              pregunta,
            ],
          };

          bloques.push(
            grupoActual
          );

          return;
        }

        grupoActual = null;

        bloques.push({
          clave: null,
          textoRV: null,
          preguntas: [
            pregunta,
          ],
        });
      }
    );

    return bloques.map(
      (bloque) => {
        if (!bloque.textoRV) {
          return renderTarjetaPregunta(
            bloque.preguntas[0]
          );
        }

        return (
          <div
            key={bloque.clave}
            className="examen-page__rv-grupo"
          >
            <div className="arcade-game-container question-card examen-page__card examen-page__rv-texto">
              <div className="examen-page__curso-tag">
                {
                  cursoActual.cursoNombre
                }
              </div>

              {renderTextoRV(
                bloque.textoRV
              )}
            </div>

            {bloque.preguntas.map(
              (pregunta) =>
                renderTarjetaPregunta(
                  pregunta
                )
            )}
          </div>
        );
      }
    );
  }

  /*
   * ============================================================
   * RENDER PRINCIPAL
   * ============================================================
   */

  return (
    <div className="examen-page">

      {/* ======================================================
          TOPBAR DEL EXAMEN
          ====================================================== */}

      <div
        ref={topbarRef}
        className={`examen-page__topbar ${
          topbarVisible
            ? "is-visible"
            : "is-hidden"
        }`}
      >
        <span
          className={`examen-page__timer ${
            segundosLeft <= 300
              ? "is-urgente"
              : ""
          }`}
        >
          <svg
            className="examen-page__clock"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            {/* Esfera del reloj */}

            <circle
              className="examen-page__clock-face"
              cx="12"
              cy="12"
              r="9"
            />

            {/* Aguja */}

            <line
              className="examen-page__clock-minute"
              x1="12"
              y1="12"
              x2="12"
              y2="5"
              style={{
                transform: `rotate(${rotacionAguja}deg)`,
                transformOrigin:
                  "12px 12px",
              }}
            />

            {/* Centro de la aguja */}

            <circle
              className="examen-page__clock-center"
              cx="12"
              cy="12"
              r="1"
            />
          </svg>

          {formatearTiempo(
            segundosLeft
          )}
        </span>

        <span className="examen-page__progreso">
          Curso{" "}
          {cursos.length
            ? indiceCurso + 1
            : 0}{" "}
          / {cursos.length} ·{" "}
          {totalRespondidas}{" "}
          respondidas
        </span>

        <button
          type="button"
          className="examen-page__abandonar-btn"
          onClick={() =>
            setModal("abandonar")
          }
        >
          Abandonar
        </button>
      </div>

      {/* ======================================================
          BODY
          ====================================================== */}

      <div className="examen-page__body container">

        {cursoActual ? (
          <>
            <SelectorCurso
              cursos={cursos}
              cursoSeleccionado={
                cursoActual.curso
              }
              onSeleccionar={(curso) => {
                const nuevoIndice =
                  cursos.findIndex(
                    (item) =>
                      String(
                        item.curso
                      ) ===
                      String(curso)
                  );

                if (
                  nuevoIndice !== -1
                ) {
                  setIndiceCurso(
                    nuevoIndice
                  );
                }
              }}
            />

            {renderPreguntasDelCurso()}
          </>
        ) : (
          <p>
            No se pudo armar el
            simulacro (no hay
            preguntas disponibles
            todavía para esta área).
          </p>
        )}

        {/* ====================================================
            NAVEGACIÓN
            ==================================================== */}

        <div className="examen-page__nav">

          <div className="examen-page__nav-preguntas">

            <button
              type="button"
              disabled={
                indiceCurso === 0 ||
                cursos.length === 0
              }
              onClick={() =>
                setIndiceCurso(
                  (i) =>
                    Math.max(
                      0,
                      i - 1
                    )
                )
              }
              className="examen-page__nav-btn"
            >
              <i className="fas fa-arrow-left" />
              Ant.
            </button>

            <button
              type="button"
              disabled={
                cursos.length === 0 ||
                indiceCurso >=
                  cursos.length - 1
              }
              onClick={() =>
                setIndiceCurso(
                  (i) =>
                    Math.min(
                      cursos.length - 1,
                      i + 1
                    )
                )
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
              setModal("entregar")
            }
          >
            Entregar examen
          </button>

        </div>
      </div>

      {/* ======================================================
          MODAL
          ====================================================== */}

      <AbandonarSimulacroModal
        abierto={modal !== null}
        modo={
          modal || "abandonar"
        }
        onContinuar={() =>
          setModal(null)
        }
        onConfirmar={
          modal === "entregar"
            ? entregarExamen
            : abandonarExamen
        }
      />

    </div>
  );
}