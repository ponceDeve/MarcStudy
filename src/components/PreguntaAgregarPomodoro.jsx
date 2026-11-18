import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { usePomodoro } from "../context/PomodoroContext";
import { agregarParCurso } from "../lib/horarioProgress";
// ─────────────────────────────────────────────────────────────────────────
// "¿Quieres añadir otro pomodoro?" — se muestra al terminar el último
// pomodoro planeado de un curso. Los estilos (.horario__agregar-*) están
// en _horario.scss.
// ─────────────────────────────────────────────────────────────────────────
export default function PreguntaAgregarPomodoro({
  subject,
  onResponder,
}) {
  return (
    <div
      className="horario__agregar-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="horario-agregar-titulo"
    >
      <div className="horario__agregar-card">
        <i className="fa-solid fa-circle-check horario__agregar-icono" />
        <h3
          id="horario-agregar-titulo"
          className="horario__agregar-titulo"
        >
          ¡Pomodoro terminado!
        </h3>
        <p className="horario__agregar-texto">
          ¿Quieres añadir otro pomodoro a <strong>{subject}</strong>?
        </p>
        <div className="horario__agregar-acciones">
          <button
            type="button"
            className="horario__agregar-btn is-secundario"
            onClick={() => onResponder(false)}
          >
            Ahora no
          </button>
          <button
            type="button"
            className="horario__agregar-btn is-primario"
            onClick={() => onResponder(true)}
          >
            <i className="fas fa-plus" /> Añadir pomodoro
          </button>
        </div>
      </div>
    </div>
  );
}
// Versión para el resto de la app (Mi Estudio, Repaso, Examen, Inglés...).
// En /pomodoro la muestra HorarioPage, porque ahí además hay que
// actualizar su lista de pomodoros en pantalla.
export function PreguntaAgregarPomodoroGlobal() {
  const { preguntaAgregar, cerrarPreguntaAgregar, avisoFinAbierto } =
    usePomodoro();
  const { pathname } = useLocation();
  // Pequeña espera: Mi Estudio abre su aviso "¡Se acabó el tiempo!" un
  // instante después de que termina el cronómetro; sin esto la pregunta
  // parpadearía antes de que ese aviso aparezca.
  const [listo, setListo] = useState(false);
  useEffect(() => {
    if (!preguntaAgregar) {
      setListo(false);
      return undefined;
    }
    const t = setTimeout(() => setListo(true), 400);
    return () => clearTimeout(t);
  }, [preguntaAgregar]);
  if (
    !preguntaAgregar ||
    !listo ||
    avisoFinAbierto ||
    pathname.endsWith("/pomodoro")
  ) {
    return null;
  }
  return (
    <PreguntaAgregarPomodoro
      subject={preguntaAgregar.subject}
      onResponder={(agregar) => {
        if (agregar) {
          agregarParCurso(
            preguntaAgregar.day,
            preguntaAgregar.subject
          );
        }
        cerrarPreguntaAgregar();
      }}
    />
  );
}