import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useAutoHideHeader } from "../../hooks/useAutoHideHeader";
function SideDrawer({ title, isOpen, onClose, children }) {
  return createPortal(
    <>
      {isOpen && (
        <div
          className="offcanvas-backdrop fade show"
          onClick={onClose}
        />
      )}
      <div
        className={`offcanvas offcanvas-end topbar__drawer ${
          isOpen ? "show" : ""
        }`}
        tabIndex="-1"
        aria-hidden={!isOpen}
      >
        <div className="offcanvas-header topbar__drawer-header">
          <h3 className="offcanvas-title topbar__drawer-title">
            {title}
          </h3>
          <button
            type="button"
            className="topbar__drawer-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
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
  tema,
  curso,
  stage,
  onAbrirBuscador,
  onAbrirTemas,
  onAbandonarPregunta,
  onIrInicio,
  onVolverTeoria,
  temasOpen = false,
  musicaOn = false,
  onToggleMusica,
}) {
  const [menuMobileOpen, setMenuMobileOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(
    () => !!document.fullscreenElement
  );
  useAutoHideHeader(menuMobileOpen);
  // En los resultados del examen, el título curso/tema se reemplaza por
  // un botón "Volver" que regresa a la teoría.
  const esResultados =
    stage === "results" &&
    typeof onVolverTeoria === "function";
  const wrapperRef = useRef(null);
  const temaRef = useRef(null);
  const [temaOverflows, setTemaOverflows] = useState(false);
  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener(
      "fullscreenchange",
      onFullscreenChange
    );
    return () =>
      document.removeEventListener(
        "fullscreenchange",
        onFullscreenChange
      );
  }, []);
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
  useEffect(() => {
    const checkOverflow = () => {
      const wrapper = wrapperRef.current;
      const temaElement = temaRef.current;
      if (!wrapper || !temaElement) return;
      const firstText = temaElement.children[0];
      if (!firstText) {
        setTemaOverflows(false);
        return;
      }
      const wrapperWidth = wrapper.clientWidth;
      const textWidth = firstText.scrollWidth;
      const overflows = textWidth > wrapperWidth;
      setTemaOverflows(overflows);
      if (overflows) {
        wrapper.style.setProperty(
          "--scroll-dist",
          `${-(textWidth + 40)}px`
        );
      } else {
        wrapper.style.removeProperty("--scroll-dist");
      }
    };
    checkOverflow();
    const observer = new ResizeObserver(checkOverflow);
    if (wrapperRef.current) {
      observer.observe(wrapperRef.current);
    }
    window.addEventListener("resize", checkOverflow);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", checkOverflow);
    };
  }, [tema, esResultados]);
  const pomodoroTo = `/pomodoro?curso=${encodeURIComponent(
    curso
  )}&tema=${encodeURIComponent(tema)}`;
  const repasoTo = "/repaso";
  const botonesPrincipales = [
    {
      title: "Ir a Inicio",
      label: "Inicio",
      fullLabel: "Ir a Inicio",
      icon: "fa-solid fa-house",
      onClick: onIrInicio,
    },
    {
      title: "Buscar otro tema",
      label: "Buscar",
      fullLabel: "Buscar tema",
      icon: "fa-solid fa-magnifying-glass",
      onClick: onAbrirBuscador,
    },
    {
      title: "Ir a Mis Repasos",
      label: "Repaso",
      fullLabel: "Mis Repasos",
      icon: "fa-solid fa-calendar-check",
      to: repasoTo,
    },
    {
      title: "Ir al Pomodoro",
      label: "Pomodoro",
      fullLabel: "Pomodoro",
      icon: "fa-solid fa-hourglass-half",
      to: pomodoroTo,
    },
  ];
  const botonAbandonar = {
    title: "Abandonar pregunta",
    label: "Abandonar",
    fullLabel: "Abandonar pregunta",
    icon: "fas fa-door-open",
    onClick: onAbandonarPregunta,
    className: "topbar__nav-btn--abandonar",
  };
  const botonFullscreen = {
    title: isFullscreen
      ? "Minimizar pantalla"
      : "Pantalla completa",
    label: isFullscreen
      ? "Minimizar"
      : "Agrandar",
    fullLabel: isFullscreen
      ? "Minimizar pantalla"
      : "Pantalla completa",
    icon: isFullscreen
      ? "fa-solid fa-compress"
      : "fa-solid fa-expand",
    onClick: toggleFullscreen,
    className: "topbar__nav-btn--fullscreen",
  };
  const esPregunta =
    stage === "question" || stage === "exam";
  // La bocina solo aparece dentro de un tema (teoría) o de una pregunta/examen.
  const mostrarMusica =
    typeof onToggleMusica === "function" &&
    (stage === "theory" || esPregunta);
  const botonesVisibles = esPregunta
    ? [botonAbandonar, botonFullscreen]
    : [...botonesPrincipales, botonFullscreen];
  // En "pregunta" el botón Abandonar ya se muestra
  // directo en el nav; no hace falta el menú de hamburguesa duplicándolo.
  const botonesMenu = esPregunta
    ? []
    : botonesVisibles;
  const renderBoton = (
    b,
    cls,
    closeFn = () => {}
  ) => {
    const content = (
      <>
        <i className={`${b.icon} topbar__btn-icon`} />
        <span className="topbar__btn-title">
          {b.label}
        </span>
      </>
    );
    const handleClick = () => {
      if (b.onClick) {
        b.onClick();
      }
      closeFn();
    };
    const buttonClass =
      `${cls} ${b.className || ""}`.trim();
    if (b.to) {
      return (
        <Link
          key={b.title || b.label}
          to={b.to}
          title={b.title}
          className={buttonClass}
          onClick={closeFn}
        >
          {content}
        </Link>
      );
    }
    return (
      <button
        key={b.title || b.label}
        type="button"
        onClick={handleClick}
        title={b.title}
        className={buttonClass}
      >
        {content}
      </button>
    );
  };
  const renderFila = (
    b,
    closeFn = () => {}
  ) => {
    const content = (
      <>
        <span className="topbar__drawer-item-label">
          {b.fullLabel || b.label}
        </span>
        <i
          className={`${b.icon} topbar__drawer-item-icon`}
        />
      </>
    );
    const handleClick = () => {
      if (b.onClick) {
        b.onClick();
      }
      closeFn();
    };
    if (b.to) {
      return (
        <Link
          key={b.title || b.label}
          to={b.to}
          title={b.title}
          className="topbar__drawer-item"
          onClick={closeFn}
        >
          {content}
        </Link>
      );
    }
    return (
      <button
        key={b.title || b.label}
        type="button"
        onClick={handleClick}
        title={b.title}
        className="topbar__drawer-item"
      >
        {content}
      </button>
    );
  };
  return (
    <div className="topbar-wrapper">
      <div className="topbar">
        <div className="topbar__inner">
          <div className="topbar__content-box">
            {esResultados ? (
              <button
                type="button"
                className="topbar__volver-btn"
                onClick={onVolverTeoria}
                title="Volver a la teoría"
              >
                <i className="fa-solid fa-arrow-left topbar__volver-icon" />
                <span className="topbar__volver-label">
                  Volver
                </span>
              </button>
            ) : (
              <button
                type="button"
                className="topbar__title-btn"
                onClick={onAbrirTemas}
                title="Ver mapa de temas de este curso"
              >
                <div className="topbar__title-box">
                  <div className="topbar__info-box">
                    <div
                      className="topbar__tema-wrapper"
                      ref={wrapperRef}
                    >
                      <span
                        ref={temaRef}
                        className={`topbar__tema ${
                          temaOverflows
                            ? "topbar__tema--marquee"
                            : ""
                        }`}
                      >
                        <span>{tema}</span>
                        {temaOverflows && (
                          <span aria-hidden="true">
                            {tema}
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="topbar__curso topbar__curso--clickable">
                      {curso}
                    </span>
                  </div>
                  <span
                    className={`topbar__expand-icon ${
                      temasOpen ? "is-open" : ""
                    }`}
                    aria-hidden="true"
                  />
                </div>
              </button>
            )}
          </div>
          <div className="topbar__controls">
            {botonesVisibles.length > 0 && (
              <div
                className={`topbar__nav ${
                  esPregunta
                    ? "topbar__nav--question"
                    : ""
                }`}
              >
                {botonesVisibles.map((b) =>
                  renderBoton(
                    b,
                    "topbar__nav-btn"
                  )
                )}
              </div>
            )}
            {mostrarMusica && (
              <button
                type="button"
                onClick={onToggleMusica}
                title={
                  musicaOn
                    ? "Desactivar música"
                    : "Activar música"
                }
                aria-label={
                  musicaOn
                    ? "Desactivar música"
                    : "Activar música"
                }
                aria-pressed={musicaOn}
                className={`topbar__control-btn topbar__control-btn--musica ${
                  musicaOn ? "is-on" : "is-off"
                }`}
              >
                <i
                  className={
                    musicaOn
                      ? "fa-solid fa-volume-high"
                      : "fa-solid fa-volume-xmark"
                  }
                />
              </button>
            )}
            {botonesMenu.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setMenuMobileOpen(true)
                }
                title="Menú"
                className="topbar__control-btn topbar__control-btn--menu topbar__hamburger"
              >
                <i className="fa-solid fa-gear" />
              </button>
            )}
          </div>
        </div>
        {botonesMenu.length > 0 && (
          <SideDrawer
            title="Menú"
            isOpen={menuMobileOpen}
            onClose={() =>
              setMenuMobileOpen(false)
            }
          >
            {botonesMenu.map((b) =>
              renderFila(
                b,
                () =>
                  setMenuMobileOpen(false)
              )
            )}
          </SideDrawer>
        )}
      </div>
    </div>
  );
}