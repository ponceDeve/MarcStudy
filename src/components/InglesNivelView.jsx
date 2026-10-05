import React, { useEffect, useState } from "react";
import Leccion from "./InglesLeccion";
// Abre directo en la primera sesión pendiente. Una sesión a la vez, sin listas.
export default function NivelView({ nivel, progreso, alGuardar, alVolver, datosIniciales }) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [idx, setIdx] = useState(0);
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    setDatos(null); setError(null);
    const aplicar = (d) => {
      const hechas = (progreso[nivel.id] && progreso[nivel.id].secciones) || {};
      const primera = d.secciones.findIndex((s) => !(hechas[s.id] && hechas[s.id].dominada));
      setIdx(primera === -1 ? 0 : primera);
      setDatos(d);
    };
    // Si el nivel ya viene cargado (página principal), no hace falta pedirlo otra vez.
    if (datosIniciales) { aplicar(datosIniciales); return; }
    fetch(`${import.meta.env.BASE_URL}${nivel.archivo}`)
      .then((r) => { if (!r.ok) throw new Error(`No se encontró ${nivel.archivo}`); return r.json(); })
      .then(aplicar)
      .catch((e) => setError(e.message));
  }, [nivel.archivo]); // eslint-disable-line
  if (error) return <div className="niv"><button type="button" className="ing-btn ing-btn--suave" onClick={alVolver}>←</button><p className="niv__error">{error}</p></div>;
  if (!datos) return <div className="niv"><p>Cargando...</p></div>;
  const seccion = datos.secciones[idx];
  const total = datos.secciones.length;
  return (
    <div className="niv">
      <header className="niv__cab">
        <button type="button" className="ing-btn ing-btn--suave" onClick={alVolver} aria-label="Volver al mapa">←</button>
        <span className="niv__nombre">Nivel {datos.id} · {datos.nombre}</span>
        <span className="niv__pos">{idx + 1} / {total}</span>
      </header>
      <div className="niv__barra" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={idx}><i style={{ width: `${(idx / total) * 100}%` }} /></div>
      <Leccion
        key={`${seccion.id}-${intento}`}
        seccion={seccion}
        esUltima={idx === total - 1}
        alTerminar={(r) => alGuardar(nivel.id, seccion.id, r)}
        alSiguiente={() => (idx === total - 1 ? alVolver() : setIdx(idx + 1))}
        alRepetir={() => setIntento(intento + 1)}
        alAnterior={idx > 0 ? () => setIdx(idx - 1) : null}
        alSaltar={idx < total - 1 ? () => setIdx(idx + 1) : null}
      />
    </div>
  );
}