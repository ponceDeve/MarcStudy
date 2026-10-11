import React, { useEffect, useState } from "react";
import { ETIQUETA, SIMBOLO, calcularEstado, calcularPorcentaje, columnasSegunAncho } from "../lib/inglesEstadoNivel";
function NodoNivel({ nivel, estado, seleccionado, finDeFila, esUltimo, alSeleccionar }) {
  const porcentaje = calcularPorcentaje(nivel);
  const claseCelda = [
    "ruta__celda",
    finDeFila && "ruta__celda--fin-fila",
    esUltimo && "ruta__celda--ultima",
    estado === "completado" && "ruta__celda--completada",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={claseCelda}>
      <button
        type="button"
        className={`ruta__nivel ruta__nivel--${estado} ${seleccionado ? "ruta__nivel--seleccionado" : ""}`}
        aria-pressed={seleccionado}
        aria-label={`Nivel ${nivel.id}, ${nivel.nombre}, ${ETIQUETA[estado]}, ${porcentaje}% completado`}
        onClick={alSeleccionar}
      >
        <span className="ruta__simbolo" aria-hidden="true">{SIMBOLO[estado]}</span>
        <span className="ruta__numero">{nivel.id}</span>
        <span className="ruta__nombre">{nivel.nombre}</span>
        <span className="ruta__barra" aria-hidden="true">
          <i style={{ width: `${porcentaje}%` }} />
        </span>
      </button>
    </div>
  );
}
/**
 * Props:
 *  - niveles:        [{ id, nombre, total, hechas }]  (opcional)
 *  - alSeleccionar:  (nivel, estado) => void          (opcional)
 */
export default function RutaNiveles({ niveles = [], alSeleccionar }) {
  const [columnas, setColumnas] = useState(() => columnasSegunAncho(window.innerWidth));
  const [idSeleccionado, setIdSeleccionado] = useState(null);
  useEffect(() => {
    const actualizar = () => setColumnas(columnasSegunAncho(window.innerWidth));
    window.addEventListener("resize", actualizar);
    return () => window.removeEventListener("resize", actualizar);
  }, []);
  const filas = [];
  for (let i = 0; i < niveles.length; i += columnas) filas.push(niveles.slice(i, i + columnas));
  return (
    <div className="ruta" style={{ "--ruta-columnas": columnas }}>
      {filas.map((fila, iFila) => (
        <div key={iFila} className={`ruta__fila ${iFila % 2 === 1 ? "ruta__fila--invertida" : ""}`}>
          {fila.map((nivel, pos) => {
            const indice = niveles.indexOf(nivel);
            const estado = calcularEstado(niveles, indice);
            const esUltimo = indice === niveles.length - 1;
            return (
              <NodoNivel
                key={nivel.id}
                nivel={nivel}
                estado={estado}
                seleccionado={idSeleccionado === nivel.id}
                finDeFila={pos === fila.length - 1 && !esUltimo}
                esUltimo={esUltimo}
                alSeleccionar={() => {
                  setIdSeleccionado(nivel.id);
                  alSeleccionar?.(nivel, estado);
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
