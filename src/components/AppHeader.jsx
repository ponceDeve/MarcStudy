import { useState } from "react";
import { Link } from "react-router-dom";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useTheme } from "../hooks/useTheme";

// Header compacto compartido entre el inicio de Mi Estudio, Pomodoro y
// Repaso. A diferencia del TopBar de dentro de un tema, este NO tiene
// Niveles, Timer ni Guardar — solo navegación entre páginas + buscador.
//
// Usa <Link> de react-router (navegación interna, sin recargar la
// página) — importante para que el pomodoro siga corriendo al navegar
// entre pantallas. Ojo: la ruta que se le pasa a <Link to=""> NO debe
// incluir el basename "/cont_crono" (react-router ya lo antepone
// solo); ponerlo a mano lo duplica (/cont_crono/cont_crono).
export default function AppHeader({
  onAbrirBuscador,
  showHome = false,
  onEditarHorario = null,
}) {
  const [configOpen, setConfigOpen] = useState(false);
  const [nombreUsuario] = useLocalStorage("miEstudio_nombreUsuario", null);
  const { tema, alternarTema } = useTheme();

  const botones = [
    ...(showHome
      ? [{ title: "Ir a Mi Estudio", label: "Inicio", icon: "fa-solid fa-house", to: "/" }]
      : []),
    // Solo se agrega si onAbrirBuscador viene definido — en la
    // pantalla de inicio de Mi Estudio no hace falta, porque ahí ya
    // hay un buscador principal en el propio cuerpo de la página.
    ...(onAbrirBuscador
      ? [{ title: "Buscar curso o tema", label: "Buscar", icon: "fa-solid fa-magnifying-glass", onClick: onAbrirBuscador }]
      : []),
    { title: "Ir al Pomodoro", label: "Pomo", icon: "fa-solid fa-calendar-alt", to: "/pomodoro" },
    { title: "Ir a Mis Repasos", label: "Repaso", icon: "fa-solid fa-brain", to: "/repaso" },
    ...(onEditarHorario
      ? [{ title: "Editar horario", label: "Editar", icon: "fa-solid fa-pen", onClick: onEditarHorario }]
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
        <Link key={b.title} to={b.to} title={b.title} className={cls} onClick={() => setConfigOpen(false)}>
          {content}
        </Link>
      );
    }
    return (
      <button
        key={b.title}
        onClick={() => {
          b.onClick();
          setConfigOpen(false);
        }}
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

        <button onClick={() => setConfigOpen(true)} title="Opciones" className="topbar__gear">
          <i className="fa-solid fa-gear" />
        </button>
      </div>

      {configOpen && (
        <div
          onClick={(e) => e.target === e.currentTarget && setConfigOpen(false)}
          className="topbar__overlay"
        >
          <div className="topbar__overlay-inner">
            <div className="topbar__overlay-row1">
              {botones.map((b) => renderBoton(b, "topbar__overlay-btn"))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}