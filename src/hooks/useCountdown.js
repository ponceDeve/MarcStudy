import { useState, useRef, useCallback, useEffect } from "react";

const STORAGE_KEY = "pomodoro_countdown_backup";

export function useCountdown(initialMinutes, onComplete) {
  // 1. Inicializar leyendo de localStorage (sobrevive al cambio de pantalla)
  const [secondsLeft, setSecondsLeft] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const { endTime, pausedLeft } = JSON.parse(saved);
      // Si estaba corriendo, calculamos cuánto falta
      if (endTime) {
        const remaining = Math.round((endTime - Date.now()) / 1000);
        return remaining > 0 ? remaining : 0;
      }
      // Si estaba pausado, recuperamos donde se quedó
      if (pausedLeft) return pausedLeft;
    }
    return initialMinutes * 60;
  });

  const [isRunning, setIsRunning] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const { endTime } = JSON.parse(saved);
      return endTime && endTime > Date.now();
    }
    return false;
  });

  const intervalRef = useRef(null);
  const endTimeRef = useRef(null); 
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    if (!endTimeRef.current) return;
    const now = Date.now();
    const remaining = Math.round((endTimeRef.current - now) / 1000);

    if (remaining <= 0) {
      clear();
      setIsRunning(false);
      setSecondsLeft(0);
      localStorage.removeItem(STORAGE_KEY); // Limpiar al terminar
      onCompleteRef.current?.();
    } else {
      setSecondsLeft(remaining);
    }
  }, [clear]);

  const start = useCallback(() => {
    if (intervalRef.current) return;

    setIsRunning(true);
    const end = Date.now() + secondsLeft * 1000;
    endTimeRef.current = end;
    
    // Guardamos la meta en el almacenamiento del celular
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ endTime: end }));

    intervalRef.current = setInterval(tick, 1000);
  }, [secondsLeft, tick]);

  const pause = useCallback(() => {
    clear();
    setIsRunning(false);
    endTimeRef.current = null;
    // Guardamos los segundos restantes para cuando regrese
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ pausedLeft: secondsLeft }));
  }, [clear, secondsLeft]);

  const reset = useCallback(
    (minutes) => {
      clear();
      setIsRunning(false);
      endTimeRef.current = null;
      setSecondsLeft((minutes ?? initialMinutes) * 60);
      localStorage.removeItem(STORAGE_KEY); // Limpiamos la memoria
    },
    [clear, initialMinutes],
  );

  const setMinutes = useCallback(
    (minutes) => {
      clear();
      setIsRunning(false);
      endTimeRef.current = null;
      setSecondsLeft(minutes * 60);
      localStorage.removeItem(STORAGE_KEY);
    },
    [clear],
  );

  // 2. Auto-arrancar el intervalo si detecta que había un timer activo al montar la pantalla
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const { endTime } = JSON.parse(saved);
      if (endTime && endTime > Date.now()) {
        endTimeRef.current = endTime;
        intervalRef.current = setInterval(tick, 1000);
      }
    }
    return clear;
  }, [clear, tick]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isRunning) {
        tick();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isRunning, tick]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return {
    secondsLeft,
    formatted: `${mm}:${ss}`,
    isRunning,
    start,
    pause,
    reset,
    setMinutes,
  };
}