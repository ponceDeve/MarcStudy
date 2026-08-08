import { useState, useRef, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { usePomodoro } from "../../context/PomodoroContext";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import manifest from "../../data/manifest.json";
import {
  leerHorario,
  guardarHorario,
  hayHorarioConfigurado,
  DIAS_SEMANA,
  DIA_LABELS,
} from "../../lib/scheduleStorage";
import { registrarCursoCompletado } from "../../lib/repasoStorage";
import { normalizarTexto } from "../../lib/buscador";
import {
  limpiarPomodoroCompartido,
  leerYLimpiarRetorno,
  leerRetorno,
  guardarRetorno,
} from "../../lib/pomodoroShared";
import TemaModal from "../../components/TemaModal";
import Modal from "../../components/Modal";
import AppHeader from "../../components/AppHeader";
import SearchModal from "../../components/SearchModal";
import StepsWelcomeModal from "../../components/StepsWelcomeModal";
import ScheduleSetup from "./ScheduleSetup";
import ScheduleEditor from "./ScheduleEditor";

const POMODORO_MIN = 25;
const REST_MIN = 5;

const NOMBRE_DIA = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};

const PASOS_BIENVENIDA = [
  {
    icon: "fa-solid fa-calendar-alt",
    titulo: "¡Bienvenido al Pomodoro!",
    texto: "Aquí armas tu propio horario de estudio con sesiones cronometradas.",
  },
  {
    icon: "fa-solid fa-list-check",
    titulo: "Tu horario, a tu medida",
    texto: "Eliges qué días estudias y qué cursos ves cada día, con cuántos pomodoros cada uno.",
  },
  {
    icon: "fa-solid fa-play",
    titulo: "Sesiones de 25 minutos",
    texto: "Cada pomodoro son 25 min de estudio seguidos de 5 min de descanso, hasta terminar los que elegiste.",
  },
  {
    icon: "fa-solid fa-pen",
    titulo: "¿Cambió tu horario?",
    texto: "Toca 'Editar' arriba cuando quieras para rehacer tus días y cursos.",
  },
];

function buildCourseTasks(course) {
  const tasks = [];
  for (let i = 1; i <= course.pomodoros; i++) {
    tasks.push({
      type: "course",
      detail: `Pomodoro ${i} de ${course.pomodoros}`,
      duration: POMODORO_MIN,
    });
    if (i < course.pomodoros) tasks.push({ type: "rest", duration: REST_MIN });
  }
  return tasks;
}

function progressKey(day, subject) {
  return `${day}::${subject}`;
}

