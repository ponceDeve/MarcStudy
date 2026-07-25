import { useState } from "react";
import { Link } from "react-router-dom";

export default function TopBar({
  tema,
  curso,
  onAbrirNiveles,
  onAbrirBuscador,
  onTogglePomodoroMini,
  onAbrirTemas,
  onGuardarRepaso,
}) {
  const [configOpen, setConfigOpen] = useState(false);

  // Construir las URLs absolutas usando el origen actual
  const baseUrl = window.location.origin;
  const pomodoroHref = `${baseUrl}/cont_crono/pomodoro?curso=${encodeURIComponent(curso)}&tema=${encodeURIComponent(tema)}`;
  const repasoHref = `${baseUrl}/cont_crono/repaso`;

  const botones = [
    {
      title: "Niveles",
      label: "Nvl",
      icon: "fa-solid fa-flag-checkered",
      onClick: onAbrirNiveles
    },
    {
      title: "Mini cronómetro",
      label: "Timer",
      icon: "fa-solid fa-clock",
      onClick: onTogglePomodoroMini
    },
    {
      title: "Ir al Pomodoro de este curso",
      label: "Pomo",
      icon: "fa-solid fa-calendar-alt",
      href: pomodoroHref,
      target: "_blank"
    },
    {
      title: "Ir a Mis Repasos",
      label: "Repaso",
      icon: "fa-solid fa-brain",
      href: repasoHref,
      target: "_blank"
    },
    {
      title: "Buscar otro tema",
      label: "Buscar",
      icon: "fa-solid fa-magnifying-glass",
      onClick: onAbrirBuscador
    },
    {
      title: "Guardar este tema para repasarlo después",
      label: "Guardar",
      icon: "fa-solid fa-bookmark",
      onClick: onGuardarRepaso
    },
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
    if (b.href) {
      return (
        <a key={b.title} href={b.href} target={b.target} rel="noopener noreferrer" title={b.title} className={cls}>
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
    <div className="topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 15px' }}>

      {/* CAJA 1: Nombre del curso con su tema */}
      <div className="topbar__title" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <span className="topbar__tema">{tema}</span>
        <span
          className="topbar__curso topbar__curso--clickable"
          onClick={onAbrirTemas}
          title="Ver mapa de temas de este curso"
        >
          {curso}
        </span>
      </div>

      {/* CAJA 3: Botones de escritorio (usando la clase original topbar__nav para ocultarse en móvil) + Engranaje con clase topbar__gear */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
              {botones.slice(0, 3).map((b) => renderBoton(b, "topbar__overlay-btn"))}
            </div>
            <div className="topbar__overlay-row2">
              {botones.slice(3, 6).map((b) => renderBoton(b, "topbar__overlay-btn"))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}