import { useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";

// Estado compartido del tema oscuro/claro. Antes vivía solo dentro de
// AppHeader, así que al entrar a teoría/preguntas (donde se monta TopBar
// en su lugar) el botón desaparecía y dejaba de aplicarse. Con este hook,
// cualquier header puede leer y cambiar el mismo tema.
export function useTemaOscuro() {
  const [temaOscuro, setTemaOscuro] = useLocalStorage(
    "miEstudio_temaOscuro",
    false
  );

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      temaOscuro ? "dark" : "light"
    );
  }, [temaOscuro]);

  return [temaOscuro, setTemaOscuro];
}
