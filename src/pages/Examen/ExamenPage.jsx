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

function leerEstadoGuardado(area) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return null;

    const data = JSON.parse(raw);

    if (data.area !== area) return null;

    if (!data.horaFin || data.horaFin <= Date.now()) return null;

    return data;
  } catch {
    return null;
  }
}

function guardarEstado(estado) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  } catch {
    // Si falla el guardado no rompemos el examen, solo no persiste.
  }
}

function limpiarEstadoGuardado() {
  localStorage.removeItem(STORAGE_KEY);
}

function formatearTiempo(segundos) {
  const s = Math.max(0, Math.round(segundos));

  const h = String(Math.floor(s / 3600)).padStart(2, "0");

  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");

  const ss = String(s % 60).padStart(2, "0");

  return `${h}:${m}:${ss}`;
}

export default function ExamenPage() {
  const [searchParams] = useSearchParams();

  const area = searchParams.get("area") || "A";

  const navigate = useNavigate();

  const { setFooterHidden } = useFooterVisibility();

  const [etapa, setEtapa] = useState("cargando");

  const [preguntas, setPreguntas] = useState([]);

  const [respuestas, setRespuestas] = useState({});

  const [horaFin, setHoraFin] = useState(null);

  /*
   * Ahora el índice representa el CURSO actual,
   * no una pregunta individual.
   */
  const [indiceCurso, setIndiceCurso] = useState(0);

  const [segundosLeft, setSegundosLeft] =
    useState(DURACION_SEGUNDOS);

  const [modal, setModal] = useState(null);

  const [resultados, setResultados] = useState(null);

  const respuestasRef = useRef(respuestas);

  respuestasRef.current = respuestas;

  useEffect(() => {
    setFooterHidden(true);

    return () => setFooterHidden(false);
  }, [setFooterHidden]);

  useEffect(() => {
    let cancelado = false;

    async function iniciar() {
      const guardado = leerEstadoGuardado(area);

      if (guardado) {
        if (cancelado) return;

        setPreguntas(guardado.preguntas || []);

        setRespuestas(guardado.respuestas || {});

        setHoraFin(guardado.horaFin);

        setSegundosLeft(
          Math.max(
            0,
            Math.round(
              (guardado.horaFin - Date.now()) / 1000
            )
          )
        );

        setEtapa("en_curso");

        return;
      }

      const nuevasPreguntas = await armarSimulacro(area);

      if (cancelado) return;

      const fin =
        Date.now() + DURACION_SEGUNDOS * 1000;

      setPreguntas(nuevasPreguntas);

      setRespuestas({});

      setHoraFin(fin);

      setSegundosLeft(DURACION_SEGUNDOS);

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
   *
   * Cuando se navega a otro curso (Ant./Sig. o el selector),
   * la vista debe empezar siempre desde la primera pregunta,
   * no quedarse en el scroll que tenía el curso anterior.
   * ============================================================
   */
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [indiceCurso]);

  useEffect(() => {
    if (etapa !== "en_curso" || !horaFin) return;

    function tick() {
      const restante = Math.round(
        (horaFin - Date.now()) / 1000
      );

      setSegundosLeft(restante);

      if (restante <= 0) {
        entregarExamen();
      }
    }

    tick();

    const id = setInterval(tick, 1000);

    return () => clearInterval(id);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapa, horaFin]);

  function actualizarRespuesta(preguntaId, valor) {
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

  function entregarExamen() {
    const res = calcularResultados(
      preguntas,
      respuestasRef.current
    );

    setResultados(res);

    setEtapa("resultados");

    setModal(null);

    limpiarEstadoGuardado();
  }

  function abandonarExamen() {
    entregarExamen();
  }

  if (etapa === "cargando") {
    return (
      <div className="examen-page examen-page--cargando">
        <p>
          Armando tu simulacro del área {area}...
        </p>
      </div>
    );
  }

  if (etapa === "resultados") {
    return (
      <>
        <AppHeader section="examen" />

        <ResultadosExamenPage
          resultados={resultados}
          area={area}
          nombreArea={AREAS_UNMSM[area]}
          onSalir={() => navigate("/")}
        />
      </>
    );
  }

  /*
   * ============================================================
   * AGRUPACIÓN DE PREGUNTAS POR CURSO
   * ============================================================
   *
   * Se utiliza pregunta.curso como identificador estable.
   *
   * El orden se conserva según la primera aparición de cada
   * curso dentro de preguntas.
   */
  const cursos = [];

  const cursosMap = new Map();

  preguntas.forEach((pregunta) => {
    const curso = pregunta.curso;

    if (!cursosMap.has(curso)) {
      const grupo = {
        curso,
        cursoNombre: pregunta.cursoNombre,
        preguntas: [],
      };

      cursosMap.set(curso, grupo);

      cursos.push(grupo);
    }

    cursosMap.get(curso).preguntas.push(pregunta);
  });

  /*
   * Protección por si el examen todavía no tiene preguntas.
   */
  const cursoActual =
    cursos[indiceCurso] || null;

  const preguntasDelCurso =
    cursoActual?.preguntas || [];

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
   *
   * El examen dura 3 horas.
   * La aguja da una vuelta cada 60 minutos.
   * ============================================================
   */
  const segundosTranscurridos =
    DURACION_SEGUNDOS - segundosLeft;

  const rotacionAguja =
    ((segundosTranscurridos / 60) * 6) % 360;

  /*
   * ============================================================
   * CONTEXTO DE TEXTOS RV
   * ============================================================
   *
   * Cada texto se identifica por su contenido/metadata.
   *
   * Esto permite que preguntas del mismo texto compartan
   * un único bloque de contexto y que textos diferentes
   * permanezcan separados.
   */
  const gruposRV = [];

  const gruposRVMap = new Map();

  preguntasDelCurso.forEach((pregunta) => {
    const textoRV = pregunta.textoRV;

    if (!textoRV) return;

    const tieneContenido =
      textoRV.titulo ||
      textoRV.texto ||
      textoRV.imagen;

    if (!tieneContenido) return;

    const clave = JSON.stringify({
      titulo: textoRV.titulo || "",
      texto: textoRV.texto || "",
      imagen: textoRV.imagen || null,
    });

    if (!gruposRVMap.has(clave)) {
      const grupo = {
        clave,
        textoRV,
        preguntas: [],
      };

      gruposRVMap.set(clave, grupo);

      gruposRV.push(grupo);
    }

    gruposRVMap
      .get(clave)
      .preguntas.push(pregunta);
  });

  /*
   * Determina a qué texto RV pertenece una pregunta.
   */
  function obtenerClaveTextoRV(pregunta) {
    const textoRV = pregunta?.textoRV;

    if (!textoRV) return null;

    const tieneContenido =
      textoRV.titulo ||
      textoRV.texto ||
      textoRV.imagen;

    if (!tieneContenido) return null;

    return JSON.stringify({
      titulo: textoRV.titulo || "",
      texto: textoRV.texto || "",
      imagen: textoRV.imagen || null,
    });
  }

  /*
   * ============================================================
   * RENDER DEL CONTEXTO RV
   * ============================================================
   */
  function renderTextoRV(textoRV) {
    if (!textoRV) return null;

    const imagen =
      textoRV.imagen || null;

    return (
      <div className="question-card__inner">
        {textoRV.titulo ? (
          <h3>{textoRV.titulo}</h3>
        ) : null}

        {textoRV.texto ? (
          <div>
            {textoRV.texto}
          </div>
        ) : null}

        {imagen ? (
          <img
            src={`${import.meta.env.BASE_URL}${String(
              imagen
            ).replace(/^\/+/, "")}`}
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
   * RENDER DE LAS PREGUNTAS DEL CURSO
   *
   * Las preguntas se muestran TODAS.
   * La navegación ya no utiliza un índice de pregunta.
   * ============================================================
   */
  function renderTarjetaPregunta(pregunta) {
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
              respuestas[pregunta.id] ?? null
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

  function renderPreguntasDelCurso() {
    if (!preguntasDelCurso.length) {
      return (
        <p>
          No se pudo armar el simulacro (no hay preguntas
          disponibles todavía para esta área).
        </p>
      );
    }

    /*
     * ==========================================================
     * AGRUPAR EN BLOQUES CONSECUTIVOS
     * ==========================================================
     *
     * Antes, el texto RV se insertaba dentro de la MISMA tarjeta
     * que la primera pregunta del grupo, mientras que el resto
     * de preguntas de ese mismo texto quedaban en tarjetas
     * propias. Eso hacía que la primera pregunta se viera
     * "pegada" al texto y las demás se vieran "separadas" del
     * mismo texto, aunque todas pertenecen al mismo bloque.
     *
     * Ahora el texto se muestra en su PROPIA tarjeta, una sola
     * vez por grupo, y todas sus preguntas (incluida la primera)
     * quedan en tarjetas propias y separadas por igual.
     * ==========================================================
     */
    const bloques = [];

    let grupoActual = null;

    preguntasDelCurso.forEach((pregunta) => {
      const claveTextoRV =
        obtenerClaveTextoRV(pregunta);

      if (claveTextoRV) {
        if (
          grupoActual &&
          grupoActual.clave === claveTextoRV
        ) {
          grupoActual.preguntas.push(pregunta);

          return;
        }

        grupoActual = {
          clave: claveTextoRV,
          textoRV: pregunta.textoRV,
          preguntas: [pregunta],
        };

        bloques.push(grupoActual);

        return;
      }

      grupoActual = null;

      bloques.push({
        clave: null,
        textoRV: null,
        preguntas: [pregunta],
      });
    });

    return bloques.map((bloque) => {
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
              {cursoActual.cursoNombre}
            </div>

            {renderTextoRV(bloque.textoRV)}
          </div>

          {bloque.preguntas.map((pregunta) =>
            renderTarjetaPregunta(pregunta)
          )}
        </div>
      );
    });
  }

  return (
    <div className="examen-page">
      <div className="examen-page__topbar">
        <span
          className={`examen-page__timer ${
            segundosLeft <= 300 ? "is-urgente" : ""
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
                transformOrigin: "12px 12px",
              }}
            />

            {/* Centro de la aguja */}
            <circle
              className="examen-page__clock-center"
              cx="12"
              cy="12"
              r="1"
            />
          </svg>{" "}
          {formatearTiempo(segundosLeft)}
        </span>

        <span className="examen-page__progreso">
          Curso{" "}
          {cursos.length
            ? indiceCurso + 1
            : 0}{" "}
          / {cursos.length} ·{" "}
          {totalRespondidas} respondidas
        </span>

        <button
          type="button"
          className="examen-page__abandonar-btn"
          onClick={() => setModal("abandonar")}
        >
          Abandonar
        </button>
      </div>

      <div className="examen-page__body container">
        {cursoActual ? (
          <>
            <select
              value={cursoActual.curso}
              onChange={(event) => {
                const nuevoIndice =
                  cursos.findIndex(
                    (curso) =>
                      String(curso.curso) ===
                      event.target.value
                  );

                if (nuevoIndice !== -1) {
                  setIndiceCurso(nuevoIndice);
                }
              }}
              aria-label="Seleccionar curso"
            >
              {cursos.map((curso) => (
                <option
                  key={curso.curso}
                  value={curso.curso}
                >
                  {curso.cursoNombre}
                </option>
              ))}
            </select>

            {renderPreguntasDelCurso()}
          </>
        ) : (
          <p>
            No se pudo armar el simulacro (no hay preguntas
            disponibles todavía para esta área).
          </p>
        )}

        <div className="examen-page__nav">
          <div className="examen-page__nav-preguntas">
            <button
              type="button"
              disabled={
                indiceCurso === 0 ||
                cursos.length === 0
              }
              onClick={() =>
                setIndiceCurso((i) =>
                  Math.max(0, i - 1)
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
                indiceCurso >= cursos.length - 1
              }
              onClick={() =>
                setIndiceCurso((i) =>
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
            onClick={() => setModal("entregar")}
          >
            Entregar examen
          </button>
        </div>
      </div>

      <AbandonarSimulacroModal
        abierto={modal !== null}
        modo={modal || "abandonar"}
        onContinuar={() => setModal(null)}
        onConfirmar={
          modal === "entregar"
            ? entregarExamen
            : abandonarExamen
        }
      />
    </div>
  );
}