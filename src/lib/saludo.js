// ─────────────────────────────────────────────────────────────────────────
// Saludo calmado según la hora del día, con el nombre del usuario.
// Usado por los avisos que aparecen al entrar a Inicio.
// ─────────────────────────────────────────────────────────────────────────

export function franjaHoraria(fecha = new Date()) {
  const hora = fecha.getHours();

  if (hora >= 5 && hora < 12) return "Buenos días";
  if (hora >= 12 && hora < 19) return "Buenas tardes";

  return "Buenas noches";
}

export function saludoConNombre(nombreUsuario, fecha = new Date()) {
  const base = franjaHoraria(fecha);

  return nombreUsuario ? `${base}, ${nombreUsuario}` : base;
}