export default function HorarioPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [horario, setHorario] = useState(() => leerHorario() || {});
  const [selectedDay, setSelectedDay] = useState(() => {
    const dias = [
      "domingo",
      "lunes",
      "martes",
      "miercoles",
      "jueves",
      "viernes",
      "sabado",
    ];

    return dias[new Date().getDay()];
  });
  const [activeCourseIdx, setActiveCourseIdx] = useState(null);
  const [progress, setProgress] = useLocalStorage(
    "horario_task_progress_v1",
    {},
  );
  const [temaDesdeLink, setTemaDesdeLink] = useState(null);
  const [retornoTema, setRetornoTema] = useState(() => leerRetorno());

  function volverAlTema() {
    if (!retornoTema) return;
    navigate(`/?q=${encodeURIComponent(retornoTema)}`);
  }

  const [pendingCourseComplete, setPendingCourseComplete] = useState(null);
  const [temaModalOpen, setTemaModalOpen] = useState(false);
  const [courseCompleteOpen, setCourseCompleteOpen] = useState(false);

  const [manualBreak, setManualBreak] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const [welcomeSeen, setWelcomeSeen] = useLocalStorage("horario_welcome_seen", false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  const [cursoRapidoDia, setCursoRapidoDia] = useState(null);
  const [cursoRapidoNombre, setCursoRapidoNombre] = useState("");
  const [temaRapidoElegido, setTemaRapidoElegido] = useState(null);

  const [eligiendoTemaIdx, setEligiendoTemaIdx] = useState(null);
  const [temaElegidoParaCurso, setTemaElegidoParaCurso] = useState(null);

  const alarmRef = useRef(null);

  const courses = horario[selectedDay] || [];
  const diasConfigurados = DIAS_SEMANA.filter((d) => horario[d] && horario[d].length > 0);
  const activeCourse =
    activeCourseIdx !== null ? courses[activeCourseIdx] : null;
  const activeTasks = useMemo(
    () => (activeCourse ? buildCourseTasks(activeCourse) : []),
    [activeCourse],
  );

  const mostrarGate = welcomeSeen && !hayHorarioConfigurado() && !setupOpen;

  useEffect(() => {
    document.body.style.overflow = mostrarGate ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mostrarGate]);

  function getTaskIndex(day, subject) {
    return progress[progressKey(day, subject)] || 0;
  }

  function getDonePomodoros(day, subject, pomodoros) {
    const tasks = buildCourseTasks({ pomodoros });
    const idx = getTaskIndex(day, subject);
    return tasks.slice(0, idx).filter((t) => t.type === "course").length;
  }

  const pomodoro = usePomodoro();
  const { formatted, secondsLeft, isRunning } = pomodoro;
  const reset = pomodoro.reiniciar;

  const currentTaskDuration = activeCourse
    ? activeTasks[getTaskIndex(selectedDay, activeCourse.subject)]?.duration ||
    POMODORO_MIN
    : manualBreak || POMODORO_MIN;
  const progressPct = Math.round(
    ((currentTaskDuration * 60 - secondsLeft) / (currentTaskDuration * 60)) *
    100,
  );

  function iniciarConSync() {
    const label = activeCourse
      ? `${activeCourse.subject} · ${activeTasks[getTaskIndex(selectedDay, activeCourse.subject)]?.detail || ""}`
      : manualBreak
        ? `Descanso de ${manualBreak} min`
        : "";
    pomodoro.iniciar(null, label, activeCourse ? activeCourse.subject : "");

    if (temaElegidoParaCurso) {
      navigate(`/?q=${encodeURIComponent(temaElegidoParaCurso)}`);
      setTemaElegidoParaCurso(null);
      return;
    }

    if (temaDesdeLink) {
      navigate(`/?q=${encodeURIComponent(temaDesdeLink.tema)}`);
      return;
    }

    const retorno = leerYLimpiarRetorno();
    if (retorno) {
      navigate(`/?q=${encodeURIComponent(retorno)}`);
    }
  }

  function pausarConSync() {
    pomodoro.pausar();
  }

  // NUEVO: Atajo global de teclado para iniciar/pausar con la barra espaciadora
  useEffect(() => {
    function handleGlobalKeyDown(e) {
      // Evitar que salte la alerta o accione si hay modales abiertos
      if (searchOpen || setupOpen || editorOpen || eligiendoTemaIdx !== null || cursoRapidoDia || temaModalOpen || courseCompleteOpen) return;

      const activeTag = document.activeElement ? document.activeElement.tagName : "";
      
      // Ignorar si el usuario está escribiendo o el foco ya está en un botón
      if (["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(activeTag)) return;

      if (e.code === "Space") {
        e.preventDefault(); // Evita que la página haga scroll
        if (isRunning) {
          pausarConSync();
        } else if (activeCourse || manualBreak) {
          iniciarConSync();
        }
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isRunning, activeCourse, manualBreak, searchOpen, setupOpen, editorOpen, eligiendoTemaIdx, cursoRapidoDia, temaModalOpen, courseCompleteOpen]);

  function handleTaskComplete() {
    limpiarPomodoroCompartido();

    if (alarmRef.current) {
      alarmRef.current.muted = false;
      alarmRef.current.volume = 1.0;
      alarmRef.current.load();
      alarmRef.current.play().catch(() => { });
    }

    if (!activeCourse) {
      setManualBreak(null);
      return;
    }
    const key = progressKey(selectedDay, activeCourse.subject);
    const currentIdx = getTaskIndex(selectedDay, activeCourse.subject);
    const nextIdx = currentIdx + 1;
    setProgress({ ...progress, [key]: nextIdx });

    if (nextIdx >= activeTasks.length) {
      setPendingCourseComplete({
        subject: activeCourse.subject,
        day: selectedDay,
      });
      setCourseCompleteOpen(true);
      setActiveCourseIdx(null);
    } else {
      reset(activeTasks[nextIdx].duration);
    }
  }

  function abrirCurso(idx) {
    const course = courses[idx];
    const tasks = buildCourseTasks(course);
    const taskIdx = getTaskIndex(selectedDay, course.subject);
    setManualBreak(null);
    setActiveCourseIdx(idx);
    if (taskIdx < tasks.length) {
      reset(tasks[taskIdx].duration);
    }
  }

  function pedirTemaYAbrirCurso(idx) {
    setEligiendoTemaIdx(idx);
  }

  function elegirTemaDeCurso(tema) {
    const idx = eligiendoTemaIdx;
    setEligiendoTemaIdx(null);
    setTemaElegidoParaCurso(tema);
    abrirCurso(idx);
  }

  function omitirTemaDeCurso() {
    const idx = eligiendoTemaIdx;
    setEligiendoTemaIdx(null);
    setTemaElegidoParaCurso(null);
    abrirCurso(idx);
  }

  function iniciarDescansoManual(minutos) {
    setActiveCourseIdx(null);
    setManualBreak(minutos);
    reset(minutos);
  }

  function elegirCursoRapido(dia, nombreCurso) {
    setCursoRapidoDia(dia);
    setCursoRapidoNombre(nombreCurso);
    setTemaRapidoElegido(null);
  }

  function cancelarCursoRapido() {
    setCursoRapidoDia(null);
    setCursoRapidoNombre("");
    setTemaRapidoElegido(null);
  }

  function confirmarCursoRapido() {
    if (!cursoRapidoDia || !cursoRapidoNombre || !temaRapidoElegido) return;

    pomodoro.iniciar(POMODORO_MIN, `${cursoRapidoNombre} · Pomodoro 1 de 4`, cursoRapidoNombre);

    const destino = temaRapidoElegido;
    cancelarCursoRapido();
    navigate(`/?q=${encodeURIComponent(destino)}`);
  }

  function cerrarCourseComplete() {
    setCourseCompleteOpen(false);
    const vieneConTema =
      pendingCourseComplete &&
      temaDesdeLink &&
      temaDesdeLink.curso.toLowerCase() ===
      pendingCourseComplete.subject.toLowerCase();
    if (vieneConTema) {
      registrarCursoCompletado({
        ...pendingCourseComplete,
        tema: temaDesdeLink.tema,
      });
      setPendingCourseComplete(null);
    } else {
      setTemaModalOpen(true);
    }
  }

  function guardarTema(tema) {
    if (pendingCourseComplete)
      registrarCursoCompletado({ ...pendingCourseComplete, tema });
    setPendingCourseComplete(null);
    setTemaModalOpen(false);
  }

  function omitirTema() {
    if (pendingCourseComplete)
      registrarCursoCompletado({ ...pendingCourseComplete, tema: "" });
    setPendingCourseComplete(null);
    setTemaModalOpen(false);
  }

  function terminarSetup(nuevoHorario) {
    guardarHorario(nuevoHorario);
    setHorario(nuevoHorario);
    const configurados = DIAS_SEMANA.filter((d) => nuevoHorario[d] && nuevoHorario[d].length > 0);
    setSelectedDay(configurados[0] || "lunes");
    setActiveCourseIdx(null);
    setSetupOpen(false);
  }

  const activeTaskIdx = activeCourse
    ? getTaskIndex(selectedDay, activeCourse.subject)
    : 0;

  useEffect(() => {
    const cursoParam = searchParams.get("curso");
    const temaParam = searchParams.get("tema");

    const cursoObjetivo = cursoParam || (isRunning ? pomodoro.subject : null);
    if (!cursoObjetivo) return;

    for (const dia of DIAS_SEMANA) {
      const lista = horario[dia] || [];
      const idx = lista.findIndex(
        (c) => normalizarTexto(c.subject) === normalizarTexto(cursoObjetivo),
      );
      if (idx !== -1) {
        setSelectedDay(dia);
        setActiveCourseIdx(idx);

        if (cursoParam) {
          setTemaDesdeLink({ curso: cursoParam, tema: temaParam || "" });
          if (temaParam) {
            guardarRetorno(temaParam);
            setRetornoTema(temaParam);
          }
        }

        const mismoCursoCorriendo =
          isRunning &&
          normalizarTexto(pomodoro.subject || "") === normalizarTexto(cursoObjetivo);

        if (!mismoCursoCorriendo) {
          const tasks = buildCourseTasks(lista[idx]);
          const taskIdx = progress[progressKey(dia, lista[idx].subject)] || 0;
          if (taskIdx < tasks.length) reset(tasks[taskIdx].duration);
        }
        break;
      }
    }
  }, []);

  return (
    <div className="horario">
      <AppHeader
        showHome
        onAbrirBuscador={() => setSearchOpen(true)}
        onEditarHorario={() => setEditorOpen(true)}
      />

      <main className="horario__main">
        {/* Temporizador */}
        <section className="horario__timer-section">
          <div className="horario__timer-card">
            {retornoTema && (
              <button
                onClick={volverAlTema}
                className="horario__btn-volver-tema"
              >
                <i className="fas fa-arrow-left" /> Volver a "{retornoTema}"
              </button>
            )}
            <div className="horario__timer-center">
              {activeCourse && (
                <p className="horario__timer-label">
                  {activeCourse.subject} ·{" "}
                  {activeTasks[activeTaskIdx]?.type === "rest"
                    ? "Descanso"
                    : activeTasks[activeTaskIdx]?.detail || "Completado"}
                </p>
              )}
              {!activeCourse && manualBreak && (
                <p className="horario__timer-label">Descanso de {manualBreak} min</p>
              )}
              <h2 className="timer-font horario__timer-clock">{formatted}</h2>
              <div className="horario__progress-track">
                <div className="horario__progress-fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>

            <div className="horario__timer-controls">
              <div className="horario__timer-btn-row">
                <button
                  onClick={iniciarConSync}
                  disabled={(!activeCourse && !manualBreak) || isRunning}
                  className="horario__btn is-start"
                >
                  <i className="fas fa-play" /> Iniciar
                </button>
                <button
                  onClick={pausarConSync}
                  disabled={!isRunning}
                  className="horario__btn is-pause"
                >
                  <i className="fas fa-pause" /> Pausar
                </button>
                <button
                  onClick={() => reset(currentTaskDuration)}
                  className="horario__btn-reset"
                >
                  <i className="fas fa-rotate-left" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Días + lista de cursos / desglose de pomodoros */}
        <section className="horario__side-section">
          <div className="horario__day-tabs">
            <div
              className="horario__day-row"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "8px",
              }}
            >
              {DIAS_SEMANA.map((dia) => (
                <button
                  key={dia}
                  onClick={() => {
                    setSelectedDay(dia);
                    setActiveCourseIdx(null);
                  }}
                  className={`horario__day-btn ${selectedDay === dia ? "is-active" : ""}`}
                >
                  {DIA_LABELS[dia]}
                </button>
              ))}
            </div>
          </div>

          <div className="horario__courses-card">
            <div className="horario__courses-header">
              <div className="horario__courses-header-left">
                {activeCourse && (
                  <button onClick={() => setActiveCourseIdx(null)} className="horario__back-course">
                    <i className="fas fa-arrow-left" />
                  </button>
                )}
                <div>
                  <h3 className="horario__day-title">{NOMBRE_DIA[selectedDay]}</h3>
                  <p className="horario__day-sub">
                    {activeCourse
                      ? `${activeCourse.subject} · ${getDonePomodoros(selectedDay, activeCourse.subject, activeCourse.pomodoros)}/${activeCourse.pomodoros} pomodoros`
                      : courses.length > 0
                        ? "Elige un curso para empezar"
                        : "Sin cursos configurados este día"}
                  </p>
                </div>
              </div>
              {!activeCourse && courses.length > 0 && (
                <button
                  onClick={() => {
                    const cleared = { ...progress };
                    courses.forEach(
                      (c) => delete cleared[progressKey(selectedDay, c.subject)],
                    );
                    setProgress(cleared);
                  }}
                  className="horario__reset-link"
                >
                  <i className="fas fa-rotate-left" /> Reiniciar
                </button>
              )}
            </div>

            {/* Lista de cursos del día */}
            {!activeCourse && (
              <div className="horario__course-list">
                {courses.map((c, idx) => {
                  const done = getDonePomodoros(selectedDay, c.subject, c.pomodoros);
                  const isComplete = done >= c.pomodoros;
                  const pct = Math.round((done / c.pomodoros) * 100);
                  const statusText = isComplete
                    ? "Completado"
                    : done > 0
                      ? "En curso"
                      : "No iniciado";

                  return (
                    <div
                      key={idx}
                      role="button"
                      tabIndex={isComplete ? -1 : 0}
                      onClick={() => !isComplete && pedirTemaYAbrirCurso(idx)}
                      onKeyDown={(e) => {
                        // NUEVO: Permite abrir el curso usando Enter o Espacio
                        if (!isComplete && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          pedirTemaYAbrirCurso(idx);
                        }
                      }}
                      className={`horario__course-item ${isComplete ? "is-complete" : ""}`}
                    >
                      <div className="horario__course-top">
                        <div className="horario__course-tags">
                          <h4 className="horario__course-name">{c.subject}</h4>
                        </div>
                        {isComplete ? (
                          <i className="fas fa-check horario__check-icon" />
                        ) : (
                          <i className="fas fa-chevron-right horario__chevron-icon" />
                        )}
                      </div>
                      <div className="horario__course-progress">
                        <div className="horario__mini-track">
                          <div className="horario__mini-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="horario__course-count">{done}/{c.pomodoros} 🍅</span>
                      </div>
                      <p className="horario__course-status">{statusText}</p>
                    </div>
                  );
                })}

                <div className="horario__rest-row">
                  <button className="horario__rest-btn" onClick={() => iniciarDescansoManual(10)}>
                    Desc. 10
                  </button>
                  <button className="horario__rest-btn" onClick={() => iniciarDescansoManual(30)}>
                    Desc. 30
                  </button>
                </div>

                <div style={{ marginTop: "14px" }}>
                  <label style={{ display: "block", fontSize: "0.82rem", color: "var(--ink-soft)", marginBottom: "6px" }}>
                    Escoge un curso
                  </label>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) elegirCursoRapido(selectedDay, e.target.value);
                    }}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "12px 14px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-strong)",
                      background: "var(--bg)",
                      color: "var(--ink)",
                      fontSize: "0.9rem",
                    }}
                  >
                    <option value="" disabled>
                      Selecciona un curso...
                    </option>
                    {manifest.cursos.map((c) => (
                      <option key={c.nombre} value={c.nombre}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Desglose de pomodoros + descansos del curso activo */}
            {activeCourse && (
              <div className="horario__task-list">
                {activeTasks.map((task, index) => {
                  const isActive = index === activeTaskIdx;
                  const isPast = index < activeTaskIdx;

                  if (task.type === "course") {
                    return (
                      <div key={index} className="horario__task-row">
                        <div className={`horario__task-dot ${isPast ? "is-past" : ""}`}>
                          {isPast ? (
                            <i className="fas fa-check horario__task-check-icon" />
                          ) : (
                            <span>{Math.floor(index / 2) + 1}</span>
                          )}
                        </div>
                        <div
                          className={`horario__task-box ${isPast ? "is-past" : ""} ${isActive ? "is-active" : ""}`}
                        >
                          <div className="horario__task-box-top">
                            <h4 className="horario__task-box-title">{activeCourse.subject}</h4>
                          </div>
                          <p className="horario__task-box-detail">{task.detail}</p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={index} className="horario__task-row">
                      <div className={`horario__rest-dot ${isPast ? "is-past" : ""}`}>
                        <svg className="horario__tomato-svg" viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M12 3c.9 0 1.5.9 1.5.9s.6-.9 1.6-.9c-.1 1.1-.9 1.7-1.5 1.9 3.7.4 6.6 3.3 6.6 8.3 0 4.9-3.7 7.8-8.2 7.8s-8.2-2.9-8.2-7.8c0-5 2.9-7.9 6.6-8.3-.6-.2-1.4-.8-1.5-1.9 1 0 1.6.9 1.6.9S11.1 3 12 3z"
                            fill="currentColor"
                          />
                        </svg>
                        <i className={`fa-solid ${isPast ? "fa-check" : "fa-lock"} horario__tomato-icon`} />
                      </div>
                      <div
                        className={`horario__rest-box ${isPast ? "is-past" : ""} ${isActive ? "is-active" : ""}`}
                      >
                        Descanso ({task.duration} min)
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <audio ref={alarmRef} src="sonidos/loud-alarm-ringtones-annoying.mp3" preload="auto" />

      <Modal open={courseCompleteOpen} onClose={cerrarCourseComplete} wide>
        <button onClick={cerrarCourseComplete} className="modal-close-x" aria-label="Cerrar">
          <i className="fa-solid fa-times" />
        </button>
        <div className="horario__complete-modal">
          <div className="horario__complete-emoji">🎉</div>
          <h2 className="horario__complete-title">¡Felicidades!</h2>
          <p className="horario__complete-sub">
            Completaste el curso de {pendingCourseComplete?.subject}
          </p>
          <p className="horario__complete-msg">
            Así es como entran a la UNMSM:
            <br />
            curso por curso 🎓
          </p>
          <button onClick={cerrarCourseComplete} className="horario__complete-btn">
            Seguir así
          </button>
        </div>
      </Modal>

      <TemaModal
        open={temaModalOpen}
        subject={pendingCourseComplete?.subject}
        day={pendingCourseComplete?.day}
        onGuardar={guardarTema}
        onOmitir={omitirTema}
      />

      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={(item) => {
          setSearchOpen(false);
          navigate(`/?q=${encodeURIComponent(item.nombre)}`);
        }}
      />

      <Modal open={eligiendoTemaIdx !== null} onClose={omitirTemaDeCurso}>
        <button onClick={omitirTemaDeCurso} className="modal-close-x" aria-label="Cerrar">
          <i className="fa-solid fa-times" />
        </button>
        <div className="tema-selector">
          <h3 className="tema-selector__titulo">
            {eligiendoTemaIdx !== null ? courses[eligiendoTemaIdx]?.subject : ""}
          </h3>

          <p className="tema-selector__descripcion">
            Elige el tema que vas a estudiar:
          </p>

          <div className="tema-selector__lista">
            {(manifest.cursos.find(
              (c) =>
                normalizarTexto(c.nombre) ===
                normalizarTexto(
                  eligiendoTemaIdx !== null ? courses[eligiendoTemaIdx]?.subject : ""
                ),
            )?.temas || []).map((t) => (
              <button
                key={t.tema}
                onClick={() => elegirTemaDeCurso(t.tema)}
                className="tema-selector__boton"
              >
                {t.tema}
              </button>
            ))}
          </div>

          <button
            onClick={omitirTemaDeCurso}
            className="tema-selector__omitir"
          >
            Omitir por ahora
          </button>
        </div>
      </Modal>

      <Modal open={!!cursoRapidoDia} onClose={cancelarCursoRapido}>
        <button onClick={cancelarCursoRapido} className="modal-close-x" aria-label="Cerrar">
          <i className="fa-solid fa-times" />
        </button>
        <div className="tema-selector">
          <h3 className="tema-selector__titulo">{cursoRapidoNombre}</h3>

          {!temaRapidoElegido ? (
            <>
              <p className="tema-selector__descripcion">
                Elige el tema que vas a repasar en{" "}
                {cursoRapidoDia && DIA_LABELS[cursoRapidoDia]}:
              </p>

              <div className="tema-selector__lista">
                {(manifest.cursos.find(
                  (c) => normalizarTexto(c.nombre) === normalizarTexto(cursoRapidoNombre)
                )?.temas || []).map((t) => (
                  <button
                    key={t.tema}
                    onClick={() => setTemaRapidoElegido(t.tema)}
                    className="tema-selector__boton"
                  >
                    {t.tema}
                  </button>
                ))}
              </div>

              <button
                onClick={cancelarCursoRapido}
                className="tema-selector__omitir"
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              <p className="tema-selector__descripcion">
                Vas a estudiar "{temaRapidoElegido}" ahora, con el pomodoro corriendo.
                ¿Confirmas?
              </p>

              <div className="tema-selector__acciones">
                <button
                  onClick={cancelarCursoRapido}
                  className="tema-selector__accion tema-selector__omitir"
                >
                  Cancelar
                </button>

                <button
                  onClick={confirmarCursoRapido}
                  className="tema-selector__accion tema-selector__iniciar"
                >
                  Iniciar
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <StepsWelcomeModal
        open={!welcomeSeen}
        pasos={PASOS_BIENVENIDA}
        labelFinal="Entendido"
        onFinish={() => setWelcomeSeen(true)}
      />

      {mostrarGate && (
        <div className="gate-overlay">
          <style>{`
            .gate-overlay {
              position: fixed;
              inset: 0;
              z-index: 9999;
              display: flex;
              align-items: center;
              justify-content: center;
              background: var(--overlay-strong);
              backdrop-filter: blur(6px);
            }
            .gate-btn {
              padding: 18px 32px;
              border-radius: var(--radius-md);
              font-size: 1.05rem;
              display: flex;
              align-items: center;
              gap: 10px;
            }
          `}</style>
          <button className="gate-btn btn-primary" onClick={() => setSetupOpen(true)}>
            <i className="fa-solid fa-calendar-alt" /> Configurar Pomodoro
          </button>
        </div>
      )}

      <ScheduleSetup
        open={setupOpen}
        onComplete={terminarSetup}
        onCancel={null}
      />

      {editorOpen && (
        <ScheduleEditor
          open={editorOpen}
          horarioInicial={horario}
          onGuardar={(nuevoHorario) => {
            guardarHorario(nuevoHorario);
            setHorario(nuevoHorario);
          }}
          onCerrar={() => {
            setEditorOpen(false);
            const configurados = DIAS_SEMANA.filter((d) => horario[d] && horario[d].length > 0);
            setSelectedDay((prev) => (horario[prev] ? prev : configurados[0] || "lunes"));
            setActiveCourseIdx(null);
          }}
        />
      )}
    </div>
  );
}