import { useEffect, useRef, useState } from "react";
import { buscarConPuntaje } from "../../lib/buscador";

export default function LevelsModal({
  open,
  onClose,
  flatPuntos = [],
  maxUnlocked,
  current,
  onSelect,
}) {
  const [busqueda, setBusqueda] = useState("");
  const puntoInicioToque = useRef(null);
  const UMBRAL_ARRASTRE = 10;

  useEffect(() => {
    if (!open) setBusqueda("");
  }, [open]);

  if (!open) return null;

  const total = flatPuntos.length;

  function previewNivel(i) {
    const levelData = flatPuntos[i] || {};
    const textoBase = levelData.tema || levelData.nombre || levelData.q || levelData.textoConEspacios || "";
    return textoBase || `Nivel ${i + 1}`;
  }

  // Compara dónde empezó el toque (pointerdown) contra dónde terminó
  // (click) para distinguir un tap real de un scroll/arrastre.
  function fueArrastre(e) {
    const inicio = puntoInicioToque.current;
    if (!inicio) return false;
    const dx = e.clientX - inicio.x;
    const dy = e.clientY - inicio.y;
    return Math.sqrt(dx * dx + dy * dy) > UMBRAL_ARRASTRE;
  }

  function seleccionar(i, locked) {
    if (locked) return;
    onSelect(i);
    onClose();
  }

  const indices = Array.from({ length: total }, (_, i) => i);
  const indicesFiltrados = busqueda.trim()
    ? buscarConPuntaje(indices, busqueda, (i) => previewNivel(i))
    : indices;

  return (
    <div className="levels-modal" onClick={onClose}>
      <div className="levels-modal__inner" onClick={(e) => e.stopPropagation()}>
        <h2 className="levels-modal__title">Seleccionar Nivel</h2>

        <div className="home-search levels-modal__search" onClick={(e) => e.stopPropagation()}>
          <input autoComplete="off"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar nivel..."
            className="home-search-input"
          />
        </div>

        <div className="levels-modal__grid">
          {indicesFiltrados.map((i) => {
            const locked = i > maxUnlocked;
            const isCurrent = i === current;

            return (
              <div key={i} className="level-cell">
                <button
                  disabled={locked}
                  onPointerDown={(e) => {
                    puntoInicioToque.current = { x: e.clientX, y: e.clientY };
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (fueArrastre(e)) return;
                    seleccionar(i, locked);
                  }}
                  className={`level-btn ${isCurrent ? "is-current" : ""}`}
                >
                  {locked ? <i className="fas fa-lock" /> : i + 1}
                </button>
              </div>
            );
          })}
        </div>

        {indicesFiltrados.length === 0 && (
          <p style={{ color: "var(--ink-soft)", marginBottom: "20px" }}>
            Ningún nivel coincide con "{busqueda}".
          </p>
        )}

        <button onClick={onClose} className="levels-modal__close">
          <i className="fas fa-times" /> Volver al Juego
        </button>
      </div>
    </div>
  );
}