import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { guardarPomodoroCompartido, leerPomodoroCompartido, limpiarPomodoroCompartido } from "../lib/pomodoroShared";

// Antes cada página (Horario) tenía su PROPIO cronómetro local
// (useCountdown), que moría apenas se navegaba a otra página porque el
// componente se desmontaba. Este contexto vive arriba de <Routes> en
// App.jsx, así que sigue montado sin importar a qué pantalla navegues
// dentro de la app — el cronómetro sigue corriendo de verdad mientras
// estás viendo el tema en Mi Estudio, no solo cuando estás parado en
// la pantalla de Pomodoro.
//
// Ojo: esto NO reemplaza el aviso de "se acabó el tiempo" que ya existe
// en Mi Estudio (ese sigue leyendo localStorage por su cuenta, sin
// cambios) — este contexto solo lleva la cuenta del tiempo en sí.
const PomodoroContext = createContext(null);

const UMBRAL_ABANDONO_MS = 2 * 60 * 60 * 1000; // 2 horas

export function PomodoroProvider({ children }) {
  const [endTimestamp, setEndTimestamp] = useState(null); // null = no está corriendo
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [label, setLabel] = useState("");
  const [subject, setSubject] = useState("");
  const intervalRef = useRef(null);

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback((endTs) => {
    const remaining = Math.round((endTs - Date.now()) / 1000);
    if (remaining <= 0) {
      clearTick();
      setSecondsLeft(0);
      setEndTimestamp(null);
    } else {
      setSecondsLeft(remaining);
    }
  }, [clearTick]);

  // Al cargar la app (primera vez o recarga de página completa), si
  // había un pomodoro corriendo y todavía no venció, lo retoma en vez
  // de reiniciar el reloj en 25:00.
  useEffect(() => {
    const guardado = leerPomodoroCompartido();
    if (!guardado || !guardado.running) return;
    const restanteMs = guardado.endTimestamp - Date.now();
    if (restanteMs <= 0) return; // ya venció, que lo maneje la alarma normal
    if (restanteMs > UMBRAL_ABANDONO_MS) return; // demasiado viejo, no lo retoma

    setEndTimestamp(guardado.endTimestamp);
    setLabel(guardado.label || "");
    setSubject(guardado.subject || "");
    setSecondsLeft(Math.round(restanteMs / 1000));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    clearTick();
    if (endTimestamp) {
      intervalRef.current = setInterval(() => tick(endTimestamp), 1000);
    }
    return clearTick;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endTimestamp]);

  // Si cambias de pestaña/app y vuelves, corrige al instante en vez de
  // esperar hasta el próximo tick del setInterval.
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible" && endTimestamp) tick(endTimestamp);
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [endTimestamp, tick]);

  const iniciar = useCallback((minutos, nuevaLabel, nuevoSubject) => {
    const seg = minutos != null ? minutos * 60 : secondsLeft;
    const nuevoEnd = Date.now() + seg * 1000;
    setTotalSeconds(seg);
    setSecondsLeft(seg);
    const labelFinal = nuevaLabel !== undefined ? nuevaLabel : label;
    if (nuevaLabel !== undefined) setLabel(nuevaLabel);
    const subjectFinal = nuevoSubject !== undefined ? nuevoSubject : subject;
    if (nuevoSubject !== undefined) setSubject(nuevoSubject);
    setEndTimestamp(nuevoEnd);
    guardarPomodoroCompartido({ endTimestamp: nuevoEnd, running: true, label: labelFinal, subject: subjectFinal });
  }, [secondsLeft, label, subject]);

  const pausar = useCallback(() => {
    setEndTimestamp(null);
    limpiarPomodoroCompartido();
  }, []);

  const reiniciar = useCallback((minutos, nuevaLabel) => {
    clearTick();
    const seg = (minutos ?? Math.round(totalSeconds / 60)) * 60;
    setEndTimestamp(null);
    setTotalSeconds(seg);
    setSecondsLeft(seg);
    if (nuevaLabel !== undefined) setLabel(nuevaLabel);
  }, [clearTick, totalSeconds]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  const value = {
    secondsLeft,
    totalSeconds,
    formatted: `${mm}:${ss}`,
    isRunning: !!endTimestamp,
    label,
    setLabel,
    subject,
    iniciar,
    pausar,
    reiniciar,
  };

  return <PomodoroContext.Provider value={value}>{children}</PomodoroContext.Provider>;
}

export function usePomodoro() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error("usePomodoro debe usarse dentro de <PomodoroProvider>");
  return ctx;
}