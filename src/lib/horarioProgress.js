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

// mano: lunes a sábado salen fijos de GRUPOS_ROTACION

// (definidos aquí), uno por día; domingo es un 7mo bloque fijo

// aparte (Economía, Química, Física, los cursos con más temas), sin

// tocar GRUPOS_ROTACION. Y la cantidad de pomodoros por curso ya no es

// fija: arranca en

// 1 par (pomodoro + descanso) y crece cada vez que el usuario aprieta

// "+" en la lista de cursos del día — por eso se guarda aparte, en

// PARES_KEY, en vez de leerse de un horario configurado.

// ─────────────────────────────────────────────────────────────────────────

// Cursos fijos de lunes a sábado (uno por día, en orden).
const GRUPOS_ROTACION = [
  ["Habilidad Verbal", "Educación Cívica", "Economía"],
  ["Lenguaje", "Geografía", "Álgebra"],
  ["Literatura", "Física", "Trigonometría"],
  ["Historia Universal", "Química", "Habilidad Lógico Matemático"],
  ["Historia del Perú", "Psicología", "Geometría"],
  ["Filosofía", "Biología", "Aritmética"],
];

const PROGRESS_KEY = "horario_task_progress_v1";

const PARES_KEY = "horario_pares_curso_v1";

const FECHA_KEY = "horario_datos_fecha_v1";

const POMODORO_MIN = 25;

const REST_MIN = 5;

export const DIAS_SEMANA = [
  "lunes",
  "martes",
  "miercoles",
  "jueves",
  "viernes",
  "sabado",
  "domingo",
];

export const DIA_LABELS = {
  lunes: "Lun",
  martes: "Mar",
  miercoles: "Mié",
  jueves: "Jue",
  viernes: "Vie",
  sabado: "Sáb",
  domingo: "Dom",
};

// Domingo es un 7mo bloque fijo aparte (no repite el grupo del lunes):

// los 3 cursos con más temas.

const BLOQUE_DOMINGO = ["Economía", "Química", "Física"];

// Curso(s) fijo(s) del día: lunes a sábado salen de GRUPOS_ROTACION

// (uno por día, en orden); domingo usa BLOQUE_DOMINGO. Son 7

// rotaciones en total, sin depender de avance ni de fechas.

export function grupoFijoDelDia(day) {
  if (day === "domingo") return BLOQUE_DOMINGO;

  const idx = DIAS_SEMANA.indexOf(day);

  if (idx === -1 || idx >= GRUPOS_ROTACION.length) return [];

  return GRUPOS_ROTACION[idx];
}

// Al entrar a Horario se abre el día real del calendario.

export function diaSegunRecomendacion(diaReal) {
  return diaReal;
}

function progressKey(day, subject) {
  return `${day}::${subject}`;
}

// ─────────────────────────────────────────────────────────────────────────
// Fecha actual
//
// Se usa la fecha real y no solamente "lunes", "martes", etc., porque

// esos nombres se repiten cada semana.
//
// Ejemplo:
//
// 2026-10-05 → lunes
// 2026-10-12 → lunes
//
// Aunque ambos sean lunes, su progreso debe ser independiente.
// ─────────────────────────────────────────────────────────────────────────

