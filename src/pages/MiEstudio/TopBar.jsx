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

  // Agregamos 'fullLabel' para que se vea el nombre completo en el celular
  const botonesPrincipales = [
    { title: "Mini cronómetro", label: "Timer", fullLabel: "Mini cronómetro", icon: "fa-solid fa-clock", onClick: onTogglePomodoroMini },
    { title: "Ir al Pomodoro", label: "Pomo", fullLabel: "Pomodoro", icon: "fa-solid fa-calendar-alt", to: pomodoroTo },
    { title: "Ir a Mis Repasos", label: "Repaso", fullLabel: "Mis Repasos", icon: "fa-solid fa-brain", to: repasoTo },
    { title: "Buscar otro tema", label: "Buscar", fullLabel: "Buscar tema", icon: "fa-solid fa-magnifying-glass", onClick: onAbrirBuscador },
    { title: "Guardar", label: "Guardar", fullLabel: "Guardar progreso", icon: "fa-solid fa-bookmark", onClick: onGuardarRepaso }
  ];

  const botonesVisibles = stage === "question" ? [] : botonesPrincipales;

  // Agregamos 'fullLabel' a las opciones de configuración también
  const configButtons = [
    { icon: "fas fa-play", label: "Continuar", fullLabel: "Continuar repaso", onClick: () => { if (repasoQuizActivo) onSalirDeRepaso(); } },
    { icon: isFullscreen ? "fas fa-compress" : "fas fa-expand", label: isFullscreen ? "Minimizar" : "Pantalla", fullLabel: isFullscreen ? "Minimizar pantalla" : "Pantalla completa", onClick: onToggleFullscreen },
    // "Repasar" muestra las preguntas ya vistas de este tema, mezcladas.
    // Se puede abrir desde teoría o desde pregunta; MiEstudioPage se
    // encarga de cambiar a la vista de pregunta y volver si hace falta.
    { icon: "fas fa-list-check", label: "Repasar", fullLabel: "Ver preguntas vistas", onClick: onVerPreguntasVistas },
    { icon: "fas fa-rotate-left", label: "Reiniciar", fullLabel: "Reiniciar tarjetas", onClick: onReiniciarTarjetas },
    { icon: "fas fa-door-open", label: "Abandonar", fullLabel: "Abandonar sesión", onClick: onAbandonar }
  ];

  // Renderizadores de UI para la barra (usa 'label' corto)
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

  // Componente reutilizable para los paneles laterales
  const SideDrawer = ({ title, isOpen, onClose, children }) => (
    <div
      className={`topbar__drawer-backdrop ${isOpen ? "is-open" : ""}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-hidden={!isOpen}
    >
      <div className="topbar__drawer">
        <div className="topbar__drawer-header">
          <h3 className="topbar__drawer-title">{title}</h3>
          <button type="button" className="topbar__drawer-close" onClick={onClose} aria-label="Cerrar">
            <i className="fa-solid fa-times" />
          </button>
        </div>
        <div className="topbar__drawer-list">
          {children}
        </div>
      </div>
    </div>
  );

  // Renderizador para las filas del panel móvil (usa 'fullLabel')
  const renderFila = (b, closeFn = () => {}) => {
    const content = (
      <>
        <span className="topbar__drawer-item-label">{b.fullLabel || b.label}</span>
        <i className={`${b.icon} topbar__drawer-item-icon`} />
      </>
    );

    const handleClick = () => {
      if (b.onClick) b.onClick();
      closeFn();
    };

    return b.to ? (
      <Link key={b.title} to={b.to} title={b.title} className="topbar__drawer-item" onClick={closeFn}>{content}</Link>
    ) : (
      <button key={b.title || b.label} type="button" onClick={handleClick} title={b.title} className="topbar__drawer-item">{content}</button>
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

      {/* PANEL DEL MENÚ MÓVIL */}
      {botonesVisibles.length > 0 && (
        <SideDrawer title="Menú" isOpen={menuMobileOpen} onClose={() => setMenuMobileOpen(false)}>
          {botonesVisibles.map((b) => renderFila(b, () => setMenuMobileOpen(false)))}
        </SideDrawer>
      )}

      {/* PANEL DE CONFIGURACIÓN */}
      <SideDrawer title="Configuración" isOpen={configOpen} onClose={() => setConfigOpen(false)}>
        {configButtons.map((b) => renderFila(b, () => setConfigOpen(false)))}
      </SideDrawer>
    </div>
  );
}