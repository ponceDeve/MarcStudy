const KEY = "curso-ingles-progreso-v2";
export function cargarProgreso() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}
export function guardarProgreso(p) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* sin almacenamiento */ }
}
// Cantidad de secciones dominadas en un nivel
export function seccionesHechas(p, idNivel) {
  const s = (p[idNivel] && p[idNivel].secciones) || {};
  return Object.values(s).filter((x) => x.dominada).length;
}
