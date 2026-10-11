// ─────────────────────────────────────────────────────────────────────────
// Estado del pomodoro compartido entre pestañas (Pomodoro corre en una
// pestaña/página, pero Mi Estudio en otra necesita enterarse cuando se
// acaba el tiempo). Se guarda en localStorage con hora absoluta de fin,
// así cualquier pestaña puede calcular el tiempo restante sin depender
// de que un setInterval siga vivo en segundo plano.
// ─────────────────────────────────────────────────────────────────────────

const POMO_SHARED_KEY = "mi_estudio_pomodoro_compartido";

const POMO_RETORNO_KEY = "mi_estudio_pomodoro_retorno";

// Si el retorno guardado tiene más de esto, se considera olvidado/abandonado
// y no debe reabrir el tema solo (mismo criterio que UMBRAL_ABANDONO_MS).
const UMBRAL_RETORNO_MS = 2 * 60 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────
// Fecha local actual
//
// Se usa la fecha real y no solamente el nombre del día de la semana,
// porque "lunes" vuelve a aparecer cada semana.
// ─────────────────────────────────────────────────────────────────────────

function fechaHoy() {
  const ahora = new Date();

  return `${ahora.getFullYear()}-${String(
    ahora.getMonth() + 1
  ).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;
}

// ─────────────────────────────────────────────────────────────────────────
// Pomodoro compartido
// ─────────────────────────────────────────────────────────────────────────

export function guardarPomodoroCompartido(estado) {
  try {
    localStorage.setItem(
      POMO_SHARED_KEY,
      JSON.stringify({
        ...estado,
        fecha: fechaHoy(),
      })
    );
  } catch (e) {
    console.error("Error guardando pomodoro compartido:", e);
  }
}

export function leerPomodoroCompartido() {
  try {
    const raw = localStorage.getItem(POMO_SHARED_KEY);

    if (!raw) return null;

    const estado = JSON.parse(raw);

    // Un pomodoro que pertenece a otro día ya no debe restaurarse.
    if (estado?.fecha !== fechaHoy()) {
      localStorage.removeItem(POMO_SHARED_KEY);
      return null;
    }

    return estado;
  } catch {
    return null;
  }
}

export function limpiarPomodoroCompartido() {
  try {
    localStorage.removeItem(POMO_SHARED_KEY);
  } catch {
    /* noop */
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Nombre del tema al que hay que volver después de presionar "Iniciar"
// en Pomodoro (se guarda justo antes de mandar al usuario a esa pestaña
// desde el aviso de "se acabó el tiempo").
//
// El retorno también es válido solamente durante el mismo día.
// ─────────────────────────────────────────────────────────────────────────

export function guardarRetorno(temaNombre) {
  try {
    localStorage.setItem(
      POMO_RETORNO_KEY,
      JSON.stringify({
        tema: temaNombre,
        timestamp: Date.now(),
        fecha: fechaHoy(),
      })
    );
  } catch {
    /* noop */
  }
}

// Lee el retorno guardado, descartándolo (y borrándolo) si ya quedó viejo
// u olvidado, si pertenece a otro día, o si es un valor del formato antiguo
// (string plano).

function leerRetornoVigente() {
  try {
    const raw = localStorage.getItem(POMO_RETORNO_KEY);

    if (!raw) return null;

    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      // Formato viejo (string plano sin timestamp): ya no es confiable.
      localStorage.removeItem(POMO_RETORNO_KEY);
      return null;
    }

    if (!data?.tema || !data?.timestamp || !data?.fecha) {
      localStorage.removeItem(POMO_RETORNO_KEY);
      return null;
    }

    // El retorno de ayer no debe aparecer hoy.
    if (data.fecha !== fechaHoy()) {
      localStorage.removeItem(POMO_RETORNO_KEY);
      return null;
    }

    if (Date.now() - data.timestamp > UMBRAL_RETORNO_MS) {
      localStorage.removeItem(POMO_RETORNO_KEY);
      return null;
    }

    return data.tema;
  } catch {
    return null;
  }
}

// Igual que leerYLimpiarRetorno, pero sin borrar el valor: sirve para
// mostrar un botón persistente de "volver al tema" que no se pierda
// la primera vez que se lee.

export function leerRetorno() {
  return leerRetornoVigente();
}

export function leerYLimpiarRetorno() {
  const tema = leerRetornoVigente();

  if (tema) {
    try {
      localStorage.removeItem(POMO_RETORNO_KEY);
    } catch {
      /* noop */
    }
  }

  return tema;
}

// ─────────────────────────────────────────────────────────────────────────
// Tema elegido por curso+día.
//
// Se guarda apenas el usuario elige el tema para un curso, y se usa para
// NO volver a preguntar el tema en los siguientes pomodoros de ese mismo
// curso durante el mismo día.
//
// Ejemplo:
// 2026-10-05::domingo::Cívica → Derechos Humanos
// 2026-10-05::domingo::Física → Cinemática
//
// Al cambiar el día, todos estos temas dejan de existir para el horario.
// ─────────────────────────────────────────────────────────────────────────

const TEMA_CURSO_KEY = "mi_estudio_pomodoro_tema_curso";

function claveTemaCurso(day, subject) {
  return `${fechaHoy()}::${day}::${subject}`;
}

function leerMapaTemasCurso() {
  try {
    const raw = localStorage.getItem(TEMA_CURSO_KEY);

    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Conserva solamente los temas correspondientes al día actual.
// De esta manera, los temas de días anteriores no vuelven a aparecer.

function limpiarTemasDeDiasAnteriores(mapa) {
  const fecha = fechaHoy();
  const mapaActual = {};

  Object.entries(mapa).forEach(([key, value]) => {
    if (key.startsWith(`${fecha}::`)) {
      mapaActual[key] = value;
    }
  });

  return mapaActual;
}

export function guardarTemaCurso(day, subject, tema) {
  try {
    const mapaAnterior = leerMapaTemasCurso();

    const mapa = limpiarTemasDeDiasAnteriores(mapaAnterior);

    mapa[claveTemaCurso(day, subject)] = tema;

    localStorage.setItem(
      TEMA_CURSO_KEY,
      JSON.stringify(mapa)
    );
  } catch {
    /* noop */
  }
}

export function leerTemaCurso(day, subject) {
  try {
    const mapaAnterior = leerMapaTemasCurso();

    const mapa = limpiarTemasDeDiasAnteriores(mapaAnterior);

    // Elimina del almacenamiento los temas de días anteriores.
    localStorage.setItem(
      TEMA_CURSO_KEY,
      JSON.stringify(mapa)
    );

    return mapa[claveTemaCurso(day, subject)] || null;
  } catch {
    return null;
  }
}

export function limpiarTemaCurso(day, subject) {
  try {
    const mapaAnterior = leerMapaTemasCurso();

    const mapa = limpiarTemasDeDiasAnteriores(mapaAnterior);

    delete mapa[claveTemaCurso(day, subject)];

    localStorage.setItem(
      TEMA_CURSO_KEY,
      JSON.stringify(mapa)
    );
  } catch {
    /* noop */
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Curso activo (día + materia) dentro de Horario. Se guarda mientras el
// usuario está "dentro" de un curso, para poder restaurar esa vista al
// volver a la página (por ejemplo, después de ir a Mi Estudio a estudiar
// mientras corre el pomodoro y regresar cuando se acaba el tiempo).
//
// El curso activo también pertenece al día actual. Si quedó guardado de
// ayer, no se restaura.
// ─────────────────────────────────────────────────────────────────────────

const CURSO_ACTIVO_KEY = "mi_estudio_pomodoro_curso_activo";

export function guardarCursoActivo(day, subject) {
  try {
    if (!subject) {
      localStorage.removeItem(CURSO_ACTIVO_KEY);
      return;
    }

    localStorage.setItem(
      CURSO_ACTIVO_KEY,
      JSON.stringify({
        fecha: fechaHoy(),
        day,
        subject,
      })
    );
  } catch {
    /* noop */
  }
}

export function leerCursoActivo() {
  try {
    const raw = localStorage.getItem(CURSO_ACTIVO_KEY);

    if (!raw) return null;

    const curso = JSON.parse(raw);

    // Un curso activo de otro día ya no debe restaurarse.
    if (curso?.fecha !== fechaHoy()) {
      localStorage.removeItem(CURSO_ACTIVO_KEY);
      return null;
    }

    return curso;
  } catch {
    return null;
  }
}

export function limpiarCursoActivo() {
  try {
    localStorage.removeItem(CURSO_ACTIVO_KEY);
  } catch {
    /* noop */
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Posición exacta (card, stage, modo) dentro de un tema de Mi Estudio.
// Se guarda mientras el usuario navega las tarjetas, y se usa al volver
// de Pomodoro (o de cualquier otra pantalla) para seguir en la misma
// card en vez de reiniciar el tema desde cero y volver a preguntar si
// mostrar la teoría.
//
// Esta posición NO se reinicia por cambio de día porque pertenece a
// Mi Estudio, no al estado diario del horario.
// ─────────────────────────────────────────────────────────────────────────

const POSICION_ESTUDIO_KEY = "mi_estudio_posicion_actual";

export function guardarPosicionEstudio(posicion) {
  try {
    localStorage.setItem(
      POSICION_ESTUDIO_KEY,
      JSON.stringify(posicion)
    );
  } catch {
    /* noop */
  }
}

export function leerPosicionEstudio() {
  try {
    const raw = localStorage.getItem(POSICION_ESTUDIO_KEY);

    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}