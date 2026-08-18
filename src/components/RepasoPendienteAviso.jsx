import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { saludoConNombre } from "../lib/saludo";
import { leerLog, clasificarRepasos } from "../lib/repasoStorage";

// Este aviso NO guarda ningún estado de "ya lo vi": se recalcula cada vez
// que se monta (es decir, cada vez que se entra a Inicio). Por eso, si el
// usuario lo cierra sin marcar el check del repaso, va a volver a salir
// la próxima vez que abra la web. Solo deja de salir cuando el repaso
// se marca como hecho (deja de estar en "repasosHoy").
export default function RepasoPendienteAviso({ onDone }) {
  const [nombreUsuario] = useLocalStorage(
    "miEstudio_nombreUsuario",
    null
  );

  const [temasPendientes, setTemasPendientes] = useState([]);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const log = leerLog();
    const { repasosHoy } = clasificarRepasos(log);

    if (repasosHoy.length > 0) {
      setTemasPendientes(
        repasosHoy.map(({ entrada }) => ({
          subject: entrada.subject,
          tema: entrada.tema || entrada.subject
        }))
      );
      setVisible(true);
    } else if (onDone) {
      onDone();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cerrar() {
    // Solo oculta el aviso por esta visita; no se guarda nada, así que
    // reaparece la próxima vez que se entre mientras siga pendiente.
    setVisible(false);
    if (onDone) onDone();
  }

  function irARepaso() {
    setVisible(false);
    navigate("/repaso");
  }

  if (!visible || temasPendientes.length === 0) return null;

  return (
    <div className="repaso-pendiente-aviso" role="status">
      <div className="repaso-pendiente-aviso__header">
        <i className="fa-solid fa-brain repaso-pendiente-aviso__icon" />
        <p className="repaso-pendiente-aviso__saludo">
          {saludoConNombre(nombreUsuario)}
        </p>

        <button
          type="button"
          className="repaso-pendiente-aviso__cerrar"
          aria-label="Cerrar aviso"
          onClick={cerrar}
        >
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      <p className="repaso-pendiente-aviso__texto">
        {temasPendientes.length === 1
          ? "Tienes un repaso pendiente para hoy:"
          : "Tienes repasos pendientes para hoy:"}
      </p>

      <ol className="repaso-pendiente-aviso__lista">
        {temasPendientes.map((t, i) => (
          <li key={`${t.subject}-${i}`}>{t.tema}</li>
        ))}
      </ol>

      <button
        type="button"
        className="repaso-pendiente-aviso__boton"
        onClick={irARepaso}
      >
        Ir a Repaso
      </button>
    </div>
  );
}
