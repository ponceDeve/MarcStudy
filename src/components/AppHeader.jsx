import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLocalStorage } from "../hooks/useLocalStorage";

export default function AppHeader({
  onAbrirBuscador,
  showHome = false,
  onEditarHorario = null,
}) {
  const [nombreUsuario] = useLocalStorage("miEstudio_nombreUsuario", null);
  const [menuMobileOpen, setMenuMobileOpen] = useState(false);
  const headerRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const setHeaderVar = () => {
      document.documentElement.style.setProperty(
        "--app-header-h",
        `${el.offsetHeight}px`
      );
    };

    setHeaderVar();

    const ro = new ResizeObserver(setHeaderVar);
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  const botones = [
    ...(showHome
      ? [
          {
            title: "Ir a Mi Estudio",
            label: "Home",
            fullLabel: "Inicio",
            icon: "fa-solid fa-house",
            to: "/",
          },
        ]
      : []),
    ...(onAbrirBuscador
      ? [
          {
            title: "Buscar curso o tema",
            label: "Buscar",
            fullLabel: "Buscar curso o tema",
            icon: "fa-solid fa-magnifying-glass",
            onClick: onAbrirBuscador,
          },
        ]
      : []),
    {
      title: "Ir al Pomodoro",
      label: "Pomo",
      fullLabel: "Pomodoro",
      icon: "fa-solid fa-calendar-alt",
      to: "/pomodoro",
    },
    {
      title: "Ir a Mis Repasos",
      label: "Repaso",
      fullLabel: "Mis Repasos",
      icon: "fa-solid fa-brain",
      to: "/repaso",
    },
    {
      title: "Editar horario",
      label: "Editar",
      fullLabel: "Editar horario",
      icon: "fa-solid fa-pen",
      to: "/editar",
      onClick: onEditarHorario,
    },
  ];

  const esActivo = (b) => {
    if (!b.to) return false;

    if (b.to === "/") {
      return location.pathname === "/";
    }

    return (
      location.pathname === b.to ||
      location.pathname.startsWith(`${b.to}/`)
    );
  };

  function renderBoton(b, cls) {
    const content = (
      <>
        <i className={`${b.icon} topbar__btn-icon`} />
        <span className="topbar__btn-title">{b.label}</span>
      </>
    );

    const activeClass = esActivo(b) ? " is-active" : "";

    const handleClick = () => {
      if (b.onClick) b.onClick();
    };

    if (b.to) {
      return (
        <Link
          key={b.title}
          to={b.to}
          title={b.title}
          className={`${cls}${activeClass}`}
          onClick={handleClick}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        key={b.title}
        type="button"
        onClick={handleClick}
        title={b.title}
        className={`${cls}${activeClass}`}
      >
        {content}
      </button>
    );
  }

  const SideDrawer = ({ title, isOpen, onClose, children }) => (
    <div
      className={`topbar__drawer-backdrop ${isOpen ? "is-open" : ""}`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      aria-hidden={!isOpen}
    >
      <div className="topbar__drawer">
        <div className="topbar__drawer-header">
          <h3 className="topbar__drawer-title">{title}</h3>
          <button
            type="button"
            className="topbar__drawer-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <i className="fa-solid fa-times" />
          </button>
        </div>

        <div className="topbar__drawer-list">{children}</div>
      </div>
    </div>
  );

  const renderFila = (b, closeFn = () => {}) => {
    const content = (
      <>
        <span className="topbar__drawer-item-label">
          {b.fullLabel || b.label}
        </span>
        <i className={`${b.icon} topbar__drawer-item-icon`} />
      </>
    );

    const activeClass = esActivo(b) ? " is-active" : "";

    const handleClick = () => {
      if (b.onClick) b.onClick();
      closeFn();
    };

    return b.to ? (
      <Link
        key={b.title}
        to={b.to}
        title={b.title}
        className={`topbar__drawer-item${activeClass}`}
        onClick={handleClick}
      >
        {content}
      </Link>
    ) : (
      <button
        key={b.title || b.label}
        type="button"
        onClick={handleClick}
        title={b.title}
        className={`topbar__drawer-item${activeClass}`}
      >
        {content}
      </button>
    );
  };

  return (
    <div className="topbar-wrapper">
      <div className="topbar container" ref={headerRef}>
        <Link to="/" className="topbar__title-btn" title="Mi Estudio">
          <span className="topbar__curso topbar__curso--clickable">
            {nombreUsuario || "Mi Estudio"}
          </span>
        </Link>

        <div className="topbar__controls">
          <div className="topbar__nav">
            {botones.map((b) => renderBoton(b, "topbar__nav-btn"))}
          </div>

          <button
            type="button"
            onClick={() => setMenuMobileOpen(true)}
            title="Menú"
            className="topbar__control-btn topbar__control-btn--menu topbar__hamburger"
          >
            <i className="fa-solid fa-bars" />
          </button>
        </div>

        <SideDrawer
          title="Menú"
          isOpen={menuMobileOpen}
          onClose={() => setMenuMobileOpen(false)}
        >
          {botones.map((b) =>
            renderFila(b, () => setMenuMobileOpen(false))
          )}
        </SideDrawer>
      </div>
    </div>
  );
}