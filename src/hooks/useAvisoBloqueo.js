import { useEffect, useRef, useState } from "react";

// Hook para botones que están "bloqueados" porque esperan una
// acción previa del usuario (elegir una opción, responder algo, etc).
// Devuelve [visible, mostrar]: llama a mostrar() cuando el usuario
// intenta la acción sin cumplir la condición, y el aviso se muestra
// por `duracion` ms, reiniciando el conteo si se llama de nuevo antes
// de que termine.
export function useAvisoBloqueo(duracion = 2000) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  function mostrar() {
    clearTimeout(timeoutRef.current);
    setVisible(true);
    timeoutRef.current = setTimeout(() => setVisible(false), duracion);
  }

  return [visible, mostrar];
}
