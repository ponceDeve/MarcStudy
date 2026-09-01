import { useCallback, useState } from "react";

/**
 * Gestiona el estado de "tutorial visto" por sección, guardado en localStorage.
 * Cada sección tiene su propia key, así Inicio / Pomodoro / Editar / Repaso
 * son completamente independientes entre sí.
 */
export function useTutorialSeen(storageKey) {
  const fullKey = `miEstudio_tutorial_${storageKey}`;

  const [visto, setVisto] = useState(() => {
    try {
      return localStorage.getItem(fullKey) === "1";
    } catch {
      return true; // si falla localStorage, no molestamos al usuario
    }
  });

  const marcarVisto = useCallback(() => {
    try {
      localStorage.setItem(fullKey, "1");
    } catch {}
    setVisto(true);
  }, [fullKey]);

  return { visto, marcarVisto };
}
