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

  const botones = [
    ...(showHome
      ? [{ title: "Ir a Mi Estudio", label: "Home", icon: "fa-solid fa-house", to: "/" }]
      : []),
    ...(onAbrirBuscador
      ? [{ title: "Buscar curso o tema", label: "Busc", icon: "fa-solid fa-magnifying-glass", onClick: onAbrirBuscador }]
      : []),
    { title: "Ir al Pomodoro", label: "Pomo", icon: "fa-solid fa-calendar-alt", to: "/pomodoro" },
    { title: "Ir a Mis Repasos", label: "Repa", icon: "fa-solid fa-brain", to: "/repaso" },
    ...(onEditarHorario
      ? [{ title: "Editar horario", label: "Edit", icon: "fa-solid fa-pen", onClick: onEditarHorario }]
      : []),
  ];

  function renderBoton(b, cls) {
    const content = (
      <>
        <i className={b.icon} />
        <span>{b.label}</span>
      </>
    );
    if (b.to) {
      return (
        <Link key={b.title} to={b.to} title={b.title} className={cls}>
          {content}
        </Link>
      );
    }
    return (
      <button
        key={b.title}
        onClick={b.onClick}
        title={b.title}
        className={cls}
      >
        {content}
      </button>
    );
  }

  return (
    <div className="topbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 15px" }}>
      <Link to="/" className="topbar__title" style={{ display: "flex", flexDirection: "column", justifyContent: "center", textDecoration: "none" }}>
        <span className="topbar__curso">{nombreUsuario || "Mi Estudio"}</span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <div className="topbar__nav">
          {botones.map((b) => renderBoton(b, "topbar__nav-btn"))}
        </div>

        <button
          onClick={alternarTema}
          title={tema === "oscuro" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          className="topbar__theme-btn"
        >
          <i className={`fa-solid ${tema === "oscuro" ? "fa-sun" : "fa-moon"}`} />
        </button>
      </div>
    </div>
  );
}