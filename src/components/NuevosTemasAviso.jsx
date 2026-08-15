import { useState, useEffect } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import manifest from "../data/manifest.json";

/**
 * NuevosTemasAviso
 * --------------------------------------------------------------
 * Al abrir la app, compara la cantidad de temas por curso contra la
 * última vez que este mismo dispositivo la abrió (guardado en el
 * celular/computadora del usuario, no en un servidor). Si algún
 * curso tiene más temas que antes, muestra un aviso con los nombres
 * de esos cursos.
 *
 * No es una notificación push (no llega con la app cerrada): solo
 * aparece cuando el usuario efectivamente entra a la app.
 */
export default function NuevosTemasAviso() {
  // "Foto" de cuántos temas tenía cada curso la última vez que este
  // usuario abrió la app. La primera vez que alguien entra, no hay
  // nada guardado todavía (snapshot === null).
  const [snapshot, setSnapshot] = useLocalStorage(
    "miEstudio_temasSnapshot",
    null
  );

  // Cursos que recibieron temas nuevos desde la última visita,
  // calculado una sola vez al montar el componente.
  const [cursosConNovedades, setCursosConNovedades] = useState([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Conteo actual de temas por curso (solo los que tienen contenido).
    const conteoActual = {};

    manifest.cursos.forEach((c) => {
      if (c.temas.length > 0) {
        conteoActual[c.codigo] = c.temas.length;
      }
    });

    if (snapshot) {
      // Ya había una visita anterior: comparamos curso por curso.
      const nuevos = manifest.cursos.filter((c) => {
        const antes = snapshot[c.codigo] || 0;
        const ahora = conteoActual[c.codigo] || 0;

        return ahora > antes;
      });

      if (nuevos.length > 0) {
        setCursosConNovedades(nuevos.map((c) => c.nombre));
        setVisible(true);
      }
    }

    // Guardamos la foto actual para la próxima visita, sea la primera
    // vez (solo establece la base, sin avisar nada) o no.
    setSnapshot(conteoActual);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo se calcula una vez, al entrar a la app.

  // Cierre automático después de 5 segundos.
  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      setVisible(false);
    }, 5000);

    // Si se cierra manualmente con la X, limpiamos el temporizador.
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible || cursosConNovedades.length === 0) return null;

  return (
    <div className="nuevos-temas-aviso" role="status">
      <i className="fa-solid fa-sparkles nuevos-temas-aviso__icon" />

      <p className="nuevos-temas-aviso__texto">
        <strong>Temas nuevos:</strong> {cursosConNovedades.join(", ")}
      </p>

      <button
        type="button"
        className="nuevos-temas-aviso__cerrar"
        aria-label="Cerrar aviso"
        onClick={() => setVisible(false)}
      >
        <i className="fa-solid fa-xmark" />
      </button>
    </div>
  );
}