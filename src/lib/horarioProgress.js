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
//
// El curso del día en Horario ya NO sale de un horario configurado a
// mano: sale fijo de GRUPOS_ROTACION (repasoRecomendado.js), asignado
// siempre igual según el día de la semana (domingo repite el grupo del
// lunes). Y la cantidad de pomodoros por curso ya no es fija: arranca en
// 1 par (pomodoro + descanso) y crece cada vez que el usuario aprieta
// "+" en la lista de cursos del día — por eso se guarda aparte, en
// PARES_KEY, en vez de leerse de un horario configurado.
// ─────────────────────────────────────────────────────────────────────────
import { GRUPOS_ROTACION } from "./repasoRecomendado";
import { DIAS_SEMANA } from "./scheduleStorage";
const PROGRESS_KEY = "horario_task_progress_v1";
const PARES_KEY = "horario_pares_curso_v1";
const POMODORO_MIN = 25;
const REST_MIN = 5;
// Curso(s) fijo(s) del día: siempre los mismos 3 cursos de
// GRUPOS_ROTACION según el día de la semana, sin depender de avance ni
// de fechas. domingo vuelve a repetir el grupo de lunes (ciclo de 6).
export function grupoFijoDelDia(day) {
  const idx = DIAS_SEMANA.indexOf(day);
  if (idx === -1) return [];
  return GRUPOS_ROTACION[idx % GRUPOS_ROTACION.length];
}
function progressKey(day, subject) {
  return `${day}::${subject}`;
}
// Misma forma que buildCourseTasks() en HorarioPage.jsx: una lista de
// tareas (curso/descanso) alternadas, en pares completos (pomodoro +
// descanso), incluyendo el descanso del último par. Si cambias una,
// cambia la otra.
function buildCourseTasks(course) {
  const tasks = [];
  for (let i = 1; i <= course.pomodoros; i++) {
    tasks.push({ type: "course", duration: POMODORO_MIN });
    tasks.push({ type: "rest", duration: REST_MIN });
  }
  return tasks;
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
// Cuántos pares (pomodoro + descanso) tiene agregados el usuario para
// day+subject. Arranca en 1 y crece con agregarParCurso().
export function leerParesCurso(day, subject) {
  try {
    const mapa = JSON.parse(localStorage.getItem(PARES_KEY) || "{}");
    return mapa[progressKey(day, subject)] || 1;
  } catch {
    return 1;
  }
}
// Agrega otro par pomodoro+descanso a day+subject. Se puede llamar las
// veces que se quiera, sin límite. Devuelve la cantidad total de pares
// que quedó después de agregar.
export function agregarParCurso(day, subject) {
  try {
    const mapa = JSON.parse(localStorage.getItem(PARES_KEY) || "{}");
    const key = progressKey(day, subject);
    const total = (mapa[key] || 1) + 1;
    mapa[key] = total;
    localStorage.setItem(PARES_KEY, JSON.stringify(mapa));
    return total;
  } catch (e) {
    console.error("Error agregando pomodoro al curso:", e);
    return null;
  }
}
// Suma una tarea (curso o descanso) al progreso guardado de day+subject.
// El curso del día ya no sale de un horario configurado: sale fijo de
// GRUPOS_ROTACION según el día. El completado tampoco se detecta más
// por llegar a una cantidad fija de pomodoros (ahora es abierta) — se
// marca a mano con el botón de check en la lista de cursos, así que acá
// solo avanzamos el índice de progreso, sin pasarnos del último par
// agregado (si el usuario no agregó más pomodoros con "+", el progreso
// se queda esperando ahí).
export function avanzarProgresoPomodoro({ day, subject }) {
  if (!day || !subject) return null;
  const grupo = grupoFijoDelDia(day);
  if (!grupo.includes(subject)) return null;
  const pares = leerParesCurso(day, subject);
  const tasks = buildCourseTasks({ pomodoros: pares });
  const key = progressKey(day, subject);
  const progress = leerProgresoHorario();
  const currentIdx = progress[key] || 0;
  const nextIdx = Math.min(currentIdx + 1, tasks.length);
  guardarProgresoHorario({ ...progress, [key]: nextIdx });
  return { completado: false };
}