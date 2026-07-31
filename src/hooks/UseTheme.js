import { useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";

// Tema global (claro/oscuro), guardado en localStorage y aplicado como
// atributo data-theme en <html> — _tokens.scss define las variables de
// cada tema bajo ese selector.
export function useTheme() {
  const [tema, setTema] = useLocalStorage("tema", "oscuro");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tema);
  }, [tema]);

  function alternarTema() {
    setTema((t) => (t === "oscuro" ? "claro" : "oscuro"));
  }

  return { tema, alternarTema };
}