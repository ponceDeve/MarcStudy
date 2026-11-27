import { useEffect, useRef } from "react";
// El buscador vive en el estado de cada página (searchOpen), así que el
// atajo global no puede abrirlo directamente: avisa con un evento y la
// página que tenga buscador lo abre.
const EVENTO_ABRIR_BUSCADOR = "abrir-buscador";
export function pedirAbrirBuscador() {
  window.dispatchEvent(new Event(EVENTO_ABRIR_BUSCADOR));
}
export function useAtajoBuscador(abrir) {
  const abrirRef = useRef(abrir);
  useEffect(() => {
    abrirRef.current = abrir;
  });
  useEffect(() => {
    function onAbrir() {
      abrirRef.current?.();
    }
    window.addEventListener(EVENTO_ABRIR_BUSCADOR, onAbrir);
    return () => window.removeEventListener(EVENTO_ABRIR_BUSCADOR, onAbrir);
  }, []);
}
