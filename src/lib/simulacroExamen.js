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
  // RVE NO USA LOS EXAMEN DE LOS TEMAS
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
  // ==========================================================

  temasJson.forEach((data) => {
    if (!data || !Array.isArray(data.examen)) {
      return;
    }

    const preguntasValidas = data.examen.filter(
      (p) => p && p.tipo
    );

    // SOLO LAS ÚLTIMAS 20 DE ESTE TEMA
    const ultimas20 = preguntasValidas.slice(-20);

    preguntas.push(...ultimas20);
  });

  // ==========================================================
  // MEZCLAR TODAS LAS PREGUNTAS DE LOS TEMAS
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
// - 3 textos
// - 10 preguntas totales
// - distribución 3 + 3 + 4
//
// ============================================================

function prepararPreguntasRV(
  curso,
  cursoNombre,
  cantidadPedida
) {
  if (cantidadPedida <= 0) {
    return [];
  }

  const textos = Array.isArray(
    textosRV?.textos
  )
    ? textosRV.textos
    : [];

  if (textos.length < 3) {
    return [];
  }

  // ==========================================================
  // FILTRAR TEXTOS VÁLIDOS
  // ==========================================================

  const textosDisponibles = shuffle(
    textos.filter(
      (texto) =>
        texto &&
        texto.id &&
        Array.isArray(texto.preguntas) &&
        texto.preguntas.length > 0
    )
  );

  if (textosDisponibles.length < 3) {
    return [];
  }

  // ==========================================================
  // SOLO TEXTOS QUE PUEDAN APORTAR AL MENOS 3 PREGUNTAS
  // ==========================================================

  const candidatos =
    textosDisponibles.filter(
      (texto) =>
        texto.preguntas.length >= 3
    );

  if (candidatos.length < 3) {
    return [];
  }

  // ==========================================================
  // SEPARAR CANDIDATOS SEGÚN CUÁNTAS PREGUNTAS APORTAN
  // ==========================================================
  //
  // La distribución final SIEMPRE necesita que, de los 3
  // textos elegidos, al menos UNO tenga 4 preguntas
  // (3 + 3 + 4 = 10). Antes se elegían 3 textos al azar sin
  // garantizar esto, así que si los 3 elegidos tenían
  // únicamente 3 preguntas cada uno, no calzaba ninguna
  // distribución y el bloque de RV se descartaba por completo
  // (bug intermitente: en ~25% de los simulacros no salían
  // preguntas de razonamiento verbal).
  //
  // Ahora se garantiza explícitamente que uno de los 3 textos
  // seleccionados tenga al menos 4 preguntas.
  // ==========================================================

  const conCuatro = candidatos.filter(
    (texto) => texto.preguntas.length >= 4
  );

  const conTres = candidatos.filter(
    (texto) => texto.preguntas.length === 3
  );

  if (conCuatro.length < 1) {
    return [];
  }

  const [textoDeCuatro, ...restoConCuatro] =
    conCuatro;

  const restantes = shuffle([
    ...restoConCuatro,
    ...conTres,
  ]);

  if (restantes.length < 2) {
    return [];
  }

  const textosSeleccionados = shuffle([
    textoDeCuatro,
    ...restantes.slice(0, 2),
  ]);

  // ==========================================================
  // POSIBLES DISTRIBUCIONES
  // ==========================================================

  const distribuciones = shuffle([
    [3, 3, 4],
    [3, 4, 3],
    [4, 3, 3],
  ]);

  // ==========================================================
  // BUSCAR UNA DISTRIBUCIÓN POSIBLE
  // ==========================================================

  const distribucionValida =
    distribuciones.find(
      (distribucion) =>
        distribucion.every(
          (cantidad, i) =>
            textosSeleccionados[i]
              .preguntas.length >= cantidad
        )
    );

  if (!distribucionValida) {
    return [];
  }

  const preguntas = [];

  // ==========================================================
  // TOMAR LAS PREGUNTAS DE CADA TEXTO
  // ==========================================================

  textosSeleccionados.forEach(
    (texto, i) => {
      const cantidad =
        distribucionValida[i];

      const preguntasDelTexto =
        shuffle(
          texto.preguntas.filter(
            (pregunta) =>
              pregunta &&
              pregunta.tipo
          )
        ).slice(0, cantidad);

      preguntasDelTexto.forEach(
        (pregunta) => {
          preguntas.push({
            ...pregunta,

            textoRV: {
              id: texto.id,

              tipo:
                texto.tipo || "",

              subtipo:
                texto.subtipo || "",

              titulo:
                texto.titulo || "",

              texto:
                texto.texto || "",

              imagen:
                texto.imagen === undefined
                  ? null
                  : texto.imagen,
            },
          });
        }
      );
    }
  );

  // ==========================================================
  // VERIFICAR QUE SEAN EXACTAMENTE 10
  // ==========================================================

  if (preguntas.length !== 10) {
    return [];
  }

  return preguntas.map(
    (pregunta) =>
      prepararPregunta(
        pregunta,
        curso,
        cursoNombre
      )
  );
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
    (c) => distribucion[c] > 0
  );

  // ==========================================================
  // CARGAR LOS POOLS DE TODOS LOS CURSOS
  // ==========================================================

  const pools = await Promise.all(
    codigos.map((codigo) =>
      poolDelCurso(codigo)
    )
  );

  const preguntas = [];

  // ==========================================================
  // SELECCIONAR PREGUNTAS
  // ==========================================================

  codigos.forEach((codigo, i) => {
    const cantidadPedida =
      distribucion[codigo];

    const {
      nombre,
      preguntas: pool,
    } = pools[i];

    // ========================================================
    // RVE
    // ========================================================

    if (codigo === "RVE") {
      const preguntasRV =
        prepararPreguntasRV(
          codigo,
          nombre,
          cantidadPedida
        );

      preguntas.push(
        ...preguntasRV
      );

      return;
    }

    // ========================================================
    // CURSOS NORMALES
    // ========================================================
    //
    // IMPORTANTE:
    //
    // pool ya contiene únicamente:
    // las últimas 20 preguntas de CADA tema.
    //
    // Aquí recién se selecciona la cantidad
    // que necesita el simulacro.
    //
    // ========================================================

    const elegidas = shuffle(
      pool
    ).slice(0, cantidadPedida);

    elegidas.forEach((p) => {
      preguntas.push(
        prepararPregunta(
          p,
          codigo,
          nombre
        )
      );
    });
  });

  return preguntas;
}

// ============================================================
// CALIFICAR PREGUNTA
// ============================================================

export function calificarPregunta(
  pregunta,
  respuesta
) {
  // ==========================================================
  // VERDADERO / FALSO
  // ==========================================================

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
          marcas[i] === prop.correct
      );

    return todasCorrectas
      ? "correcta"
      : "incorrecta";
  }

  // ==========================================================
  // SIN RESPUESTA
  // ==========================================================

  if (
    respuesta === null ||
    respuesta === undefined
  ) {
    return "blanco";
  }

  // ==========================================================
  // PREGUNTA NORMAL
  // ==========================================================

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
  if (estado === "correcta") {
    return PUNTOS_CORRECTA;
  }

  if (estado === "incorrecta") {
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

  // ==========================================================
  // DETALLE DE CADA PREGUNTA
  // ==========================================================

  const detalle = preguntas.map(
    (p) => {
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
        respuesta: respuestaUsuario,
      };
    }
  );

  // ==========================================================
  // AGRUPAR POR CURSO
  // ==========================================================

  const porCurso = new Map();

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

  // ==========================================================
  // RESULTADO FINAL
  // ==========================================================

  return {
    puntajeTotal,

    detalle,

    grupos:
      Array.from(
        porCurso.values()
      ),
  };
}