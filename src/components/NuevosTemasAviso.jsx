import { useState, useEffect } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import manifest from "../data/manifest.json";

export default function NuevosTemasAviso() {
  const [snapshot, setSnapshot] = useLocalStorage(
    "miEstudio_temasSnapshot",
    null
  );

  const [cursosConNovedades, setCursosConNovedades] = useState([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 1. Conteo actual de temas por curso
    const conteoActual = {};
    manifest.cursos.forEach((c) => {
      if (c.temas.length > 0) {
        conteoActual[c.codigo] = c.temas.length;
      }
    });

    // 2. Si ya existía un snapshot anterior, comparamos
    if (snapshot !== null) {
      const nuevos = manifest.cursos.filter((c) => {
        const antes = snapshot[c.codigo] || 0;
        const ahora = conteoActual[c.codigo] || 0;
        return ahora > antes;
      });

      if (nuevos.length > 0) {
        setCursosConNovedades(nuevos.map((c) => c.nombre));
        setVisible(true);
      }
      
      // Opcional: Si quieres actualizar el snapshot inmediatamente o al cerrar el aviso.
      // Lo seguro es actualizarlo aquí para que la próxima vez compare contra este momento,
      // PERO asegurándonos de haber hecho la comparación con el snapshot *viejo* primero.
    }

    // 3. Guardamos el conteo actual para la *siguiente* visita
    setSnapshot(conteoActual);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cierre automático después de 5 segundos.
  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      setVisible(false);
    }, 5000);

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