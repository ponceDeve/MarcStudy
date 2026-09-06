// ============================================================================
// DISTRIBUCIÓN DEL EXAMEN ORDINARIO UNMSM (NUEVO FORMATO)
// ============================================================================
//
// Estructura:
// - 10 preguntas Actitudinales
// - 10 preguntas de Habilidad Verbal
// - 10 preguntas de Habilidad Lógico-Matemática
// - 70 preguntas de Conocimientos
// - TOTAL: 100 preguntas
//
// Distribución basada en el nuevo prospecto oficial de la OCA-UNMSM.
// ============================================================================

// ============================================================================
// NOMBRE COMPLETO DE CADA ÁREA
// ============================================================================

export const AREAS_UNMSM = {
  A: "Ciencias de la Salud",
  B: "Ciencias Básicas",
  C: "Ingenierías",
  D: "Ciencias Económicas y de la Gestión",
  E: "Humanidades y Ciencias Jurídicas y Sociales",
};

// ============================================================================
// CURSOS DEL SIMULACRO
// ============================================================================

export const CURSOS_SIMULACRO = [
  "ACT", // Actitudinal
  "RVE", // Habilidad Verbal
  "RMA", // Habilidad Lógico-Matemática
  "ARI", // Aritmética
  "GEM", // Geometría
  "ALG", // Álgebra
  "TRI", // Trigonometría
  "LEN", // Lenguaje
  "LIT", // Literatura
  "PSI", // Psicología
  "CIV", // Educación Cívica
  "HPE", // Historia del Perú
  "HIS", // Historia Universal
  "GEO", // Geografía
  "ECO", // Economía
  "FIL", // Filosofía
  "FIS", // Física
  "QUI", // Química
  "BIO", // Biología
];

// ============================================================================
// DISTRIBUCIÓN OFICIAL
// ============================================================================
//
// Cada área:
// 10 ACT
// 10 RVE
// 10 RMA
// 70 conocimientos
// ----------------
// 100 preguntas
//
// ============================================================================

export const DISTRIBUCION_UNMSM = {
  // ==========================================================================
  // ÁREA A — CIENCIAS DE LA SALUD
  // ==========================================================================

  A: {
    ACT: 10,
    RVE: 10,
    RMA: 10,

    ARI: 4,
    GEM: 3,
    ALG: 3,
    TRI: 2,

    LEN: 7,
    LIT: 4,

    PSI: 6,
    CIV: 4,

    HPE: 3,
    HIS: 2,
    GEO: 4,
    ECO: 4,
    FIL: 4,

    FIS: 5,
    QUI: 7,
    BIO: 8,
  },

  // ==========================================================================
  // ÁREA B — CIENCIAS BÁSICAS
  // ==========================================================================

  B: {
    ACT: 10,
    RVE: 10,
    RMA: 10,

    ARI: 4,
    GEM: 4,
    ALG: 4,
    TRI: 3,

    LEN: 6,
    LIT: 4,

    PSI: 4,
    CIV: 4,

    HPE: 2,
    HIS: 2,
    GEO: 4,
    ECO: 4,
    FIL: 4,

    FIS: 7,
    QUI: 7,
    BIO: 7,
  },

  // ==========================================================================
  // ÁREA C — INGENIERÍAS
  // ==========================================================================

  C: {
    ACT: 10,
    RVE: 10,
    RMA: 10,

    ARI: 4,
    GEM: 4,
    ALG: 4,
    TRI: 3,

    LEN: 7,
    LIT: 4,

    PSI: 4,
    CIV: 4,

    HPE: 3,
    HIS: 2,
    GEO: 4,
    ECO: 4,
    FIL: 4,

    FIS: 7,
    QUI: 6,
    BIO: 6,
  },

  // ==========================================================================
  // ÁREA D — CIENCIAS ECONÓMICAS Y DE LA GESTIÓN
  // ==========================================================================

  D: {
    ACT: 10,
    RVE: 10,
    RMA: 10,

    ARI: 4,
    GEM: 4,
    ALG: 4,
    TRI: 2,

    LEN: 8,
    LIT: 4,

    PSI: 6,
    CIV: 4,

    HPE: 3,
    HIS: 3,
    GEO: 4,
    ECO: 8,
    FIL: 4,

    FIS: 4,
    QUI: 4,
    BIO: 4,
  },

  // ==========================================================================
  // ÁREA E — HUMANIDADES Y CIENCIAS JURÍDICAS Y SOCIALES
  // ==========================================================================

  E: {
    ACT: 10,
    RVE: 10,
    RMA: 10,

    ARI: 2,
    GEM: 2,
    ALG: 2,
    TRI: 2,

    LEN: 8,
    LIT: 6,

    PSI: 6,
    CIV: 4,

    HPE: 5,
    HIS: 5,
    GEO: 5,
    ECO: 5,
    FIL: 6,

    FIS: 4,
    QUI: 4,
    BIO: 4,
  },
};

// ============================================================================
// COMPROBACIÓN AUTOMÁTICA
// ============================================================================
//
// Esto sirve para detectar inmediatamente si alguien modifica una cantidad
// y accidentalmente deja un área con más o menos de 100 preguntas.
//
// ============================================================================

Object.entries(DISTRIBUCION_UNMSM).forEach(
  ([area, distribucion]) => {
    const total = Object.values(distribucion).reduce(
      (suma, cantidad) => suma + cantidad,
      0
    );

    if (total !== 100) {
      console.warn(
        `[UNMSM] El área ${area} tiene ${total} preguntas. ` +
        `Debe tener exactamente 100.`
      );
    }
  }
);