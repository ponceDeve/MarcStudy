import manifest from "../data/manifest.json";
import { DISTRIBUCION_UNMSM } from "../data/distribucionExamenUNMSM";
import { shuffle } from "./shuffle";
import textosRV from "../data/textosRV.json";

// ============================================================
// PUNTAJE
// ============================================================

export const PUNTOS_CORRECTA = 20;
export const PUNTOS_INCORRECTA = -1.125;
export const PUNTOS_BLANCO = 0;

// ============================================================
// CACHE DE TEMAS
// ============================================================

const CACHE_TEMAS = new Map();

function fetchTema(archivo) {
  if (!CACHE_TEMAS.has(archivo)) {
    const promesa = fetch(import.meta.env.BASE_URL + archivo)
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);

    CACHE_TEMAS.set(archivo, promesa);
  }

  return CACHE_TEMAS.get(archivo);
}

// ============================================================
// POOL DE PREGUNTAS POR CURSO
// ============================================================

async function poolDelCurso(codigoCurso) {
  const curso = manifest.cursos.find(
    (c) => c.codigo === codigoCurso
  );

  if (!curso) {
    return {
      nombre: codigoCurso,
      preguntas: [],
    };
  }

  // ==========================================================
  // RVE NO USA LOS EXÁMENES DE LOS TEMAS
  // ==========================================================

  if (codigoCurso === "RVE") {
    return {
      nombre: curso.nombre,
      preguntas: [],
    };
  }

  // ==========================================================
  // CARGAR TODOS LOS TEMAS DEL CURSO
  // ==========================================================

  const temasJson = await Promise.all(
    (curso.temas || []).map((t) => fetchTema(t.archivo))
  );

  const preguntas = [];

  // ==========================================================
  // DE CADA TEMA:
  // SOLO SE TOMAN LAS ÚLTIMAS 20 PREGUNTAS
  // Y SE ESCOGE 1 AL AZAR
  // ==========================================================

  temasJson.forEach((data) => {
    if (!data || !Array.isArray(data.examen)) {
      return;
    }

    const preguntasValidas = data.examen.filter(
      (p) => p && p.tipo
    );

    const ultimas20 = preguntasValidas.slice(-20);

    if (ultimas20.length === 0) {
      return;
    }

    const ejercicio = shuffle(ultimas20)[0];

    preguntas.push({
      ...ejercicio,
      tema: data.tema || "",
    });
  });

  // ==========================================================
  // MEZCLAR LAS PREGUNTAS DE LOS TEMAS
  // ==========================================================

  return {
    nombre: curso.nombre,
    preguntas: shuffle(preguntas),
  };
}

// ============================================================
// GENERADOR DE ID
// ============================================================

let contadorId = 0;

function nuevoId() {
  contadorId += 1;
  return `sim-${Date.now()}-${contadorId}`;
}

// ============================================================
// PREPARAR PREGUNTA
// ============================================================

function prepararPregunta(
  preguntaOriginal,
  curso,
  cursoNombre
) {
  const base = {
    id: nuevoId(),
    curso,
    cursoNombre,
    tema: preguntaOriginal.tema || "",
    tipo: preguntaOriginal.tipo,
    q: preguntaOriginal.q || "",
    explicacion: preguntaOriginal.explicacion || "",
  };

  // ==========================================================
  // TEXTO RV
  // ==========================================================

  if (preguntaOriginal.textoRV) {
    base.textoRV = preguntaOriginal.textoRV;
  }

  if (preguntaOriginal.tituloRV) {
    base.tituloRV = preguntaOriginal.tituloRV;
  }

  if (preguntaOriginal.imagenRV) {
    base.imagenRV = preguntaOriginal.imagenRV;
  }

  if (preguntaOriginal.idTextoRV) {
    base.idTextoRV = preguntaOriginal.idTextoRV;
  }

  if (preguntaOriginal.subtipoRV) {
    base.subtipoRV = preguntaOriginal.subtipoRV;
  }

  if (preguntaOriginal.numeroTextoRV) {
    base.numeroTextoRV = preguntaOriginal.numeroTextoRV;
  }

  if (preguntaOriginal.numeroPreguntaRV) {
    base.numeroPreguntaRV =
      preguntaOriginal.numeroPreguntaRV;
  }

  // ==========================================================
  // VERDADERO / FALSO
  // ==========================================================

  if (preguntaOriginal.tipo === "verdadero_falso") {
    return {
      ...base,
      proposiciones:
        preguntaOriginal.proposiciones || [],
    };
  }

  // ==========================================================
  // COMPLETAR
  // ==========================================================

  if (preguntaOriginal.tipo === "completar") {
    const combos = (
      preguntaOriginal.opts || []
    ).map((combo, i) => ({
      combo,
      esCorrecta:
        i === preguntaOriginal.correct,
    }));

    const barajado = shuffle(combos);

    return {
      ...base,

      textoConEspacios:
        preguntaOriginal.textoConEspacios || "",

      opciones: barajado.map(
        (o) => o.combo
      ),

      correctoIdx: barajado.findIndex(
        (o) => o.esCorrecta
      ),
    };
  }

  // ==========================================================
  // RELACIONAR
  // ==========================================================

  if (preguntaOriginal.tipo === "relacionar") {
    const combos = (
      preguntaOriginal.opts || []
    ).map((combo, i) => ({
      combo,
      esCorrecta:
        i === preguntaOriginal.correct,
    }));

    const barajado = shuffle(combos);

    return {
      ...base,

      columnaA:
        preguntaOriginal.columnaA || [],

      columnaB:
        preguntaOriginal.columnaB || [],

      opciones: barajado.map(
        (o) => o.combo
      ),

      correctoIdx: barajado.findIndex(
        (o) => o.esCorrecta
      ),
    };
  }

  // ==========================================================
  // PREGUNTA NORMAL
  // ==========================================================

  const opts = (
    preguntaOriginal.opts || []
  ).map((texto, i) => ({
    texto,
    esCorrecta:
      i === preguntaOriginal.correct,
  }));

  const barajado = shuffle(opts);

  return {
    ...base,

    opciones: barajado.map(
      (o) => o.texto
    ),

    correctoIdx: barajado.findIndex(
      (o) => o.esCorrecta
    ),
  };
}

