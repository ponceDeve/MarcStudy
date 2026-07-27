import { useState } from "react";

// Header compacto compartido entre el inicio de Mi Estudio, Pomodoro y
// Repaso. A diferencia del TopBar de dentro de un tema, este NO tiene
// Niveles, Timer ni Guardar — solo navegación entre páginas + buscador.
//
// Usa <a href> con URL absoluta en vez de <Link> de React Router: con el
// basename "/cont_crono" configurado, la navegación de React Router
// duplicaba el prefijo (/cont_crono/cont_crono) al ir de una página
// anidada (/pomodoro, /repaso) de vuelta a "/". Con <a> normal no hay
// ese problema, aunque implica una recarga completa de la página.
function url(path) {
  return `${window.location.origin}/cont_crono${path}`;
}

export default function AppHeader({
  onAbrirBuscador,
  showHome = false,
  onEditarHorario = null,
}) {
  const [configOpen, setConfigOpen] = useState(false);

  const botones = [
    ...(showHome
      ? [{ title: "Ir a Mi Estudio", label: "Inicio", icon: "fa-solid fa-house", href: url("/") }]
      : []),
    { title: "Buscar curso o tema", label: "Buscar", icon: "fa-solid fa-magnifying-glass", onClick: onAbrirBuscador },
    { title: "Ir al Pomodoro", label: "Pomo", icon: "fa-solid fa-calendar-alt", href: url("/pomodoro") },
    { title: "Ir a Mis Repasos", label: "Repaso", icon: "fa-solid fa-brain", href: url("/repaso") },
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
    if (b.href) {
      return (
        <a key={b.title} href={b.href} title={b.title} className={cls}>
          {content}
        </a>
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
      <a href={url("/")} className="topbar__title" style={{ display: "flex", flexDirection: "column", justifyContent: "center", textDecoration: "none" }}>
        <span className="topbar__curso">Mi Estudio</span>
      </a>

      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <div className="topbar__nav">
          {botones.map((b) => renderBoton(b, "topbar__nav-btn"))}
        </div>

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