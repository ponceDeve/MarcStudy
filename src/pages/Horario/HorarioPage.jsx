import { useState, useRef, useMemo, useEffect } from "react";

import { useSearchParams, useNavigate } from "react-router-dom";

import { usePomodoro } from "../../context/PomodoroContext";

import { useLocalStorage } from "../../hooks/useLocalStorage";

import manifest from "../../data/manifest.json";

import { normalizarTexto } from "../../lib/buscador";

import {
  leerProgresoHorario,
  grupoFijoDelDia,
  agregarParCurso,
  diaSegunRecomendacion,
  DIAS_SEMANA,
  DIA_LABELS,
} from "../../lib/horarioProgress";

import { registrarCursoCompletado } from "../../lib/repasoStorage";

import {
  limpiarPomodoroCompartido,
  leerRetorno,
  guardarRetorno,
  guardarTemaCurso,
  leerTemaCurso,
  limpiarTemaCurso,
  guardarCursoActivo,
  leerCursoActivo,
  limpiarCursoActivo,
} from "../../lib/pomodoroShared";

import TemaModal from "../../components/TemaModal";
import Modal from "../../components/Modal";
import AppHeader from "../../components/AppHeader";
import { RelojFlip } from "../../components/RelojPared";
import SearchModal from "../../components/SearchModal";

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

    tasks.push({
      type: "rest",
      duration: REST_MIN,
    });
  }

  return tasks;
}

function progressKey(day, subject) {
  return `${day}::${subject}`;
}