// ============================================================
// PREPARAR PREGUNTAS DE RVE
// ============================================================
//
// RVE utiliza textosRV.json.
//
// Se seleccionan:
//
// - 3 textos
// - 10 preguntas totales
// - Texto 1 → 4 preguntas
// - Texto 2 → 3 preguntas
// - Texto 3 → 3 preguntas
// - Texto 3 SIEMPRE es inglés
//
// ============================================================

export function prepararPreguntasRV(bancoEntrada) {
  const CANTIDAD_TEXTOS = 3;
  const CANTIDAD_PREGUNTAS = [4, 3, 3];

  if (!bancoEntrada) {
    console.error(
      "No se recibió textosRV."
    );

    return [];
  }

  const banco = Array.isArray(bancoEntrada)
    ? bancoEntrada
    : Array.isArray(bancoEntrada.textos)
      ? bancoEntrada.textos
      : [];

  if (banco.length === 0) {
    console.error(
      "El banco de textos RV está vacío."
    );

    return [];
  }

  const textosIngles = banco.filter(
    (texto) =>
      String(
        texto?.subtipo || ""
      )
        .toLowerCase()
        .trim() === "ingles"
  );

  const textosNoIngles = banco.filter(
    (texto) =>
      String(
        texto?.subtipo || ""
      )
        .toLowerCase()
        .trim() !== "ingles"
  );

  if (textosIngles.length === 0) {
    console.error(
      "No existen textos con subtipo 'ingles'."
    );

    return [];
  }

  const mezclar = (array) => {
    const copia = [...array];

    for (
      let i = copia.length - 1;
      i > 0;
      i--
    ) {
      const j = Math.floor(
        Math.random() * (i + 1)
      );

      [copia[i], copia[j]] = [
        copia[j],
        copia[i],
      ];
    }

    return copia;
  };

  const candidatosNormales =
    mezclar(textosNoIngles);

  if (candidatosNormales.length < 2) {
    console.error(
      "Se necesitan al menos 2 textos que no sean de inglés."
    );

    return [];
  }

  const texto1 =
    candidatosNormales[0];

  const texto2 =
    candidatosNormales[1];

  const texto3 =
    mezclar(textosIngles)[0];

  const textosSeleccionados = [
    {
      texto: texto1,
      cantidadPreguntas:
        CANTIDAD_PREGUNTAS[0],
    },

    {
      texto: texto2,
      cantidadPreguntas:
        CANTIDAD_PREGUNTAS[1],
    },

    {
      texto: texto3,
      cantidadPreguntas:
        CANTIDAD_PREGUNTAS[2],
    },
  ];

  const resultado = [];

  textosSeleccionados.forEach(
    (
      {
        texto,
        cantidadPreguntas,
      },
      indiceTexto
    ) => {
      if (!Array.isArray(texto.preguntas)) {
        console.warn(
          `El texto ${texto.id} no tiene preguntas válidas.`
        );

        return;
      }

      if (
        texto.preguntas.length <
        cantidadPreguntas
      ) {
        console.warn(
          `El texto ${texto.id} tiene solo ${texto.preguntas.length} preguntas. ` +
            `Se necesitan ${cantidadPreguntas}.`
        );
      }

      const preguntasDisponibles =
        mezclar(texto.preguntas);

      const preguntasSeleccionadas =
        preguntasDisponibles.slice(
          0,
          cantidadPreguntas
        );

      preguntasSeleccionadas.forEach(
        (
          pregunta,
          indicePregunta
        ) => {
          resultado.push({
            ...pregunta,

            textoRV: {
              titulo:
                texto.titulo || "",

              texto:
                texto.texto || "",

              imagen:
                texto.imagen ?? null,
            },

            idTextoRV:
              texto.id,

            subtipoRV:
              texto.subtipo,

            numeroTextoRV:
              indiceTexto + 1,

            numeroPreguntaRV:
              indicePregunta + 1,
          });
        }
      );
    }
  );

  if (resultado.length !== 10) {
    console.warn(
      `RV generó ${resultado.length} preguntas en lugar de 10.`
    );
  }

  const textosFinales = [];

  resultado.forEach((pregunta) => {
    if (
      !textosFinales.includes(
        pregunta.idTextoRV
      )
    ) {
      textosFinales.push(
        pregunta.idTextoRV
      );
    }
  });

  if (
    textosFinales.length !==
    CANTIDAD_TEXTOS
  ) {
    console.warn(
      `RV generó ${textosFinales.length} textos en lugar de ${CANTIDAD_TEXTOS}.`
    );
  }

  const tercerTexto =
    resultado.find(
      (pregunta) =>
        pregunta.numeroTextoRV === 3
    );

  if (
    !tercerTexto ||
    String(
      tercerTexto.subtipoRV || ""
    )
      .toLowerCase()
      .trim() !== "ingles"
  ) {
    console.error(
      "ERROR: el tercer texto de RV no es inglés."
    );
  }

  return resultado;
}

