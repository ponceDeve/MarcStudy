import { useMemo, useState } from "react";
import manifest from "../data/manifest.json";
import { buscarConPuntaje } from "../lib/buscador";

const CURSOS_ITEMS = manifest.cursos.map((c) => ({
  type: "curso",
  nombre: c.nombre,
}));

const TEMAS_ITEMS = manifest.cursos.flatMap((c) =>
  c.temas.map((t) => ({
    type: "tema",
    curso: c.nombre,
    tema: t.tema,
    archivo: t.archivo,
  }))
);

function buscarFuertes(query) {
  const cursos = buscarConPuntaje(
    CURSOS_ITEMS,
    query,
    (c) => c.nombre,
    { minScore: 400 }
  );

  const temas = buscarConPuntaje(
    TEMAS_ITEMS,
    query,
    (t) => t.tema,
    { minScore: 400 }
  );

  return { cursos, temas };
}

function agruparResultados({ cursos, temas }) {
  const nombresCursosFuertes = new Set(
    cursos.map((c) => c.nombre)
  );

  const grupos = cursos.map((c) => ({
    curso: c.nombre,
    temas: manifest.cursos
      .find((x) => x.nombre === c.nombre)
      .temas.map((t) => ({
        type: "tema",
        curso: c.nombre,
        tema: t.tema,
        archivo: t.archivo,
      })),
  }));

  const temasPorCurso = new Map();

  for (const t of temas) {
    if (nombresCursosFuertes.has(t.curso)) continue;

    if (!temasPorCurso.has(t.curso)) {
      temasPorCurso.set(t.curso, []);
    }

    temasPorCurso.get(t.curso).push(t);
  }

  for (const [curso, temasDelCurso] of temasPorCurso) {
    grupos.push({
      curso,
      temas: temasDelCurso,
    });
  }

  return grupos;
}

export function useSearch() {
  const [query, setQuery] = useState("");

  const hayQuery = query.trim() !== "";

  const fuertes = useMemo(() => {
    if (!hayQuery) {
      return {
        cursos: [],
        temas: [],
      };
    }

    return buscarFuertes(query);
  }, [query, hayQuery]);

  const grupos = useMemo(
    () => agruparResultados(fuertes),
    [fuertes]
  );

  const itemsPlanos = useMemo(
    () =>
      grupos.flatMap((g) => [
        {
          type: "curso",
          nombre: g.curso,
        },
        ...g.temas,
      ]),
    [grupos]
  );

  return {
    query,
    setQuery,
    hayQuery,
    fuertes,
    grupos,
    itemsPlanos,
  };
}