export default function HorarioPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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

    const diaReal = dias[new Date().getDay()];

    return diaSegunRecomendacion(diaReal);
  });

  const [activeCourseIdx, setActiveCourseIdx] = useState(null);

  const [progress, setProgress] = useLocalStorage(
    "horario_task_progress_v1",
    {}
  );

  const [pares, setPares] = useLocalStorage(
    "horario_pares_curso_v1",
    {}
  );

  const [completados, setCompletados] = useLocalStorage(
    "horario_curso_completado_manual_v1",
    {}
  );

  const [pendingCompletarCurso, setPendingCompletarCurso] = useState(null);
  const [confirmarReinicio, setConfirmarReinicio] = useState(false);

  const [mostrarConfirmacionCompletar, setMostrarConfirmacionCompletar] =
    useState(false);

  const [temaDesdeLink, setTemaDesdeLink] = useState(null);
  const [retornoTema, setRetornoTema] = useState(() => leerRetorno());

  const [pendingCourseComplete, setPendingCourseComplete] = useState(null);
  const [temaModalOpen, setTemaModalOpen] = useState(false);
  const [courseCompleteOpen, setCourseCompleteOpen] = useState(false);

  const [manualBreak, setManualBreak] = useState(null);
  const [breakDuration, setBreakDuration] = useState("");

  const [searchOpen, setSearchOpen] = useState(false);

  const [cursoRapidoDia, setCursoRapidoDia] = useState(null);
  const [cursoRapidoNombre, setCursoRapidoNombre] = useState("");
  const [temaRapidoElegido, setTemaRapidoElegido] = useState(null);

  const [cursoPickerOpen, setCursoPickerOpen] = useState(false);

  const [eligiendoTemaIdx, setEligiendoTemaIdx] = useState(null);
  const [temaSeleccionadoTmp, setTemaSeleccionadoTmp] = useState(null);

  const [semanaPagina, setSemanaPagina] = useState(0);

  const [temaElegidoParaCurso, setTemaElegidoParaCurso] = useState(null);
  const [cursoRapidoPreparado, setCursoRapidoPreparado] = useState(null);

  const [alarmActive, setAlarmActive] = useState(false);
  const alarmRef = useRef(null);

  const [semanaTemaRapido, setSemanaTemaRapido] = useState(1);
  const [semanaPaginaRapido, setSemanaPaginaRapido] = useState(0);

  function cursosDelDia(dia) {
    return grupoFijoDelDia(dia).map((subject) => ({
      subject,
      pomodoros: pares[progressKey(dia, subject)] || 1,
    }));
  }

  const courses = useMemo(
    () => cursosDelDia(selectedDay),
    [selectedDay, pares]
  );

  const activeCourse =
    activeCourseIdx !== null ? courses[activeCourseIdx] : null;

  useEffect(() => {
    const guardado = leerCursoActivo();

    if (guardado && guardado.day === selectedDay) {
      const idx = courses.findIndex(
        (c) => c.subject === guardado.subject
      );

      if (idx !== -1) {
        setActiveCourseIdx(idx);
      }
    }
  }, []);

  useEffect(() => {
    if (activeCourse) {
      guardarCursoActivo(selectedDay, activeCourse.subject);
    } else {
      limpiarCursoActivo();
    }
  }, [activeCourse, selectedDay]);

  useEffect(() => {
    let timer;

    if (courseCompleteOpen) {
      timer = setTimeout(() => {
        cerrarCourseComplete();
      }, 7000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [courseCompleteOpen]);

  useEffect(() => {
    if (!mostrarConfirmacionCompletar) return;

    const timer = setTimeout(() => {
      setMostrarConfirmacionCompletar(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [mostrarConfirmacionCompletar]);

  useEffect(() => {
    if (!confirmarReinicio) return;

    const timer = setTimeout(() => {
      setConfirmarReinicio(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [confirmarReinicio]);

  const activeTasks = useMemo(
    () => (activeCourse ? buildCourseTasks(activeCourse) : []),
    [activeCourse]
  );

  function volverAlTema() {
    if (!retornoTema) return;

    navigate(`/?q=${encodeURIComponent(retornoTema)}`);
  }

  function limpiarRetornoActual() {
    setRetornoTema(null);
    setTemaDesdeLink(null);
    guardarRetorno("");
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
            getTaskIndex(selectedDay, activeCourse.subject)
          ]?.duration || POMODORO_MIN
        : manualBreak || POMODORO_MIN;

  const progressPct =
    totalSeconds > 0
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(
              ((totalSeconds - secondsLeft) / totalSeconds) * 100
            )
          )
        )
      : 0;

  function apagarAlarma() {
    const audios = document.querySelectorAll("audio");

    audios.forEach((audio) => {
      try {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = true;
      } catch {}
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

  function detenerYReiniciar(duration) {
    apagarAlarma();

    if (isRunning) {
      pomodoro.pausar();
    }

    if (alarmRef.current) {
      alarmRef.current.muted = false;
    }

    reset(duration);
  }

  function resetConSync(duration) {
    apagarAlarma();

    if (alarmRef.current) {
      alarmRef.current.muted = false;
    }

    reset(duration);
  }

  function iniciarConSync() {
    apagarAlarma();

    const taskIndex = activeCourse
      ? getTaskIndex(selectedDay, activeCourse.subject)
      : null;

    if (activeCourse && !activeTasks[taskIndex]) {
      setActiveCourseIdx(null);
      return;
    }

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
          : ""
    );

    if (cursoRapidoPreparado) {
      setCursoRapidoPreparado(null);
    }

    if (temaElegidoParaCurso) {
      const tema =
        typeof temaElegidoParaCurso === "string"
          ? temaElegidoParaCurso
          : temaElegidoParaCurso.tema;

      setTemaElegidoParaCurso(null);

      navigate(`/?q=${encodeURIComponent(tema)}`);
    }
  }

  function pausarConSync() {
    pomodoro.pausar();
  }

  useEffect(() => {
    function handleGlobalKeyDown(e) {
      if (
        searchOpen ||
        eligiendoTemaIdx !== null ||
        cursoRapidoDia ||
        temaModalOpen ||
        courseCompleteOpen
      ) {
        return;
      }

      const activeTag = document.activeElement
        ? document.activeElement.tagName
        : "";

      if (
        ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(
          activeTag
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

    window.addEventListener("keydown", handleGlobalKeyDown);

    return () =>
      window.removeEventListener(
        "keydown",
        handleGlobalKeyDown
      );
  }, [
    isRunning,
    activeCourse,
    manualBreak,
    searchOpen,
    eligiendoTemaIdx,
    cursoRapidoDia,
    temaModalOpen,
    courseCompleteOpen,
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

    if (!subject) {
      setManualBreak(null);
      return;
    }

    const progresoActual = leerProgresoHorario();

    setProgress(progresoActual);

    if (completado) {
      const course = courses.find(
        (c) => c.subject === subject
      );

      const pomodorosCompletados = course
        ? buildCourseTasks({ pomodoros: course.pomodoros })
            .slice(
              0,
              progresoActual[
                progressKey(day, subject)
              ] || 0
            )
            .filter((t) => t.type === "course").length
        : 0;

      const temaGuardadoCurso = leerTemaCurso(
        day,
        subject
      );

      limpiarTemaCurso(day, subject);

      setPendingCourseComplete({
        subject,
        day,
        pomodorosCompletados,
        tema: temaGuardadoCurso || "",
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
      const idx =
        progresoActual[progressKey(day, subject)] || 0;

      const siguiente = activeTasks[idx];

      if (siguiente) {
        if (siguiente.type === "rest") {
          pomodoro.iniciar(
            siguiente.duration,
            `${subject} · Descanso`,
            subject,
            day
          );
        } else {
          resetConSync(siguiente.duration);
        }
      }
    }
  }

  useEffect(() => {
    pomodoro.registrarOnComplete(handleTaskComplete);

    return () => {
      if (pomodoro.cancelarOnComplete) {
        pomodoro.cancelarOnComplete();
      } else {
        pomodoro.registrarOnComplete(null);
      }
    };
  });

  function abrirCurso(idx) {
    setManualBreak(null);
    setActiveCourseIdx(idx);
  }

  function abrirOPedirTema(idx) {
    const course = courses[idx];

    const isComplete = course
      ? !!completados[
          progressKey(selectedDay, course.subject)
        ]
      : false;

    const temaGuardado = course
      ? leerTemaCurso(selectedDay, course.subject)
      : null;

    if (isComplete || temaGuardado) {
      abrirCurso(idx);
      return;
    }

    pedirTemaYAbrirCurso(idx);
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
    const tema = temaSeleccionadoTmp;
    const course = courses[idx];

    guardarRetorno(tema);
    setRetornoTema(tema);

    if (course) {
      guardarTemaCurso(
        selectedDay,
        course.subject,
        tema
      );
    }

    setEligiendoTemaIdx(null);

    setTemaElegidoParaCurso({
      tema,
    });

    setTemaSeleccionadoTmp(null);

    abrirCurso(idx);

    if (course) {
      const tasks = buildCourseTasks(course);

      const taskIdx = getTaskIndex(
        selectedDay,
        course.subject
      );

      if (tasks[taskIdx]) {
        detenerYReiniciar(tasks[taskIdx].duration);
      }
    }
  }

  function iniciarDescansoManual(minutos) {
    apagarAlarma();

    setActiveCourseIdx(null);
    setManualBreak(minutos);

    detenerYReiniciar(minutos);
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

  function elegirCursoRapido(dia, nombreCurso) {
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
    setCursoRapidoPreparado(cursoRapidoNombre);

    guardarRetorno(temaRapidoElegido);
    setRetornoTema(temaRapidoElegido);

    guardarTemaCurso(
      cursoRapidoDia,
      cursoRapidoNombre,
      temaRapidoElegido
    );

    setTemaElegidoParaCurso({
      tema: temaRapidoElegido,
    });

    detenerYReiniciar(POMODORO_MIN);
    cancelarCursoRapido();
  }

  function cerrarCourseComplete() {
    setCourseCompleteOpen(false);

    if (!pendingCourseComplete) return;

    const vieneConTema =
      temaDesdeLink &&
      temaDesdeLink.curso.toLowerCase() ===
        pendingCourseComplete.subject.toLowerCase();

    registrarCursoCompletado({
      ...pendingCourseComplete,
      tema: vieneConTema
        ? temaDesdeLink.tema
        : pendingCourseComplete.tema || "",
    });

    const key = progressKey(
      pendingCourseComplete.day,
      pendingCourseComplete.subject
    );

    setProgress((prev) => ({
      ...prev,
      [key]: 0,
    }));

    setPares((prev) => ({
      ...prev,
      [key]: 1,
    }));

    setCompletados((prev) => ({
      ...prev,
      [key]: false,
    }));

    setPendingCourseComplete(null);
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

  function pedirReiniciarCurso() {
    if (!activeCourse) return;

    if (!confirmarReinicio) {
      setConfirmarReinicio(true);
      return;
    }

    const key = progressKey(
      selectedDay,
      activeCourse.subject
    );

    setProgress((prev) => ({
      ...prev,
      [key]: 0,
    }));

    setPares((prev) => ({
      ...prev,
      [key]: 1,
    }));

    setCompletados((prev) => ({
      ...prev,
      [key]: false,
    }));

    detenerYReiniciar(POMODORO_MIN);
    setConfirmarReinicio(false);
  }

  function agregarPomodoroCurso(day, subject) {
    agregarParCurso(day, subject);

    setPares((prev) => ({
      ...prev,
      [progressKey(day, subject)]:
        (prev[progressKey(day, subject)] || 1) + 1,
    }));
  }

  function completarCurso(day, subject) {
    setPendingCompletarCurso(null);
    setMostrarConfirmacionCompletar(false);

    if (
      isRunning &&
      pomodoro.subject === subject &&
      pomodoro.day === day
    ) {
      pomodoro.pausar();
    }

    const curso = courses.find(
      (c) => c.subject === subject
    );

    const pomodorosCompletados =
      pendingCompletarCurso &&
      pendingCompletarCurso.day === day &&
      pendingCompletarCurso.subject === subject
        ? pendingCompletarCurso.pomodorosCompletados
        : curso
          ? getDonePomodoros(
              day,
              subject,
              curso.pomodoros
            )
          : 0;

    if (
      activeCourse &&
      activeCourse.subject === subject &&
      selectedDay === day
    ) {
      setActiveCourseIdx(null);
    }

    const temaGuardadoCurso = leerTemaCurso(
      day,
      subject
    );

    limpiarTemaCurso(day, subject);

    setCompletados((prev) => ({
      ...prev,
      [progressKey(day, subject)]: true,
    }));

    setPendingCourseComplete({
      subject,
      day,
      pomodorosCompletados,
      tema: temaGuardadoCurso || "",
    });

    setCourseCompleteOpen(true);
  }

  function pedirConfirmarCompletarCurso(day, subject) {
    if (
      pendingCompletarCurso &&
      pendingCompletarCurso.day === day &&
      pendingCompletarCurso.subject === subject
    ) {
      completarCurso(day, subject);
      return;
    }

    const curso = courses.find(
      (c) => c.subject === subject
    );

    const pomodorosCompletados = curso
      ? getDonePomodoros(
          day,
          subject,
          curso.pomodoros
        )
      : 0;

    setPendingCompletarCurso({
      day,
      subject,
      pomodorosCompletados,
    });

    setMostrarConfirmacionCompletar(true);
  }

  const activeTaskIdx = activeCourse
    ? getTaskIndex(
        selectedDay,
        activeCourse.subject
      )
    : 0;

  useEffect(() => {
    const cursoParam = searchParams.get("curso");
    const temaParam = searchParams.get("tema");

    const cursoObjetivo =
      cursoParam || (isRunning ? pomodoro.subject : null);

    if (!cursoObjetivo) return;

    for (const dia of DIAS_SEMANA) {
      const lista = cursosDelDia(dia);

      const idx = lista.findIndex(
        (c) =>
          normalizarTexto(c.subject) ===
          normalizarTexto(cursoObjetivo)
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
          normalizarTexto(pomodoro.subject || "") ===
            normalizarTexto(cursoObjetivo);

        if (!mismoCursoCorriendo) {
          const tasks = buildCourseTasks(lista[idx]);

          const taskIdx =
            progress[
              progressKey(dia, lista[idx].subject)
            ] || 0;

          if (taskIdx < tasks.length) {
            resetConSync(tasks[taskIdx].duration);
          }
        }

        break;
      }
    }
  }, []);

  return (
    <div className="horario">
      <AppHeader
        section="pomodoro"
        onAbrirBuscador={() => setSearchOpen(true)}
      />

      <main className="horario__main">
        <section className="horario__timer-section">
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
                    selectedDay === dia ? "is-active" : ""
                  }`}
                >
                  {DIA_LABELS[dia]}
                </button>
              ))}
            </div>
          </div>

          <div className="horario__timer-card">
            <div className="horario__timer-center">
              {!activeCourse && manualBreak && (
                <p className="horario__timer-label">
                  Descanso de {manualBreak} min
                </p>
              )}

              <RelojFlip segundos={secondsLeft} />

              <div className="horario__progress-track">
                <div
                  className="horario__progress-fill"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <div className="horario__timer-controls">
              <div className="horario__timer-btn-row">
                <button
                  onClick={iniciarConSync}
                  disabled={
                    (!activeCourse && !manualBreak) ||
                    isRunning
                  }
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
                  onClick={() =>
                    resetConSync(currentTaskDuration)
                  }
                  disabled={!isRunning}
                  className="horario__btn-reset"
                >
                  <i className="fas fa-rotate-left" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="horario__side-section">
          <div className="horario__courses-card">
            <div className="horario__courses-header">
              <div className="horario__courses-header-left">
                {activeCourse && (
                  <button
                    onClick={() => setActiveCourseIdx(null)}
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
                  const done = getDonePomodoros(
                    selectedDay,
                    c.subject,
                    c.pomodoros
                  );

                  const isComplete =
                    !!completados[
                      progressKey(
                        selectedDay,
                        c.subject
                      )
                    ];

                  const pct = Math.round(
                    (done / c.pomodoros) * 100
                  );

                  const statusText = isComplete
                    ? "Completado"
                    : done > 0
                      ? "En curso"
                      : "No iniciado";

                  return (
                    <div
                      key={idx}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        abrirOPedirTema(idx)
                      }
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" ||
                          e.key === " "
                        ) {
                          e.preventDefault();
                          abrirOPedirTema(idx);
                        }
                      }}
                      className={`horario__course-item ${
                        isComplete ? "is-complete" : ""
                      }`}
                    >
                      <div className="horario__course-top">
                        <div className="horario__course-tags">
                          <h4 className="horario__course-name">
                            {c.subject}
                          </h4>
                        </div>

                        <div className="horario__course-actions">
                          {isComplete ? (
                            <i className="fas fa-check horario__check-icon" />
                          ) : (
                            <i className="fas fa-chevron-right horario__chevron-icon" />
                          )}
                        </div>
                      </div>

                      <div className="horario__course-progress">
                        <div className="horario__mini-track">
                          <div
                            className="horario__mini-fill"
                            style={{
                              width: `${pct}%`,
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
                        Elige la duración de tu descanso
                      </p>
                    </div>

                    <div className="horario__rest-select-control">
                      <i className="fa-solid fa-mug-hot" />

                      <select
                        value={breakDuration}
                        onChange={cambiarDuracionDescanso}
                        disabled={isRunning}
                        aria-label="Duración del descanso"
                      >
                        <option value="" disabled>
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
                          )
                        )}
                      </select>

                      <i className="fas fa-chevron-down" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeCourse && (
              <>
                {retornoTema && (
                  <button
                    type="button"
                    onClick={volverAlTema}
                    className="horario__btn-volver-tema"
                  >
                    <i className="fas fa-arrow-left" />{" "}
                    Regresar a: "{retornoTema}"
                  </button>
                )}

                <div className="horario__task-list">
                  {activeTasks.map((task, index) => {
                    const isActive =
                      index === activeTaskIdx;

                    const isPast =
                      index < activeTaskIdx;

                    if (task.type === "course") {
                      return (
                        <div
                          key={index}
                          className="horario__task-row"
                        >
                          <div
                            className={`horario__task-dot ${
                              isPast ? "is-past" : ""
                            }`}
                          >
                            {isPast ? (
                              <i className="fas fa-check horario__task-check-icon" />
                            ) : (
                              <span>
                                {Math.floor(index / 2) +
                                  1}
                              </span>
                            )}
                          </div>

                          <div
                            className={`horario__task-box ${
                              isPast ? "is-past" : ""
                            } ${
                              isActive ? "is-active" : ""
                            }`}
                          >
                            <div className="horario__task-box-top">
                              <h4 className="horario__task-box-title">
                                {activeCourse.subject}
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
                          className={`horario__rest-dot horario__tomato-circle ${
                            isPast
                              ? "is-past"
                              : "is-locked"
                          }`}
                        >
                          <i
                            className="fa-solid fa-apple-whole horario__tomato-icon"
                            aria-hidden="true"
                          />

                          <i
                            className={`fa-solid ${
                              isPast
                                ? "fa-check"
                                : "fa-lock"
                            } horario__tomato-lock`}
                            aria-hidden="true"
                          />
                        </div>

                        <div
                          className={`horario__rest-box ${
                            isPast ? "is-past" : ""
                          } ${
                            isActive ? "is-active" : ""
                          }`}
                        >
                          Descanso ({task.duration} min)
                        </div>
                      </div>
                    );
                  })}

                  <div className="horario__task-actions">
                    <button
                      type="button"
                      className="horario__reset-pomodoros-btn"
                      disabled={
                        isRunning ||
                        (activeTaskIdx === 0 &&
                          activeCourse.pomodoros <= 1 &&
                          !completados[
                            progressKey(
                              selectedDay,
                              activeCourse.subject
                            )
                          ])
                      }
                      onClick={pedirReiniciarCurso}
                      title="Reiniciar pomodoros"
                      aria-label={`Reiniciar pomodoros de ${activeCourse.subject}`}
                    >
                      <i className="fas fa-rotate-left" />
                    </button>

                    <button
                      type="button"
                      className="horario__add-pomodoro-btn"
                      disabled={
                        activeTasks.length === 0 ||
                        activeTaskIdx < activeTasks.length
                      }
                      onClick={() =>
                        agregarPomodoroCurso(
                          selectedDay,
                          activeCourse.subject
                        )
                      }
                      aria-label={`Agregar otro pomodoro a ${activeCourse.subject}`}
                    >
                      <i className="fas fa-plus" />
                    </button>

                    <button
                      type="button"
                      className="horario__course-complete-btn"
                      disabled={
                        activeTasks.length === 0 ||
                        activeTaskIdx < activeTasks.length
                      }
                      onClick={() =>
                        pedirConfirmarCompletarCurso(
                          selectedDay,
                          activeCourse.subject
                        )
                      }
                      aria-label={`Marcar ${activeCourse.subject} como completado`}
                    >
                      <i className="fas fa-check" />
                    </button>
                  </div>
                </div>
              </>
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
            <span>La alarma está sonando</span>
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

      {mostrarConfirmacionCompletar &&
        pendingCompletarCurso && (
          <div
            className="horario__complete-confirm-toast"
            role="status"
          >
            <div className="horario__complete-confirm-toast-content">
              <div className="horario__complete-confirm-toast-info">
                <i className="fa-solid fa-circle-check" />

                <div>
                  <strong>
                    ¿Seguro que quieres completar{" "}
                    {pendingCompletarCurso.subject} con{" "}
                    {
                      pendingCompletarCurso.pomodorosCompletados
                    }{" "}
                    pomodoros?
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}

      {courseCompleteOpen && (
        <div className="horario__felicitacion-overlay">
          <div className="horario__felicitacion-confetti">
            <div className="horario__felicitacion-confetti-2" />
          </div>

          <div className="horario__felicitacion-content">
            <p className="horario__felicitacion-titulo">
              ¡Felicidades! completaste
            </p>

            <p className="horario__felicitacion-texto">
              {" "}
              <span className="horario__felicitacion-curso">
                {pendingCourseComplete?.subject}
              </span>{" "}
              con{" "}
              <span className="horario__felicitacion-pomodoros">
                {pendingCourseComplete?.pomodorosCompletados ||
                  0}{" "}
                pomodoros
              </span>
            </p>
          </div>
        </div>
      )}

      {confirmarReinicio && activeCourse && (
        <div
          className="horario__complete-confirm-toast horario__complete-confirm-toast--reset"
          role="status"
        >
          <div className="horario__complete-confirm-toast-content">
            <div className="horario__complete-confirm-toast-info">
              <i className="fa-solid fa-rotate-left" />

              <div>
                <strong>
                  ¿Reiniciar los pomodoros de{" "}
                  {activeCourse.subject}?
                </strong>

                <small>
                  Toca otra vez el botón para confirmar
                </small>
              </div>
            </div>
          </div>
        </div>
      )}

      <TemaModal
        open={temaModalOpen}
        subject={pendingCourseComplete?.subject}
        day={pendingCourseComplete?.day}
        onGuardar={guardarTema}
      />

      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={(item) => {
          setSearchOpen(false);

          navigate(
            `/?q=${encodeURIComponent(
              item.type === "curso"
                ? item.nombre
                : item.tema
            )}`
          );
        }}
      />

      <Modal
        open={eligiendoTemaIdx !== null}
        onClose={() => {
          setEligiendoTemaIdx(null);
          setTemaSeleccionadoTmp(null);
        }}
      >
        <div className="tema-selector">
          <div className="tema-selector__lista">
            {(
              manifest.cursos.find(
                (c) =>
                  normalizarTexto(c.nombre) ===
                  normalizarTexto(
                    eligiendoTemaIdx !== null
                      ? courses[eligiendoTemaIdx]?.subject
                      : ""
                  )
              )?.temas || []
            ).map((t) => (
              <button
                key={t.tema}
                type="button"
                onClick={() =>
                  marcarTemaTmp(t.tema)
                }
                className={`tema-selector__boton ${
                  temaSeleccionadoTmp === t.tema
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
              onClick={() => {
                setEligiendoTemaIdx(null);
                setTemaSeleccionadoTmp(null);
              }}
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
    </div>
  );
}