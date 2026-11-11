import { useSyncExternalStore } from "react";

// Tema de la interfaz: "claro" u "oscuro". Si la persona nunca eligió, se
// sigue el del sistema. Se aplica con data-theme="light|dark" en <html>.
const CLAVE = "miEstudio_tema";
const COLORES = { claro: "#EEF3EF", oscuro: "#1B222C" };
const CONSULTA_OSCURO = "(prefers-color-scheme: dark)";
const oyentes = new Set();

function leerGuardado() {
  try {
    const v = localStorage.getItem(CLAVE);
    return v === "claro" || v === "oscuro" ? v : null;
  } catch {
    return null;
  }
}

function temaDelSistema() {
  try {
    return window.matchMedia(CONSULTA_OSCURO).matches ? "oscuro" : "claro";
  } catch {
    return "claro";
  }
}

export function temaActual() {
  return leerGuardado() ?? temaDelSistema();
}

export function aplicarTema(tema = temaActual()) {
  document.documentElement.setAttribute(
    "data-theme",
    tema === "oscuro" ? "dark" : "light"
  );
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", COLORES[tema]);
}

export function alternarTema() {
  const siguiente = temaActual() === "oscuro" ? "claro" : "oscuro";
  try {
    localStorage.setItem(CLAVE, siguiente);
  } catch {
    /* noop */
  }
  aplicarTema(siguiente);
  oyentes.forEach((avisar) => avisar());
}

function suscribir(avisar) {
  oyentes.add(avisar);

  const mq = window.matchMedia?.(CONSULTA_OSCURO);
  const alCambiarSistema = () => {
    if (!leerGuardado()) {
      aplicarTema();
      avisar();
    }
  };
  const alCambiarStorage = (e) => {
    if (e.key === CLAVE) {
      aplicarTema();
      avisar();
    }
  };

  mq?.addEventListener?.("change", alCambiarSistema);
  window.addEventListener("storage", alCambiarStorage);

  return () => {
    oyentes.delete(avisar);
    mq?.removeEventListener?.("change", alCambiarSistema);
    window.removeEventListener("storage", alCambiarStorage);
  };
}

export function useTema() {
  const tema = useSyncExternalStore(suscribir, temaActual, () => "claro");
  return { tema, esOscuro: tema === "oscuro", alternarTema };
}
