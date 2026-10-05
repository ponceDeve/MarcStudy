import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  guardarPomodoroCompartido,
  leerPomodoroCompartido,
  limpiarPomodoroCompartido,
} from "../lib/pomodoroShared";

import { avanzarProgresoPomodoro } from "../lib/horarioProgress";

const PomodoroContext = createContext(null);

const UMBRAL_ABANDONO_MS = 2 * 60 * 60 * 1000;

// Fecha local actual.
// Se usa la fecha real y no el nombre del día de la semana,
// porque "lunes" vuelve a aparecer cada semana.
function fechaHoy() {
  const ahora = new Date();

  return `${ahora.getFullYear()}-${String(
    ahora.getMonth() + 1
  ).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")}`;
}

export function PomodoroProvider({ children }) {
  const [endTimestamp, setEndTimestamp] = useState(null);

  const [totalSeconds, setTotalSeconds] = useState(25 * 60);

  const [secondsLeft, setSecondsLeft] = useState(25 * 60);

  const [label, setLabel] = useState("");

  const [subject, setSubject] = useState("");

  const [day, setDay] = useState("");

  const [fecha, setFecha] = useState("");

  const intervalRef = useRef(null);

  const subjectRef = useRef("");

  const dayRef = useRef("");

  const fechaRef = useRef("");

  useEffect(() => {
    subjectRef.current = subject;
  }, [subject]);

  useEffect(() => {
    dayRef.current = day;
  }, [day]);

  useEffect(() => {
    fechaRef.current = fecha;
  }, [fecha]);

  const onCompleteRef = useRef(null);

  const registrarOnComplete = useCallback((fn) => {
    onCompleteRef.current = fn;
  }, []);

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(
    (endTs) => {
      // Si cambió el día mientras el Pomodoro estaba corriendo,
      // el Pomodoro anterior deja de ser válido y se reinicia.
      if (fechaRef.current && fechaRef.current !== fechaHoy()) {
        clearTick();

        setEndTimestamp(null);
        setTotalSeconds(25 * 60);
        setSecondsLeft(25 * 60);
        setLabel("");
        setSubject("");
        setDay("");
        setFecha("");

        limpiarPomodoroCompartido();

        return;
      }

      const remaining = Math.round(
        (endTs - Date.now()) / 1000
      );

      if (remaining <= 0) {
        clearTick();

        setSecondsLeft(0);

        setEndTimestamp(null);

        setFecha("");

        limpiarPomodoroCompartido();

        const resultado = subjectRef.current
          ? avanzarProgresoPomodoro({
              day: dayRef.current,
              subject: subjectRef.current,
            })
          : null;

        if (onCompleteRef.current) {
          onCompleteRef.current({
            day: dayRef.current,
            subject: subjectRef.current,
            completado: !!resultado?.completado,
          });
        }
      } else {
        setSecondsLeft(remaining);
      }
    },
    [clearTick]
  );

  useEffect(() => {
    const guardado = leerPomodoroCompartido();

    if (!guardado || !guardado.running) return;

    // leerPomodoroCompartido() ya elimina automáticamente un Pomodoro
    // perteneciente a otro día.
    if (guardado.fecha !== fechaHoy()) {
      limpiarPomodoroCompartido();
      return;
    }

    const restanteMs =
      guardado.endTimestamp - Date.now();

    if (restanteMs <= 0) {
      limpiarPomodoroCompartido();
      return;
    }

    if (restanteMs > UMBRAL_ABANDONO_MS) {
      limpiarPomodoroCompartido();
      return;
    }

    setEndTimestamp(guardado.endTimestamp);

    setLabel(guardado.label || "");

    setSubject(guardado.subject || "");

    setDay(guardado.day || "");

    setFecha(guardado.fecha || "");

    setSecondsLeft(
      Math.round(restanteMs / 1000)
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    clearTick();

    if (endTimestamp) {
      intervalRef.current = setInterval(() => {
        tick(endTimestamp);
      }, 1000);
    }

    return clearTick;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endTimestamp]);

  useEffect(() => {
    function onVisible() {
      if (
        document.visibilityState === "visible" &&
        endTimestamp
      ) {
        tick(endTimestamp);
      }
    }

    document.addEventListener(
      "visibilitychange",
      onVisible
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        onVisible
      );
    };
  }, [endTimestamp, tick]);

  const iniciar = useCallback(
    (
      minutos,
      nuevaLabel,
      nuevoSubject,
      nuevoDay
    ) => {
      const seg =
        minutos != null
          ? minutos * 60
          : secondsLeft;

      const nuevoEnd =
        Date.now() + seg * 1000;

      const fechaActual = fechaHoy();

      // Solo actualizamos totalSeconds cuando se inicia una duración nueva
      // (minutos != null). Al reanudar desde pausa (minutos == null) hay
      // que conservar el total original; si no, la barra de progreso se
      // reinicia porque totalSeconds pasaba a valer lo mismo que lo
      // restante (progreso quedaba en 0%).

      if (minutos != null) {
        setTotalSeconds(seg);
      }

      setSecondsLeft(seg);

      const labelFinal =
        nuevaLabel !== undefined
          ? nuevaLabel
          : label;

      if (nuevaLabel !== undefined) {
        setLabel(nuevaLabel);
      }

      const subjectFinal =
        nuevoSubject !== undefined
          ? nuevoSubject
          : subject;

      if (nuevoSubject !== undefined) {
        setSubject(nuevoSubject);
      }

      const dayFinal =
        nuevoDay !== undefined
          ? nuevoDay
          : day;

      if (nuevoDay !== undefined) {
        setDay(nuevoDay);
      }

      setFecha(fechaActual);

      setEndTimestamp(nuevoEnd);

      guardarPomodoroCompartido({
        endTimestamp: nuevoEnd,
        running: true,
        label: labelFinal,
        subject: subjectFinal,
        day: dayFinal,
        fecha: fechaActual,
      });
    },
    [secondsLeft, label, subject, day]
  );

  const pausar = useCallback(() => {
    setEndTimestamp(null);

    setFecha("");

    limpiarPomodoroCompartido();
  }, []);

  const reiniciar = useCallback(
    (minutos, nuevaLabel) => {
      clearTick();

      const seg =
        (minutos ??
          Math.round(totalSeconds / 60)) *
        60;

      setEndTimestamp(null);

      setTotalSeconds(seg);

      setSecondsLeft(seg);

      setFecha("");

      if (nuevaLabel !== undefined) {
        setLabel(nuevaLabel);
      }

      limpiarPomodoroCompartido();
    },
    [clearTick, totalSeconds]
  );

  const mm = String(
    Math.floor(secondsLeft / 60)
  ).padStart(2, "0");

  const ss = String(
    secondsLeft % 60
  ).padStart(2, "0");

  const value = {
    secondsLeft,
    totalSeconds,
    formatted: `${mm}:${ss}`,
    isRunning: !!endTimestamp,
    label,
    setLabel,
    subject,
    day,
    iniciar,
    pausar,
    reiniciar,
    registrarOnComplete,
  };

  return (
    <PomodoroContext.Provider value={value}>
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const ctx = useContext(PomodoroContext);

  if (!ctx) {
    throw new Error(
      "usePomodoro debe usarse dentro de <PomodoroProvider>"
    );
  }

  return ctx;
}