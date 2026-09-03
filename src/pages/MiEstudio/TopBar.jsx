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
  onTogglePomodoroMini,
  onAbrirTemas,
  onGuardarRepaso,
  isFullscreen,
  onToggleFullscreen,
  onAbandonarPregunta,
  onIrInicio,
  pdfVerUrl,
  pdfDescargaUrl,
}) {
  const [menuMobileOpen, setMenuMobileOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  useAutoHideHeader(menuMobileOpen || configOpen);

  const wrapperRef = useRef(null);
  const temaRef = useRef(null);
  const [temaOverflows, setTemaOverflows] = useState(false);

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
        const scrollDistance = -(textWidth + 40);

        wrapper.style.setProperty(
          "--scroll-dist",
          `${scrollDistance}px`
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
  }, [tema]);

  const pomodoroTo = `/pomodoro?curso=${encodeURIComponent(
    curso
  )}&tema=${encodeURIComponent(tema)}`;

  const repasoTo = "/repaso";

  /*
  ============================================================
  BOTONES PRINCIPALES
  ============================================================
  */

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

  const botonesVisibles =
    stage === "question"
      ? []
      : botonesPrincipales;

  /*
  ============================================================
  AJUSTES
  ============================================================
  */

  const configButtons = [
    {
      title: "Mini cronómetro",
      icon: "fa-solid fa-clock",
      label: "Timer",
      fullLabel: "Mini cronómetro",
      onClick: onTogglePomodoroMini,
    },
    {
      title: "Guardar progreso",
      icon: "fa-solid fa-bookmark",
      label: "Guardar",
      fullLabel: "Guardar progreso",
      onClick: onGuardarRepaso,
    },
    {
      title: isFullscreen
        ? "Minimizar pantalla"
        : "Pantalla completa",
      icon: isFullscreen
        ? "fas fa-compress"
        : "fas fa-expand",
      label: isFullscreen
        ? "Minimizar"
        : "Pantalla",
      fullLabel: isFullscreen
        ? "Minimizar pantalla"
        : "Pantalla completa",
      onClick: onToggleFullscreen,
    },
    ...(pdfVerUrl
      ? [
          {
            title: "Ver PDF",
            icon: "fas fa-file-pdf",
            label: "Ver PDF",
            fullLabel: "Ver PDF",
            href: pdfVerUrl,
            target: "_blank",
          },
        ]
      : []),
    ...(pdfDescargaUrl
      ? [
          {
            title: "Descargar PDF",
            icon: "fas fa-download",
            label: "Descargar",
            fullLabel: "Descargar PDF",
            href: pdfDescargaUrl,
            download: true,
          },
        ]
      : []),
    ...(stage === "question"
      ? [
          {
            title: "Abandonar pregunta",
            icon: "fas fa-door-open",
            label: "Abandonar",
            fullLabel: "Abandonar pregunta",
            onClick: onAbandonarPregunta,
          },
        ]
      : []),
  ];

  /*
  ============================================================
  BOTÓN DEL TOPBAR
  ============================================================
  */

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

    if (b.to) {
      return (
        <Link
          key={b.title || b.label}
          to={b.to}
          title={b.title}
          className={cls}
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
        className={cls}
      >
        {content}
      </button>
    );
  };

  /*
  ============================================================
  FILA DEL DRAWER
  ============================================================
  */

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

    if (b.href) {
      return (
        <a
          key={b.title || b.label}
          href={b.href}
          download={b.download || undefined}
          target={b.target}
          rel={
            b.target
              ? "noopener noreferrer"
              : undefined
          }
          title={b.title}
          className="topbar__drawer-item"
          onClick={closeFn}
        >
          {content}
        </a>
      );
    }

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

  /*
  ============================================================
  RENDER
  ============================================================
  */

  return (
    <div className="topbar-wrapper">
      <div className="topbar">
        <div className="topbar__inner">

          {/* ==================================================
              TEMA + CURSO
              ================================================== */}

          <div className="topbar__title-box">
            <button
              type="button"
              className="topbar__title-btn"
              onClick={onAbrirTemas}
              title="Ver mapa de temas de este curso"
            >
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

                <i className="bi bi-chevron-down" />
              </div>

              <span className="topbar__curso topbar__curso--clickable">
                {curso}
              </span>
            </button>
          </div>

          {/* ==================================================
              CONTROLES
              ================================================== */}

          <div className="topbar__controls">

            {botonesVisibles.length > 0 && (
              <div className="topbar__nav">
                {botonesVisibles.map((b) =>
                  renderBoton(
                    b,
                    "topbar__nav-btn"
                  )
                )}
              </div>
            )}

            {/* =================================================
                AJUSTES
                ================================================= */}

            <button
              type="button"
              onClick={() =>
                setConfigOpen(true)
              }
              title="Ajustes"
              className="topbar__gear"
            >
              <i className="fa-solid fa-gear" />
            </button>

            {/* =================================================
                MENÚ
                ================================================= */}

            {botonesVisibles.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setMenuMobileOpen(true)
                }
                title="Menú"
                className="topbar__control-btn topbar__control-btn--menu topbar__hamburger"
              >
                <i className="fa-solid fa-bars" />
              </button>
            )}
          </div>
        </div>

        {/* ====================================================
            DRAWER — MENÚ
            ==================================================== */}

        {botonesVisibles.length > 0 && (
          <SideDrawer
            title="Menú"
            isOpen={menuMobileOpen}
            onClose={() =>
              setMenuMobileOpen(false)
            }
          >
            {botonesVisibles.map((b) =>
              renderFila(
                b,
                () =>
                  setMenuMobileOpen(false)
              )
            )}
          </SideDrawer>
        )}

        {/* ====================================================
            DRAWER — AJUSTES
            ==================================================== */}

        <SideDrawer
          title="Ajustes"
          isOpen={configOpen}
          onClose={() =>
            setConfigOpen(false)
          }
        >
          {configButtons.map((b) =>
            renderFila(
              b,
              () =>
                setConfigOpen(false)
            )
          )}
        </SideDrawer>
      </div>
    </div>
  );
}