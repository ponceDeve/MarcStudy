// ─────────────────────────────────────────────────────────────────────────
// Estado del pomodoro compartido entre pestañas (Pomodoro corre en una
// pestaña/página, pero Mi Estudio en otra necesita enterarse cuando se
// acaba el tiempo). Se guarda en localStorage con hora absoluta de fin,
// así cualquier pestaña puede calcular el tiempo restante sin depender
// de que un setInterval siga vivo en segundo plano.
// ─────────────────────────────────────────────────────────────────────────

const POMO_SHARED_KEY = "mi_estudio_pomodoro_compartido";
const POMO_RETORNO_KEY = "mi_estudio_pomodoro_retorno";

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
    localStorage.setItem(POMO_RETORNO_KEY, temaNombre);
  } catch {
    /* noop */
  }
}

// Igual que leerYLimpiarRetorno, pero sin borrar el valor: sirve para
// mostrar un botón persistente de "volver al tema" que no se pierda
// la primera vez que se lee.
export function leerRetorno() {
  try {
    return localStorage.getItem(POMO_RETORNO_KEY);
  } catch {
    return null;
  }
}

export function leerYLimpiarRetorno() {
  try {
    const v = localStorage.getItem(POMO_RETORNO_KEY);
    if (v) localStorage.removeItem(POMO_RETORNO_KEY);
    return v;
  } catch {
    return null;
  }
}