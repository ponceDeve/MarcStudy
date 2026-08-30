import { useCallback, useEffect, useState } from "react";

const HISTORIAL_KEY = "searchHistory";
const HISTORIAL_MAX = 15;

function obtenerClaveHistorial(item) {
  if (!item || !item.type) return "";

  if (item.type === "curso") {
    return `curso:${item.nombre}`;
  }

  return `tema:${item.archivo || item.tema}`;
}

function leerHistorial() {
  try {
    const guardado = localStorage.getItem(HISTORIAL_KEY);

    if (!guardado) {
      return [];
    }

    const historial = JSON.parse(guardado);

    if (!Array.isArray(historial)) {
      return [];
    }

    return historial
      .filter((item) => item && item.type)
      .slice(0, HISTORIAL_MAX);
  } catch {
    return [];
  }
}

function escribirHistorial(historial) {
  try {
    localStorage.setItem(
      HISTORIAL_KEY,
      JSON.stringify(historial)
    );

    return true;
  } catch {
    return false;
  }
}

export function useSearchHistory() {
  const [historial, setHistorial] = useState([]);

  useEffect(() => {
    setHistorial(leerHistorial());
  }, []);

  const guardarBusqueda = useCallback((item) => {
    if (!item) {
      return [];
    }

    const historialActual = leerHistorial();
    const claveNueva = obtenerClaveHistorial(item);

    if (!claveNueva) {
      return historialActual;
    }

    const sinDuplicado = historialActual.filter(
      (anterior) =>
        obtenerClaveHistorial(anterior) !== claveNueva
    );

    const nuevoHistorial = [
      item,
      ...sinDuplicado
    ].slice(0, HISTORIAL_MAX);

    const guardado =
      escribirHistorial(nuevoHistorial);

    if (guardado) {
      setHistorial(nuevoHistorial);
      return nuevoHistorial;
    }

    return historialActual;
  }, []);

  const eliminarBusqueda = useCallback((item) => {
    if (!item) {
      return;
    }

    const claveEliminar =
      obtenerClaveHistorial(item);

    if (!claveEliminar) {
      return;
    }

    const historialActual = leerHistorial();

    const nuevoHistorial =
      historialActual.filter(
        (anterior) =>
          obtenerClaveHistorial(anterior) !==
          claveEliminar
      );

    escribirHistorial(nuevoHistorial);
    setHistorial(nuevoHistorial);
  }, []);

  const eliminarHistorial = useCallback(() => {
    try {
      localStorage.removeItem(HISTORIAL_KEY);
    } catch {
      // No hacer nada si localStorage no está disponible.
    }

    setHistorial([]);
  }, []);

  const actualizarHistorial = useCallback(() => {
    const nuevoHistorial = leerHistorial();

    setHistorial(nuevoHistorial);

    return nuevoHistorial;
  }, []);

  return {
    historial,
    guardarBusqueda,
    eliminarBusqueda,
    eliminarHistorial,
    actualizarHistorial,
    obtenerClaveHistorial,
    maxHistorial: HISTORIAL_MAX
  };
}

export { obtenerClaveHistorial };