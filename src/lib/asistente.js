import baseConocimiento from "../data/asistenteConocimiento.json";
import manifest from "../data/manifest.json";

import { puntajeDeTexto, normalizarTexto } from "./buscador";

import {
  embeberTextos,
  embeberTexto,
  similitudCoseno,
} from "./semantico";

const PUNTAJE_MINIMO = 150;
const UMBRAL_SIMILITUD = 0.38;
const PESO_SEMANTICO = 700;

const UMBRAL_FUZZY_CURSO = 0.64;
const UMBRAL_FUZZY_TEMA = 0.64;
const UMBRAL_FUZZY_TOKEN = 0.68;
const UMBRAL_SEMANTICO_ENTIDAD = 0.68;

const UMBRAL_SEMANTICO_RESPUESTA = 0.56;
const UMBRAL_COBERTURA_RESPUESTA = 0.30;

let cacheEmbeddings = null;
let cacheEmbeddingsCursos = null;
let cacheEmbeddingsTemas = null;

function textoParaEmbeder(entrada) {
  return [
    entrada.categoria,
    entrada.pregunta,
    ...(entrada.variantes || []),
    ...(entrada.respuestas || []),
  ].join(". ");
}

function obtenerEmbeddingsBase() {
  if (!cacheEmbeddings) {
    cacheEmbeddings = embeberTextos(
      baseConocimiento.map(textoParaEmbeder)
    );
  }

  return cacheEmbeddings;
}

export function precargarConocimientoAsistente() {
  obtenerEmbeddingsBase().catch(() => {});
}

