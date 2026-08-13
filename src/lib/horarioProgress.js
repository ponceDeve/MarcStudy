// ─────────────────────────────────────────────────────────────────────────
// Avanza el progreso de un curso del Horario cuando un pomodoro termina
// de verdad (llega a 0). Vive fuera de HorarioPage a propósito: desde que
// el cronómetro corre en PomodoroContext (que sigue vivo sin importar a
// qué pantalla navegues), la alarma puede sonar con HorarioPage ya
// desmontada — por ejemplo mientras el usuario está estudiando en Mi
// Estudio. Si el avance de progreso solo viviera dentro de HorarioPage,
// esos pomodoros nunca se marcarían como completados.
//
// Esta función lee y escribe directo en localStorage, así que funciona
// sin que ningún componente de React esté montado.
// ─────────────────────────────────────────────────────────────────────────
import { leerHorario } from "./scheduleStorage";

const PROGRESS_KEY = "horario_task_progress_v1";
const POMODORO_MIN = 25;
const REST_MIN = 5;

// Misma forma que buildCourseTasks() en HorarioPage.jsx: una lista de
// tareas (curso/descanso) alternadas. Si cambias una, cambia la otra.
function buildCourseTasks(course) {
  const tasks = [];
  for (let i = 1; i <= course.pomodoros; i++) {
    tasks.push({ type: "course", duration: POMODORO_MIN });
    if (i < course.pomodoros) tasks.push({ type: "rest", duration: REST_MIN });
  }
  return tasks;
}

function progressKey(day, subject) {
  return `${day}::${subject}`;
}

export function leerProgresoHorario() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
  } catch {
    return {};
  }
}

function guardarProgresoHorario(progress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error("Error guardando progreso de horario:", e);
  }
}

// Suma una tarea (curso o descanso) al progreso guardado de day+subject.
// Devuelve { completado: true } si con esto se terminó el curso, o null
// si no encontró el curso en el horario (por ejemplo si el usuario lo
// editó/borró mientras el pomodoro corría) o si faltan datos.
export function avanzarProgresoPomodoro({ day, subject }) {
  if (!day || !subject) return null;

  const horario = leerHorario();
  const curso = (horario?.[day] || []).find((c) => c.subject === subject);
  if (!curso) return null;

  const tasks = buildCourseTasks(curso);
  const key = progressKey(day, subject);
  const progress = leerProgresoHorario();
  const currentIdx = progress[key] || 0;
  const nextIdx = currentIdx + 1;

  guardarProgresoHorario({ ...progress, [key]: nextIdx });

  return { completado: nextIdx >= tasks.length };
}
