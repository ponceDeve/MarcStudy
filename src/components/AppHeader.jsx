import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useAutoHideHeader } from "../hooks/useAutoHideHeader";
import EditarNombreModal from "./EditarNombreModal";

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

export default function AppHeader({
  onAbrirBuscador,
  showHome = false,
  onEditarHorario = null,
}) {
  const [nombreUsuario, setNombreUsuario] = useLocalStorage(
    "miEstudio_nombreUsuario",
    null
  );

  const [fotoUsuario, setFotoUsuario] = useLocalStorage(
    "miEstudio_fotoUsuario",
    null
  );

  const [menuMobileOpen, setMenuMobileOpen] = useState(false);
  const [editarPerfilAbierto, setEditarPerfilAbierto] = useState(false);

  const headerRef = useRef(null);
  const location = useLocation();

  useAutoHideHeader(menuMobileOpen);

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

  /*
  ============================================================
  BOTONES DEL HEADER DE INICIO
  ============================================================
  */

  const botones = [
    ...(showHome
      ? [
          {
            title: "Ir a Inicio",
            label: "Inicio",
            fullLabel: "Ir a Inicio",
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
      title: "Ir a Mis Repasos",
      label: "Repaso",
      fullLabel: "Mis Repasos",
      icon: "fa-solid fa-calendar-check",
      to: "/repaso",
    },

    {
      title: "Ir al Pomodoro",
      label: "Pomodoro",
      fullLabel: "Pomodoro",
      icon: "fa-solid fa-hourglass-half",
      to: "/pomodoro",
    },

    {
      title: "Editar horario",
      label: "Editar",
      fullLabel: "Editar horario",
      icon: "fa-solid fa-pen",
      to: "/editar",
      onClick: onEditarHorario,
    },

    ...(nombreUsuario
      ? [
          {
            title: "Editar perfil",
            label: "Perfil",
            fullLabel: "Editar perfil",
            icon: "fa-solid fa-user",
            onClick: () => setEditarPerfilAbierto(true),
          },
        ]
      : []),
  ];

  /*
  ============================================================
  RUTA ACTIVA
  ============================================================
  */

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

  /*
  ============================================================
  BOTÓN DEL TOPBAR
  ============================================================
  */

  const renderBoton = (b, cls) => {
    const content = (
      <>
        <i className={`${b.icon} topbar__btn-icon`} />

        <span className="topbar__btn-title">
          {b.label}
        </span>
      </>
    );

    const activeClass = esActivo(b)
      ? " is-active"
      : "";

    const handleClick = () => {
      if (b.onClick) {
        b.onClick();
      }
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
        key={b.title || b.label}
        type="button"
        onClick={handleClick}
        title={b.title}
        className={`${cls}${activeClass}`}
      >
        {content}
      </button>
    );
  };

  /*
  ============================================================
  FILA DEL MENÚ LATERAL
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

    const activeClass = esActivo(b)
      ? " is-active"
      : "";

    const handleClick = () => {
      if (b.onClick) {
        b.onClick();
      }

      closeFn();
    };

    if (b.to) {
      return (
        <Link
          key={b.title}
          to={b.to}
          title={b.title}
          className={`topbar__drawer-item${activeClass}`}
          onClick={handleClick}
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
        className={`topbar__drawer-item${activeClass}`}
      >
        {content}
      </button>
    );
  };

  /*
  ============================================================
  HEADER
  ============================================================
  */

  return (
    <div className="topbar-wrapper">
      <div
        className="topbar"
        ref={headerRef}
      >
        <div className="topbar__inner">

          {/* ==================================================
              LOGO + NOMBRE DEL USUARIO
              ================================================== */}

          <div className="topbar__title-btn btn__inicio">

            <Link
              to="/"
              title="Mi Estudio"
            >
              <img
                src={
                  fotoUsuario ||
                  `${import.meta.env.BASE_URL}icon.png`
                }
                alt="Mi Estudio"
                className={`topbar__logo${
                  fotoUsuario
                    ? " topbar__logo--foto"
                    : ""
                }`}
              />
            </Link>

            {nombreUsuario ? (
              <span
                className="topbar__curso"
                title={nombreUsuario}
              >
                {nombreUsuario}
              </span>
            ) : (
              <Link
                to="/"
                className="topbar__curso topbar__curso--clickable"
              >
                Mi Estudio
              </Link>
            )}
          </div>

          {/* ==================================================
              BUSCADOR
              ================================================== */}

          {onAbrirBuscador && (
            <button
              type="button"
              className="topbar__search-bar"
              onClick={onAbrirBuscador}
              title="Buscar curso o tema"
            >
              <i className="fa-solid fa-magnifying-glass topbar__search-icon" />

              <span className="topbar__search-placeholder">
                Buscar cursos, temas...
              </span>
            </button>
          )}

          {/* ==================================================
              CONTROLES
              ================================================== */}

          <div className="topbar__controls">

            <div className="topbar__nav">

              {botones
                .filter(
                  (b) => b.label !== "Buscar"
                )
                .map((b) =>
                  renderBoton(
                    b,
                    "topbar__nav-btn"
                  )
                )}

            </div>

            {/* =================================================
                MENÚ
                ================================================= */}

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

          </div>
        </div>

        {/* ====================================================
            MENÚ LATERAL
            ==================================================== */}

        <SideDrawer
          title="Menú"
          isOpen={menuMobileOpen}
          onClose={() =>
            setMenuMobileOpen(false)
          }
        >
          {botones.map((b) =>
            renderFila(
              b,
              () =>
                setMenuMobileOpen(false)
            )
          )}
        </SideDrawer>
      </div>

      {/* ======================================================
          MODAL DE PERFIL
          ====================================================== */}

      <EditarNombreModal
        open={editarPerfilAbierto}
        nombreActual={nombreUsuario}
        fotoActual={fotoUsuario}
        onGuardar={(n, f) => {
          setNombreUsuario(n);
          setFotoUsuario(f);
          setEditarPerfilAbierto(false);
        }}
        onCancelar={() =>
          setEditarPerfilAbierto(false)
        }
      />
    </div>
  );
}