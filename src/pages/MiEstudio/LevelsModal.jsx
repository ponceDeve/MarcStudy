import { useEffect, useRef, useState } from "react";
import { buscarConPuntaje } from "../../lib/buscador";

export default function LevelsModal({
  open,
  onClose,
  flatPuntos = [],
  maxUnlocked,
  current,
  onSelect
}) {
  const [busqueda, setBusqueda] = useState("");
  const [nivelSeleccionado, setNivelSeleccionado] = useState(null);
  const puntoInicioToque = useRef(null);
  const UMBRAL_ARRASTRE = 10;

  useEffect(() => {
    if (!open) {
      setBusqueda("");
      setNivelSeleccionado(null);
      puntoInicioToque.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (current !== undefined && current !== null) {
      setNivelSeleccionado(current);
    }
  }, [current]);

  const total = flatPuntos.length;

  function previewNivel(i) {
    const levelData = flatPuntos[i] || {};

    const textoBase =
      levelData.tema ||
      levelData.nombre ||
      levelData.q ||
      levelData.textoConEspacios ||
      "";

    return textoBase || `Nivel ${i + 1}`;
  }

  function iniciarToque(e) {
    puntoInicioToque.current = {
      x: e.clientX,
      y: e.clientY
    };
  }

  function fueArrastre(e) {
    const inicio = puntoInicioToque.current;

    if (!inicio) {
      return false;
    }

    const dx = e.clientX - inicio.x;
    const dy = e.clientY - inicio.y;

    return (
      Math.sqrt(dx * dx + dy * dy) >
      UMBRAL_ARRASTRE
    );
  }

  function limpiarToque() {
    puntoInicioToque.current = null;
  }

  function seleccionar(i, locked) {
    if (locked) {
      return;
    }

    if (nivelSeleccionado === i) {
      onSelect(i);
      onClose();
      return;
    }

    setNivelSeleccionado(i);
  }

  const indices = Array.from(
    { length: total },
    (_, i) => i
  );

  const indicesFiltrados = busqueda.trim()
    ? buscarConPuntaje(
        indices,
        busqueda,
        (i) => previewNivel(i)
      )
    : indices;

  return (
    <div
      className={`levels-modal ${
        open ? "" : "is-closed"
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      aria-hidden={!open}
    >
      <h2 className="levels-modal__title levels-modal__title--live">
        Seleccionar Nivel
      </h2>

      <div
        className="levels-modal__inner"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`home-search levels-modal__search ${
            busqueda.trim()
              ? "has-query"
              : ""
          }`}
          onClick={(e) =>
            e.stopPropagation()
          }
        >
          <input
            autoComplete="off"
            type="search"
            name="buscar-nivel"
            value={busqueda}
            onChange={(e) =>
              setBusqueda(e.target.value)
            }
            placeholder="Buscar nivel..."
            className="home-search-input"
          />
        </div>

        <div className="levels-modal__grid">
          {indicesFiltrados.map((i) => {
            const locked =
              i > maxUnlocked;

            const isSelected =
              i === nivelSeleccionado;

            return (
              <div
                key={i}
                className="level-cell"
              >
                <button
                  type="button"
                  disabled={locked}
                  onPointerDown={
                    iniciarToque
                  }
                  onClick={(e) => {
                    e.stopPropagation();

                    const arrastre =
                      fueArrastre(e);

                    limpiarToque();

                    if (arrastre) {
                      return;
                    }

                    seleccionar(
                      i,
                      locked
                    );
                  }}
                  onPointerCancel={
                    limpiarToque
                  }
                  className={`level-btn ${
                    isSelected
                      ? "is-selected"
                      : ""
                  }`}
                >
                  {locked ? (
                    <i className="fas fa-lock" />
                  ) : (
                    i + 1
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {indicesFiltrados.length === 0 && (
          <p
            style={{
              color: "var(--ink-soft)",
              marginBottom: "20px"
            }}
          >
            Ningún nivel coincide con "
            {busqueda}".
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="levels-modal__close"
        >
          <i className="fas fa-times" />
          Volver al Juego
        </button>
      </div>
    </div>
  );
}