import { useState } from "react";
import NuevosTemasAviso from "./NuevosTemasAviso";
import RepasoPendienteAviso from "./RepasoPendienteAviso";

// Muestra, en orden, los avisos de Inicio:
// 1. Cursos nuevos agregados desde la última visita.
// 2. Repasos pendientes para hoy (solo aparece cuando el primero termina).
export default function AvisosInicio() {
  const [mostrarRepaso, setMostrarRepaso] = useState(false);

  return (
    <>
      <NuevosTemasAviso onDone={() => setMostrarRepaso(true)} />
      {mostrarRepaso && <RepasoPendienteAviso />}
    </>
  );
}
