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

export function guardarPomodoroCompartido(estado) {
  try {
    localStorage.setItem(POMO_SHARED_KEY, JSON.stringify(estado));
  } catch (e) {
    console.error("Error guardando pomodoro compartido:", e);
  }
}

export function leerPomodoroCompartido() {
  try {
    const raw = localStorage.getItem(POMO_SHARED_KEY);
    return raw ? JSON.parse(raw) : null;
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

// Nombre del tema al que hay que volver después de presionar "Iniciar"
// en Pomodoro (se guarda justo antes de mandar al usuario a esa pestaña
// desde el aviso de "se acabó el tiempo").
export function guardarRetorno(temaNombre) {
  try {
    localStorage.setItem(
      POMO_RETORNO_KEY,
      JSON.stringify({ tema: temaNombre, timestamp: Date.now() })
    );
  } catch {
    /* noop */
  }
}

// Lee el retorno guardado, descartándolo (y borrándolo) si ya quedó viejo
// u olvidado, o si es un valor del formato antiguo (string plano).
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

    if (!data?.tema || !data?.timestamp) {
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
// Tema elegido por curso+día. Se guarda apenas el usuario elige el tema
// para un curso, y se usa para NO volver a preguntar el tema en los
// siguientes pomodoros de ese mismo curso (ej: pomodoro 2, 3, 4...),
// aunque ya se haya salido de la página de Pomodoro mientras corría.
// ─────────────────────────────────────────────────────────────────────────
const TEMA_CURSO_KEY = "mi_estudio_pomodoro_tema_curso";

function claveTemaCurso(day, subject) {
  return `${day}::${subject}`;
}

export function guardarTemaCurso(day, subject, tema) {
  try {
    const raw = localStorage.getItem(TEMA_CURSO_KEY);
    const mapa = raw ? JSON.parse(raw) : {};
    mapa[claveTemaCurso(day, subject)] = tema;
    localStorage.setItem(TEMA_CURSO_KEY, JSON.stringify(mapa));
  } catch {
    /* noop */
  }
}

export function leerTemaCurso(day, subject) {
  try {
    const raw = localStorage.getItem(TEMA_CURSO_KEY);
    const mapa = raw ? JSON.parse(raw) : {};
    return mapa[claveTemaCurso(day, subject)] || null;
  } catch {
    return null;
  }
}

export function limpiarTemaCurso(day, subject) {
  try {
    const raw = localStorage.getItem(TEMA_CURSO_KEY);
    if (!raw) return;
    const mapa = JSON.parse(raw);
    delete mapa[claveTemaCurso(day, subject)];
    localStorage.setItem(TEMA_CURSO_KEY, JSON.stringify(mapa));
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
// ─────────────────────────────────────────────────────────────────────────
const POSICION_ESTUDIO_KEY = "mi_estudio_posicion_actual";

export function guardarPosicionEstudio(posicion) {
  try {
    localStorage.setItem(POSICION_ESTUDIO_KEY, JSON.stringify(posicion));
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