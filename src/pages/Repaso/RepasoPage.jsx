import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  leerLog,
  marcarRepasoHecho,
  clasificarRepasos,
  intervaloClasses,
  formatearFecha,
  fechaHoy,
  diffDias,
  REPASO_INTERVALOS,
} from "../../lib/repasoStorage";

export default function RepasoPage() {
  const [log, setLog] = useState(() => leerLog());

  const { repasosHoy, proximos } = useMemo(() => clasificarRepasos(log), [log]);

  function marcar(id, intervaloIdx, repasosDoneActual) {
    const repasosDone = Array.isArray(repasosDoneActual)
      ? [...repasosDoneActual]
      : [];
    if (!repasosDone.includes(intervaloIdx)) repasosDone.push(intervaloIdx);
    setLog(marcarRepasoHecho(id, repasosDone));
  }

  const porFecha = useMemo(() => {
    const map = {};
    proximos.forEach((item) => {
      if (!map[item.fecha]) map[item.fecha] = [];
      map[item.fecha].push(item);
    });
    return map;
  }, [proximos]);

  return (
    <div className="repaso">
      <div className="repaso__nav">
        <Link to="/" className="repaso__nav-link">
          <i className="bi bi-book" /> Mi Estudio
        </Link>
        <Link to="/pomodoro" className="repaso__nav-link">
          <i className="bi bi-arrow-left" /> Volver al cronograma
        </Link>
      </div>

      <div className="repaso__header">
        <h1 className="repaso__title">Repasos de hoy</h1>
        <p className="repaso__date">{formatearFecha(fechaHoy())}</p>
      </div>

      <section className="repaso__section">
        <div className="repaso__list">
          {repasosHoy.map(({ entrada, intervaloIdx, vencido }) => {
            const lc = intervaloClasses(intervaloIdx);
            const numRepaso = intervaloIdx + 1;
            return (
              <div key={entrada.id} className={`repaso__item ${lc.box}`}>
                <div className="repaso__item-body">
                  <div className="repaso__item-tags">
                    <span className={`repaso__badge ${lc.badge}`}>Repaso {numRepaso}</span>
                    {entrada.day && <span className="repaso__item-day">{entrada.day}</span>}
                    {vencido && <span className="repaso__item-overdue">Vencido</span>}
                  </div>
                  <h3 className="repaso__item-subject">{entrada.subject}</h3>
                  {entrada.tema && <p className="repaso__item-tema">Tema: {entrada.tema}</p>}
                  <p className="repaso__item-meta">
                    Repaso {numRepaso} de {REPASO_INTERVALOS.length} · Intervalo{" "}
                    {REPASO_INTERVALOS[intervaloIdx]} día
                    {REPASO_INTERVALOS[intervaloIdx] > 1 ? "s" : ""}
                  </p>
                  <a
                    href={`${window.location.origin}/cont_crono/?q=${encodeURIComponent(entrada.tema || entrada.subject)}`}
                    target="_blank"
                    rel="noopener"
                    className="repaso__item-link"
                  >
                    <i className="bi bi-book" /> Repasar en Mi Estudio
                  </a>
                </div>
                <button
                  onClick={() => marcar(entrada.id, intervaloIdx, entrada.repasosDone)}
                  className="repaso__check"
                >
                  <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2.5" width="16" height="16">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>

        {repasosHoy.length === 0 && (
          <div className="repaso__empty">
            <div className="repaso__empty-emoji">🎉</div>
            <p className="repaso__empty-title">No tienes repasos pendientes hoy</p>
            <p className="repaso__empty-sub">Vuelve mañana o completa más cursos en el cronograma</p>
          </div>
        )}
      </section>

      <section>
        <h2 className="repaso__proximos-title">Próximos repasos</h2>
        <div className="repaso__proximos-list">
          {proximos.length === 0 && (
            <p className="repaso__proximos-empty">No hay repasos programados en los próximos 14 días.</p>
          )}
          {Object.keys(porFecha)
            .sort()
            .map((fecha) => {
              const grupo = porFecha[fecha];
              const diff = diffDias(fecha);
              const etiqueta = diff === 1 ? "Mañana" : `En ${diff} días`;
              return (
                <div key={fecha} className="repaso__proximos-group">
                  <div className="repaso__proximos-group-header">
                    <span className="repaso__proximos-fecha">{formatearFecha(fecha)}</span>
                    <span className="repaso__proximos-etiqueta">{etiqueta}</span>
                  </div>
                  <div>
                    {grupo.map(({ entrada, intervaloIdx }) => (
                      <div key={entrada.id} className="repaso__proximos-row">
                        <span className={`repaso__dot ${intervaloClasses(intervaloIdx).badge}`} />
                        <span className="repaso__proximos-subject">{entrada.subject}</span>
                        {entrada.tema && (
                          <span className="repaso__proximos-tema">— {entrada.tema}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      </section>
    </div>
  );
}