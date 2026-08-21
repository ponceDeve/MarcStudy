import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";

function SideDrawer({ title, isOpen, onClose, children }) {
  return createPortal(
    <>
      {isOpen && (
        <div className="offcanvas-backdrop fade show" onClick={onClose} />
      )}

      <div
        className={`offcanvas offcanvas-end topbar__drawer ${
          isOpen ? "show" : ""
        }`}
        tabIndex="-1"
        aria-hidden={!isOpen}
      >
        <div className="offcanvas-header topbar__drawer-header">
          <h3 className="offcanvas-title topbar__drawer-title">{title}</h3>
          <button type="button" className="topbar__drawer-close" onClick={onClose} aria-label="Cerrar">
            <i className="fa-solid fa-times" />
          </button>
        </div>
        <div className="offcanvas-body topbar__drawer-list">
          {children}
        </div>
      </div>
    </>,
    document.body
  );
}

export default function TopBar({
  tema, curso, stage,
  onAbrirBuscador, onTogglePomodoroMini, onAbrirTemas,
  onGuardarRepaso, isFullscreen, onToggleFullscreen,
  onVerPreguntasVistas, onAbandonar, onReiniciarTarjetas,
  onIrInicio
}) {
  const [menuMobileOpen, setMenuMobileOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  // Auto-ocultar header al bajar / mostrar al subir.
  // No se oculta cerca del tope, ni con menús abiertos (evita que
  // desaparezca mientras el usuario está usando el drawer/config).
  useEffect(() => {
    const UMBRAL_SCROLL = 8;
    const ZONA_SEGURA_TOPE = 80;
    let ultimoY = window.scrollY;
    let ticking = false;

    function actualizar() {
      const y = window.scrollY;
      const delta = y - ultimoY;

      if (menuMobileOpen || configOpen) {
        document.body.classList.remove("is-header-oculto");
      } else if (y < ZONA_SEGURA_TOPE) {
        document.body.classList.remove("is-header-oculto");
      } else if (delta > UMBRAL_SCROLL) {
        document.body.classList.add("is-header-oculto");
      } else if (delta < -UMBRAL_SCROLL) {
        document.body.classList.remove("is-header-oculto");
      }

      ultimoY = y;
      ticking = false;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(actualizar);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.body.classList.remove("is-header-oculto");
    };
  }, [menuMobileOpen, configOpen]);

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

  // Botones ordenados de más a menos importante (izquierda -> derecha)
  const botonesPrincipales = [
    { title: "Ir a Inicio", label: "Inicio", fullLabel: "Ir a Inicio", icon: "fa-solid fa-house", onClick: onIrInicio },
    { title: "Buscar otro tema", label: "Buscar", fullLabel: "Buscar tema", icon: "fa-solid fa-magnifying-glass", onClick: onAbrirBuscador },
    { title: "Guardar", label: "Guardar", fullLabel: "Guardar progreso", icon: "fa-solid fa-bookmark", onClick: onGuardarRepaso },
    { title: "Ir a Mis Repasos", label: "Repaso", fullLabel: "Mis Repasos", icon: "fa-solid fa-brain", to: repasoTo },
    { title: "Ir al Pomodoro", label: "Pomo", fullLabel: "Pomodoro", icon: "fa-solid fa-calendar-alt", to: pomodoroTo }
  ];

  const botonesVisibles = stage === "question" ? [] : botonesPrincipales;

  // Opciones de configuración, también ordenadas por importancia
  const configButtons = [
    { icon: "fa-solid fa-clock", label: "Timer", fullLabel: "Mini cronómetro", onClick: onTogglePomodoroMini },
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
    <div className="topbar-wrapper">
      <div className="topbar">
        <div className="topbar__inner">
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

            <button type="button" onClick={() => setConfigOpen(true)} title="Configuración" className="topbar__gear">
              <i className="fa-solid fa-gear" />
            </button>

            {botonesVisibles.length > 0 && (
              <button type="button" onClick={() => setMenuMobileOpen(true)} title="Menú" className="topbar__control-btn topbar__control-btn--menu topbar__hamburger">
                <i className="fa-solid fa-bars" />
              </button>
            )}
          </div>
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
    </div>
  );
}