function quitarTildes(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizarConsulta(query) {
  return quitarTildes(String(query || ""))
    .toLowerCase()
    .replace(/[¿?¡!.,;:"'()[\]{}]/g, " ")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizarEstricto(texto) {
  return normalizarConsulta(texto);
}

function escapeRegExp(texto) {
  return String(texto).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function dividirPalabras(texto) {
  return normalizarEstricto(texto)
    .split(/\s+/)
    .map((palabra) => palabra.trim())
    .filter(Boolean);
}

function eliminarDuplicadosTokens(tokens) {
  const vistos = new Set();

  return tokens.filter((token) => {
    const normalizado = normalizarEstricto(token);

    if (!normalizado || vistos.has(normalizado)) {
      return false;
    }

    vistos.add(normalizado);
    return true;
  });
}

function distanciaLevenshtein(a, b) {
  const primero = String(a || "");
  const segundo = String(b || "");

  if (primero === segundo) return 0;
  if (!primero.length) return segundo.length;
  if (!segundo.length) return primero.length;

  let anterior = Array.from(
    { length: segundo.length + 1 },
    (_, i) => i
  );

  for (let i = 1; i <= primero.length; i++) {
    const actual = [i];

    for (let j = 1; j <= segundo.length; j++) {
      const costo =
        primero[i - 1] === segundo[j - 1] ? 0 : 1;

      actual[j] = Math.min(
        actual[j - 1] + 1,
        anterior[j] + 1,
        anterior[j - 1] + costo
      );
    }

    anterior = actual;
  }

  return anterior[segundo.length];
}

function similitudLevenshtein(a, b) {
  const primero = normalizarEstricto(a);
  const segundo = normalizarEstricto(b);

  if (!primero || !segundo) return 0;
  if (primero === segundo) return 1;

  const distancia = distanciaLevenshtein(
    primero,
    segundo
  );

  return Math.max(
    0,
    1 -
      distancia /
        Math.max(primero.length, segundo.length)
  );
}

function raizMorfologicaSimple(palabra) {
  const texto = normalizarEstricto(palabra);

  if (texto.length <= 4) return texto;

  if (texto.endsWith("es") && texto.length > 5) {
    return texto.slice(0, -2);
  }

  if (texto.endsWith("s") && texto.length > 4) {
    return texto.slice(0, -1);
  }

  return texto;
}

function similitudPalabras(a, b) {
  const palabraA = raizMorfologicaSimple(a);
  const palabraB = raizMorfologicaSimple(b);

  if (!palabraA || !palabraB) return 0;
  if (palabraA === palabraB) return 1;

  return similitudLevenshtein(
    palabraA,
    palabraB
  );
}

function mejorSimilitudTokens(tokensA, tokensB) {
  if (!tokensA.length || !tokensB.length) return 0;

  let suma = 0;

  for (const tokenA of tokensA) {
    let mejor = 0;

    for (const tokenB of tokensB) {
      mejor = Math.max(
        mejor,
        similitudPalabras(tokenA, tokenB)
      );
    }

    suma += mejor;
  }

  return suma / tokensA.length;
}

function similitudNombreAproximada(
  consulta,
  nombre
) {
  const query = normalizarEstricto(consulta);
  const objetivo = normalizarEstricto(nombre);

  if (!query || !objetivo) return 0;
  if (query === objetivo) return 1;

  const similitudCompleta =
    similitudLevenshtein(query, objetivo);

  const tokensQuery = eliminarDuplicadosTokens(
    dividirPalabras(query)
  );

  const tokensObjetivo = eliminarDuplicadosTokens(
    dividirPalabras(objetivo)
  );

  const similitudTokensQuery =
    mejorSimilitudTokens(
      tokensQuery,
      tokensObjetivo
    );

  const similitudTokensObjetivo =
    mejorSimilitudTokens(
      tokensObjetivo,
      tokensQuery
    );

  const cobertura =
    (similitudTokensQuery +
      similitudTokensObjetivo) /
    2;

  const tieneTodasLasPalabras =
    tokensObjetivo.length > 0 &&
    tokensObjetivo.every((objetivoToken) =>
      tokensQuery.some(
        (queryToken) =>
          similitudPalabras(
            queryToken,
            objetivoToken
          ) >= UMBRAL_FUZZY_TOKEN
      )
    );

  let puntuacion = Math.max(
    similitudCompleta,
    cobertura
  );

  if (tieneTodasLasPalabras) {
    puntuacion = Math.max(
      puntuacion,
      Math.min(0.98, cobertura + 0.12)
    );
  }

  return Math.min(1, puntuacion);
}

function contieneNombreExacto(
  consulta,
  nombre
) {
  const query = normalizarEstricto(consulta);
  const objetivo = normalizarEstricto(nombre);

  if (!query || !objetivo) return false;

  if (query === objetivo) return true;

  const palabras = objetivo
    .split(/\s+/)
    .filter(Boolean);

  if (!palabras.length) return false;

  if (palabras.length === 1) {
    const expresion = new RegExp(
      `\\b${escapeRegExp(palabras[0])}\\b`,
      "i"
    );

    return expresion.test(query);
  }

  const expresion = new RegExp(
    `(^|\\s)${palabras
      .map(escapeRegExp)
      .join("\\s+")}(?=\\s|$)`,
    "i"
  );

  return expresion.test(query);
}

function encontrarCoincidenciaFuzzyEnTexto(
  consulta,
  nombre,
  opciones = {}
) {
  const {
    umbral = UMBRAL_FUZZY_TEMA,
    permitirPalabrasExtra = true,
  } = opciones;

  const texto = normalizarEstricto(consulta);
  const objetivo = normalizarEstricto(nombre);

  if (!texto || !objetivo) return null;

  if (contieneNombreExacto(texto, objetivo)) {
    return {
      nombre,
      puntuacion: 1,
      metodo: "exacto",
    };
  }

  const palabrasObjetivo =
    dividirPalabras(objetivo);

  const palabrasTexto =
    dividirPalabras(texto);

  if (
    !palabrasObjetivo.length ||
    !palabrasTexto.length
  ) {
    return null;
  }

  let mejor = {
    nombre,
    puntuacion: 0,
    metodo: "fuzzy",
  };

  const cantidadObjetivo =
    palabrasObjetivo.length;

  if (permitirPalabrasExtra) {
    for (
      let inicio = 0;
      inicio < palabrasTexto.length;
      inicio++
    ) {
      for (
        let fin = inicio + 1;
        fin <= palabrasTexto.length;
        fin++
      ) {
        const fragmento = palabrasTexto
          .slice(inicio, fin)
          .join(" ");

        const puntuacion =
          similitudNombreAproximada(
            fragmento,
            objetivo
          );

        if (puntuacion > mejor.puntuacion) {
          mejor = {
            nombre,
            puntuacion,
            metodo: "fuzzy",
          };
        }
      }
    }
  } else if (
    palabrasTexto.length >= cantidadObjetivo
  ) {
    for (
      let inicio = 0;
      inicio <=
      palabrasTexto.length - cantidadObjetivo;
      inicio++
    ) {
      const fragmento = palabrasTexto
        .slice(
          inicio,
          inicio + cantidadObjetivo
        )
        .join(" ");

      const puntuacion =
        similitudNombreAproximada(
          fragmento,
          objetivo
        );

      if (puntuacion > mejor.puntuacion) {
        mejor = {
          nombre,
          puntuacion,
          metodo: "fuzzy",
        };
      }
    }
  }

  const puntuacionGlobal =
    similitudNombreAproximada(
      texto,
      objetivo
    );

  if (puntuacionGlobal > mejor.puntuacion) {
    mejor = {
      nombre,
      puntuacion: puntuacionGlobal,
      metodo: "fuzzy",
    };
  }

  return mejor.puntuacion >= umbral
    ? mejor
    : null;
}

function obtenerMejorCoincidenciaNombre(
  consulta,
  nombres,
  umbral
) {
  const candidatos = nombres
    .filter(Boolean)
    .map((nombre) => {
      const exacto =
        contieneNombreExacto(
          consulta,
          nombre
        );

      if (exacto) {
        return {
          nombre,
          puntuacion: 1,
          metodo: "exacto",
        };
      }

      return encontrarCoincidenciaFuzzyEnTexto(
        consulta,
        nombre,
        {
          umbral,
        }
      );
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (
        b.puntuacion !==
        a.puntuacion
      ) {
        return (
          b.puntuacion -
          a.puntuacion
        );
      }

      return (
        normalizarEstricto(b.nombre)
          .length -
        normalizarEstricto(a.nombre)
          .length
      );
    });

  const mejor = candidatos[0];

  if (!mejor || mejor.puntuacion < umbral) {
    return null;
  }

  const segundo = candidatos[1];

  if (
    segundo &&
    segundo.puntuacion >= umbral &&
    mejor.puntuacion -
      segundo.puntuacion <
      0.055
  ) {
    return null;
  }

  return mejor;
}

const SALUDOS = [
  "hola",
  "holaa",
  "holis",
  "buenas",
  "buenos dias",
  "buenas tardes",
  "buenas noches",
  "hey",
  "ey",
  "que tal",
  "como estas",
  "gracias",
  "muchas gracias",
  "ok",
  "okey",
  "listo",
  "genial",
  "perfecto",
];

const RESPUESTA_SALUDO = {
  id: "__saludo__",
  respuestas: [
    "¡Hola! Pregúntame cómo funciona cualquier parte de Mi Estudio.",
    "¡Hola! Cuéntame qué parte de la app quieres entender.",
  ],
  icono: "fa-solid fa-hand-peace",
};

function esSaludo(query) {
  const limpio = normalizarConsulta(query)
    .replace(/[¿?¡!.,;:]/g, "")
    .trim();

  return SALUDOS.includes(limpio);
}

const CURSOS_MANIFEST = Array.isArray(
  manifest?.cursos
)
  ? manifest.cursos
  : [];

const TODOS_LOS_TEMAS =
  CURSOS_MANIFEST.flatMap((curso) =>
    Array.isArray(curso?.temas)
      ? curso.temas
          .filter(
            (tema) =>
              tema &&
              typeof tema.tema ===
                "string" &&
              tema.tema.trim()
          )
          .map((tema) => ({
            ...tema,
            curso: curso.nombre,
          }))
      : []
  );

function obtenerPalabrasClavePregunta(texto) {
  const palabrasVacias = new Set([
    "a",
    "al",
    "como",
    "con",
    "cual",
    "cuales",
    "cuando",
    "cuanto",
    "de",
    "del",
    "donde",
    "el",
    "en",
    "es",
    "esta",
    "este",
    "explicame",
    "hacer",
    "hay",
    "necesito",
    "la",
    "las",
    "lo",
    "los",
    "me",
    "mi",
    "mira",
    "para",
    "por",
    "porque",
    "puedes",
    "podrias",
    "puede",
    "puedo",
    "que",
    "se",
    "son",
    "su",
    "te",
    "tengo",
    "tiene",
    "tienen",
    "dame",
    "dime",
    "un",
    "una",
    "quiero",
    "si",
    "ya",
    "y",
  ]);

  return eliminarDuplicadosTokens(
    dividirPalabras(texto).filter(
      (palabra) =>
        palabra.length >= 3 &&
        !palabrasVacias.has(palabra)
    )
  );
}

const GRUPOS_SINONIMOS_PREGUNTA = [
  ["abrir", "entrar", "acceder"],
  ["avanzar", "pasar", "seguir"],
  ["volver", "regresar", "retroceder"],
  ["borrar", "eliminar", "quitar"],
  ["salir", "abandonar", "cerrar"],
  [
    "fallar",
    "equivocar",
    "error",
    "incorrecta",
    "mal",
  ],
  ["guardar", "marcar", "agregar"],
  ["escuchar", "oir", "audio", "voz"],
  ["celular", "telefono", "movil"],
  [
    "computadora",
    "ordenador",
    "laptop",
    "pc",
  ],
  ["tablet", "tableta"],
  [
    "examen",
    "quiz",
    "practica",
    "ejercicio",
  ],
  ["tema", "leccion"],
  ["vida", "corazon"],
  [
    "bloqueado",
    "bloquear",
    "candado",
  ],
  [
    "cronometro",
    "temporizador",
    "timer",
  ],
  ["configuracion", "ajustes"],
  ["foto", "imagen", "avatar"],
  ["nombre", "usuario"],
  ["trofeo", "logro"],
  ["check", "marca", "casilla"],
  ["teoria", "contenido"],
  [
    "hace",
    "sirve",
    "utilidad",
    "beneficio",
  ],
  ["pomo", "pomodoro"],
];

const INDICE_SINONIMOS_PREGUNTA =
  new Map(
    GRUPOS_SINONIMOS_PREGUNTA.flatMap(
      (grupo) =>
        grupo.map((palabra) => [
          palabra,
          new Set(grupo),
        ])
    )
  );

function similitudPalabraPregunta(
  palabraA,
  palabraB
) {
  if (palabraA === palabraB) return 1;

  const equivalentes =
    INDICE_SINONIMOS_PREGUNTA.get(
      palabraA
    );

  if (equivalentes?.has(palabraB)) {
    return 0.92;
  }

  return similitudPalabras(
    palabraA,
    palabraB
  );
}

function puntajeCoberturaPregunta(
  palabrasClaveQuery,
  textoCandidato
) {
  const palabrasCandidato =
    obtenerPalabrasClavePregunta(
      textoCandidato
    );

  if (!palabrasCandidato.length) {
    return 0;
  }

  const cobertura =
    palabrasClaveQuery.reduce(
      (total, palabraQuery) => {
        const mejorCoincidencia =
          Math.max(
            ...palabrasCandidato.map(
              (palabraCandidato) =>
                similitudPalabraPregunta(
                  palabraQuery,
                  palabraCandidato
                )
            )
          );

        const coincidenciaValida =
          mejorCoincidencia >=
          UMBRAL_FUZZY_TOKEN
            ? mejorCoincidencia
            : 0;

        return (
          total +
          coincidenciaValida
        );
      },
      0
    ) /
    palabrasClaveQuery.length;

  return cobertura * 360;
}

function mejorPuntajeDeTexto(
  entrada,
  query
) {
  const candidatos = [
    entrada.pregunta,
    ...(entrada.variantes || []),
    ...(entrada.respuestas || []),
  ];

  const puntajeDirecto =
    candidatos.reduce(
      (mejor, candidato) =>
        Math.max(
          mejor,
          puntajeDeTexto(
            candidato,
            query
          )
        ),
      0
    );

  const palabrasClaveQuery =
    obtenerPalabrasClavePregunta(query);

  if (!palabrasClaveQuery.length) {
    return puntajeDirecto;
  }

  const puntajePorCobertura =
    candidatos.reduce(
      (mejor, candidato) =>
        Math.max(
          mejor,
          puntajeCoberturaPregunta(
            palabrasClaveQuery,
            candidato
          )
        ),
      0
    );

  return Math.max(
    puntajeDirecto,
    puntajePorCobertura
  );
}

function obtenerPalabras(query) {
  return eliminarDuplicadosTokens(
    dividirPalabras(query)
  );
}

function contieneAlgunaPalabra(
  tokens,
  palabras
) {
  return palabras.some((palabra) =>
    tokens.includes(palabra)
  );
}

function obtenerTotalTemas() {
  return CURSOS_MANIFEST.reduce(
    (total, curso) =>
      total +
      (Array.isArray(curso?.temas)
        ? curso.temas.length
        : 0),
    0
  );
}

function obtenerTotalCursos() {
  return CURSOS_MANIFEST.length;
}

const PALABRAS_FUNCIONALES_TEMA =
  new Set([
    "que",
    "cual",
    "cuales",
    "el",
    "la",
    "los",
    "las",
    "un",
    "una",
    "de",
    "del",
    "en",
    "para",
    "por",
    "mi",
    "su",
    "ese",
    "esa",
    "eso",
    "este",
    "esta",
    "otro",
    "otra",
    "y",
    "tiene",
    "tienen",
    "hay",
    "cuenta",
    "con",
    "incluye",
    "posee",
    "contiene",
    "existe",
    "existen",
    "tambien",
    "se",
    "encuentra",
    "tema",
    "temas",
    "curso",
    "cursos",
    "materia",
    "materias",
    "contenido",
    "donde",
    "dentro",
    "cuantos",
    "cuantas",
    "cuanto",
    "dime",
    "lista",
    "son",
  ]);

const PALABRAS_FUNCIONALES_CURSO =
  new Set([
    "cuantos",
    "cuantas",
    "cuanto",
    "que",
    "cuales",
    "temas",
    "tema",
    "contenido",
    "tiene",
    "tienen",
    "hay",
    "posee",
    "dime",
    "lista",
    "lo",
    "en",
    "de",
    "del",
    "curso",
    "cursos",
    "materia",
    "materias",
    "son",
    "y",
    "e",
    "los",
    "las",
    "el",
    "la",
    "un",
    "una",
  ]);

function limpiarConsultaParaTema(
  query,
  curso = null
) {
  let texto = normalizarConsulta(query);

  if (curso) {
    const nombreCurso =
      normalizarEstricto(
        curso.nombre
      );

    const palabrasCurso =
      nombreCurso
        .split(/\s+/)
        .filter(Boolean);

    if (palabrasCurso.length) {
      const palabrasTexto =
        texto.split(/\s+/);

      for (
        let i = 0;
        i <=
        palabrasTexto.length -
          palabrasCurso.length;
        i++
      ) {
        const fragmento =
          palabrasTexto
            .slice(
              i,
              i + palabrasCurso.length
            )
            .join(" ");

        if (
          similitudNombreAproximada(
            fragmento,
            nombreCurso
          ) >= 0.72
        ) {
          palabrasTexto.splice(
            i,
            palabrasCurso.length
          );

          break;
        }
      }

      texto = palabrasTexto.join(" ");
    }
  }

  texto = texto
    .split(/\s+/)
    .filter(
      (palabra) =>
        palabra &&
        !PALABRAS_FUNCIONALES_TEMA.has(
          normalizarEstricto(
            palabra
          )
        )
    )
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return texto;
}

function limpiarConsultaParaCurso(
  query
) {
  return normalizarConsulta(query)
    .split(/\s+/)
    .filter(
      (palabra) =>
        !PALABRAS_FUNCIONALES_CURSO.has(
          palabra
        )
    )
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function buscarCursosPorNombre(query) {
  const consulta =
    normalizarConsulta(query);

  if (!consulta) return [];

  const exactos =
    CURSOS_MANIFEST.filter((curso) =>
      contieneNombreExacto(
        consulta,
        curso.nombre
      )
    );

  if (exactos.length) {
    return exactos;
  }

  const nombres =
    CURSOS_MANIFEST
      .map((curso) => curso.nombre)
      .filter(Boolean);

  const mejor =
    obtenerMejorCoincidenciaNombre(
      consulta,
      nombres,
      UMBRAL_FUZZY_CURSO
    );

  if (!mejor) return [];

  const curso =
    CURSOS_MANIFEST.find(
      (item) =>
        normalizarEstricto(
          item.nombre
        ) ===
        normalizarEstricto(
          mejor.nombre
        )
    );

  return curso ? [curso] : [];
}

function buscarCursoPorNombre(query) {
  const cursos =
    buscarCursosPorNombre(query);

  if (cursos.length === 1) {
    return cursos[0];
  }

  if (cursos.length > 1) {
    const normalizado =
      normalizarEstricto(query);

    return (
      cursos.find(
        (curso) =>
          normalizarEstricto(
            curso.nombre
          ) === normalizado
      ) || null
    );
  }

  return null;
}

function encontrarCursoMencionado(query) {
  const consulta =
    normalizarConsulta(query);

  if (!consulta) return null;

  const nombres =
    CURSOS_MANIFEST
      .map((curso) => curso.nombre)
      .filter(Boolean);

  const mejor =
    obtenerMejorCoincidenciaNombre(
      consulta,
      nombres,
      UMBRAL_FUZZY_CURSO
    );

  if (!mejor) return null;

  return (
    CURSOS_MANIFEST.find(
      (curso) =>
        normalizarEstricto(
          curso.nombre
        ) ===
        normalizarEstricto(
          mejor.nombre
        )
    ) || null
  );
}

function buscarTemasGlobalesPorNombre(
  query
) {
  const consulta =
    normalizarConsulta(query);

  if (!consulta) return [];

  const exactos =
    TODOS_LOS_TEMAS.filter((tema) =>
      contieneNombreExacto(
        consulta,
        tema.tema
      )
    );

  if (exactos.length) {
    return exactos;
  }

  const candidatos =
    TODOS_LOS_TEMAS
      .map((tema) => {
        const coincidencia =
          encontrarCoincidenciaFuzzyEnTexto(
            consulta,
            tema.tema,
            {
              umbral:
                UMBRAL_FUZZY_TEMA,
            }
          );

        return coincidencia
          ? {
              tema,
              puntaje:
                coincidencia.puntuacion,
            }
          : null;
      })
      .filter(Boolean)
      .sort(
        (a, b) =>
          b.puntaje -
          a.puntaje
      );

  if (!candidatos.length) {
    return [];
  }

  const mejor = candidatos[0];
  const segundo = candidatos[1];

  if (
    segundo &&
    segundo.puntaje >=
      UMBRAL_FUZZY_TEMA &&
    mejor.puntaje -
      segundo.puntaje <
      0.055
  ) {
    return [];
  }

  return [mejor.tema];
}

function buscarTemaEnCurso(
  consulta,
  curso
) {
  if (
    !curso ||
    !Array.isArray(curso.temas)
  ) {
    return null;
  }

  const temas =
    curso.temas.filter(
      (tema) =>
        tema &&
        typeof tema.tema ===
          "string" &&
        tema.tema.trim()
    );

  const consultaNormalizada =
    normalizarEstricto(
      consulta
    );

  if (!consultaNormalizada) {
    return null;
  }

  const exactos =
    temas.filter(
      (tema) =>
        normalizarEstricto(
          tema.tema
        ) ===
        consultaNormalizada
    );

  if (exactos.length === 1) {
    return exactos[0];
  }

  const contenidos =
    temas.filter((tema) =>
      contieneNombreExacto(
        consulta,
        tema.tema
      )
    );

  if (contenidos.length === 1) {
    return contenidos[0];
  }

  if (contenidos.length > 1) {
    return (
      [...contenidos].sort(
        (a, b) =>
          normalizarEstricto(
            b.tema
          ).length -
          normalizarEstricto(
            a.tema
          ).length
      )[0] || null
    );
  }

  const candidatos =
    temas
      .map((tema) => {
        const coincidencia =
          encontrarCoincidenciaFuzzyEnTexto(
            consulta,
            tema.tema,
            {
              umbral:
                UMBRAL_FUZZY_TEMA,
            }
          );

        return coincidencia
          ? {
              tema,
              puntaje:
                coincidencia.puntuacion,
            }
          : null;
      })
      .filter(Boolean)
      .sort(
        (a, b) =>
          b.puntaje -
          a.puntaje
      );

  const mejor = candidatos[0];

  if (
    !mejor ||
    mejor.puntaje <
      UMBRAL_FUZZY_TEMA
  ) {
    return null;
  }

  const segundo = candidatos[1];

  if (
    segundo &&
    segundo.puntaje >=
      UMBRAL_FUZZY_TEMA &&
    mejor.puntaje -
      segundo.puntaje <
      0.055
  ) {
    return null;
  }

  return mejor.tema;
}

async function obtenerEmbeddingsCursos() {
  if (!cacheEmbeddingsCursos) {
    cacheEmbeddingsCursos =
      embeberTextos(
        CURSOS_MANIFEST.map(
          (curso) =>
            curso.nombre
        )
      );
  }

  return cacheEmbeddingsCursos;
}

async function obtenerEmbeddingsTemas() {
  if (!cacheEmbeddingsTemas) {
    cacheEmbeddingsTemas =
      embeberTextos(
        TODOS_LOS_TEMAS.map(
          (tema) =>
            tema.tema
        )
      );
  }

  return cacheEmbeddingsTemas;
}

async function buscarCursoPorNombreInteligente(
  query
) {
  const consulta =
    normalizarConsulta(query);

  if (!consulta) return null;

  const fuzzy =
    buscarCursoPorNombre(
      consulta
    );

  if (fuzzy) {
    return fuzzy;
  }

  try {
    const [
      embeddings,
      vectorQuery,
    ] = await Promise.all([
      obtenerEmbeddingsCursos(),
      embeberTexto(consulta),
    ]);

    if (
      !vectorQuery ||
      !embeddings?.length
    ) {
      return null;
    }

    const candidatos =
      embeddings
        .map(
          (vector, indice) => ({
            curso:
              CURSOS_MANIFEST[
                indice
              ],
            similitud: vector
              ? similitudCoseno(
                  vectorQuery,
                  vector
                )
              : 0,
          })
        )
        .filter(
          (item) =>
            item.curso &&
            item.similitud >=
              UMBRAL_SEMANTICO_ENTIDAD
        )
        .sort(
          (a, b) =>
            b.similitud -
            a.similitud
        );

    if (!candidatos.length) {
      return null;
    }

    const mejor =
      candidatos[0];

    const segundo =
      candidatos[1];

    if (
      segundo &&
      segundo.similitud >=
        UMBRAL_SEMANTICO_ENTIDAD &&
      mejor.similitud -
        segundo.similitud <
        0.035
    ) {
      return null;
    }

    return mejor.curso;
  } catch {
    return null;
  }
}

async function buscarTemaGlobalInteligente(
  query
) {
  const consulta =
    normalizarConsulta(query);

  if (!consulta) return null;

  const fuzzy =
    buscarTemasGlobalesPorNombre(
      consulta
    );

  if (fuzzy.length === 1) {
    return fuzzy[0];
  }

  try {
    const [
      embeddings,
      vectorQuery,
    ] = await Promise.all([
      obtenerEmbeddingsTemas(),
      embeberTexto(consulta),
    ]);

    if (
      !vectorQuery ||
      !embeddings?.length
    ) {
      return null;
    }

    const candidatos =
      embeddings
        .map(
          (vector, indice) => ({
            tema:
              TODOS_LOS_TEMAS[
                indice
              ],
            similitud: vector
              ? similitudCoseno(
                  vectorQuery,
                  vector
                )
              : 0,
          })
        )
        .filter(
          (item) =>
            item.tema &&
            item.similitud >=
              UMBRAL_SEMANTICO_ENTIDAD
        )
        .sort(
          (a, b) =>
            b.similitud -
            a.similitud
        );

    if (!candidatos.length) {
      return null;
    }

    const mejor =
      candidatos[0];

    const segundo =
      candidatos[1];

    if (
      segundo &&
      segundo.similitud >=
        UMBRAL_SEMANTICO_ENTIDAD &&
      mejor.similitud -
        segundo.similitud <
        0.035
    ) {
      return null;
    }

    return mejor.tema;
  } catch {
    return null;
  }
}

async function resolverTemaEnCursoInteligente(
  consulta,
  curso
) {
  const fuzzy =
    buscarTemaEnCurso(
      consulta,
      curso
    );

  if (fuzzy) {
    return fuzzy;
  }

  if (
    !curso ||
    !Array.isArray(curso.temas) ||
    !curso.temas.length
  ) {
    return null;
  }

  const temasCurso =
    curso.temas.filter(
      (tema) =>
        tema &&
        typeof tema.tema ===
          "string" &&
        tema.tema.trim()
    );

  if (!temasCurso.length) {
    return null;
  }

  try {
    const embeddings =
      await embeberTextos(
        temasCurso.map(
          (tema) =>
            tema.tema
        )
      );

    const vectorQuery =
      await embeberTexto(
        consulta
      );

    if (
      !vectorQuery ||
      !embeddings?.length
    ) {
      return null;
    }

    const candidatos =
      embeddings
        .map(
          (vector, indice) => ({
            tema:
              temasCurso[indice],
            similitud: vector
              ? similitudCoseno(
                  vectorQuery,
                  vector
                )
              : 0,
          })
        )
        .filter(
          (item) =>
            item.tema &&
            item.similitud >=
              UMBRAL_SEMANTICO_ENTIDAD
        )
        .sort(
          (a, b) =>
            b.similitud -
            a.similitud
        );

    if (!candidatos.length) {
      return null;
    }

    const mejor =
      candidatos[0];

    const segundo =
      candidatos[1];

    if (
      segundo &&
      segundo.similitud >=
        UMBRAL_SEMANTICO_ENTIDAD &&
      mejor.similitud -
        segundo.similitud <
        0.035
    ) {
      return null;
    }

    return mejor.tema;
  } catch {
    return null;
  }
}

function crearRespuestaDinamica({
  entradaBase = null,
  id,
  respuestas,
  contexto = null,
}) {
  return {
    ...(entradaBase || {}),
    id,
    respuestas,
    ...(contexto
      ? {
          contexto,
        }
      : {}),
  };
}

function encontrarEntradaBase(ids = []) {
  return baseConocimiento.find(
    (entrada) =>
      ids.includes(entrada.id)
  );
}

function encontrarEntradaSobreCurso(
  curso
) {
  if (!curso) return null;

  const nombreCurso =
    normalizarEstricto(
      curso.nombre
    );

  if (!nombreCurso) {
    return null;
  }

  const entrada =
    baseConocimiento.find(
      (item) => {
        const candidatos = [
          item.pregunta,
          ...(item.variantes || []),
          item.categoria,
        ]
          .filter(Boolean)
          .map(normalizarEstricto);

        return candidatos.some(
          (texto) =>
            texto ===
            nombreCurso
        );
      }
    );

  return entrada || null;
}

function encontrarCursoDeTema(
  tema
) {
  if (!tema) return null;

  const nombreTema =
    normalizarEstricto(
      tema.tema
    );

  if (!nombreTema) {
    return null;
  }

  return (
    CURSOS_MANIFEST.find(
      (curso) =>
        Array.isArray(
          curso.temas
        ) &&
        curso.temas.some(
          (itemTema) =>
            normalizarEstricto(
              itemTema?.tema
            ) === nombreTema
        )
    ) || null
  );
}

function limpiarConsultaTemaDirecta(
  query
) {
  let texto =
    normalizarConsulta(query);

  const tokens =
    dividirPalabras(texto);

  const funcionales = new Set([
    "tema",
    "temas",
    "contenido",
    "el",
    "la",
    "los",
    "las",
    "un",
    "una",
    "de",
    "del",
    "que",
    "cual",
    "cuales",
  ]);

  texto = tokens
    .filter(
      (token) =>
        !funcionales.has(token)
    )
    .join(" ")
    .trim();

  return texto;
}

function esConsultaCantidadCursos(
  query
) {
  const texto =
    normalizarConsulta(query);

  const tokens =
    obtenerPalabras(texto);

  const tieneCurso =
    contieneAlgunaPalabra(tokens, [
      "curso",
      "cursos",
      "materia",
      "materias",
    ]);

  const tieneCantidad =
    contieneAlgunaPalabra(tokens, [
      "cuantos",
      "cuantas",
      "cuanto",
      "cantidad",
      "numero",
      "total",
    ]);

  const consultaAislada =
    tokens.length === 1 &&
    tieneCurso;

  return (
    consultaAislada ||
    (tieneCurso &&
      tieneCantidad)
  );
}

function esConsultaCantidadTemasGlobal(
  query
) {
  const tokens =
    obtenerPalabras(query);

  const tieneTema =
    contieneAlgunaPalabra(tokens, [
      "tema",
      "temas",
      "contenido",
    ]);

  const tieneCantidad =
    contieneAlgunaPalabra(tokens, [
      "cuantos",
      "cuantas",
      "cuanto",
      "cantidad",
      "numero",
      "total",
    ]);

  const consultaAislada =
    tokens.length === 1 &&
    tieneTema;

  return (
    consultaAislada ||
    (tieneTema &&
      tieneCantidad &&
      !contieneAlgunaPalabra(
        tokens,
        [
          "tiene",
          "tienen",
          "posee",
          "incluye",
          "hay",
        ]
      ))
  );
}

function esConsultaCantidadTemasCurso(
  query
) {
  const tokens =
    obtenerPalabras(query);

  const tieneCantidad =
    contieneAlgunaPalabra(tokens, [
      "cuantos",
      "cuantas",
      "cuanto",
      "cantidad",
      "numero",
      "total",
    ]);

  const tieneTema =
    contieneAlgunaPalabra(tokens, [
      "tema",
      "temas",
      "contenido",
    ]);

  return (
    tieneCantidad &&
    tieneTema
  );
}

function esConsultaTemasDeCurso(
  query
) {
  const tokens =
    obtenerPalabras(query);

  if (
    !tokens.includes("temas") &&
    !tokens.includes("tema")
  ) {
    return false;
  }

  if (
    contieneAlgunaPalabra(
      tokens,
      [
        "cuantos",
        "cuantas",
        "cuanto",
        "cantidad",
        "numero",
        "total",
      ]
    )
  ) {
    return true;
  }

  return (
    tokens.includes("de") ||
    tokens.includes("del") ||
    tokens.includes("en")
  );
}

function esConsultaListaTemas(
  query
) {
  const tokens =
    obtenerPalabras(query);

  return (
    contieneAlgunaPalabra(
      tokens,
      [
        "que",
        "cual",
        "cuales",
        "lista",
        "dime",
      ]
    ) &&
    contieneAlgunaPalabra(
      tokens,
      [
        "tema",
        "temas",
        "contenido",
      ]
    )
  );
}

function esConsultaPertenenciaTema(
  query
) {
  const tokens =
    obtenerPalabras(query);

  if (
    contieneAlgunaPalabra(
      tokens,
      [
        "pertenece",
        "donde",
      ]
    )
  ) {
    return true;
  }

  return (
    tokens.includes("curso") &&
    contieneAlgunaPalabra(
      tokens,
      [
        "esta",
        "pertenece",
        "que",
        "cual",
        "cuales",
      ]
    )
  );
}

function pareceConsultaExistenciaTema(
  query
) {
  const tokens =
    obtenerPalabras(query);

  return contieneAlgunaPalabra(
    tokens,
    [
      "tiene",
      "tienen",
      "esta",
      "incluye",
      "cuenta",
      "posee",
      "contiene",
    ]
  );
}

function detectarIntencion(
  query,
  entidades = {}
) {
  const texto =
    normalizarConsulta(query);

  const tokens =
    obtenerPalabras(texto);

  const curso =
    Boolean(entidades.curso);

  const tema =
    Boolean(entidades.tema);

  /*
   * PRIORIDAD ABSOLUTA:
   * cantidades globales.
   */

  if (
    esConsultaCantidadCursos(
      texto
    )
  ) {
    return "cantidad_cursos";
  }

  if (
    esConsultaCantidadTemasGlobal(
      texto
    ) &&
    !curso
  ) {
    return "cantidad_temas_total";
  }

  /*
   * Cantidad de temas de un curso.
   */

  if (
    curso &&
    esConsultaCantidadTemasCurso(
      texto
    )
  ) {
    return "cantidad_temas_curso";
  }

  /*
   * "temas de economia"
   * también significa cantidad,
   * no lista.
   */

  if (
    curso &&
    esConsultaTemasDeCurso(
      texto
    )
  ) {
    return "cantidad_temas_curso";
  }

  /*
   * Ubicación del tema.
   */

  if (
    tema &&
    esConsultaPertenenciaTema(
      texto
    )
  ) {
    return "tema_a_curso";
  }

  /*
   * Existencia de un tema dentro
   * de un curso.
   */

  if (
    curso &&
    tema &&
    pareceConsultaExistenciaTema(
      texto
    )
  ) {
    return "curso_tiene_tema";
  }

  /*
   * Lista explícita.
   * Se conserva porque forma parte
   * de la funcionalidad existente.
   */

  if (
    curso &&
    esConsultaListaTemas(
      texto
    )
  ) {
    return "listar_temas_curso";
  }

  return null;
}

function extraerEntidadesPorTokens(
  query,
  cursoContextual = null
) {
  const texto =
    normalizarConsulta(query);

  let curso = null;
  let tema = null;

  /*
   * Primero intentamos encontrar
   * cursos mencionados explícitamente.
   */

  const consultaCurso =
    limpiarConsultaParaCurso(
      texto
    );

  if (consultaCurso) {
    curso =
      buscarCursoPorNombre(
        consultaCurso
      );
  }

  /*
   * Si no hay curso explícito,
   * usamos el contexto solamente
   * como apoyo.
   */

  if (!curso && cursoContextual) {
    curso = cursoContextual;
  }

  /*
   * Si hay curso, buscamos el tema
   * únicamente dentro de ese curso.
   */

  if (curso) {
    const consultaTema =
      limpiarConsultaParaTema(
        texto,
        curso
      );

    if (consultaTema) {
      tema =
        buscarTemaEnCurso(
          consultaTema,
          curso
        );
    }
  }

  /*
   * Si no encontramos tema dentro
   * del curso, hacemos búsqueda global.
   *
   * IMPORTANTE:
   * ya NO ignoramos todos los tokens
   * de la consulta.
   */

  if (!tema) {
    const consultaTema =
      limpiarConsultaTemaDirecta(
        texto
      );

    if (consultaTema) {
      const resultados =
        buscarTemasGlobalesPorNombre(
          consultaTema
        );

      if (
        resultados.length === 1
      ) {
        tema = resultados[0];

        if (!curso) {
          curso =
            encontrarCursoDeTema(
              tema
            );
        }
      }
    }
  }

  return {
    curso,
    tema,
  };
}

function esReferenciaContextual(
  query
) {
  const texto =
    normalizarEstricto(query);

  const tokens =
    dividirPalabras(texto);

  return (
    /^(y|e)\s+/.test(texto) ||
    /\bese tema\b/.test(texto) ||
    /\besa tema\b/.test(texto) ||
    /\bese curso\b/.test(texto) ||
    /\besa curso\b/.test(texto) ||
    /\btambien esta\b/.test(texto) ||
    /\btambien tiene\b/.test(texto) ||
    /\bcuantos tiene\b/.test(texto) ||
    /\bcuantas tiene\b/.test(texto) ||
    /\bcuales son\b/.test(texto) ||
    tokens.includes("ese") ||
    tokens.includes("esa") ||
    tokens.includes("eso") ||
    tokens.includes("este") ||
    tokens.includes("esta")
  );
}

function obtenerTextoMensaje(
  mensaje
) {
  if (!mensaje) return "";

  if (
    typeof mensaje ===
    "string"
  ) {
    return mensaje;
  }

  if (
    typeof mensaje.content ===
    "string"
  ) {
    return mensaje.content;
  }

  if (
    typeof mensaje.text ===
    "string"
  ) {
    return mensaje.text;
  }

  if (
    typeof mensaje.mensaje ===
    "string"
  ) {
    return mensaje.mensaje;
  }

  if (
    typeof mensaje.pregunta ===
    "string"
  ) {
    return mensaje.pregunta;
  }

  return "";
}

function obtenerContextoReciente(
  mensajes
) {
  if (!Array.isArray(mensajes)) {
    return [];
  }

  return mensajes
    .slice(-10)
    .map((mensaje) => ({
      texto:
        obtenerTextoMensaje(
          mensaje
        ),
    }))
    .filter(
      (mensaje) =>
        typeof mensaje.texto ===
          "string" &&
        mensaje.texto.trim()
    );
}

function encontrarCursoEnContexto(
  mensajes
) {
  const contexto =
    obtenerContextoReciente(
      mensajes
    );

  for (
    let i = contexto.length - 1;
    i >= 0;
    i--
  ) {
    const curso =
      encontrarCursoMencionado(
        contexto[i].texto
      );

    if (curso) {
      return curso;
    }
  }

  return null;
}

function encontrarTemaEnContexto(
  mensajes,
  cursoPreferido = null
) {
  const contexto =
    obtenerContextoReciente(
      mensajes
    );

  for (
    let i = contexto.length - 1;
    i >= 0;
    i--
  ) {
    const texto =
      contexto[i].texto;

    if (cursoPreferido) {
      const consultaTema =
        limpiarConsultaParaTema(
          texto,
          cursoPreferido
        );

      if (consultaTema) {
        const tema =
          buscarTemaEnCurso(
            consultaTema,
            cursoPreferido
          );

        if (tema) {
          return {
            curso:
              cursoPreferido,
            tema,
          };
        }
      }
    } else {
      const resultados =
        buscarTemasGlobalesPorNombre(
          texto
        );

      if (
        resultados.length === 1
      ) {
        return {
          curso:
            encontrarCursoDeTema(
              resultados[0]
            ),
          tema: resultados[0],
        };
      }
    }
  }

  return null;
}

function obtenerContextoDesdeMensajes(
  mensajes
) {
  const curso =
    encontrarCursoEnContexto(
      mensajes
    );

  const temaContextual =
    encontrarTemaEnContexto(
      mensajes,
      curso
    );

  return {
    curso,
    tema:
      temaContextual?.tema ||
      null,
    intencion: null,
  };
}

function normalizarContextoExterno(
  contexto
) {
  return {
    curso:
      contexto?.curso || null,
    tema:
      contexto?.tema || null,
    intencion:
      contexto?.intencion || null,
  };
}

function actualizarContexto(
  contextoAnterior,
  entidades,
  intencion
) {
  const contexto =
    normalizarContextoExterno(
      contextoAnterior
    );

  return {
    curso:
      entidades.curso ||
      contexto.curso ||
      null,

    tema:
      entidades.tema ||
      contexto.tema ||
      null,

    intencion:
      intencion ||
      contexto.intencion ||
      null,
  };
}

async function resolverConsultaDinamica(
  query,
  mensajes = [],
  contextoExterno = null
) {
  const texto =
    normalizarConsulta(query);

  if (!texto) {
    return null;
  }

  let contexto =
    normalizarContextoExterno(
      contextoExterno
    );

  if (
    !contexto.curso &&
    !contexto.tema &&
    Array.isArray(mensajes) &&
    mensajes.length
  ) {
    contexto =
      obtenerContextoDesdeMensajes(
        mensajes
      );
  }

  /*
   * =====================================================
   * 1. INTENCIONES GLOBALES PRIMERO
   * =====================================================
   *
   * Esto evita que "cursos" o "temas"
   * lleguen al buscador semántico.
   */

  if (
    esConsultaCantidadCursos(
      texto
    )
  ) {
    const entradaBase =
      encontrarEntradaBase([
        "cuantos-cursos",
        "cantidad-cursos",
        "cuantos-cursos-temas",
      ]);

    return crearRespuestaDinamica({
      entradaBase,
      id: "consulta-dinamica-cursos",
      respuestas: [
        `Hay ${obtenerTotalCursos()} cursos disponibles.`,
      ],
      contexto:
        actualizarContexto(
          contexto,
          {
            curso: null,
            tema: null,
          },
          "cantidad_cursos"
        ),
    });
  }

  if (
    esConsultaCantidadTemasGlobal(
      texto
    )
  ) {
    const entradaBase =
      encontrarEntradaBase([
        "cuantos-temas",
        "cantidad-temas",
        "cuantos-cursos-temas",
      ]);

    return crearRespuestaDinamica({
      entradaBase,
      id: "consulta-dinamica-temas",
      respuestas: [
        `Hay ${obtenerTotalTemas()} temas en total.`,
      ],
      contexto:
        actualizarContexto(
          contexto,
          {
            curso: null,
            tema: null,
          },
          "cantidad_temas_total"
        ),
    });
  }

  /*
   * =====================================================
   * 2. RESOLVER ENTIDADES
   * =====================================================
   */

  let entidades =
    extraerEntidadesPorTokens(
      texto,
      contexto.curso
    );

  let curso =
    entidades.curso ||
    null;

  let tema =
    entidades.tema ||
    null;

  const referencia =
    esReferenciaContextual(
      texto
    );

  if (!curso && referencia) {
    curso =
      contexto.curso ||
      null;
  }

  if (!tema && referencia) {
    tema =
      contexto.tema ||
      null;
  }

  /*
   * =====================================================
   * 3. INTENCIÓN CON CURSO
   * =====================================================
   */

  if (
    curso &&
    esConsultaCantidadTemasCurso(
      texto
    )
  ) {
    return crearRespuestaDinamica({
      id: "consulta-dinamica-cantidad-temas-curso",
      respuestas: [
        `${curso.nombre} tiene ${
          Array.isArray(
            curso.temas
          )
            ? curso.temas.length
            : 0
        } temas.`,
      ],
      contexto:
        actualizarContexto(
          contexto,
          {
            curso,
            tema: null,
          },
          "cantidad_temas_curso"
        ),
    });
  }

  /*
   * "temas de economia"
   */

  if (
    curso &&
    esConsultaTemasDeCurso(
      texto
    )
  ) {
    return crearRespuestaDinamica({
      id: "consulta-dinamica-cantidad-temas-curso",
      respuestas: [
        `${curso.nombre} tiene ${
          Array.isArray(
            curso.temas
          )
            ? curso.temas.length
            : 0
        } temas.`,
      ],
      contexto:
        actualizarContexto(
          contexto,
          {
            curso,
            tema: null,
          },
          "cantidad_temas_curso"
        ),
    });
  }

  /*
   * =====================================================
   * 4. UBICACIÓN DE UN TEMA
   * =====================================================
   */

  if (
    tema &&
    esConsultaPertenenciaTema(
      texto
    )
  ) {
    const cursoReal =
      encontrarCursoDeTema(
        tema
      );

    if (cursoReal) {
      return crearRespuestaDinamica({
        id: "consulta-dinamica-pertenencia-tema",
        respuestas: [
          `El tema ${tema.tema} pertenece al curso de ${cursoReal.nombre}.`,
        ],
        contexto:
          actualizarContexto(
            contexto,
            {
              curso: cursoReal,
              tema,
            },
            "tema_a_curso"
          ),
      });
    }
  }

  /*
   * =====================================================
   * 5. EXISTENCIA DE TEMA EN CURSO
   * =====================================================
   */

  if (
    curso &&
    tema &&
    pareceConsultaExistenciaTema(
      texto
    )
  ) {
    const existe =
      Array.isArray(
        curso.temas
      ) &&
      curso.temas.some(
        (temaCurso) =>
          normalizarEstricto(
            temaCurso?.tema
          ) ===
          normalizarEstricto(
            tema.tema
          )
      );

    return crearRespuestaDinamica({
      id: "consulta-dinamica-existencia-tema",
      respuestas: [
        existe
          ? `Sí, ${curso.nombre} tiene ${tema.tema}.`
          : `No, ${curso.nombre} no tiene ${tema.tema}.`,
      ],
      contexto:
        actualizarContexto(
          contexto,
          {
            curso,
            tema,
          },
          "curso_tiene_tema"
        ),
    });
  }

  /*
   * =====================================================
   * 6. LISTA EXPLÍCITA DE TEMAS
   * =====================================================
   *
   * Se conserva para consultas como:
   * "cuales son los temas de economia"
   *
   * Pero NO se activa para:
   * "temas de economia"
   */

  if (
    curso &&
    esConsultaListaTemas(
      texto
    )
  ) {
    const temas =
      Array.isArray(
        curso.temas
      )
        ? curso.temas
            .map(
              (temaItem) =>
                temaItem?.tema
            )
            .filter(Boolean)
        : [];

    return crearRespuestaDinamica({
      id: "consulta-dinamica-lista-temas",
      respuestas: [
        temas.length
          ? `${curso.nombre}: ${temas.join(
              ", "
            )}.`
          : `${curso.nombre} no tiene temas registrados.`,
      ],
      contexto:
        actualizarContexto(
          contexto,
          {
            curso,
            tema: null,
          },
          "listar_temas_curso"
        ),
    });
  }

  /*
   * =====================================================
   * 7. TEMA ESPECÍFICO
   * =====================================================
   *
   * Esto ocurre ANTES del buscador general.
   */

  if (!tema) {
    const consultaTema =
      limpiarConsultaTemaDirecta(
        texto
      );

    if (consultaTema) {
      const resultados =
        buscarTemasGlobalesPorNombre(
          consultaTema
        );

      if (
        resultados.length === 1
      ) {
        tema = resultados[0];
        curso =
          encontrarCursoDeTema(
            tema
          );
      }
    }
  }

  /*
   * "credito"
   *
   * → El Crédito
   * → Economía
   */

  if (
    tema &&
    !curso
  ) {
    curso =
      encontrarCursoDeTema(
        tema
      );
  }

  /*
   * Si la consulta coincide directamente
   * con un tema, no debemos enviarla
   * al buscador semántico general.
   */

  if (
    tema &&
    curso
  ) {
    return crearRespuestaDinamica({
      id: "consulta-dinamica-tema",
      respuestas: [
        `Mi Estudio tiene el tema ${tema.tema} en el curso de ${curso.nombre}.`,
      ],
      contexto:
        actualizarContexto(
          contexto,
          {
            curso,
            tema,
          },
          "tema"
        ),
    });
  }

  /*
   * =====================================================
   * 8. CURSO ESPECÍFICO
   * =====================================================
   *
   * Si el usuario escribió únicamente
   * el nombre del curso, NO asumimos
   * que quiere la cantidad de temas.
   */

  const cursoExacto =
    buscarCursoPorNombre(
      texto
    );

  if (
    cursoExacto &&
    normalizarEstricto(
      texto
    ) ===
      normalizarEstricto(
        cursoExacto.nombre
      )
  ) {
    const entradaCurso =
      encontrarEntradaSobreCurso(
        cursoExacto
      );

    if (entradaCurso) {
      return respuestaDinamica(
        entradaCurso
      );
    }

    return crearRespuestaDinamica({
      id: "consulta-dinamica-curso",
      respuestas: [
        `El curso ${cursoExacto.nombre} está disponible en Mi Estudio.`,
      ],
      contexto:
        actualizarContexto(
          contexto,
          {
            curso: cursoExacto,
            tema: null,
          },
          "curso"
        ),
    });
  }

  /*
   * =====================================================
   * 9. BÚSQUEDA SEMÁNTICA GENERAL
   * =====================================================
   */

  const puntajesTexto =
    baseConocimiento.map(
      (entrada) =>
        mejorPuntajeDeTexto(
          entrada,
          query
        )
    );

  let mejorIndiceTexto = -1;
  let mejorPuntajeTexto = 0;

  puntajesTexto.forEach(
    (puntaje, i) => {
      if (
        puntaje >
        mejorPuntajeTexto
      ) {
        mejorPuntajeTexto =
          puntaje;

        mejorIndiceTexto = i;
      }
    }
  );

  if (
    mejorIndiceTexto !== -1 &&
    mejorPuntajeTexto >=
      PUNTAJE_MINIMO
  ) {
    return respuestaDinamica(
      baseConocimiento[
        mejorIndiceTexto
      ]
    );
  }

  let puntajesSemanticos =
    baseConocimiento.map(
      () => 0
    );

  try {
    const [
      vectoresBase,
      vectorQuery,
    ] = await Promise.all([
      obtenerEmbeddingsBase(),
      embeberTexto(query),
    ]);

    if (vectorQuery) {
      puntajesSemanticos =
        vectoresBase.map(
          (vector) =>
            vector
              ? similitudCoseno(
                  vectorQuery,
                  vector
                )
              : 0
        );
    }
  } catch {}

  let mejorIndice = -1;
  let mejorPuntaje = 0;

  baseConocimiento.forEach(
    (entrada, i) => {
      const similitud =
        puntajesSemanticos[
          i
        ] || 0;

      const texto =
        puntajesTexto[i] || 0;

      /*
       * Si existe coincidencia textual,
       * podemos combinarla con semántica.
       */

      const cobertura =
        obtenerPalabrasClavePregunta(
          query
        ).length > 0
          ? Math.min(
              1,
              texto / 360
            )
          : 0;

      let final = 0;

      if (
        similitud >=
        UMBRAL_SIMILITUD
      ) {
        /*
         * No permitimos que una similitud
         * semántica moderada, sin evidencia
         * textual, gane por sí sola.
         */

        if (
          texto >=
            PUNTAJE_MINIMO
        ) {
          final =
            texto +
            similitud *
              PESO_SEMANTICO;
        } else if (
          similitud >=
            UMBRAL_SEMANTICO_RESPUESTA &&
          cobertura >=
            UMBRAL_COBERTURA_RESPUESTA
        ) {
          final =
            texto +
            similitud *
              PESO_SEMANTICO;
        }
      }

      /*
       * Una coincidencia textual fuerte
       * también puede ganar sin embeddings.
       */

      if (
        texto >=
        PUNTAJE_MINIMO
      ) {
        final = Math.max(
          final,
          texto
        );
      }

      if (
        final >
        mejorPuntaje
      ) {
        mejorPuntaje = final;
        mejorIndice = i;
      }
    }
  );

  /*
   * =====================================================
   * 10. RECHAZO
   * =====================================================
   *
   * Nunca devolvemos simplemente
   * el resultado con mayor puntaje
   * si ese resultado no alcanzó
   * evidencia suficiente.
   */

  if (
    mejorIndice === -1 ||
    mejorPuntaje <
      PUNTAJE_MINIMO
  ) {
    return null;
  }

  return respuestaDinamica(
    baseConocimiento[
      mejorIndice
    ]
  );
}

function respuestaDinamica(
  entrada
) {
  if (
    entrada.id ===
    "cuantos-cursos-temas"
  ) {
    try {
      const totalCursos =
        obtenerTotalCursos();

      const totalTemas =
        obtenerTotalTemas();

      return {
        ...entrada,
        respuestas: [
          `Hay ${totalCursos} cursos con ${totalTemas} temas en total.`,
        ],
      };
    } catch {
      return entrada;
    }
  }

  if (
    Array.isArray(
      entrada.respuestas
    )
  ) {
    return {
      ...entrada,
      respuestas:
        entrada.respuestas.map(
          (respuesta) =>
            String(respuesta)
              .replace(
                /\[cantidad\]/gi,
                String(
                  obtenerTotalTemas()
                )
              )
              .replace(
                /\[cantidad_cursos\]/gi,
                String(
                  obtenerTotalCursos()
                )
              )
              .replace(
                /\[cantidad_temas\]/gi,
                String(
                  obtenerTotalTemas()
                )
              ),
        ),
    };
  }

  return entrada;
}

export async function responderPreguntaAsistente(
  pregunta,
  mensajes = [],
  contexto = null
) {
  const query = String(
    pregunta || ""
  ).trim();

  if (!query) {
    return null;
  }

  if (esSaludo(query)) {
    return RESPUESTA_SALUDO;
  }

  const dinamica =
    await resolverConsultaDinamica(
      query,
      mensajes,
      contexto
    );

  if (dinamica) {
    return dinamica;
  }

  /*
   * Si resolverConsultaDinamica()
   * devuelve null, ahora sí permitimos
   * la búsqueda normal.
   */

  const entidades =
    extraerEntidadesPorTokens(
      query
    );

  /*
   * Curso exacto.
   */

  if (
    entidades.curso &&
    normalizarConsulta(
      query
    ) ===
      normalizarEstricto(
        entidades.curso.nombre
      )
  ) {
    const entradaCurso =
      encontrarEntradaSobreCurso(
        entidades.curso
      );

    if (entradaCurso) {
      return respuestaDinamica(
        entradaCurso
      );
    }

    return crearRespuestaDinamica({
      id: "consulta-dinamica-curso",
      respuestas: [
        `El curso ${entidades.curso.nombre} está disponible en Mi Estudio.`,
      ],
      contexto: {
        curso:
          entidades.curso,
        tema: null,
        intencion: "curso",
      },
    });
  }

  /*
   * Tema exacto.
   */

  if (
    entidades.tema
  ) {
    const curso =
      encontrarCursoDeTema(
        entidades.tema
      );

    if (curso) {
      return crearRespuestaDinamica({
        id: "consulta-dinamica-tema",
        respuestas: [
          `Mi Estudio tiene el tema ${entidades.tema.tema} en el curso de ${curso.nombre}.`,
        ],
        contexto: {
          curso,
          tema:
            entidades.tema,
          intencion: "tema",
        },
      });
    }
  }

  /*
   * =====================================================
   * BÚSQUEDA NORMAL DE CONOCIMIENTO
   * =====================================================
   */

  const puntajesTexto =
    baseConocimiento.map(
      (entrada) =>
        mejorPuntajeDeTexto(
          entrada,
          query
        )
    );

  let mejorIndiceTexto = -1;
  let mejorPuntajeTexto = 0;

  puntajesTexto.forEach(
    (puntaje, i) => {
      if (
        puntaje >
        mejorPuntajeTexto
      ) {
        mejorPuntajeTexto =
          puntaje;

        mejorIndiceTexto = i;
      }
    }
  );

  if (
    mejorIndiceTexto !== -1 &&
    mejorPuntajeTexto >=
      PUNTAJE_MINIMO
  ) {
    return respuestaDinamica(
      baseConocimiento[
        mejorIndiceTexto
      ]
    );
  }

  let puntajesSemanticos =
    baseConocimiento.map(
      () => 0
    );

  try {
    const [
      vectoresBase,
      vectorQuery,
    ] = await Promise.all([
      obtenerEmbeddingsBase(),
      embeberTexto(query),
    ]);

    if (vectorQuery) {
      puntajesSemanticos =
        vectoresBase.map(
          (vector) =>
            vector
              ? similitudCoseno(
                  vectorQuery,
                  vector
                )
              : 0
        );
    }
  } catch {}

  let mejorIndice = -1;
  let mejorPuntaje = 0;

  baseConocimiento.forEach(
    (entrada, i) => {
      const similitud =
        puntajesSemanticos[
          i
        ] || 0;

      const texto =
        puntajesTexto[i] || 0;

      const palabrasQuery =
        obtenerPalabrasClavePregunta(
          query
        );

      const cobertura =
        palabrasQuery.length
          ? Math.min(
              1,
              texto / 360
            )
          : 0;

      let final = 0;

      if (
        texto >=
        PUNTAJE_MINIMO
      ) {
        final =
          texto +
          similitud *
            PESO_SEMANTICO;
      } else if (
        similitud >=
          UMBRAL_SEMANTICO_RESPUESTA &&
        cobertura >=
          UMBRAL_COBERTURA_RESPUESTA
      ) {
        final =
          texto +
          similitud *
            PESO_SEMANTICO;
      }

      if (
        final >
        mejorPuntaje
      ) {
        mejorPuntaje = final;
        mejorIndice = i;
      }
    }
  );

  if (
    mejorIndice === -1 ||
    mejorPuntaje <
      PUNTAJE_MINIMO
  ) {
    return null;
  }

  return respuestaDinamica(
    baseConocimiento[
      mejorIndice
    ]
  );
}

export function sugerenciasIniciales(
  cantidad = 4
) {
  const vistas = new Set();
  const sugerencias = [];

  for (
    const entrada of baseConocimiento
  ) {
    if (
      vistas.has(
        entrada.categoria
      )
    ) {
      continue;
    }

    vistas.add(
      entrada.categoria
    );

    sugerencias.push(
      entrada.pregunta
    );

    if (
      sugerencias.length >=
      cantidad
    ) {
      break;
    }
  }

  return sugerencias;
}

export function categoriasDisponibles() {
  return [
    ...new Set(
      baseConocimiento.map(
        (entrada) =>
          entrada.categoria
      )
    ),
  ];
}