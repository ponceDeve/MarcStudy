import { useState } from "react";
import Modal from "../../components/Modal";
import { AREAS_UNMSM } from "../../data/distribucionExamenUNMSM";

export default function SeleccionAreaModal({ open, onClose, onConfirmar }) {
  const [areaElegida, setAreaElegida] = useState(null);

  function confirmar() {
    if (!areaElegida) return;

    onConfirmar(areaElegida);
    setAreaElegida(null);
  }

  const nombreArea = areaElegida
    ? AREAS_UNMSM[areaElegida]
    : null;

  return (
    <Modal open={open} onClose={onClose}>
      <div className="seleccion-area">
        <h2 className="seleccion-area__title">
         Escoger área
        </h2>

        <p className="seleccion-area__subtitle">
          aproximadamente 90 preguntas o menos
        </p>

        <div className="seleccion-area__lista">
          {Object.entries(AREAS_UNMSM).map(([codigo]) => (
            <button
              key={codigo}
              type="button"
              className={`seleccion-area__opt ${
                areaElegida === codigo ? "is-selected" : ""
              }`}
              onClick={() => setAreaElegida(codigo)}
            >
              {codigo}
            </button>
          ))}
        </div>

        {nombreArea && (
          <div className="seleccion-area__nombre">
            {nombreArea}
          </div>
        )}

        <div className="seleccion-area__actions">
          <button
            type="button"
            className="seleccion-area__cancelar"
            onClick={onClose}
          >
            Cancelar
          </button>

          <button
            type="button"
            className="seleccion-area__ir"
            disabled={!areaElegida}
            onClick={confirmar}
          >
            Ir
          </button>
        </div>
      </div>
    </Modal>
  );
}