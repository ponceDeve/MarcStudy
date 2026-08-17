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
    localStorage.setItem(HISTORIAL_KEY, JSON.stringify(historial));

    return true;
  } catch {
    return false;
  }
}

export function useSearchHistory() {
  const [historial, setHistorial] = useState([]);

  /*
   * Cargar el historial guardado al montar el componente.
   */
  useEffect(() => {
    setHistorial(leerHistorial());
  }, []);

  /*
   * Guardar una búsqueda.
   *
   * Si ya existe:
   * - no crea duplicado
   * - la mueve al principio
   *
   * Si no existe:
   * - la agrega al principio
   *
   * Se conservan como máximo 15 búsquedas.
   */
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
      (anterior) => obtenerClaveHistorial(anterior) !== claveNueva,
    );

    const nuevoHistorial = [item, ...sinDuplicado].slice(0, HISTORIAL_MAX);

    const guardado = escribirHistorial(nuevoHistorial);

    if (guardado) {
      setHistorial(nuevoHistorial);
      return nuevoHistorial;
    }

    return historialActual;
  }, []);

  /*
   * Eliminar todo el historial.
   */
  const eliminarHistorial = useCallback(() => {
    try {
      localStorage.removeItem(HISTORIAL_KEY);
    } catch {
      // No hacer nada si localStorage no está disponible.
    }

    setHistorial([]);
  }, []);

  /*
   * Volver a leer el historial desde localStorage.
   *
   * Es útil cuando otro componente puede haber modificado
   * el historial mientras este componente seguía montado.
   */
  const actualizarHistorial = useCallback(() => {
    const nuevoHistorial = leerHistorial();
    setHistorial(nuevoHistorial);
    return nuevoHistorial;
  }, []);

  return {
    historial,
    guardarBusqueda,
    eliminarHistorial,
    actualizarHistorial,
    obtenerClaveHistorial,
    maxHistorial: HISTORIAL_MAX,
  };
}

export { obtenerClaveHistorial };
