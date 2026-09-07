import { useState, useRef, useEffect } from "react";

import { createPortal } from "react-dom";

import { Link } from "react-router-dom";

import { useAutoHideHeader } from "../../hooks/useAutoHideHeader";

import { useTemaOscuro } from "../../hooks/useTemaOscuro";

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
}) {
  const [menuMobileOpen, setMenuMobileOpen] = useState(false);

  const [temaOscuro, setTemaOscuro] = useTemaOscuro();

  useAutoHideHeader(menuMobileOpen);

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
  }, [tema]);

  const pomodoroTo = `/pomodoro?curso=${encodeURIComponent(
    curso
  )}&tema=${encodeURIComponent(tema)}`;

  const repasoTo = "/repaso";

  // ============================================================
  // BOTONES PRINCIPALES
  // Estos aparecen en RESULTADOS.
  // En pantallas pequeñas pasan al menú hamburguesa.
  // ============================================================

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

  // ============================================================
  // BOTÓN DE PREGUNTAS
  // Durante las preguntas solamente aparece ABANDONAR.
  // ============================================================

  const botonAbandonar = {
    title: "Abandonar pregunta",
    label: "Abandonar",
    fullLabel: "Abandonar pregunta",
    icon: "fas fa-door-open",
    onClick: onAbandonarPregunta,
    className: "topbar__nav-btn--abandonar",
  };

  // ============================================================
  // VISIBILIDAD
  //
  // QUESTION:
  //   Solo Abandonar.
  //
  // RESULTS:
  //   Inicio + Buscar + Repaso + Pomodoro.
  //
  // Cualquier otro stage:
  //   Botones principales.
  // ============================================================

  const esPregunta = stage === "question";
  const esResultados = stage === "results";

  const botonesVisibles = esPregunta
    ? [botonAbandonar]
    : botonesPrincipales;

  // ============================================================
  // MENÚ MOBILE
  //
  // En preguntas:
  //   Abandonar.
  //
  // En resultados:
  //   Inicio + Buscar + Repaso + Pomodoro.
  //
  // El modo oscuro NO entra aquí; permanece fuera.
  // ============================================================

  const botonesMenu = botonesVisibles;

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

    const buttonClass = `${cls} ${b.className || ""}`.trim();

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

                <span
                  className={`topbar__expand-icon ${
                    menuMobileOpen ? "is-open" : ""
                  }`}
                  aria-hidden="true"
                />
              </div>

              <span className="topbar__curso topbar__curso--clickable">
                {curso}
              </span>
            </button>
          </div>

          <div className="topbar__controls">

            {/* =====================================================
                BOTONES DE NAVEGACIÓN

                PREGUNTAS:
                Solo ABANDONAR.

                RESULTADOS:
                Inicio + Buscar + Repaso + Pomodoro.
               ===================================================== */}

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

            {/* =====================================================
                SELECTOR DE TEMA
                Un solo botón con SOL + LUNA.

                Este botón permanece fuera del menú mobile.
               ===================================================== */}

            <button
              type="button"
              className={`topbar__theme-toggle ${
                temaOscuro ? "is-dark" : "is-light"
              }`}
              onClick={() =>
                setTemaOscuro(
                  (actual) => !actual
                )
              }
              title={
                temaOscuro
                  ? "Cambiar a modo claro"
                  : "Cambiar a modo oscuro"
              }
              aria-label={
                temaOscuro
                  ? "Cambiar a modo claro"
                  : "Cambiar a modo oscuro"
              }
              aria-pressed={temaOscuro}
            >
              <span className="topbar__theme-option topbar__theme-option--light">
                <i
                  className="fa-solid fa-sun"
                  aria-hidden="true"
                />
              </span>

              <span className="topbar__theme-option topbar__theme-option--dark">
                <i
                  className="fa-solid fa-moon"
                  aria-hidden="true"
                />
              </span>
            </button>

            {/* =====================================================
                HAMBURGUESA

                En mobile contiene:
                - Abandonar, durante preguntas.
                - Inicio, Buscar, Repaso y Pomodoro, en resultados.

                El modo oscuro permanece fuera.
               ===================================================== */}

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

        {/* =========================================================
            MENÚ LATERAL MOBILE
           ========================================================= */}

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