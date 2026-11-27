import { useState, useRef, useEffect } from "react";

// Desplegable de ajustes secundarios (pantalla completa, música, tema).
// Recibe la lista `controles` con { key, label, atajo, icon, onClick } y se
// usa igual en AppHeader.jsx y en TopBar.jsx.
export default function AjustesMenu({ controles }) {
  const [abierto, setAbierto] = useState(false);
  const refRaiz = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    function alClicFuera(e) {
      if (refRaiz.current && !refRaiz.current.contains(e.target)) {
        setAbierto(false);
      }
    }
    function alTecla(e) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("pointerdown", alClicFuera);
    document.addEventListener("keydown", alTecla);
    return () => {
      document.removeEventListener("pointerdown", alClicFuera);
      document.removeEventListener("keydown", alTecla);
    };
  }, [abierto]);

  return (
    <div className="ajustes-menu" ref={refRaiz}>
      <button
        type="button"
        className="topbar__nav-btn ajustes-menu__btn"
        onClick={() => setAbierto((v) => !v)}
        title="Ajustes"
        aria-label="Ajustes"
        aria-haspopup="menu"
        aria-expanded={abierto}
      >
        <i className="fa-solid fa-sliders topbar__btn-icon" />
        <span className="topbar__btn-title">Ajustes</span>
      </button>
      {abierto && (
        <div className="ajustes-menu__panel" role="menu">
          {controles.map((c) => (
            <button
              key={c.key}
              type="button"
              role="menuitem"
              className="ajustes-menu__item"
              onClick={() => {
                c.onClick();
                setAbierto(false);
              }}
            >
              <i className={`${c.icon} ajustes-menu__icon`} />
              <span className="ajustes-menu__label">{c.label}</span>
              {c.atajo && <kbd className="topbar__atajo">({c.atajo})</kbd>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}