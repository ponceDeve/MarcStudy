// Parte visual de una respuesta del asistente: el ícono principal (si la
// entrada de conocimiento trae uno) y, opcionalmente, una fila de íconos
// relacionados con sus etiquetas — por ejemplo, los tres botones de un
// punto de teoría, o las vidas disponibles/perdidas. Todos son íconos
// reales de la propia interfaz (Font Awesome), nunca ilustraciones
// inventadas.
export default function AsistenteIconoPrincipal({ icono }) {
  if (!icono) return null;

  return (
    <div className="asistente-msg__icono-principal">
      <i className={icono} />
    </div>
  );
}

export function AsistenteIconosFila({ iconos }) {
  if (!iconos || iconos.length === 0) return null;

  return (
    <div className="asistente-msg__iconos-fila">
      {iconos.map((item, i) => (
        <div key={i} className="asistente-msg__icono-chip">
          <i className={item.icon} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
