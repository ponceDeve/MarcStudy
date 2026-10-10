import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import manifest from "../data/manifest.json";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  embeberTextos,
  similitudCoseno
} from "../lib/semantico";
import EditarNombreModal from "./EditarNombreModal";

const CURSOS_ITEMS = manifest.cursos.map(c => ({
  type: "curso",
  nombre: c.nombre
}));

const TEMAS_ITEMS = manifest.cursos.flatMap(c => c.temas.map(t => ({
  type: "tema",
  curso: c.nombre,
  tema: t.tema,
  archivo: t.archivo
})));

const UMBRAL_SEMANTICO = 0.48;
const UMBRAL_RELATIVO_SEMANTICO = 0.82;
const UMBRAL_LEXICO_SEMANTICO = 0.22;
const DIFERENCIA_MINIMA_SEMANTICA = 0.06;

let embeddingsCursos = null;
let embeddingsTemas = null;
let promesaEmbeddingsTemas = null;
let promesaEmbeddingsCursos = null;

function normalizarTexto(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

const INGLES_EN_PAGINA_APARTE = false;

function esCursoIngles(nombre) {
  return INGLES_EN_PAGINA_APARTE && normalizarTexto(nombre) === "ingles";
}

function obtenerPalabras(texto) {
  return normalizarTexto(texto).match(/[a-z0-9]+/g) || [];
}

/*
 * Reduce terminaciones frecuentes sin asumir que todas las
 * palabras que comparten una raíz tienen el mismo significado.
 */
function obtenerVariantesPalabra(palabra) {
  const p = normalizarTexto(palabra);
  const variantes = new Set([p]);

  if (p.length <= 3) return variantes;

  const reglas = [
    { sufijo: "es", minimo: 5 },
    { sufijo: "s", minimo: 4 },
    { sufijo: "ces", minimo: 5, raiz: p.slice(0, -3) + "z" },
    { sufijo: "aciones", minimo: 9, raiz: p.slice(0, -7) },
    { sufijo: "iciones", minimo: 9, raiz: p.slice(0, -7) },
    { sufijo: "ación", minimo: 7, raiz: p.slice(0, -5) },
    { sufijo: "ición", minimo: 7, raiz: p.slice(0, -5) },
    { sufijo: "amientos", minimo: 10, raiz: p.slice(0, -8) },
    { sufijo: "imientos", minimo: 10, raiz: p.slice(0, -8) },
    { sufijo: "amiento", minimo: 9, raiz: p.slice(0, -7) },
    { sufijo: "imiento", minimo: 9, raiz: p.slice(0, -7) },
    { sufijo: "mente", minimo: 8 },
    { sufijo: "idades", minimo: 9, raiz: p.slice(0, -6) },
    { sufijo: "idad", minimo: 7, raiz: p.slice(0, -4) },
    { sufijo: "ando", minimo: 7, raiz: p.slice(0, -4) },
    { sufijo: "iendo", minimo: 7, raiz: p.slice(0, -5) },
    { sufijo: "ados", minimo: 7, raiz: p.slice(0, -4) },
    { sufijo: "idos", minimo: 7, raiz: p.slice(0, -4) },
    { sufijo: "adas", minimo: 7, raiz: p.slice(0, -4) },
    { sufijo: "idas", minimo: 7, raiz: p.slice(0, -4) }
  ];

  for (const regla of reglas) {
    if (
      p.endsWith(regla.sufijo) &&
      p.length >= regla.minimo
    ) {
      const raiz = regla.raiz ?? p.slice(0, -regla.sufijo.length);

      if (raiz.length >= 3) {
        variantes.add(raiz);

        if (regla.sufijo === "es" && raiz.length >= 4) {
          variantes.add(raiz + "e");
        }
      }
    }
  }

  return variantes;
}

function palabrasCoinciden(palabraConsulta, palabraTexto) {
  const a = normalizarTexto(palabraConsulta);
  const b = normalizarTexto(palabraTexto);

  if (!a || !b) return false;
  if (a === b) return true;

  const variantesA = obtenerVariantesPalabra(a);
  const variantesB = obtenerVariantesPalabra(b);

  for (const variante of variantesA) {
    if (variantesB.has(variante)) return true;
  }

  /*
   * Prefijos para reconocer variaciones de una misma palabra.
   * Se exige una raíz relativamente larga para reducir falsos positivos.
   */
  for (const raizA of variantesA) {
    for (const raizB of variantesB) {
      if (
        raizA.length >= 5 &&
        raizB.length >= 5 &&
        (
          raizA.startsWith(raizB) ||
          raizB.startsWith(raizA)
        )
      ) {
        return true;
      }
    }
  }

  return false;
}

function puntajeLexico(texto, consulta) {
  const palabrasConsulta = obtenerPalabras(consulta);
  const palabrasTexto = obtenerPalabras(texto);

  if (!palabrasConsulta.length || !palabrasTexto.length) {
    return 0;
  }

  let puntuacion = 0;

  for (const palabraConsulta of palabrasConsulta) {
    let mejor = 0;

    for (const palabraTexto of palabrasTexto) {
      if (palabraConsulta === palabraTexto) {
        mejor = 1;
        break;
      }

      if (palabrasCoinciden(palabraConsulta, palabraTexto)) {
        mejor = Math.max(mejor, 0.85);
      }
    }

    puntuacion += mejor;
  }

  return puntuacion / palabrasConsulta.length;
}

function coincidenciaLexica(texto, consulta) {
  return puntajeLexico(texto, consulta) >= 0.85;
}

function puntajeCoincidenciaNombre(nombre, consulta) {
  const texto = normalizarTexto(nombre);
  const q = normalizarTexto(consulta);

  if (!texto || !q) return 0;
  if (texto === q) return 4;

  if (texto.startsWith(q)) return 3.5;
  if (texto.includes(q)) return 3;

  const palabrasConsulta = obtenerPalabras(q);
  const palabrasTexto = obtenerPalabras(texto);

  if (!palabrasConsulta.length || !palabrasTexto.length) {
    return 0;
  }

  const puntuacion = puntajeLexico(texto, q);

  if (puntuacion === 1) {
    return 2.5;
  }

  if (puntuacion >= 0.85) {
    return 2;
  }

  /*
   * Las consultas de varias palabras deben coincidir en todas
   * sus palabras para considerarse coincidencias léxicas.
   */
  if (palabrasConsulta.length > 1 && puntuacion < 0.85) {
    return 0;
  }

  return 0;
}

function ResaltarCoincidencia({ texto, query }) {
  if (!query.trim()) return texto;

  const textoOriginal = String(texto ?? "");
  const busqueda = query.trim();
  const textoNormalizado = normalizarTexto(textoOriginal);
  const busquedaNormalizada = normalizarTexto(busqueda);

  if (!busquedaNormalizada) return textoOriginal;

  const indice = textoNormalizado.indexOf(busquedaNormalizada);

  if (indice !== -1) {
    return (
      <span>
        {textoOriginal.slice(0, indice)}
        <span className="search-match">
          {textoOriginal.slice(indice, indice + busqueda.length)}
        </span>
        {textoOriginal.slice(indice + busqueda.length)}
      </span>
    );
  }

  const palabrasConsulta = obtenerPalabras(busqueda);
  const partes = textoOriginal.split(/(\s+)/);

  return (
    <span>
      {partes.map((parte, index) => {
        const limpio = parte.replace(/[.,;:!?()[\]{}"']/g, "");
        const coincide = palabrasConsulta.some(
          p => palabrasCoinciden(p, limpio)
        );

        return coincide
          ? (
            <span
              className="search-match"
              key={index}
            >
              {parte}
            </span>
          )
          : parte;
      })}
    </span>
  );
}

function obtenerTextoSemantico(item) {
  if (item.type === "curso") {
    return `Curso: ${item.nombre}`;
  }

  return `Curso: ${item.curso}. Tema: ${item.tema}`;
}

async function prepararEmbeddingsTemas() {
  if (embeddingsTemas) return embeddingsTemas;

  if (promesaEmbeddingsTemas) {
    return promesaEmbeddingsTemas;
  }

  promesaEmbeddingsTemas = embeberTextos(
    TEMAS_ITEMS.map(obtenerTextoSemantico)
  )
    .then(resultado => {
      embeddingsTemas = resultado;
      return resultado;
    })
    .finally(() => {
      promesaEmbeddingsTemas = null;
    });

  return promesaEmbeddingsTemas;
}

async function prepararEmbeddingsCursos() {
  if (embeddingsCursos) return embeddingsCursos;

  if (promesaEmbeddingsCursos) {
    return promesaEmbeddingsCursos;
  }

  promesaEmbeddingsCursos = embeberTextos(
    CURSOS_ITEMS.map(obtenerTextoSemantico)
  )
    .then(resultado => {
      embeddingsCursos = resultado;
      return resultado;
    })
    .finally(() => {
      promesaEmbeddingsCursos = null;
    });

  return promesaEmbeddingsCursos;
}

function crearResultado(cursos = [], temas = [], coincidenciaLiteral = null, esLiteral = false) {
  return {
    cursos,
    temas,
    coincidenciasExactas: [...cursos, ...temas],
    coincidenciaLiteral,
    esLiteral
  };
}

/*
 * Reúne todas las coincidencias literales de cursos y temas.
 * No se detiene al encontrar una coincidencia exacta o parcial.
 * Los resultados se ordenan por precisión y se eliminan duplicados.
 */
function obtenerCoincidenciasLiterales(consulta) {
  const q = normalizarTexto(consulta);

  if (!q) {
    return crearResultado();
  }

  const resultadosCursos = new Map();
  const resultadosTemas = new Map();

  function agregarCurso(curso, puntaje, prioridad) {
    const clave = normalizarTexto(curso.nombre);
    const actual = resultadosCursos.get(clave);

    if (
      !actual ||
      puntaje > actual.puntaje ||
      (puntaje === actual.puntaje && prioridad < actual.prioridad)
    ) {
      resultadosCursos.set(clave, {
        item: curso,
        puntaje,
        prioridad
      });
    }
  }

  function agregarTema(tema, puntaje, prioridad) {
    const clave = [
      normalizarTexto(tema.curso),
      normalizarTexto(tema.tema),
      tema.archivo || ""
    ].join("::");

    const actual = resultadosTemas.get(clave);

    if (
      !actual ||
      puntaje > actual.puntaje ||
      (puntaje === actual.puntaje && prioridad < actual.prioridad)
    ) {
      resultadosTemas.set(clave, {
        item: tema,
        puntaje,
        prioridad
      });
    }
  }

  /*
   * 1. Coincidencias exactas.
   */
  for (const curso of CURSOS_ITEMS) {
    if (normalizarTexto(curso.nombre) === q) {
      agregarCurso(curso, 4, 1);
    }
  }

  for (const tema of TEMAS_ITEMS) {
    if (normalizarTexto(tema.tema) === q) {
      agregarTema(tema, 4, 1);
    }
  }

  /*
   * 2. Coincidencias parciales de nombres.
   * Se incluyen todas las que alcancen el umbral, no solo las
   * que estén cerca de la puntuación de la primera coincidencia.
   */
  for (const curso of CURSOS_ITEMS) {
    const puntaje = puntajeCoincidenciaNombre(curso.nombre, q);

    if (puntaje >= 3) {
      agregarCurso(curso, puntaje, 2);
    }
  }

  for (const tema of TEMAS_ITEMS) {
    const puntaje = puntajeCoincidenciaNombre(tema.tema, q);

    if (puntaje >= 3) {
      agregarTema(tema, puntaje, 2);
    }
  }

  /*
   * 3. Coincidencias léxicas, incluidas variaciones de palabras
   * como singular/plural. Se conservan todas las que cumplen
   * el umbral, sin recortar la lista por diferencia de puntaje.
   */
  for (const curso of CURSOS_ITEMS) {
    const puntaje = puntajeLexico(curso.nombre, q);

    if (puntaje >= 0.85) {
      agregarCurso(curso, puntaje, 3);
    }
  }

  for (const tema of TEMAS_ITEMS) {
    const puntaje = puntajeLexico(tema.tema, q);

    if (puntaje >= 0.85) {
      agregarTema(tema, puntaje, 3);
    }
  }

  const cursos = [...resultadosCursos.values()]
    .sort((a, b) =>
      a.prioridad - b.prioridad ||
      b.puntaje - a.puntaje ||
      a.item.nombre.localeCompare(b.item.nombre)
    )
    .map(resultado => resultado.item);

  const temas = [...resultadosTemas.values()]
    .sort((a, b) =>
      a.prioridad - b.prioridad ||
      b.puntaje - a.puntaje ||
      a.item.tema.localeCompare(b.item.tema)
    )
    .map(resultado => resultado.item);

  const coincidencias = [...cursos, ...temas];

  return crearResultado(
    cursos,
    temas,
    coincidencias.length === 1 ? coincidencias[0] : null,
    coincidencias.length > 0
  );
}

async function buscarFuertes(query) {
  const consulta = query.trim();

  if (!consulta) {
    return crearResultado();
  }

  const literal = obtenerCoincidenciasLiterales(consulta);

  if (
    literal.cursos.length > 0 ||
    literal.temas.length > 0
  ) {
    return literal;
  }

  try {
    await prepararEmbeddingsTemas();

    const [embeddingConsulta] = await embeberTextos([consulta]);

    if (!embeddingConsulta || !embeddingsTemas?.length) {
      return crearResultado();
    }

    const temasSemanticos = TEMAS_ITEMS
      .map((item, index) => {
        const semanticScore = similitudCoseno(
          embeddingConsulta,
          embeddingsTemas[index]
        );

        const lexicalScore = puntajeLexico(
          item.tema,
          consulta
        );

        return {
          ...item,
          _semanticScore: semanticScore,
          _lexicalScore: lexicalScore,
          _scoreFinal:
            semanticScore +
            lexicalScore * UMBRAL_LEXICO_SEMANTICO
        };
      })
      .sort((a, b) => b._scoreFinal - a._scoreFinal);

    const mejorTema = temasSemanticos[0];
    const segundoTema = temasSemanticos[1];

    if (mejorTema) {
      const mejorPuntaje = mejorTema._scoreFinal;
      const segundoPuntaje = segundoTema?._scoreFinal || 0;
      const diferencia = mejorPuntaje - segundoPuntaje;

      const temaValido =
        mejorTema._semanticScore >= UMBRAL_SEMANTICO &&
        mejorPuntaje >= UMBRAL_SEMANTICO &&
        mejorPuntaje >= segundoPuntaje * UMBRAL_RELATIVO_SEMANTICO &&
        diferencia >= DIFERENCIA_MINIMA_SEMANTICA;

      if (temaValido) {
        const temasRelevantes = temasSemanticos.filter(
          tema =>
            tema._semanticScore >= UMBRAL_SEMANTICO &&
            tema._scoreFinal >= mejorPuntaje * UMBRAL_RELATIVO_SEMANTICO
        );

        if (temasRelevantes.length > 0) {
          return crearResultado(
            [],
            temasRelevantes,
            null,
            false
          );
        }
      }
    }

    await prepararEmbeddingsCursos();

    if (!embeddingsCursos?.length) {
      return crearResultado();
    }

    const cursosSemanticos = CURSOS_ITEMS
      .map((item, index) => ({
        ...item,
        _semanticScore: similitudCoseno(
          embeddingConsulta,
          embeddingsCursos[index]
        )
      }))
      .sort((a, b) => b._semanticScore - a._semanticScore);

    const mejorCurso = cursosSemanticos[0];
    const segundoCurso = cursosSemanticos[1];

    if (mejorCurso) {
      const diferenciaCurso =
        mejorCurso._semanticScore -
        (segundoCurso?._semanticScore || 0);

      const cursoValido =
        mejorCurso._semanticScore >= UMBRAL_SEMANTICO &&
        diferenciaCurso >= DIFERENCIA_MINIMA_SEMANTICA;

      if (cursoValido) {
        return crearResultado([mejorCurso], [], null, false);
      }
    }
  } catch (error) {
    console.error("Error en búsqueda semántica:", error);
  }

  return crearResultado();
}

function agruparResultados({ cursos, temas }) {
  const grupos = [];
  const temasPorCurso = new Map();

  for (const tema of temas) {
    if (!temasPorCurso.has(tema.curso)) {
      temasPorCurso.set(tema.curso, []);
    }

    temasPorCurso.get(tema.curso).push({
      type: "tema",
      curso: tema.curso,
      tema: tema.tema,
      archivo: tema.archivo
    });
  }

  /*
   * Si hay coincidencias de cursos y temas a la vez, muestra
   * los cursos encontrados junto con los temas coincidentes.
   * Si solo coincide un curso, conserva su lista completa de temas.
   */
  if (cursos.length > 0) {
    for (const curso of cursos) {
      const cursoManifest = manifest.cursos.find(
        c => c.nombre === curso.nombre
      );

      const temasCoincidentes = temasPorCurso.get(curso.nombre) || [];

      grupos.push({
        curso: curso.nombre,
        temas: temas.length > 0
          ? temasCoincidentes
          : (cursoManifest?.temas?.map(tema => ({
            type: "tema",
            curso: curso.nombre,
            tema: tema.tema,
            archivo: tema.archivo
          })) || [])
      });
    }

    for (const [curso, temasDelCurso] of temasPorCurso) {
      if (cursos.some(item => item.nombre === curso)) continue;

      grupos.push({
        curso,
        temas: temasDelCurso
      });
    }

    return grupos;
  }

  for (const [curso, temasDelCurso] of temasPorCurso) {
    grupos.push({
      curso,
      temas: temasDelCurso
    });
  }

  return grupos;
}

function construirItemsNavegables(grupos) {
  const items = [];

  for (const grupo of grupos) {
    items.push({
      type: "curso",
      nombre: grupo.curso
    });

    for (const tema of grupo.temas) {
      items.push({
        type: "tema",
        curso: tema.curso,
        tema: tema.tema,
        archivo: tema.archivo
      });
    }
  }

  return items;
}

export default function SearchModal({
  open,
  onClose,
  onSelect
}) {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [queryConfirmada, setQueryConfirmada] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [editarNombreAbierto, setEditarNombreAbierto] = useState(false);

  const [nombreUsuario, setNombreUsuario] = useLocalStorage(
    "miEstudio_nombreUsuario",
    null
  );

  const [fotoUsuario, setFotoUsuario] = useLocalStorage(
    "miEstudio_fotoUsuario",
    null
  );

  const [focusedIdx, setFocusedIdx] = useState(-1);
  const [cursoSeleccionado, setCursoSeleccionado] = useState(null);

  const [fuertes, setFuertes] = useState({
    cursos: [],
    temas: [],
    coincidenciasExactas: [],
    coincidenciaLiteral: null,
    esLiteral: false
  });

  const [buscandoSemantica, setBuscandoSemantica] = useState(false);
  const inputRef = useRef(null);

  const hayQuery = queryConfirmada.trim() !== "";

  const gruposIniciales = useMemo(
    () => manifest.cursos.map(curso => ({
      curso: curso.nombre,
      temas: curso.temas.map(tema => ({
        type: "tema",
        curso: curso.nombre,
        tema: tema.tema,
        archivo: tema.archivo
      }))
    })),
    []
  );

  const grupoCursoSeleccionado = useMemo(() => {
    if (!cursoSeleccionado) return null;

    return gruposIniciales.find(
      grupo => grupo.curso === cursoSeleccionado
    ) || null;
  }, [
    cursoSeleccionado,
    gruposIniciales
  ]);

  const cursoBusquedaSeleccionado =
    hayQuery &&
    fuertes.esLiteral &&
    fuertes.coincidenciaLiteral?.type === "curso" &&
    cursoSeleccionado === fuertes.coincidenciaLiteral.nombre;

  const mostrarCursoSeleccionado =
    !!cursoSeleccionado &&
    !!grupoCursoSeleccionado &&
    (
      !hayQuery ||
      cursoBusquedaSeleccionado
    );

  useEffect(() => {
    if (!open) return;

    prepararEmbeddingsTemas().catch(error => {
      console.error("Error preparando búsqueda semántica:", error);
    });
  }, [open]);

  useEffect(() => {
    let cancelado = false;

    if (!hayQuery) {
      setFuertes(crearResultado());
      setBuscandoSemantica(false);
      return;
    }

    const literal = obtenerCoincidenciasLiterales(queryConfirmada);

    if (literal.cursos.length > 0 || literal.temas.length > 0) {
      setFuertes(literal);
      setBuscandoSemantica(false);
      return;
    }

    setBuscandoSemantica(true);

    buscarFuertes(queryConfirmada)
      .then(resultado => {
        if (cancelado) return;
        setFuertes(resultado);
      })
      .catch(error => {
        if (cancelado) return;

        console.error("Error buscando:", error);
        setFuertes(crearResultado());
      })
      .finally(() => {
        if (!cancelado) {
          setBuscandoSemantica(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [queryConfirmada, hayQuery]);

  const grupos = useMemo(
    () => agruparResultados(fuertes),
    [fuertes]
  );

  const gruposVisibles = useMemo(() => {
    if (mostrarCursoSeleccionado) {
      return [grupoCursoSeleccionado];
    }

    if (hayQuery) {
      return grupos;
    }

    if (cursoSeleccionado && grupoCursoSeleccionado) {
      return [grupoCursoSeleccionado];
    }

    return gruposIniciales.map(grupo => ({
      curso: grupo.curso,
      temas: []
    }));
  }, [
    mostrarCursoSeleccionado,
    grupoCursoSeleccionado,
    hayQuery,
    grupos,
    cursoSeleccionado,
    gruposIniciales
  ]);

  const mostrarListaInicial = open && !hayQuery;
  const mostrarResultados = open && hayQuery;

  const contenidoExpandido =
    mostrarListaInicial ||
    mostrarResultados;

  const itemsNavegables = useMemo(
    () => construirItemsNavegables(gruposVisibles),
    [gruposVisibles]
  );

  function obtenerIndiceElemento(item) {
    return itemsNavegables.findIndex(elemento => {
      if (elemento.type !== item.type) {
        return false;
      }

      if (elemento.type === "curso") {
        return elemento.nombre === item.nombre;
      }

      return (
        elemento.curso === item.curso &&
        elemento.tema === item.tema &&
        elemento.archivo === item.archivo
      );
    });
  }

  function abrirCurso(nombre) {
    setCursoSeleccionado(nombre);
    setFocusedIdx(-1);
  }

  function volverCursos() {
    setCursoSeleccionado(null);
    setFocusedIdx(-1);
  }

  function ejecutarBusqueda(item) {
    if (!item) return;

    setQuery("");
    setQueryConfirmada("");
    setInputFocused(false);
    setFocusedIdx(-1);
    setCursoSeleccionado(null);

    const cursoDelItem =
      item.type === "curso"
        ? item.nombre
        : item.curso;

    if (esCursoIngles(cursoDelItem)) {
      onClose();
      navigate("/ingles");
      return;
    }

    onSelect(item);
    onClose();
  }

  function confirmarBusqueda() {
    const consulta = query.trim();

    if (!consulta) return;

    setCursoSeleccionado(null);
    setQueryConfirmada(consulta);
    setFocusedIdx(-1);
  }

  function ejecutarBusquedaActual() {
    const consulta = query.trim();

    if (!consulta) return;

    setCursoSeleccionado(null);
    setQueryConfirmada(consulta);
    setFocusedIdx(-1);
  }

  function limpiarBusqueda() {
    setQuery("");
    setQueryConfirmada("");
    setCursoSeleccionado(null);
    setFocusedIdx(-1);
  }

  function moverSeleccion(direccion) {
    if (!open) return;

    const total = itemsNavegables.length;

    if (!total) {
      setFocusedIdx(-1);
      return;
    }

    setFocusedIdx(actual => {
      if (actual === -1) {
        return direccion > 0 ? 0 : total - 1;
      }

      const siguiente = actual + direccion;

      if (siguiente < 0) return 0;
      if (siguiente >= total) return total - 1;

      return siguiente;
    });
  }

  function seleccionarElementoActual() {
    if (
      focusedIdx < 0 ||
      focusedIdx >= itemsNavegables.length
    ) {
      return;
    }

    const item = itemsNavegables[focusedIdx];

    if (
      item.type === "curso" &&
      !hayQuery &&
      cursoSeleccionado !== item.nombre
    ) {
      abrirCurso(item.nombre);
      return;
    }

    ejecutarBusqueda(item);
  }

  useEffect(() => {
    if (focusedIdx < 0) return;

    const elemento = document.querySelector(
      `[data-search-index="${focusedIdx}"]`
    );

    if (!elemento) return;

    elemento.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }, [focusedIdx, itemsNavegables]);

  useEffect(() => {
    setFocusedIdx(-1);
  }, [
    queryConfirmada,
    hayQuery,
    fuertes,
    cursoSeleccionado
  ]);

  useEffect(() => {
    if (!open) return;

    setQuery("");
    setQueryConfirmada("");
    setCursoSeleccionado(null);
    setInputFocused(true);
    setFocusedIdx(-1);

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e) {
      if (document.activeElement === inputRef.current) {
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        moverSeleccion(1);
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        moverSeleccion(-1);
        return;
      }

      if (e.key === "Enter") {
        if (
          focusedIdx >= 0 &&
          focusedIdx < itemsNavegables.length
        ) {
          e.preventDefault();
          e.stopPropagation();
          seleccionarElementoActual();
          return;
        }

        if (query.trim()) {
          e.preventDefault();
          e.stopPropagation();
          ejecutarBusquedaActual();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [
    open,
    onClose,
    focusedIdx,
    itemsNavegables,
    query
  ]);

  const inputTieneLista =
    mostrarListaInicial ||
    (
      mostrarResultados &&
      (
        grupos.length > 0 ||
        cursoBusquedaSeleccionado
      )
    );

  function renderGrupo(
    g,
    grupoIndex,
    esBusqueda = false,
    mostrarTemas = false
  ) {
    const cursoIndex = obtenerIndiceElemento({
      type: "curso",
      nombre: g.curso
    });

    const esCursoAbierto = cursoSeleccionado === g.curso;

    const esCursoDeBusqueda =
      esBusqueda &&
      fuertes.cursos.some(
        curso => curso.nombre === g.curso
      );

    const puedeAbrirCurso = !esBusqueda || esCursoDeBusqueda;

    return (
      <div
        key={`${esBusqueda ? "grupo" : "grupo-inicial"}-${g.curso}-${grupoIndex}`}
        className="search-group"
      >
        <div className="search-course-row">
          <button
            type="button"
            data-search-index={cursoIndex}
            className={`search-result-item is-curso${cursoIndex === focusedIdx ? " is-focused" : ""
              }${esCursoAbierto ? " is-open" : ""
              }`}
            onClick={() => {
              if (mostrarTemas) {
                ejecutarBusqueda({
                  type: "curso",
                  nombre: g.curso
                });
                return;
              }

              if (puedeAbrirCurso) {
                abrirCurso(g.curso);
              }
            }}
          >
            {esCursoAbierto && (
              <i className="fa-solid fa-arrow-left search-course-arrow" />
            )}

            <span className="curso-title">
              {g.curso}
            </span>
          </button>
        </div>

        {mostrarTemas && (
          <div className="search-group__temas is-open">
            {g.temas.map((t, temaIndex) => {
              const index = obtenerIndiceElemento(t);

              return (
                <button
                  type="button"
                  key={`tema-${esBusqueda ? "" : "inicial-"}${t.curso}-${t.tema}-${t.archivo || ""}-${grupoIndex}-${temaIndex}`}
                  data-search-index={index}
                  onClick={() => ejecutarBusqueda(t)}
                  className={`search-result-item is-tema${index === focusedIdx ? " is-focused" : ""
                    }`}
                >
                  <p className="search-result-item__tema">
                    {!esBusqueda && (
                      <span className="search-topic-number">
                        {temaIndex + 1}){" "}
                      </span>
                    )}

                    {esBusqueda ? (
                      <ResaltarCoincidencia
                        texto={t.tema}
                        query={queryConfirmada}
                      />
                    ) : (
                      t.tema
                    )}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`search-overlay${open ? "" : " is-closed"}`}
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      aria-hidden={!open}
    >
      <div
        className={`search-box${contenidoExpandido ? " is-expanded" : ""}`}
      >
        <div
          className={`search-input-row${inputTieneLista ? " has-query" : ""}`}
        >
          <button
            type="button"
            className="search-input-lupa-izq"
            aria-label="Buscar"
            onMouseDown={e => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={confirmarBusqueda}
          >
            <i className="fa-solid fa-magnifying-glass" />
          </button>

          <input
            autoComplete="off"
            type="search"
            name="buscar-curso-tema"
            ref={inputRef}
            value={query}
            onFocus={() => setInputFocused(true)}
            onBlur={() => {
              setTimeout(() => {
                setInputFocused(false);
              }, 100);
            }}
            onChange={e => {
              setQuery(e.target.value);
              setFocusedIdx(-1);
            }}
            onKeyDown={e => {
              if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();
                onClose();
                return;
              }

              if (e.key === "ArrowDown") {
                e.preventDefault();
                e.stopPropagation();
                moverSeleccion(1);
                return;
              }

              if (e.key === "ArrowUp") {
                e.preventDefault();
                e.stopPropagation();
                moverSeleccion(-1);
                return;
              }

              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();

                if (
                  focusedIdx >= 0 &&
                  focusedIdx < itemsNavegables.length
                ) {
                  seleccionarElementoActual();
                  return;
                }

                if (query.trim()) {
                  ejecutarBusquedaActual();
                }
              }
            }}
            placeholder="Buscar curso o tema..."
            className="search-input"
          />

          {query.trim() !== "" && (
            <button
              type="button"
              className="search-input-clear"
              aria-label="Limpiar búsqueda"
              onMouseDown={e => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={limpiarBusqueda}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          )}
        </div>

        {mostrarListaInicial &&
          !cursoSeleccionado && (
            <div className="search-results">
              {gruposIniciales.map(
                (g, grupoIndex) =>
                  renderGrupo(g, grupoIndex, false, false)
              )}
            </div>
          )}

        {mostrarListaInicial &&
          cursoSeleccionado &&
          grupoCursoSeleccionado && (
            <div className="search-results">
              {renderGrupo(grupoCursoSeleccionado, 0, false, true)}
            </div>
          )}

        {mostrarResultados &&
          cursoBusquedaSeleccionado &&
          grupoCursoSeleccionado && (
            <div className="search-results">
              {renderGrupo(grupoCursoSeleccionado, 0, false, true)}
            </div>
          )}

        {mostrarResultados &&
          !cursoBusquedaSeleccionado &&
          grupos.length > 0 && (
            <div className="search-results">
              {grupos.map(
                (g, grupoIndex) =>
                  renderGrupo(g, grupoIndex, true, true)
              )}
            </div>
          )}

        {mostrarResultados &&
          !cursoBusquedaSeleccionado &&
          grupos.length === 0 &&
          !buscandoSemantica && (
            <div className="search-results">
              <div className="search-group">
                <div className="search-result-item search-no-results">
                  <p className="search-result-item__tema">
                    Sin resultados para "{queryConfirmada}"
                  </p>
                </div>
              </div>
            </div>
          )}

        {mostrarResultados &&
          !cursoBusquedaSeleccionado &&
          buscandoSemantica &&
          grupos.length === 0 && (
            <div className="search-results">
              <div className="search-group">
                <div className="search-result-item search-no-results search-loading">
                  <p className="search-result-item__tema">
                    Buscando...
                  </p>
                </div>
              </div>
            </div>
          )}
      </div>

      <EditarNombreModal
        open={editarNombreAbierto}
        nombreActual={nombreUsuario}
        fotoActual={fotoUsuario}
        onGuardar={(n, f) => {
          setNombreUsuario(n);
          setFotoUsuario(f);
          setEditarNombreAbierto(false);
        }}
        onCancelar={() => {
          setEditarNombreAbierto(false);
        }}
      />
    </div>
  );
}