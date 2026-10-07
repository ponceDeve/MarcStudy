import { useEffect } from "react";
import { alternarMusica } from "../lib/musicaFondo";

// Atajos de teclado globales (funcionan en cualquier página de la app):
//   F → entrar / salir de pantalla completa
//   B → activar / silenciar la música de fondo (bocina)

function alternarPantallaCompleta() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen?.().catch(() => {});
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
}

function escribiendoEnCampo(el) {
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable === true
  );
}

export function useAtajosGlobales() {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.repeat || e.defaultPrevented) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (escribiendoEnCampo(e.target)) return;

      // e.code no depende de mayúsculas ni del idioma del teclado.
      if (e.code === "KeyF") {
        e.preventDefault();
        alternarPantallaCompleta();
      } else if (e.code === "KeyB") {
        e.preventDefault();
        alternarMusica();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
