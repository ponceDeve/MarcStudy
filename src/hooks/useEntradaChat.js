import { useEffect, useState } from "react";

// Secuencia de entrada de un mensaje del chat:
//   1) "escribiendo…" (puntitos)   2) la burbuja   3) los botones (con CSS)
// `clave` identifica el paso: al cambiar, la secuencia vuelve a empezar.
// Con "reducir movimiento" activado en el dispositivo no hay animación.
const ESCRIBIENDO_MS = 600;
const TOTAL_MS = 1900;

function prefiereMenosMovimiento() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function useEntradaChat(clave, activo = true) {
  const [estado, setEstado] = useState({ clave: null, fase: "fin" });
  const reducido = prefiereMenosMovimiento();

  useEffect(() => {
    if (!activo) {
      setEstado({ clave: null, fase: "fin" });
      return undefined;
    }
    if (reducido) return undefined;
    const t1 = setTimeout(
      () => setEstado({ clave, fase: "burbuja" }),
      ESCRIBIENDO_MS
    );
    const t2 = setTimeout(
      () => setEstado({ clave, fase: "fin" }),
      TOTAL_MS
    );
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [clave, activo, reducido]);

  if (!activo || reducido) {
    return { escribiendo: false, entrando: false };
  }
  const fase = estado.clave === clave ? estado.fase : "escribiendo";
  return { escribiendo: fase === "escribiendo", entrando: fase !== "fin" };
}
