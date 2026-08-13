import { useState } from "react";
import { Link } from "react-router-dom";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useTheme } from "../hooks/useTheme";

// Header compacto compartido entre el inicio de Mi Estudio, Pomodoro y
// Repaso. A diferencia del TopBar de dentro de un tema, este NO tiene
// Niveles, Timer ni Guardar — solo navegación entre páginas + buscador.
export default function AppHeader({
  onAbrirBuscador,
  showHome = false,
  onEditarHorario = null,
}) {
  const [nombreUsuario] = useLocalStorage("miEstudio_nombreUsuario", null);
  const { tema, alternarTema } = useTheme();
  const [menuMobileOpen, setMenuMobileOpen] = useState(false);

  const botones = [
    ...(showHome
      ? [{ title: "Ir a Mi Estudio", label: "Home", icon: "fa-solid fa-house", to: "/" }]
      : []),
    ...(onAbrirBuscador
      ? [{ title: "Buscar curso o tema", label: "Buscar", icon: "fa-solid fa-magnifying-glass", onClick: onAbrirBuscador }]
      : []),
    { title: "Ir al Pomodoro", label: "Pomo", icon: "fa-solid fa-calendar-alt", to: "/pomodoro" },
    { title: "Ir a Mis Repasos", label: "Repaso", icon: "fa-solid fa-brain", to: "/repaso" },
    ...(onEditarHorario
      ? [{ title: "Editar horario", label: "Editar", icon: "fa-solid fa-pen", onClick: onEditarHorario }]
      : []),
  ];

  function renderBoton(b, cls, closeFn = () => {}) {
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
    if (b.to) {
      return (
        <Link key={b.title} to={b.to} title={b.title} className={cls} onClick={closeFn}>
          {content}
        </Link>
      );
    }
    return (
      <button key={b.title} type="button" onClick={handleClick} title={b.title} className={cls}>
        {content}
      </button>
    );
  }

  return (
    <div className="topbar">
      <Link to="/" className="topbar__title-btn" title="Mi Estudio">
        <span className="topbar__curso topbar__curso--clickable">{nombreUsuario || "Mi Estudio"}</span>
      </Link>

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

      {menuMobileOpen && (
        <div
          className="topbar__overlay"
          onClick={(e) => e.target === e.currentTarget && setMenuMobileOpen(false)}
        >
          <div className="topbar__overlay-inner">
            <h3 className="topbar__overlay-title">Menú</h3>
            <div className="topbar__overlay-row1">
              {botones.map((b) => renderBoton(b, "topbar__overlay-btn", () => setMenuMobileOpen(false)))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}