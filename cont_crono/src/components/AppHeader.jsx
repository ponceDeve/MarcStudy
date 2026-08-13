import { useState } from "react";
import { Link } from "react-router-dom";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useTheme } from "../hooks/useTheme";

export default function AppHeader({
  onAbrirBuscador,
  showHome = false,
  onEditarHorario = null,
}) {
  const [nombreUsuario] = useLocalStorage("miEstudio_nombreUsuario", null);
  const { tema, alternarTema } = useTheme();
  const [menuMobileOpen, setMenuMobileOpen] = useState(false);

  const botones = [
    ...(showHome ? [{ title: "Ir a Mi Estudio", label: "Home", icon: "fa-solid fa-house", to: "/" }] : []),
    ...(onAbrirBuscador ? [{ title: "Buscar curso o tema", label: "Buscar", icon: "fa-solid fa-magnifying-glass", onClick: onAbrirBuscador }] : []),
    { title: "Ir al Pomodoro", label: "Pomo", icon: "fa-solid fa-calendar-alt", to: "/pomodoro" },
    { title: "Ir a Mis Repasos", label: "Repaso", icon: "fa-solid fa-brain", to: "/repaso" },
    ...(onEditarHorario ? [{ title: "Editar horario", label: "Editar", icon: "fa-solid fa-pen", onClick: onEditarHorario }] : []),
  ];

  // Renderizador para vista de escritorio
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

  // Renderizador para menú móvil (Usa clases drawer)
  const renderFila = (b, closeFn = () => {}) => {
    const content = (
      <>
        <span className="topbar__drawer-item-label">{b.label}</span>
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

  // Componente del Panel Lateral
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

  return (
    <>
      <div className="topbar">
        <div className="topbar__title-box">
          <Link to="/" className="topbar__title-btn" title="Mi Estudio">
            <span className="topbar__curso topbar__curso--clickable">
              {nombreUsuario || "Mi Estudio"}
            </span>
          </Link>
        </div>

        <div className="topbar__controls">
          <div className="topbar__nav">
            {botones.map((b) => renderBoton(b, "topbar__nav-btn"))}
          </div>

          <button
            type="button"
            onClick={alternarTema}
            title={tema === "oscuro" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            className="topbar__theme-btn"
          >
            <i className={`fa-solid ${tema === "oscuro" ? "fa-sun" : "fa-moon"}`} />
          </button>

          <button
            type="button"
            onClick={() => setMenuMobileOpen(true)}
            title="Menú"
            className="topbar__control-btn topbar__control-btn--menu topbar__hamburger"
          >
            <i className="fa-solid fa-bars" />
          </button>
        </div>
      </div>

      {/* Menú renderizado AFUERA del div .topbar */}
      <SideDrawer title="Menú" isOpen={menuMobileOpen} onClose={() => setMenuMobileOpen(false)}>
        {botones.map((b) => renderFila(b, () => setMenuMobileOpen(false)))}
      </SideDrawer>
    </>
  );
}