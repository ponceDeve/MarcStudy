import { useState, useEffect, useRef } from "react";

// Hook genérico: se comporta como useState pero persiste en localStorage.
// Reemplaza los localStorage.getItem/setItem sueltos que había repetidos
// en repaso.js, script.js e index.html.
export function useLocalStorage(key, defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const isFirstRun = useRef(true);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error guardando "${key}" en localStorage:`, e);
    }
  }, [key, value]);

  return [value, setValue];
}
