import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import AppHeader from "../../components/AppHeader";
import SearchModal from "../../components/SearchModal";

import {
  leerLog,
  marcarRepasoHecho,
  clasificarRepasos,
  intervaloClasses,
  formatearFecha,
  fechaHoy,
  diffDias,
  REPASO_INTERVALOS,
  eliminarRepaso
} from "../../lib/repasoStorage";

// La bienvenida con tutorial fijo (PASOS_BIENVENIDA) se reemplazó por la
// sección de Preguntas frecuentes en Inicio: cualquier duda sobre cómo
// funciona el Repaso se responde ahora desde ahí.

export default function RepasoPage() {
  const navigate = useNavigate();

  const [nombreUsuario] = useLocalStorage(
    "miEstudio_nombreUsuario",
    null
  );

  const [searchOpen, setSearchOpen] = useState(false);

  const [log, setLog] = useState(() => leerLog());

  const [deleteState, setDeleteState] = useState({
    isOpen: false,
    id: null,
    phase: 1
  });

  const nombreFormateado = nombreUsuario
    ? nombreUsuario.charAt(0).toUpperCase() +
      nombreUsuario.slice(1)
    : "";

  function irAMiEstudio(nombre) {
    navigate(`/?q=${encodeURIComponent(nombre)}`);
  }

  const { repasosHoy, proximos } = useMemo(
    () => clasificarRepasos(log),
    [log]
  );

  /*
   * ─────────────────────────────────────────────────────────────
   * NOTIFICACIONES (pendiente)
   * ─────────────────────────────────────────────────────────────
   *
   * Antes se llamaba aquí a programarNotificacionRepasos(repasosHoy),
   * pero esa función nunca se implementó (no existe en el proyecto
   * ni hay un plugin de notificaciones instalado), lo que rompía
   * esta pantalla con un ReferenceError apenas se entraba a Repasos.
   *
   * Si más adelante se agrega @capacitor/local-notifications,
   * volver a colocar aquí el useEffect que llame a esa función.
   */

  /*
   * ─────────────────────────────────────────────────────────────
   * MARCAR REPASO
   * ─────────────────────────────────────────────────────────────
   */

  function marcar(
    id,
    intervaloIdx,
    repasosDoneActual
  ) {
    const repasosDone = Array.isArray(
      repasosDoneActual
    )
      ? [...repasosDoneActual]
      : [];

    if (!repasosDone.includes(intervaloIdx)) {
      repasosDone.push(intervaloIdx);
    }

    setLog(
      marcarRepasoHecho(
        id,
        repasosDone
      )
    );
  }

  /*
   * ─────────────────────────────────────────────────────────────
   * ELIMINAR
   * ─────────────────────────────────────────────────────────────
   */

  function iniciarBorrado(id) {
    setDeleteState({
      isOpen: true,
      id,
      phase: 1
    });
  }

  function confirmarBorrado() {
    if (deleteState.phase === 1) {
      setDeleteState({
        ...deleteState,
        phase: 2
      });
    } else {
      setLog(
        eliminarRepaso(
          deleteState.id
        )
      );

      setDeleteState({
        isOpen: false,
        id: null,
        phase: 1
      });
    }
  }

  function cancelarBorrado() {
    setDeleteState({
      isOpen: false,
      id: null,
      phase: 1
    });
  }

  /*
   * ─────────────────────────────────────────────────────────────
   * AGRUPAR PRÓXIMOS REPASOS POR FECHA
   * ─────────────────────────────────────────────────────────────
   */

  const porFecha = useMemo(() => {
    const map = {};

    proximos.forEach((item) => {
      if (!map[item.fecha]) {
        map[item.fecha] = [];
      }

      map[item.fecha].push(item);
    });

    return map;
  }, [proximos]);

  return (
    <main className="container__repaso">
      <div className="repaso container">

        <AppHeader
          section="repaso"
          onAbrirBuscador={() =>
            setSearchOpen(true)
          }
        />

        {/* ─────────────────────────────────────
            CABECERA
        ───────────────────────────────────── */}

        <div className="repaso__header">

          <h1 className="repaso__title">
            {nombreFormateado
              ? `Tus repasos de hoy, ${nombreFormateado}`
              : "Tus repasos de hoy"}
          </h1>

          <p className="repaso__date">
            {formatearFecha(fechaHoy())}
          </p>

        </div>

        {/* ─────────────────────────────────────
            REPASOS DE HOY
        ───────────────────────────────────── */}

        <section className="repaso__section">

          <div className="repaso__list">

            {repasosHoy.map(
              ({
                entrada,
                intervaloIdx,
                vencido
              }) => {

                const lc =
                  intervaloClasses(
                    intervaloIdx
                  );

                const numRepaso =
                  intervaloIdx + 1;

                return (
                  <div
                    key={entrada.id}
                    className={`repaso__item ${lc.box}`}
                  >

                    <div className="repaso__item-body">

                      {/* ETIQUETAS */}

                      <div className="repaso__item-tags">

                        <span
                          className={`repaso__badge ${lc.badge}`}
                        >
                          Repaso {numRepaso}
                        </span>

                        {entrada.day && (
                          <span className="repaso__item-day">
                            {entrada.day}
                          </span>
                        )}

                        {vencido && (
                          <span className="repaso__item-overdue">
                            Vencido
                          </span>
                        )}

                      </div>

                      {/* CURSO */}

                      <h3 className="repaso__item-subject">
                        {entrada.subject}
                      </h3>

                      {/* TEMA */}

                      {entrada.tema && (
                        <p className="repaso__item-tema">
                          Tema: {entrada.tema}
                        </p>
                      )}

                      {/* INFORMACIÓN DEL REPASO */}

                      <p className="repaso__item-meta">

                        Repaso {numRepaso} de{" "}
                        {REPASO_INTERVALOS.length}

                        {" · "}

                        Intervalo{" "}

                        {REPASO_INTERVALOS[
                          intervaloIdx
                        ]}{" "}

                        día
                        {REPASO_INTERVALOS[
                          intervaloIdx
                        ] > 1
                          ? "s"
                          : ""}

                      </p>

                      {/* IR AL TEMA */}

                      <button
                        onClick={() =>
                          irAMiEstudio(
                            entrada.tema ||
                              entrada.subject
                          )
                        }
                        className="repaso__item-link"
                      >

                        <i className="bi bi-book" />

                        Repasar

                      </button>

                    </div>

                    {/* CHECK */}

                    <button
                      onClick={() =>
                        marcar(
                          entrada.id,
                          intervaloIdx,
                          entrada.repasosDone
                        )
                      }
                      className="repaso__check"
                      aria-label="Marcar repaso como realizado"
                      title="Marcar repaso como realizado"
                    >

                      <svg
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        fill="none"
                        strokeWidth="2.5"
                        width="16"
                        height="16"
                      >

                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m4.5 12.75 6 6 9-13.5"
                        />

                      </svg>

                    </button>

                    {/* ELIMINAR */}

                    <button
                      onClick={() =>
                        iniciarBorrado(
                          entrada.id
                        )
                      }
                      className="repaso__trash"
                      aria-label="Eliminar repaso"
                      title="Eliminar repaso"
                    >

                      <i className="fa-solid fa-trash" />

                    </button>

                  </div>
                );
              }
            )}

          </div>

          {/* SIN REPASOS */}

          {repasosHoy.length === 0 && (
            <div className="repaso__empty">

              <div className="repaso__empty-emoji">
                🎉
              </div>

              <p className="repaso__empty-title">
                No tienes repasos pendientes hoy
              </p>

              <p className="repaso__empty-sub">
                Vuelve mañana o completa más
                cursos en el cronograma
              </p>

            </div>
          )}

        </section>

        {/* ─────────────────────────────────────
            PRÓXIMOS REPASOS
        ───────────────────────────────────── */}

        <section>

          <h2 className="repaso__proximos-title">
            Próximos repasos
          </h2>

          <div className="repaso__proximos-list">

            {proximos.length === 0 && (
              <p className="repaso__proximos-empty">
                No hay repasos programados en
                los próximos 14 días.
              </p>
            )}

            {Object.keys(porFecha)
              .sort()
              .map((fecha) => {

                const grupo =
                  porFecha[fecha];

                const diff =
                  diffDias(fecha);

                const etiqueta =
                  diff === 1
                    ? "Mañana"
                    : `En ${diff} días`;

                return (
                  <div
                    key={fecha}
                    className="repaso__proximos-group"
                  >

                    <div className="repaso__proximos-group-header">

                      <span className="repaso__proximos-fecha">
                        {formatearFecha(fecha)}
                      </span>

                      <span className="repaso__proximos-etiqueta">
                        {etiqueta}
                      </span>

                    </div>

                    <div>

                      {grupo.map(
                        ({
                          entrada,
                          intervaloIdx
                        }) => (

                          <div
                            key={entrada.id}
                            className="repaso__proximos-row"
                          >

                            <div className="repaso__proximos-row-content">

                              <span
                                className={`repaso__dot ${
                                  intervaloClasses(
                                    intervaloIdx
                                  ).badge
                                }`}
                              />

                              <span className="repaso__proximos-subject">

                                {entrada.subject}

                                {entrada.tema && (
                                  <span className="repaso__proximos-tema">
                                    {" "}
                                    —{" "}
                                    {entrada.tema}
                                  </span>
                                )}

                              </span>

                            </div>

                            <button
                              onClick={() =>
                                iniciarBorrado(
                                  entrada.id
                                )
                              }
                              className="repaso__proximos-trash"
                              aria-label="Eliminar repaso"
                              title="Eliminar repaso"
                            >

                              <i className="fa-solid fa-trash" />

                            </button>

                          </div>

                        )
                      )}

                    </div>

                  </div>
                );
              })}

          </div>

        </section>

        {/* ─────────────────────────────────────
            BUSCADOR
        ───────────────────────────────────── */}

        <SearchModal
          open={searchOpen}
          onClose={() =>
            setSearchOpen(false)
          }
          onSelect={(item) => {

            setSearchOpen(false);

            irAMiEstudio(
              item.type === "curso"
                ? item.nombre
                : item.tema
            );

          }}
        />

        {/* ─────────────────────────────────────
            MODAL ELIMINAR
        ───────────────────────────────────── */}

        {deleteState.isOpen && (
          <div className="delete-modal-overlay">

            <div className="delete-modal-content">

              <div className="delete-modal-icon">
                <i className="fa-solid fa-triangle-exclamation" />
              </div>

              <h3 className="delete-modal-title">
                ¿Eliminar este repaso?
              </h3>

              <p className="delete-modal-text">

                {deleteState.phase === 1
                  ? "Esta acción requiere confirmación. Selecciona Aceptar para continuar."
                  : "¡Atención! ¿Estás completamente seguro de borrarlo?"}

              </p>

              <div
                className={`delete-modal-buttons ${
                  deleteState.phase === 1
                    ? "delete-modal-buttons--reverse"
                    : ""
                }`}
              >

                <button
                  onClick={confirmarBorrado}
                  className={`btn-confirm ${
                    deleteState.phase === 1
                      ? "btn-confirm--phase1"
                      : "btn-confirm--phase2"
                  }`}
                >

                  {deleteState.phase === 1
                    ? "Aceptar"
                    : "Sí, borrar"}

                </button>

                <button
                  onClick={cancelarBorrado}
                  className="btn-cancel"
                >
                  Cancelar
                </button>

              </div>

            </div>

          </div>
        )}

      </div>
    </main>
  );
}