function fechaHoy() {
  const ahora = new Date();

  return `${ahora.getFullYear()}-${String(
    ahora.getMonth() + 1
  ).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;
}

// ─────────────────────────────────────────────────────────────────────────
// Lee un mapa guardado en localStorage.
// ─────────────────────────────────────────────────────────────────────────

function leerMapa(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch {
    return {};
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Guarda un mapa en localStorage.
// ─────────────────────────────────────────────────────────────────────────

function guardarMapa(key, mapa) {
  try {
    localStorage.setItem(key, JSON.stringify(mapa));
  } catch (e) {
    console.error(`Error guardando ${key}:`, e);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Comprueba si los datos pertenecen al día actual.
//
// Si cambió la fecha:
//
// - se borra el progreso de ayer
// - se borran los pomodoros agregados de ayer
// - se marca la nueva fecha
//
// De esta manera, cada día empieza completamente desde cero.
// ─────────────────────────────────────────────────────────────────────────

function asegurarDatosDelDia() {
  const hoy = fechaHoy();

  try {
    const fechaGuardada = localStorage.getItem(FECHA_KEY);

    // Primera vez que se usa este sistema:
    // se registra la fecha actual sin borrar datos existentes.
    if (!fechaGuardada) {
      localStorage.setItem(FECHA_KEY, hoy);
      return;
    }

    // Si cambió el día, todo el estado temporal del Horario empieza
    // nuevamente desde cero.
    if (fechaGuardada !== hoy) {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify({}));

      localStorage.setItem(PARES_KEY, JSON.stringify({}));

      localStorage.setItem(FECHA_KEY, hoy);
    }
  } catch (e) {
    console.error("Error comprobando la fecha del horario:", e);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Misma forma que buildCourseTasks() en HorarioPage.jsx: una lista de

// tareas (curso/descanso) alternadas, en pares completos (pomodoro +

// descanso), incluyendo el descanso del último par. Si cambias una,

// cambia la otra.
// ─────────────────────────────────────────────────────────────────────────

function buildCourseTasks(course) {
  const tasks = [];

  for (let i = 1; i <= course.pomodoros; i++) {
    tasks.push({
      type: "course",
      duration: POMODORO_MIN,
    });

    tasks.push({
      type: "rest",
      duration: REST_MIN,
    });
  }

  return tasks;
}

// ─────────────────────────────────────────────────────────────────────────
// Lee el progreso del día actual.
//
// Si ayer había:
//
// "lunes::Cívica": 4
//
// y hoy es otro día, asegurarDatosDelDia() ya habrá limpiado ese dato.
//
// El valor que recibe Horario será entonces:
// {}
// ─────────────────────────────────────────────────────────────────────────

export function leerProgresoHorario() {
  asegurarDatosDelDia();

  return leerMapa(PROGRESS_KEY);
}

function guardarProgresoHorario(progress) {
  asegurarDatosDelDia();

  guardarMapa(PROGRESS_KEY, progress);
}

// ─────────────────────────────────────────────────────────────────────────
// Cuántos pares (pomodoro + descanso) tiene agregados el usuario para

// day+subject.
//
// Arranca en 1 y crece con agregarParCurso().
//
// La cantidad solamente existe durante el día actual.
// ─────────────────────────────────────────────────────────────────────────

export function leerParesCurso(day, subject) {
  asegurarDatosDelDia();

  const mapa = leerMapa(PARES_KEY);

  return mapa[progressKey(day, subject)] || 1;
}

// ─────────────────────────────────────────────────────────────────────────
// Agrega otro par pomodoro+descanso a day+subject. Se puede llamar las

// veces que se quiera, sin límite. Devuelve la cantidad total de pares

// que quedó después de agregar.
//
// Si cambia el día, el mapa ya fue reiniciado y el curso vuelve a empezar

// automáticamente con 1 par.
// ─────────────────────────────────────────────────────────────────────────

export function agregarParCurso(day, subject) {
  try {
    asegurarDatosDelDia();

    const mapa = leerMapa(PARES_KEY);

    const key = progressKey(day, subject);

    const total = (mapa[key] || 1) + 1;

    mapa[key] = total;

    guardarMapa(PARES_KEY, mapa);

    return total;
  } catch (e) {
    console.error("Error agregando pomodoro al curso:", e);

    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Suma una tarea (curso o descanso) al progreso guardado de day+subject.
//
// El curso del día ya no sale de un horario configurado: sale fijo de

// GRUPOS_ROTACION según el día. El completado tampoco se detecta más

// por llegar a una cantidad fija de pomodoros (ahora es abierta) — se

// marca a mano con el botón de check en la lista de cursos, así que acá

// solo avanzamos el índice de progreso, sin pasarnos del último par

// agregado (si el usuario no agregó más pomodoros con "+", el progreso

// se queda esperando ahí).
//
// IMPORTANTE:
//
// Este progreso pertenece al día actual. Si un pomodoro de ayer intenta

// avanzar el progreso hoy, primero se comprueba la fecha y se reinicia

// el estado anterior.
// ─────────────────────────────────────────────────────────────────────────

export function avanzarProgresoPomodoro({ day, subject }) {
  if (!day || !subject) return null;

  asegurarDatosDelDia();

  const grupo = grupoFijoDelDia(day);

  if (!grupo.includes(subject)) return null;

  const pares = leerParesCurso(day, subject);

  const tasks = buildCourseTasks({
    pomodoros: pares,
  });

  const key = progressKey(day, subject);

  const progress = leerProgresoHorario();

  const currentIdx = progress[key] || 0;

  const nextIdx = Math.min(
    currentIdx + 1,
    tasks.length
  );

  guardarProgresoHorario({
    ...progress,
    [key]: nextIdx,
  });

  return {
    completado: false,
  };
}