// ============================================================
// ARMAR SIMULACRO
// ============================================================

export async function armarSimulacro(area) {
  const distribucion =
    DISTRIBUCION_UNMSM[area] || {};

  const codigos = Object.keys(
    distribucion
  ).filter(
    (c) =>
      distribucion[c] > 0
  );

  const pools = await Promise.all(
    codigos.map((codigo) =>
      poolDelCurso(codigo)
    )
  );

  const preguntas = [];

  codigos.forEach(
    (codigo, i) => {
      const cantidadPedida =
        distribucion[codigo];

      const {
        nombre,
        preguntas: pool,
      } = pools[i];

      // ======================================================
      // RVE
      // ======================================================

      if (codigo === "RVE") {
        const preguntasRV =
          prepararPreguntasRV(
            textosRV
          );

        const preguntasRVPreparadas =
          preguntasRV.map(
            (pregunta) =>
              prepararPregunta(
                pregunta,
                codigo,
                nombre
              )
          );

        preguntas.push(
          ...preguntasRVPreparadas
        );

        return;
      }

      // ======================================================
      // CURSOS NORMALES
      // ======================================================

      const elegidas = shuffle(
        pool
      ).slice(
        0,
        cantidadPedida
      );

      elegidas.forEach((p) => {
        preguntas.push(
          prepararPregunta(
            p,
            codigo,
            nombre
          )
        );
      });
    }
  );

  return preguntas;
}

// ============================================================
// CALIFICAR PREGUNTA
// ============================================================

export function calificarPregunta(
  pregunta,
  respuesta
) {
  if (
    pregunta.tipo ===
    "verdadero_falso"
  ) {
    const marcas =
      respuesta || [];

    const todasMarcadas =
      pregunta.proposiciones.length > 0 &&
      pregunta.proposiciones.every(
        (_, i) =>
          marcas[i] === true ||
          marcas[i] === false
      );

    if (!todasMarcadas) {
      return "blanco";
    }

    const todasCorrectas =
      pregunta.proposiciones.every(
        (prop, i) =>
          marcas[i] ===
          prop.correct
      );

    return todasCorrectas
      ? "correcta"
      : "incorrecta";
  }

  if (
    respuesta === null ||
    respuesta === undefined
  ) {
    return "blanco";
  }

  return respuesta ===
    pregunta.correctoIdx
    ? "correcta"
    : "incorrecta";
}

// ============================================================
// PUNTOS SEGÚN ESTADO
// ============================================================

export function puntosDeEstado(
  estado
) {
  if (
    estado === "correcta"
  ) {
    return PUNTOS_CORRECTA;
  }

  if (
    estado === "incorrecta"
  ) {
    return PUNTOS_INCORRECTA;
  }

  return PUNTOS_BLANCO;
}

// ============================================================
// CALCULAR RESULTADOS
// ============================================================

export function calcularResultados(
  preguntas,
  respuestas
) {
  let puntajeTotal = 0;

  const detalle =
    preguntas.map((p) => {
      const respuestaUsuario =
        respuestas[p.id] ?? null;

      const estado =
        calificarPregunta(
          p,
          respuestaUsuario
        );

      const puntos =
        puntosDeEstado(
          estado
        );

      puntajeTotal += puntos;

      return {
        pregunta: p,
        estado,
        puntos,
        respuesta:
          respuestaUsuario,
      };
    });

  const porCurso =
    new Map();

  detalle.forEach((item) => {
    const key =
      item.pregunta.curso;

    if (!porCurso.has(key)) {
      porCurso.set(key, {
        curso: key,
        nombre:
          item.pregunta
            .cursoNombre,
        items: [],
      });
    }

    porCurso
      .get(key)
      .items.push(item);
  });

  return {
    puntajeTotal,
    detalle,

    grupos:
      Array.from(
        porCurso.values()
      ),
  };
}