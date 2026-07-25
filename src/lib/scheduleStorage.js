// ─────────────────────────────────────────────────────────────────────────
// Horario de Pomodoro personalizado por el usuario (reemplaza el horario
// fijo que antes vivía en data/schedule.js).
// Forma guardada: { lunes: [{subject, pomodoros}], martes: [...], ... }
// Solo aparecen las claves de los días que el usuario eligió.
// ─────────────────────────────────────────────────────────────────────────

export const SCHEDULE_STORAGE_KEY = "mi_estudio_horario_personalizado";

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

export const MAX_CURSOS_POR_DIA = 4;
export const LIMITE_NOMBRE_CURSO = 24;

export function leerHorario() {
  try {
    const raw = localStorage.getItem(SCHEDULE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.error("Error leyendo horario personalizado:", e);
    return null;
  }
}

export function guardarHorario(schedule) {
  try {
    localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(schedule));
  } catch (e) {
    console.error("Error guardando horario personalizado:", e);
  }
}

export function hayHorarioConfigurado() {
  const h = leerHorario();
  return !!(h && Object.keys(h).length > 0);
}
