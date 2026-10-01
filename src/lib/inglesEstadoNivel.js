export const ETIQUETA = {
  bloqueado: "Bloqueado",
  disponible: "Disponible",
  progreso: "En progreso",
  completado: "Completado",
};
export const SIMBOLO = { bloqueado: "⊘", disponible: "○", progreso: "◐", completado: "✓" };

// Un nivel se desbloquea cuando el anterior está completado.
export function calcularEstado(lista, i) {
  const n = lista[i];
  if (n.hechas >= n.total) return "completado";
  if (n.hechas > 0) return "progreso";
  if (i === 0 || lista[i - 1].hechas >= lista[i - 1].total) return "disponible";
  return "bloqueado";
}

export const calcularPorcentaje = (n) => Math.round((n.hechas / n.total) * 100);

export function columnasSegunAncho(ancho) {
  if (ancho <= 480) return 3;
  if (ancho <= 768) return 4;
  if (ancho <= 1024) return 5;
  return 6;
}
