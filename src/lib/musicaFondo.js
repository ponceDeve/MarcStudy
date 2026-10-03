import { useSyncExternalStore } from "react";

// Música de fondo global: vive fuera de React, así que sigue sonando
// al cambiar de página (Pomodoro, Repaso, etc.) sin reiniciarse.
let audio = null;
let encendida = false;
const oyentes = new Set();

function obtenerAudio() {
  if (!audio) {
    audio = new Audio(`${import.meta.env.BASE_URL}sonidos/Steady_North.opus`);
    audio.loop = true;
    audio.volume = 0.35;
  }
  return audio;
}

function avisar() {
  oyentes.forEach((fn) => fn());
}

export function alternarMusica() {
  const a = obtenerAudio();
  encendida = !encendida;
  if (encendida) {
    const r = a.play();
    if (r && typeof r.catch === "function") {
      r.catch(() => {
        encendida = false;
        avisar();
      });
    }
  } else {
    a.pause();
  }
  avisar();
}

function suscribir(fn) {
  oyentes.add(fn);
  return () => oyentes.delete(fn);
}

export function useMusicaFondo() {
  const musicaOn = useSyncExternalStore(suscribir, () => encendida);
  return { musicaOn, alternarMusica };
}