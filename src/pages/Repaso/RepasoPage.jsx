import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AppHeader from "../../components/AppHeader";
import SearchModal from "../../components/SearchModal";
import {
  leerLog,
  marcarRepasoHecho,
  clasificarRepasos,
  intervaloClasses,
  formatearFecha,
  diffDias,
  REPASO_INTERVALOS,
  eliminarRepaso,
  leerRepasosVistos,
  marcarRepasoVisto,
  limpiarRepasoVisto,
  claveRepasoVisto
} from "../../lib/repasoStorage";
const TABS = [
  { id: "hoy", label: "Hoy" },
  { id: "proximos", label: "Próximos" }
];
export default function RepasoPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("hoy");
  const [log, setLog] = useState(() => leerLog());
  const [searchOpen, setSearchOpen] = useState(false);
  const [repasosVistos, setRepasosVistos] = useState(() =>
    leerRepasosVistos()
  );
  const [confirmarMarcar, setConfirmarMarcar] = useState({
    isOpen: false,
    id: null,
    intervaloIdx: null,
    tema: ""
  });
  const [deleteState, setDeleteState] = useState({
    isOpen: false,
    id: null,
    phase: 1
  });
  const { repasosHoy, proximos } = useMemo(
    () => clasificarRepasos(log),
    [log]
  );
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
  function irAMiEstudio(nombre) {
    navigate(`/?q=${encodeURIComponent(nombre)}`);
  }
  function marcar(id, intervaloIdx) {
    setLog(marcarRepasoHecho(id, [intervaloIdx]));
  }
  function irARepasarTema(id, intervaloIdx, nombre) {
    marcarRepasoVisto(id, intervaloIdx);
    setRepasosVistos((prev) => {
      const clave = claveRepasoVisto(id, intervaloIdx);
      return prev.includes(clave) ? prev : [...prev, clave];
    });
    irAMiEstudio(nombre);
  }
  function pedirMarcar(id, intervaloIdx, tema) {
    if (!repasosVistos.includes(claveRepasoVisto(id, intervaloIdx))) {
      return;
    }
    setConfirmarMarcar({ isOpen: true, id, intervaloIdx, tema });
  }
  function confirmarMarcarRepaso() {
    const { id, intervaloIdx } = confirmarMarcar;
    setLog(marcarRepasoHecho(id, [intervaloIdx]));
    limpiarRepasoVisto(id, intervaloIdx);
    setRepasosVistos((prev) =>
      prev.filter((c) => c !== claveRepasoVisto(id, intervaloIdx))
    );
    setConfirmarMarcar({
      isOpen: false,
      id: null,
      intervaloIdx: null,
      tema: ""
    });
  }
  function cancelarMarcarRepaso() {
    setConfirmarMarcar({
      isOpen: false,
      id: null,
      intervaloIdx: null,
      tema: ""
    });
  }
  function iniciarBorrado(id) {
    setDeleteState({
      isOpen: true,
      id,
      phase: 1
    });
  }
  function confirmarBorrado() {
    if (deleteState.phase === 1) {
      setDeleteState((prev) => ({
        ...prev,
        phase: 2
      }));
      return;
    }
    setLog(eliminarRepaso(deleteState.id));
    setDeleteState({
      isOpen: false,
      id: null,
      phase: 1
    });
  }
  function cancelarBorrado() {
    setDeleteState({
      isOpen: false,
      id: null,
      phase: 1
    });
  }
  return (
    <main className="container__repaso">
      <div className="repaso">
        <AppHeader
          section="repaso"
          onAbrirBuscador={() => setSearchOpen(true)}
        />
        <div className="repaso__tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`repaso__tab ${
                tab === t.id
                  ? "repaso__tab--active"
                  : ""
              }`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {tab === "hoy" && (
          <section className="repaso__section">
            <div className="repaso__list">
              {repasosHoy.map(
                ({ entrada, intervaloIdx, vencido }) => {
                  const lc = intervaloClasses(intervaloIdx);
                  const numRepaso = intervaloIdx + 1;
                  return (
                    <div
                      key={entrada.id}
                      className={`repaso__item ${lc.box}`}
                    >
                      <div className="repaso__item-body">
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
                        <h3 className="repaso__item-subject">
                          {entrada.subject}
                        </h3>
                        {entrada.tema && (
                          <p className="repaso__item-tema">
                            Tema: {entrada.tema}
                          </p>
                        )}
                        <p className="repaso__item-meta">
                          Repaso {numRepaso} de{" "}
                          {REPASO_INTERVALOS.length}
                          {" · "}
                          Intervalo{" "}
                          {REPASO_INTERVALOS[intervaloIdx]} día
                          {REPASO_INTERVALOS[intervaloIdx] > 1
                            ? "s"
                            : ""}
                        </p>
                        <button
                          onClick={() =>
                            irARepasarTema(
                              entrada.id,
                              intervaloIdx,
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
                      <button
                        onClick={() =>
                          pedirMarcar(
                            entrada.id,
                            intervaloIdx,
                            entrada.tema || entrada.subject
                          )
                        }
                        className="repaso__check"
                        aria-label="Marcar repaso como realizado"
                        title={
                          repasosVistos.includes(
                            claveRepasoVisto(entrada.id, intervaloIdx)
                          )
                            ? "Marcar repaso como realizado"
                            : "Primero dale a Repasar"
                        }
                        disabled={
                          !repasosVistos.includes(
                            claveRepasoVisto(entrada.id, intervaloIdx)
                          )
                        }
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
                      <button
                        onClick={() =>
                          iniciarBorrado(entrada.id)
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
            {repasosHoy.length === 0 && (
              <div className="repaso__empty">
                <div className="repaso__empty-emoji">
                  🎉
                </div>
                <p className="repaso__empty-title">
                  No tienes repasos pendientes hoy
                </p>
                <p className="repaso__empty-sub">
                  Vuelve mañana o completa más cursos en el
                  cronograma
                </p>
              </div>
            )}
          </section>
        )}
        {tab === "proximos" && (
          <section className="repaso__section">
            {proximos.length === 0 ? (
              <div className="repaso__empty">
                <div className="repaso__empty-emoji">
                  🎉
                </div>
                <p className="repaso__empty-title">
                  No tienes repasos próximos
                </p>
                <p className="repaso__empty-sub">
                  Cuando guardes temas, aquí verás cuándo te
                  toca repasarlos
                </p>
              </div>
            ) : (
              <div className="repaso__proximos-list">
                {Object.keys(porFecha)
                  .sort()
                  .map((fecha) => {
                    const grupo = porFecha[fecha];
                    const diff = diffDias(fecha);
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
                        {grupo.map(
                          ({ entrada, intervaloIdx }) => (
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
                                      — {entrada.tema}
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
                    );
                  })}
              </div>
            )}
          </section>
        )}
        <SearchModal
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          onSelect={(item) => {
            setSearchOpen(false);
            irAMiEstudio(
              item.type === "curso"
                ? item.nombre
                : item.tema
            );
          }}
        />
        {deleteState.isOpen && (
          <div className="delete-modal-overlay">
            <div className="delete-modal-content">
              <div className="delete-modal-icon">
                <i className="fa-solid fa-triangle-exclamation" />
              </div>
              <h3 className="delete-modal-title">
                ¿Eliminar repaso?
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
        {confirmarMarcar.isOpen && (
          <div className="repaso__confirm-toast">
            <div className="repaso__confirm-toast-content">
              <div className="repaso__confirm-toast-info">
                <i className="fa-solid fa-calendar-check" />
                <div>
                  <strong>¿Seguro que quieres guardar?</strong>
                  <span>{confirmarMarcar.tema}</span>
                </div>
              </div>
              <div className="repaso__confirm-toast-actions">
                <button
                  type="button"
                  className="repaso__confirm-toast-cancel"
                  onClick={cancelarMarcarRepaso}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="repaso__confirm-toast-confirm"
                  onClick={confirmarMarcarRepaso}
                >
                  Sí, guardar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}