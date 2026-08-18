import { useState, useEffect } from "react";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { saludoConNombre } from "../lib/saludo";
import manifest from "../data/manifest.json";

export default function NuevosTemasAviso({ onDone }) {
  const [snapshot, setSnapshot] = useLocalStorage(
    "miEstudio_temasSnapshot",
    null
  );

  const [nombreUsuario] = useLocalStorage(
    "miEstudio_nombreUsuario",
    null
  );

  const [cursosConNovedades, setCursosConNovedades] = useState([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function obtenerIdentificadorTema(tema) {
      if (typeof tema === "string") {
        return tema;
      }

      if (!tema || typeof tema !== "object") {
        return String(tema);
      }

      return (
        tema.codigo ??
        tema.id ??
        tema.nombre ??
        tema.titulo ??
        tema.tema ??
        tema.name ??
        JSON.stringify(tema)
      );
    }

    // 1. Creamos el snapshot actual con todos los temas de cada curso.
    const snapshotActual = {};

    manifest.cursos.forEach((curso) => {
      snapshotActual[curso.codigo] = (curso.temas || []).map((tema) =>
        obtenerIdentificadorTema(tema)
      );
    });

    let huboNovedades = false;

    // 2. Comparamos con el snapshot anterior.
    if (snapshot !== null) {
      const novedades = [];

      manifest.cursos.forEach((curso) => {
        const temasActuales = curso.temas || [];

        const temasAnteriores = Array.isArray(snapshot[curso.codigo])
          ? snapshot[curso.codigo]
          : [];

        const temasNuevos = temasActuales.filter((tema) => {
          const identificador = obtenerIdentificadorTema(tema);

          return !temasAnteriores.includes(identificador);
        });

        if (temasNuevos.length > 0) {
          novedades.push({
            codigo: curso.codigo,
            nombre: curso.nombre,
            temas: temasNuevos,
          });
        }
      });

      if (novedades.length > 0) {
        setCursosConNovedades(novedades);
        setVisible(true);
        huboNovedades = true;
      }
    }

    // 3. Guardamos el snapshot actual para la siguiente visita.
    setSnapshot(snapshotActual);

    // Si no hay novedades, avisamos al padre.
    if (!huboNovedades && onDone) {
      onDone();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cierre automático después de 10 segundos.
  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      cerrar();
    }, 10000);

    return () => clearTimeout(timer);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function cerrar() {
    setVisible(false);

    if (onDone) {
      onDone();
    }
  }

  if (!visible || cursosConNovedades.length === 0) {
    return null;
  }

  return (
    <div className="nuevos-temas-aviso" role="status">
      <div className="nuevos-temas-aviso__header">
        <i className="fa-solid fa-sparkles nuevos-temas-aviso__icon" />

        <p className="nuevos-temas-aviso__saludo">
          {saludoConNombre(nombreUsuario)}
        </p>

        <button
          type="button"
          className="nuevos-temas-aviso__cerrar"
          aria-label="Cerrar aviso"
          onClick={cerrar}
        >
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      <p className="nuevos-temas-aviso__texto">
        Se agregaron nuevos temas desde tu última visita:
      </p>

      <div className="nuevos-temas-aviso__cursos">
        {cursosConNovedades.map((curso) => (
          <div
            className="nuevos-temas-aviso__curso"
            key={curso.codigo}
          >
            <p className="nuevos-temas-aviso__curso-nombre">
              {curso.nombre}
            </p>

            <span className="nuevos-temas-aviso__cantidad">
              +{curso.temas.length}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}