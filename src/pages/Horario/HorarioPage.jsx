import { useState, useRef, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { usePomodoro } from "../../context/PomodoroContext";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import manifest from "../../data/manifest.json";
import { normalizarTexto } from "../../lib/buscador";
import {
  leerHorario,
  guardarHorario,
  hayHorarioConfigurado,
  DIAS_SEMANA,
  DIA_LABELS,
} from "../../lib/scheduleStorage";

import { registrarCursoCompletado } from "../../lib/repasoStorage";

import { leerProgresoHorario } from "../../lib/horarioProgress";

import {
  limpiarPomodoroCompartido,
  leerPomodoroCompartido,
  leerYLimpiarRetorno,
  leerRetorno,
  guardarRetorno,
} from "../../lib/pomodoroShared";

import TemaModal from "../../components/TemaModal";
import Modal from "../../components/Modal";
import AppHeader from "../../components/AppHeader";
import SearchModal from "../../components/SearchModal";
import ScheduleSetup from "./ScheduleSetup";

const POMODORO_MIN = 25;
const REST_MIN = 5;
const DURACIONES_DESCANSO = [5, 10, 15, 20, 25, 30, 35, 40];

const NOMBRE_DIA = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
};

function buildCourseTasks(course) {
  const tasks = [];

  for (let i = 1; i <= course.pomodoros; i++) {
    tasks.push({
      type: "course",
      detail: `Pomodoro ${i} de ${course.pomodoros}`,
      duration: POMODORO_MIN,
    });

    if (i < course.pomodoros) {
      tasks.push({
        type: "rest",
        duration: REST_MIN,
      });
    }
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

  const [pendingCourseComplete, setPendingCourseComplete] = useState(null);

  const [temaModalOpen, setTemaModalOpen] = useState(false);

  const [courseCompleteOpen, setCourseCompleteOpen] = useState(false);

  const [manualBreak, setManualBreak] = useState(null);

  // Descanso sin tiempo por defecto
  const [breakDuration, setBreakDuration] = useState("");

  const [searchOpen, setSearchOpen] = useState(false);

  const [setupOpen, setSetupOpen] = useState(false);

  const [cursoRapidoDia, setCursoRapidoDia] = useState(null);

  const [cursoRapidoNombre, setCursoRapidoNombre] = useState("");

  const [temaRapidoElegido, setTemaRapidoElegido] = useState(null);

  const [cursoPickerOpen, setCursoPickerOpen] = useState(false);

  const [eligiendoTemaIdx, setEligiendoTemaIdx] = useState(null);

  const [temaSeleccionadoTmp, setTemaSeleccionadoTmp] = useState(null);

  const [temaElegidoParaCurso, setTemaElegidoParaCurso] = useState(null);

  const [isLocked, setIsLocked] = useLocalStorage(
    "horario_rest_locked",
    false,
  );

  const [lockConfirmOpen, setLockConfirmOpen] = useState(false);

  const [cursoRapidoPreparado, setCursoRapidoPreparado] = useState(null);

  const [alarmActive, setAlarmActive] = useState(false);

  const alarmRef = useRef(null);

  const courses = horario[selectedDay] || [];

  const activeCourse =
    activeCourseIdx !== null ? courses[activeCourseIdx] : null;

  const activeTasks = useMemo(
    () => (activeCourse ? buildCourseTasks(activeCourse) : []),
    [activeCourse],
  );

  const mostrarGate = !hayHorarioConfigurado() && !setupOpen;

  useEffect(() => {
    document.body.style.overflow = mostrarGate ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mostrarGate]);

  function volverAlTema() {
    if (!retornoTema) return;

    navigate(`/?q=${encodeURIComponent(retornoTema)}`);
  }

  function getTaskIndex(day, subject) {
    return progress[progressKey(day, subject)] || 0;
  }

  function getDonePomodoros(day, subject, pomodoros) {
    const tasks = buildCourseTasks({ pomodoros });
    const idx = getTaskIndex(day, subject);

    return tasks
      .slice(0, idx)
      .filter((t) => t.type === "course")
      .length;
  }

  const pomodoro = usePomodoro();

  const {
    formatted,
    secondsLeft,
    totalSeconds,
    isRunning,
  } = pomodoro;

  const reset = pomodoro.reiniciar;

  const currentTaskDuration =
    totalSeconds > 0
      ? totalSeconds / 60
      : activeCourse
        ? activeTasks[
            getTaskIndex(
              selectedDay,
              activeCourse.subject,
            )
          ]?.duration || POMODORO_MIN
        : manualBreak || POMODORO_MIN;

  const progressPct =
    totalSeconds > 0
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(
              ((totalSeconds - secondsLeft) / totalSeconds) * 100,
            ),
          ),
        )
      : 0;

  function apagarAlarma() {
    const audios = document.querySelectorAll("audio");

    audios.forEach((audio) => {
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = true;
      } catch {
        // Ignorar errores de audio.
      }
    });

    setAlarmActive(false);
  }

  function handleAlarmEnded() {
    setAlarmActive(false);

    if (alarmRef.current) {
      alarmRef.current.muted = false;
      alarmRef.current.currentTime = 0;
    }
  }

  function resetConSync(duration) {
    apagarAlarma();

    if (alarmRef.current) {
      alarmRef.current.muted = false;
    }

    reset(duration);
  }

  useEffect(() => {
    if (!isLocked || isRunning) return;

    const guardado = leerPomodoroCompartido();

    const sigueVigente =
      guardado &&
      guardado.running &&
      guardado.endTimestamp > Date.now();

    if (!sigueVigente) {
      setIsLocked(false);
    }
  }, [isLocked, isRunning, setIsLocked]);

  function iniciarConSync() {
    apagarAlarma();

    const taskIndex = activeCourse
      ? getTaskIndex(
          selectedDay,
          activeCourse.subject,
        )
      : null;

    const isCourseTask =
      activeCourse &&
      activeTasks[taskIndex]?.type === "course";

    const label = activeCourse
      ? `${activeCourse.subject} · ${
          activeTasks[taskIndex]?.detail || ""
        }`
      : cursoRapidoPreparado
        ? `${cursoRapidoPreparado} · Pomodoro 1 de 4`
        : manualBreak
          ? `Descanso de ${manualBreak} min`
          : "";

    pomodoro.iniciar(
      null,
      label,
      activeCourse
        ? activeCourse.subject
        : cursoRapidoPreparado || "",
      activeCourse
        ? selectedDay
        : cursoRapidoPreparado
          ? selectedDay
          : "",
    );

    if (cursoRapidoPreparado) {
      setCursoRapidoPreparado(null);
    }

    if (temaElegidoParaCurso) {
      navigate(
        `/?q=${encodeURIComponent(
          temaElegidoParaCurso,
        )}`,
      );

      setTemaElegidoParaCurso(null);
      return;
    }

    if (temaDesdeLink) {
      navigate(
        `/?q=${encodeURIComponent(
          temaDesdeLink.tema,
        )}`,
      );

      return;
    }

    const retorno = leerYLimpiarRetorno();

    if (retorno && isCourseTask) {
      navigate(
        `/?q=${encodeURIComponent(retorno)}`,
      );
    }
  }

  function pausarConSync() {
    pomodoro.pausar();
  }

  useEffect(() => {
    function handleGlobalKeyDown(e) {
      if (
        searchOpen ||
        setupOpen ||
        eligiendoTemaIdx !== null ||
        cursoRapidoDia ||
        temaModalOpen ||
        courseCompleteOpen ||
        lockConfirmOpen ||
        isLocked
      ) {
        return;
      }

      const activeTag = document.activeElement
        ? document.activeElement.tagName
        : "";

      if (
        ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(
          activeTag,
        )
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();

        if (isRunning) {
          pausarConSync();
        } else if (activeCourse || manualBreak) {
          iniciarConSync();
        }
      }
    }

    window.addEventListener(
      "keydown",
      handleGlobalKeyDown,
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleGlobalKeyDown,
      );
  }, [
    isRunning,
    activeCourse,
    manualBreak,
    searchOpen,
    setupOpen,
    eligiendoTemaIdx,
    cursoRapidoDia,
    temaModalOpen,
    courseCompleteOpen,
    lockConfirmOpen,
    isLocked,
  ]);

  function handleTaskComplete({
    day,
    subject,
    completado,
  } = {}) {
    limpiarPomodoroCompartido();

    if (alarmRef.current) {
      const audio = alarmRef.current;

      audio.muted = false;
      audio.volume = 1.0;
      audio.currentTime = 0;

      audio
        .play()
        .then(() => setAlarmActive(true))
        .catch(() => setAlarmActive(false));
    }

    if (isLocked) {
      setIsLocked(false);

      if (retornoTema) {
        navigate(
          `/?q=${encodeURIComponent(
            retornoTema,
          )}`,
        );
      }
    }

    if (!subject) {
      setManualBreak(null);
      return;
    }

    setProgress(leerProgresoHorario());

    if (completado) {
      setPendingCourseComplete({
        subject,
        day,
      });

      setCourseCompleteOpen(true);
      setActiveCourseIdx(null);

      return;
    }

    if (
      activeCourse &&
      activeCourse.subject === subject &&
      selectedDay === day
    ) {
      const idx = getTaskIndex(day, subject);

      if (activeTasks[idx]) {
        resetConSync(activeTasks[idx].duration);
      }
    }
  }

  useEffect(() => {
    pomodoro.registrarOnComplete(handleTaskComplete);

    return () =>
      pomodoro.registrarOnComplete(null);
  });

  function abrirCurso(idx) {
    const course = courses[idx];

    const tasks = buildCourseTasks(course);

    const taskIdx = getTaskIndex(
      selectedDay,
      course.subject,
    );

    setManualBreak(null);

    setActiveCourseIdx(idx);

    const yaEstaCorriendo =
      isRunning &&
      normalizarTexto(
        pomodoro.subject || "",
      ) === normalizarTexto(course.subject);

    if (
      !yaEstaCorriendo &&
      taskIdx < tasks.length
    ) {
      resetConSync(tasks[taskIdx].duration);
    }
  }

  function abrirOPedirTema(idx) {
    const course = courses[idx];

    const yaEstaCorriendo =
      isRunning &&
      normalizarTexto(
        pomodoro.subject || "",
      ) === normalizarTexto(course.subject);

    if (yaEstaCorriendo) {
      abrirCurso(idx);
    } else {
      pedirTemaYAbrirCurso(idx);
    }
  }

  function pedirTemaYAbrirCurso(idx) {
    setEligiendoTemaIdx(idx);
    setTemaSeleccionadoTmp(null);
  }

  function marcarTemaTmp(tema) {
    setTemaSeleccionadoTmp(tema);
  }

  function aceptarTemaDeCurso() {
    if (!temaSeleccionadoTmp) return;

    const idx = eligiendoTemaIdx;

    leerYLimpiarRetorno();

    setRetornoTema(null);

    setEligiendoTemaIdx(null);

    setTemaElegidoParaCurso(
      temaSeleccionadoTmp,
    );

    setTemaSeleccionadoTmp(null);

    abrirCurso(idx);
  }

  function omitirTemaDeCurso() {
    setEligiendoTemaIdx(null);
    setTemaSeleccionadoTmp(null);
    setTemaElegidoParaCurso(null);
  }

  function iniciarDescansoManual(minutos) {
    apagarAlarma();

    setActiveCourseIdx(null);

    setManualBreak(minutos);

    resetConSync(minutos);
  }

  function cambiarDuracionDescanso(e) {
    const valor = e.target.value;

    if (valor === "") {
      setBreakDuration("");
      setManualBreak(null);
      return;
    }

    const minutos = Number(valor);

    setBreakDuration(minutos);
    setManualBreak(minutos);

    if (!isRunning) {
      resetConSync(minutos);
    }
  }

  function elegirCursoRapido(
    dia,
    nombreCurso,
  ) {
    setCursoPickerOpen(false);

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
    if (
      !cursoRapidoDia ||
      !cursoRapidoNombre ||
      !temaRapidoElegido
    ) {
      return;
    }

    apagarAlarma();

    setActiveCourseIdx(null);

    setManualBreak(null);

    setCursoRapidoPreparado(
      cursoRapidoNombre,
    );

    setTemaElegidoParaCurso(
      temaRapidoElegido,
    );

    resetConSync(POMODORO_MIN);

    cancelarCursoRapido();
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
    if (pendingCourseComplete) {
      registrarCursoCompletado({
        ...pendingCourseComplete,
        tema,
      });
    }

    setPendingCourseComplete(null);
    setTemaModalOpen(false);
  }

  function omitirTema() {
    if (pendingCourseComplete) {
      registrarCursoCompletado({
        ...pendingCourseComplete,
        tema: "",
      });
    }

    setPendingCourseComplete(null);
    setTemaModalOpen(false);
  }

  function terminarSetup(nuevoHorario) {
    guardarHorario(nuevoHorario);

    setHorario(nuevoHorario);

    const configurados = DIAS_SEMANA.filter(
      (d) =>
        nuevoHorario[d] &&
        nuevoHorario[d].length > 0,
    );

    setSelectedDay(
      configurados[0] || "lunes",
    );

    setActiveCourseIdx(null);

    setSetupOpen(false);
  }

  const activeTaskIdx = activeCourse
    ? getTaskIndex(
        selectedDay,
        activeCourse.subject,
      )
    : 0;

  useEffect(() => {
    const cursoParam = searchParams.get("curso");
    const temaParam = searchParams.get("tema");

    const cursoObjetivo =
      cursoParam ||
      (isRunning ? pomodoro.subject : null);

    if (!cursoObjetivo) return;

    for (const dia of DIAS_SEMANA) {
      const lista = horario[dia] || [];

      const idx = lista.findIndex(
        (c) =>
          normalizarTexto(c.subject) ===
          normalizarTexto(cursoObjetivo),
      );

      if (idx !== -1) {
        setSelectedDay(dia);

        setActiveCourseIdx(idx);

        if (cursoParam) {
          setTemaDesdeLink({
            curso: cursoParam,
            tema: temaParam || "",
          });

          if (temaParam) {
            guardarRetorno(temaParam);
            setRetornoTema(temaParam);
          }
        }

        const mismoCursoCorriendo =
          isRunning &&
          normalizarTexto(
            pomodoro.subject || "",
          ) ===
            normalizarTexto(cursoObjetivo);

        if (!mismoCursoCorriendo) {
          const tasks = buildCourseTasks(
            lista[idx],
          );

          const taskIdx =
            progress[
              progressKey(
                dia,
                lista[idx].subject,
              )
            ] || 0;

          if (taskIdx < tasks.length) {
            resetConSync(
              tasks[taskIdx].duration,
            );
          }
        }

        break;
      }
    }
  }, []);

  if (isLocked) {
    return (
      <div className="horario__lock-screen">
        <h2 className="timer-font horario__lock-clock">
          {formatted}
        </h2>

        <p className="horario__lock-title">
          Debes descansar porque ya estudiaste mucho.
        </p>

        <p className="horario__lock-sub">
          La pantalla se desbloqueará
          automáticamente al terminar el tiempo.
        </p>
      </div>
    );
  }

  return (
    <div className="horario">
      <AppHeader
        section="pomodoro"
        onAbrirBuscador={() =>
          setSearchOpen(true)
        }
        onEditarHorario={() =>
          navigate("/editar")
        }
      />

      <main className="horario__main">
        <section className="horario__timer-section">
          <div className="horario__timer-card">
            {retornoTema && (
              <button
                onClick={volverAlTema}
                className="horario__btn-volver-tema"
              >
                <i className="fas fa-arrow-left" />{" "}
                Volver al tema "{retornoTema}"
              </button>
            )}

            <div className="horario__timer-center">
              {activeCourse && (
                <p className="horario__timer-label">
                  {activeCourse.subject} ·{" "}
                  {activeTasks[activeTaskIdx]
                    ?.type === "rest"
                    ? "Descanso"
                    : activeTasks[activeTaskIdx]
                          ?.detail ||
                      "Completado"}
                </p>
              )}

              {!activeCourse &&
                manualBreak && (
                  <p className="horario__timer-label">
                    Descanso de {manualBreak} min
                  </p>
                )}

              {!activeCourse &&
                !manualBreak &&
                cursoRapidoPreparado && (
                  <p className="horario__timer-label">
                    {cursoRapidoPreparado} ·
                    Pomodoro 1 de 4
                  </p>
                )}

              <h2 className="timer-font horario__timer-clock">
                {formatted}
              </h2>

              <div className="horario__progress-track">
                <div
                  className="horario__progress-fill"
                  style={{
                    "--fill-pct": `${progressPct}%`,
                  }}
                />
              </div>
            </div>

            <div className="horario__timer-controls">
              <div className="horario__timer-btn-row">
                <button
                  onClick={iniciarConSync}
                  disabled={
                    (!activeCourse &&
                      !manualBreak &&
                      !cursoRapidoPreparado) ||
                    isRunning
                  }
                  className="horario__btn is-start"
                >
                  <i className="fas fa-play" />{" "}
                  Iniciar
                </button>

                <button
                  onClick={pausarConSync}
                  disabled={!isRunning}
                  className="horario__btn is-pause"
                >
                  <i className="fas fa-pause" />{" "}
                  Pausar
                </button>

                <button
                  onClick={() =>
                    resetConSync(
                      currentTaskDuration,
                    )
                  }
                  className="horario__btn-reset"
                >
                  <i className="fas fa-rotate-left" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="horario__side-section">
          <div className="horario__day-tabs">
            <div className="horario__day-row">
              {DIAS_SEMANA.map((dia) => (
                <button
                  key={dia}
                  onClick={() => {
                    setSelectedDay(dia);
                    setActiveCourseIdx(null);
                  }}
                  className={`horario__day-btn ${
                    selectedDay === dia
                      ? "is-active"
                      : ""
                  }`}
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
                  <button
                    onClick={() =>
                      setActiveCourseIdx(null)
                    }
                    className="horario__back-course"
                  >
                    <i className="fas fa-arrow-left" />
                  </button>
                )}

                <div>
                  <h3 className="horario__day-title">
                    {NOMBRE_DIA[selectedDay]}
                  </h3>
                </div>
              </div>
            </div>

            {!activeCourse && (
              <div className="horario__course-list">
                {courses.map((c, idx) => {
                  const done =
                    getDonePomodoros(
                      selectedDay,
                      c.subject,
                      c.pomodoros,
                    );

                  const isComplete =
                    done >= c.pomodoros;

                  const pct = Math.round(
                    (done / c.pomodoros) *
                      100,
                  );

                  const statusText =
                    isComplete
                      ? "Completado"
                      : done > 0
                        ? "En curso"
                        : "No iniciado";

                  return (
                    <div
                      key={idx}
                      role="button"
                      tabIndex={
                        isComplete ? -1 : 0
                      }
                      onClick={() =>
                        !isComplete &&
                        abrirOPedirTema(idx)
                      }
                      onKeyDown={(e) => {
                        if (
                          !isComplete &&
                          (e.key === "Enter" ||
                            e.key === " ")
                        ) {
                          e.preventDefault();
                          abrirOPedirTema(idx);
                        }
                      }}
                      className={`horario__course-item ${
                        isComplete
                          ? "is-complete"
                          : ""
                      }`}
                    >
                      <div className="horario__course-top">
                        <div className="horario__course-tags">
                          <h4 className="horario__course-name">
                            {c.subject}
                          </h4>
                        </div>

                        {isComplete ? (
                          <i className="fas fa-check horario__check-icon" />
                        ) : (
                          <i className="fas fa-chevron-right horario__chevron-icon" />
                        )}
                      </div>

                      <div className="horario__course-progress">
                        <div className="horario__mini-track">
                          <div
                            className="horario__mini-fill"
                            style={{
                              "--fill-pct": `${pct}%`,
                            }}
                          />
                        </div>

                        <span className="horario__course-count">
                          {done}/{c.pomodoros} 🍅
                        </span>
                      </div>

                      <p className="horario__course-status">
                        {statusText}
                      </p>
                    </div>
                  );
                })}

                <div className="horario__rest-row">
                  <div className="horario__rest-select">
                    <div className="horario__rest-info">
                      <p className="horario__rest-message">
                        Elige la duración de tu
                        descanso
                      </p>
                    </div>

                    <div className="horario__rest-select-control">
                      <i className="fa-solid fa-mug-hot" />

                      <select
                        value={breakDuration}
                        onChange={
                          cambiarDuracionDescanso
                        }
                        disabled={isRunning}
                        aria-label="Duración del descanso"
                      >
                        <option
                          value=""
                          disabled
                        >
                          Descanso sin tiempo
                        </option>

                        {DURACIONES_DESCANSO.map(
                          (minutos) => (
                            <option
                              key={minutos}
                              value={minutos}
                            >
                              Desc. {minutos} min
                            </option>
                          ),
                        )}
                      </select>

                      <i className="fas fa-chevron-down" />
                    </div>
                  </div>
                </div>

                <div className="horario__quick-course">
                  <label className="horario__quick-course-label">
                    Escoge un curso
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      setCursoPickerOpen(true)
                    }
                    className="horario__quick-course-select horario__quick-course-btn"
                  >
                    Selecciona un curso...
                    <i className="fas fa-chevron-down" />
                  </button>
                </div>
              </div>
            )}

            {activeCourse && (
              <div className="horario__task-list">
                {activeTasks.map(
                  (task, index) => {
                    const isActive =
                      index === activeTaskIdx;

                    const isPast =
                      index < activeTaskIdx;

                    if (
                      task.type === "course"
                    ) {
                      return (
                        <div
                          key={index}
                          className="horario__task-row"
                        >
                          <div
                            className={`horario__task-dot ${
                              isPast
                                ? "is-past"
                                : ""
                            }`}
                          >
                            {isPast ? (
                              <i className="fas fa-check horario__task-check-icon" />
                            ) : (
                              <span>
                                {Math.floor(
                                  index / 2,
                                ) + 1}
                              </span>
                            )}
                          </div>

                          <div
                            className={`horario__task-box ${
                              isPast
                                ? "is-past"
                                : ""
                            } ${
                              isActive
                                ? "is-active"
                                : ""
                            }`}
                          >
                            <div className="horario__task-box-top">
                              <h4 className="horario__task-box-title">
                                {
                                  activeCourse.subject
                                }
                              </h4>
                            </div>

                            <p className="horario__task-box-detail">
                              {task.detail}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={index}
                        className="horario__task-row"
                      >
                        <div
                          className={`horario__rest-dot ${
                            isPast
                              ? "is-past"
                              : ""
                          }`}
                        >
                          <svg
                            className="horario__tomato-svg"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              d="M12 3c.9 0 1.5.9 1.5.9s.6-.9 1.6-.9c-.1 1.1-.9 1.7-1.5 1.9 3.7.4 6.6 3.3 6.6 8.3 0 4.9-3.7 7.8-8.2 7.8s-8.2-2.9-8.2-7.8c0-5 2.9-7.9 6.6-8.3-.6-.2-1.4-.8-1.5-1.9 1 0 1.6.9 1.6.9S11.1 3 12 3z"
                              fill="currentColor"
                            />
                          </svg>

                          <i
                            className={`fa-solid ${
                              isPast
                                ? "fa-check"
                                : "fa-lock"
                            } horario__tomato-icon`}
                          />
                        </div>

                        <div
                          className={`horario__rest-box ${
                            isPast
                              ? "is-past"
                              : ""
                          } ${
                            isActive
                              ? "is-active"
                              : ""
                          }`}
                        >
                          Descanso (
                          {task.duration} min)
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <audio
        ref={alarmRef}
        src="sonidos/loud-alarm-ringtones-annoying.mp3"
        preload="auto"
        onEnded={handleAlarmEnded}
      />

      {alarmActive && (
        <div
          className="horario__alarm-toast"
          role="alert"
        >
          <div className="horario__alarm-toast-icon">
            <i className="fa-solid fa-bell" />
          </div>

          <div className="horario__alarm-toast-content">
            <strong>¡Tiempo terminado!</strong>

            <span>
              La alarma está sonando
            </span>
          </div>

          <button
            type="button"
            className="horario__alarm-toast-btn"
            onClick={apagarAlarma}
          >
            <i className="fa-solid fa-volume-xmark" />
            Apagar alarma
          </button>
        </div>
      )}

      <Modal
        open={lockConfirmOpen}
        onClose={() =>
          setLockConfirmOpen(false)
        }
      >
        <button
          onClick={() =>
            setLockConfirmOpen(false)
          }
          className="modal-close-x"
          aria-label="Cerrar"
        >
          <i className="fas fa-times" />
        </button>

        <div className="tema-selector">
          <h3 className="tema-selector__titulo">
            Aviso de Descanso
          </h3>

          <p className="tema-selector__descripcion">
            La pantalla se bloqueará durante
            tu descanso.
            <br />
            ¿Quieres comenzar ahora?
          </p>

          <div className="tema-selector__confirm-row">
            <button
              onClick={() =>
                setLockConfirmOpen(false)
              }
              className="tema-selector__confirm-btn is-cancelar"
            >
              Cancelar
            </button>

            <button
              onClick={() => {
                setIsLocked(true);
                setLockConfirmOpen(false);

                const label = activeCourse
                  ? `${activeCourse.subject} · Descanso`
                  : manualBreak
                    ? `Descanso de ${manualBreak} min`
                    : "Descanso";

                pomodoro.iniciar(
                  null,
                  label,
                  activeCourse
                    ? activeCourse.subject
                    : "",
                  activeCourse
                    ? selectedDay
                    : "",
                );
              }}
              className="tema-selector__confirm-btn is-aceptar"
            >
              Confirmar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={courseCompleteOpen}
        onClose={cerrarCourseComplete}
        wide
      >
        <button
          onClick={cerrarCourseComplete}
          className="modal-close-x"
          aria-label="Cerrar"
        >
          <i className="fas fa-times" />
        </button>

        <div className="horario__complete-modal">
          <div className="horario__complete-emoji">
            🎉
          </div>

          <h2 className="horario__complete-title">
            ¡Felicidades!
          </h2>

          <p className="horario__complete-sub">
            Completaste el curso de{" "}
            {pendingCourseComplete?.subject}
          </p>

          <p className="horario__complete-msg">
            Así es como entran a la UNMSM:
            <br />
            curso por curso 🎓
          </p>

          <button
            onClick={cerrarCourseComplete}
            className="horario__complete-btn"
          >
            Seguir así
          </button>
        </div>
      </Modal>

      <TemaModal
        open={temaModalOpen}
        subject={
          pendingCourseComplete?.subject
        }
        day={pendingCourseComplete?.day}
        onGuardar={guardarTema}
        onOmitir={omitirTema}
      />

      <SearchModal
        open={searchOpen}
        onClose={() =>
          setSearchOpen(false)
        }
        onSelect={(item) => {
          setSearchOpen(false);

          navigate(
            `/?q=${encodeURIComponent(
              item.type === "curso"
                ? item.nombre
                : item.tema,
            )}`,
          );
        }}
      />

      <Modal
        open={eligiendoTemaIdx !== null}
        onClose={omitirTemaDeCurso}
      >
        <button
          onClick={omitirTemaDeCurso}
          className="modal-close-x"
          aria-label="Cerrar"
        >
          <i className="fas fa-times" />
        </button>

        <div className="tema-selector">
          <h3 className="tema-selector__titulo">
            {eligiendoTemaIdx !== null
              ? courses[eligiendoTemaIdx]
                  ?.subject
              : ""}
          </h3>

          <p className="tema-selector__descripcion">
            Elige el tema que vas a estudiar:
          </p>

          <div className="tema-selector__lista">
            {(
              manifest.cursos.find(
                (c) =>
                  normalizarTexto(c.nombre) ===
                  normalizarTexto(
                    eligiendoTemaIdx !== null
                      ? courses[
                          eligiendoTemaIdx
                        ]?.subject
                      : "",
                  ),
              )?.temas || []
            ).map((t) => (
              <button
                key={t.tema}
                type="button"
                onClick={() =>
                  marcarTemaTmp(t.tema)
                }
                className={`tema-selector__boton ${
                  temaSeleccionadoTmp ===
                  t.tema
                    ? "is-selected"
                    : ""
                }`}
              >
                {t.tema}
              </button>
            ))}
          </div>

          <div className="tema-selector__confirm-row">
            <button
              type="button"
              onClick={omitirTemaDeCurso}
              className="tema-selector__confirm-btn is-cancelar"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={aceptarTemaDeCurso}
              disabled={!temaSeleccionadoTmp}
              className="tema-selector__confirm-btn is-aceptar"
            >
              Confirmar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={cursoPickerOpen}
        onClose={() =>
          setCursoPickerOpen(false)
        }
      >
        <button
          onClick={() =>
            setCursoPickerOpen(false)
          }
          className="modal-close-x"
          aria-label="Cerrar"
        >
          <i className="fas fa-times" />
        </button>

        <div className="tema-selector">
          <h3 className="tema-selector__titulo">
            Escoge un curso
          </h3>

          <p className="tema-selector__descripcion">
            Curso que vas a repasar en{" "}
            {DIA_LABELS[selectedDay]}:
          </p>

          <div className="tema-selector__lista">
            {manifest.cursos.map((c) => (
              <button
                key={c.nombre}
                type="button"
                onClick={() =>
                  elegirCursoRapido(
                    selectedDay,
                    c.nombre,
                  )
                }
                className="tema-selector__boton"
              >
                {c.nombre}
              </button>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        open={!!cursoRapidoDia}
        onClose={cancelarCursoRapido}
      >
        <button
          onClick={cancelarCursoRapido}
          className="modal-close-x"
          aria-label="Cerrar"
        >
          <i className="fas fa-times" />
        </button>

        <div className="tema-selector">
          <h3 className="tema-selector__titulo">
            {cursoRapidoNombre}
          </h3>

          <p className="tema-selector__descripcion">
            Elige el tema que vas a repasar
            en{" "}
            {cursoRapidoDia &&
              DIA_LABELS[cursoRapidoDia]}
            :
          </p>

          <div className="tema-selector__lista">
            {(
              manifest.cursos.find(
                (c) =>
                  normalizarTexto(c.nombre) ===
                  normalizarTexto(
                    cursoRapidoNombre,
                  ),
              )?.temas || []
            ).map((t) => (
              <button
                key={t.tema}
                type="button"
                onClick={() =>
                  setTemaRapidoElegido(
                    t.tema,
                  )
                }
                className={`tema-selector__boton ${
                  temaRapidoElegido ===
                  t.tema
                    ? "is-selected"
                    : ""
                }`}
              >
                {t.tema}
              </button>
            ))}
          </div>

          <div className="tema-selector__confirm-row">
            <button
              type="button"
              onClick={cancelarCursoRapido}
              className="tema-selector__confirm-btn is-cancelar"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={confirmarCursoRapido}
              disabled={!temaRapidoElegido}
              className="tema-selector__confirm-btn is-aceptar"
            >
              Confirmar
            </button>
          </div>
        </div>
      </Modal>

      {mostrarGate && (
        <div className="gate-overlay">
          <button
            className="gate-btn btn-primary"
            onClick={() =>
              setSetupOpen(true)
            }
          >
            <i className="fas fa-calendar-alt" />
            Configurar Pomodoro
          </button>
        </div>
      )}

      <ScheduleSetup
        open={setupOpen}
        onComplete={terminarSetup}
        onCancel={null}
      />
    </div>
  );
}