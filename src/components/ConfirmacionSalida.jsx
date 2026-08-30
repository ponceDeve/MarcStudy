export default function ConfirmacionSalida({
  mostrar,
  onGuardarYSalir,
  onSalirSinGuardar,
  temaActual
}) {
  if (!mostrar) return null;

  return (
    <div className="confirmacion-salida__overlay">
      <div className="confirmacion-salida__modal">
        <div className="confirmacion-salida__icono">
          <i className="fa-solid fa-triangle-exclamation"></i>
        </div>

        <h3>Tienes cambios sin guardar</h3>

        <p>
          Marcaste textos en <strong>{temaActual}</strong> que aún no
          se guardaron.
        </p>

        <div className="confirmacion-salida__botones">
          <button
            type="button"
            className="confirmacion-salida__guardar"
            onClick={onGuardarYSalir}
          >
            Guardar y salir
          </button>

          <button
            type="button"
            className="confirmacion-salida__descartar"
            onClick={onSalirSinGuardar}
          >
            Salir sin guardar
          </button>
        </div>
      </div>
    </div>
  );
}
