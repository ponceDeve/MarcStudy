import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";

export default function TopBar({
  tema, curso, stage,
  onAbrirBuscador, onTogglePomodoroMini, onAbrirTemas,
  onGuardarRepaso, isFullscreen, onToggleFullscreen,
  onVerPreguntasVistas, onAbandonar, onReiniciarTarjetas,
  repasoQuizActivo, onSalirDeRepaso
}) {
  const [menuMobileOpen, setMenuMobileOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const { tema: modoColor, alternarTema } = useTheme();

  // Detección de desbordamiento
  const wrapperRef = useRef(null);
  const [temaOverflows, setTemaOverflows] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (!wrapperRef.current) return;
      const { scrollWidth, clientWidth } = wrapperRef.current;

      if (scrollWidth > clientWidth) {
        setTemaOverflows(true);
        wrapperRef.current.style.setProperty("--scroll-dist", `${scrollWidth - clientWidth + 20}px`);
      } else {
        setTemaOverflows(false);
        wrapperRef.current.style.removeProperty("--scroll-dist");
      }
    };

    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [tema]);

  // Configuración de botones
  const pomodoroTo = `/pomodoro?curso=${encodeURIComponent(curso)}&tema=${encodeURIComponent(tema)}`;
  const repasoTo = "/repaso";

  const botonesPrincipales = [
    { title: "Mini cronómetro", label: "Timer", icon: "fa-solid fa-clock", onClick: onTogglePomodoroMini },
    { title: "Ir al Pomodoro", label: "Pomo", icon: "fa-solid fa-calendar-alt", to: pomodoroTo },
    { title: "Ir a Mis Repasos", label: "Repaso", icon: "fa-solid fa-brain", to: repasoTo },
    { title: "Buscar otro tema", label: "Buscar", icon: "fa-solid fa-magnifying-glass", onClick: onAbrirBuscador },
    { title: "Guardar", label: "Guardar", icon: "fa-solid fa-bookmark", onClick: onGuardarRepaso }
  ];

  const botonesVisibles = stage === "question" ? [] : botonesPrincipales;

  const configButtons = [
    { icon: "fas fa-play", label: "Continuar", onClick: () => { if (repasoQuizActivo) onSalirDeRepaso(); } },
    { icon: isFullscreen ? "fas fa-compress" : "fas fa-expand", label: isFullscreen ? "Minimizar" : "Pantalla", onClick: onToggleFullscreen },
    // "Repasar" muestra las preguntas ya vistas de este tema, mezcladas.
    // Se puede abrir desde teoría o desde pregunta; MiEstudioPage se
    // encarga de cambiar a la vista de pregunta y volver si hace falta.
    { icon: "fas fa-list-check", label: "Repasar", onClick: onVerPreguntasVistas },
    { icon: "fas fa-rotate-left", label: "Reiniciar", onClick: onReiniciarTarjetas },
    { icon: "fas fa-door-open", label: "Abandonar", onClick: onAbandonar }
  ];

  // Renderizadores de UI
  const renderBoton = (b, cls, closeFn = () => {}) => {
    const content = (
      <>
        <i className={`${b.icon} topbar__btn-icon`} />
        <span className="topbar__btn-title">{b.label}</span>
      </>
    );

    const handleClick = () => {
      if (b.onClick) b.onClick();
      closeFn();
    };

    return b.to ? (
      <Link key={b.title} to={b.to} title={b.title} className={cls} onClick={closeFn}>{content}</Link>
    ) : (
      <button key={b.title || b.label} type="button" onClick={handleClick} title={b.title} className={cls}>{content}</button>
    );
  };

  // Componente reutilizable para los modales (Overlays)
  const OverlayMenu = ({ title, isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
      <div className="topbar__overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="topbar__overlay-inner">
          <h3 className="topbar__overlay-title">{title}</h3>
          {/* AQUÍ ESTABA EL ERROR: Cambié topbar__overlay-row a topbar__overlay-row1 para que coincida con tu SCSS */}
          <div className="topbar__overlay-row1">
            {children}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="topbar">
      {/* CAJA 1: TEMA + CURSO */}
      <div className="topbar__title-box">
        <button type="button" className="topbar__title-btn" onClick={onAbrirTemas} title="Ver mapa de temas de este curso">
          <div className="topbar__tema-wrapper" ref={wrapperRef}>
            <span className={`topbar__tema ${temaOverflows ? "topbar__tema--marquee" : ""}`}>
              {tema}
            </span>
          </div>
          <span className="topbar__curso topbar__curso--clickable">{curso}</span>
        </button>
      </div>

      {/* CAJA 2 + 3: NAVEGACIÓN Y CONTROLES */}
      <div className="topbar__controls">
        {botonesVisibles.length > 0 && (
          <div className="topbar__nav">
            {botonesVisibles.map((b) => renderBoton(b, "topbar__nav-btn"))}
          </div>
        )}

        <button type="button" onClick={alternarTema} className="topbar__theme-btn" title={modoColor === "oscuro" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>
          <i className={`fa-solid ${modoColor === "oscuro" ? "fa-sun" : "fa-moon"}`} />
        </button>

        <button type="button" onClick={() => setConfigOpen(true)} title="Configuración" className="topbar__gear">
          <i className="fa-solid fa-gear" />
        </button>

        {botonesVisibles.length > 0 && (
          <button type="button" onClick={() => setMenuMobileOpen(true)} title="Menú" className="topbar__control-btn topbar__control-btn--menu topbar__hamburger">
            <i className="fa-solid fa-bars" />
          </button>
        )}
      </div>

      {/* OVERLAY DEL MENÚ MÓVIL */}
      {botonesVisibles.length > 0 && (
        <OverlayMenu title="Menú" isOpen={menuMobileOpen} onClose={() => setMenuMobileOpen(false)}>
          {botonesVisibles.map((b) => renderBoton(b, "topbar__overlay-btn", () => setMenuMobileOpen(false)))}
        </OverlayMenu>
      )}

      {/* OVERLAY DE CONFIGURACIÓN */}
      <OverlayMenu title="Configuración" isOpen={configOpen} onClose={() => setConfigOpen(false)}>
        {configButtons.map((b) => renderBoton(b, "topbar__overlay-btn", () => setConfigOpen(false)))}
      </OverlayMenu>
    </div>
  );
}