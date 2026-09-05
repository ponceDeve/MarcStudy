import { useMemo, useState, useEffect, useRef } from "react";

import manifest from "../../data/manifest.json";

const DESCRIPCIONES_CURSO = {
  CIV: "Conoce tus derechos, deberes y cómo funciona el país.",
  FIL: "Comprende las grandes preguntas sobre la vida y humanidad.",
  HIS: "Entiende los hechos históricos y cómo transformaron nuestro mundo.",
  LEN: "Domina las reglas del idioma y mejora tu comunicación.",
  LIT: "Conoce autores, obras y estilos fundamentales de la literatura.",
  RVE: "Mejora tu lectura, comprensión y velocidad para el examen.",
  BIO: "Comprende la vida, desde las células hasta el cuerpo humano.",
  ECO: "Entiende precios, mercados y decisiones de la economía.",
  FIS: "Comprende movimiento, energía y las leyes de la naturaleza.",
  GEO: "Entiende relieve, clima y espacios geográficos del mundo.",
  PSI: "Comprende cómo pensamos, sentimos y actuamos las personas.",
  QUI: "Comprende átomos, compuestos y reacciones de la química.",
  ALG: "Domina ecuaciones, expresiones y problemas básicos de álgebra.",
  ARI: "Resuelve razones, proporciones y problemas clásicos de aritmética.",
  GEM: "Domina ángulos, figuras, áreas y conceptos de geometría.",
  RMA: "Desarrolla lógica y estrategias para resolver problemas rápidamente.",
  TRI: "Domina ángulos, razones y triángulos de la trigonometría."
};

const CATEGORIAS_CURSO = {
  matematica: new Set(["ALG", "ARI", "GEM", "RMA", "TRI"]),
  ciencias: new Set(["BIO", "ECO", "FIS", "GEO", "PSI", "QUI"]),
  letras: new Set(["CIV", "FIL", "HIS", "LEN", "LIT", "RVE"])
};

const CONFIG_CATEGORIAS = [
  {
    id: "matematica",
    titulo: "Matemática",
    iconoIzquierdo: "bi-calculator",
    iconoDerecho: "bi-rulers"
  },
 {
  id: "ciencias",
  titulo: "Ciencias",
  iconoIzquierdo: "bi-beaker",
  iconoDerecho: "bi-eyedropper"
},
  {
    id: "letras",
    titulo: "Letras",
    iconoIzquierdo: "bi-book",
    iconoDerecho: "bi-feather"
  }
];

const TEMAS_POR_PAGINA = 7;

function FlechaIzquierda() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M14.5 5L8 12L14.5 19"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlechaDerecha() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M9.5 5L16 12L9.5 19"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlechaArriba() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M5 14.5L12 8L19 14.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlechaAbajo() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M5 9.5L12 16L19 9.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function WelcomeSection({
  onSelectTema,
  temasCompletadosLista = []
}) {
  const [paginaTemas, setPaginaTemas] = useState({});
  const [cursoAbierto, setCursoAbierto] = useState(null);

  const [paginasCursos, setPaginasCursos] = useState({
    matematica: 0,
    ciencias: 0,
    letras: 0
  });

  const [columnasPorCategoria, setColumnasPorCategoria] =
    useState({
      matematica: 3,
      ciencias: 3,
      letras: 3
    });

  const carruselRefs = useRef({});

  const cursosConTemas = useMemo(
    () =>
      manifest.cursos.filter(
        (curso) =>
          Array.isArray(curso.temas) &&
          curso.temas.length > 0
      ),
    []
  );

  const totalTemas = useMemo(
    () =>
      cursosConTemas.reduce(
        (total, curso) =>
          total + curso.temas.length,
        0
      ),
    [cursosConTemas]
  );

  /*
   * Clasificación por categoría.
   *
   * IMPORTANTE:
   * No se ordenan los cursos.
   *
   * Se recorre manifest.cursos en su orden original
   * y cada curso se agrega directamente a su categoría.
   */
  const cursosPorCategoria = useMemo(() => {
    const resultado = {
      matematica: [],
      ciencias: [],
      letras: []
    };

    cursosConTemas.forEach((curso) => {
      const codigo = curso.codigo;

      if (
        CATEGORIAS_CURSO.matematica.has(
          codigo
        )
      ) {
        resultado.matematica.push(curso);
        return;
      }

      if (
        CATEGORIAS_CURSO.ciencias.has(
          codigo
        )
      ) {
        resultado.ciencias.push(curso);
        return;
      }

      if (
        CATEGORIAS_CURSO.letras.has(
          codigo
        )
      ) {
        resultado.letras.push(curso);
      }
    });

    return resultado;
  }, [cursosConTemas]);

  /*
   * Determina cuántas tarjetas caben realmente
   * dentro de cada carrusel.
   *
   * 3 tarjetas -> escritorio
   * 2 tarjetas -> tablet / espacios reducidos
   * 1 tarjeta -> móvil / espacios pequeños
   */
  useEffect(() => {
    const observers = [];

    const actualizarColumnas = (
      categoriaId,
      ancho
    ) => {
      let columnas = 1;

      if (ancho >= 850) {
        columnas = 3;
      } else if (ancho >= 560) {
        columnas = 2;
      }

      setColumnasPorCategoria((actuales) => {
        if (
          actuales[categoriaId] === columnas
        ) {
          return actuales;
        }

        return {
          ...actuales,
          [categoriaId]: columnas
        };
      });
    };

    CONFIG_CATEGORIAS.forEach(
      ({ id }) => {
        const elemento =
          carruselRefs.current[id];

        if (!elemento) {
          return;
        }

        const observer =
          new ResizeObserver(
            (entries) => {
              const entry = entries[0];

              if (!entry) {
                return;
              }

              actualizarColumnas(
                id,
                entry.contentRect.width
              );
            }
          );

        observer.observe(elemento);

        actualizarColumnas(
          id,
          elemento.getBoundingClientRect().width
        );

        observers.push(observer);
      }
    );

    return () => {
      observers.forEach((observer) =>
        observer.disconnect()
      );
    };
  }, []);

  /*
   * Cuando cambia el número de columnas,
   * reajustamos la página para evitar quedar
   * fuera del rango disponible.
   */
  useEffect(() => {
    setPaginasCursos((actuales) => {
      const nuevas = { ...actuales };
      let cambio = false;

      CONFIG_CATEGORIAS.forEach(
        ({ id }) => {
          const cursos =
            cursosPorCategoria[id] || [];

          const columnas =
            columnasPorCategoria[id] || 1;

          const totalPaginas = Math.max(
            1,
            Math.ceil(
              cursos.length / columnas
            )
          );

          const paginaActual =
            actuales[id] || 0;

          if (
            paginaActual >= totalPaginas
          ) {
            nuevas[id] =
              totalPaginas - 1;

            cambio = true;
          }
        }
      );

      return cambio ? nuevas : actuales;
    });
  }, [
    columnasPorCategoria,
    cursosPorCategoria
  ]);

  function estadoTema(curso, tema) {
    const id = `${curso.nombre}_${tema.tema}`;

    if (
      temasCompletadosLista.includes(id)
    ) {
      return "completado";
    }

    try {
      const abierto =
        localStorage.getItem(
          `ultimaCard_${curso.nombre}_${tema.tema}`
        );

      if (abierto !== null) {
        return "en_curso";
      }
    } catch {
      // localStorage no disponible
    }

    return "pendiente";
  }

  function logrosDelCurso(curso) {
    return temasCompletadosLista.filter(
      (id) =>
        id.startsWith(
          `${curso.nombre}_`
        )
    ).length;
  }

  function manejarClickTema(
    curso,
    tema
  ) {
    onSelectTema?.({
      type: "tema",
      curso: curso.nombre,
      tema: tema.tema,
      archivo: tema.archivo
    });
  }

  function cambiarPaginaTemas(
    cursoCodigo,
    direccion
  ) {
    setPaginaTemas((prev) => {
      const paginaActual =
        prev[cursoCodigo] || 0;

      const curso = cursosConTemas.find(
        (item) =>
          item.codigo === cursoCodigo
      );

      if (!curso) {
        return prev;
      }

      const totalPaginas = Math.max(
        1,
        Math.ceil(
          curso.temas.length /
          TEMAS_POR_PAGINA
        )
      );

      const siguiente =
        Math.min(
          totalPaginas - 1,
          Math.max(
            0,
            paginaActual + direccion
          )
        );

      return {
        ...prev,
        [cursoCodigo]: siguiente
      };
    });
  }

  function alternarCurso(cursoCodigo) {
    setCursoAbierto((actual) =>
      actual === cursoCodigo
        ? null
        : cursoCodigo
    );
  }

  function renderCurso(curso) {
    const paginaActual =
      paginaTemas[curso.codigo] || 0;

    const inicio =
      paginaActual * TEMAS_POR_PAGINA;

    const temasVisibles =
      curso.temas.slice(
        inicio,
        inicio + TEMAS_POR_PAGINA
      );

    const haySiguiente =
      inicio + TEMAS_POR_PAGINA <
      curso.temas.length;

    const hayAnterior =
      paginaActual > 0;

    const abierto =
      cursoAbierto === curso.codigo;

    return (
      <article
        key={curso.codigo}
        className={`welcome-section__curso${abierto
            ? " welcome-section__curso--abierto"
            : ""
          }`}
      >
        <div className="welcome-section__curso-top">
          <div className="welcome-section__curso-info">
            <span className="welcome-section__curso-nombre">
              {curso.nombre}
            </span>

            <div className="box-nombre-logros">
              <span className="welcome-section__curso-count">
                {curso.temas.length}{" "}
                tema
                {curso.temas.length !== 1
                  ? "s"
                  : ""}
              </span>

              <span className="welcome-section__curso-logros">
                <span
                  className="welcome-section__trophy"
                  aria-hidden="true"
                >
                  <i className="bi bi-trophy"></i>
                </span>

                {logrosDelCurso(curso)}/
                {curso.temas.length}
              </span>
            </div>
          </div>

          <p className="welcome-section__curso-desc">
            {DESCRIPCIONES_CURSO[
              curso.codigo
            ] ||
              "Temario disponible para estudiar."}
          </p>

          <button
            type="button"
            className="welcome-section__ver-temas"
            onClick={() =>
              alternarCurso(
                curso.codigo
              )
            }
          >
            <span>
              {abierto
                ? "Ocultar temas"
                : "Ver temas"}
            </span>

            <span
              className="welcome-section__ver-temas-icon"
              aria-hidden="true"
            >
              {abierto ? (
                <FlechaArriba />
              ) : (
                <FlechaAbajo />
              )}
            </span>
          </button>
        </div>

        {abierto && (
          <div className="welcome-section__temas-dropdown">
            <ul className="welcome-section__temas">
              {temasVisibles.map(
                (tema) => {
                  const estado =
                    estadoTema(
                      curso,
                      tema
                    );

                  return (
                    <li
                      key={tema.archivo}
                      className="welcome-section__tema-item"
                    >
                      <div className="welcome-section__tema-content">
                        <button
                          type="button"
                          className="welcome-section__tema-btn"
                          onClick={() =>
                            manejarClickTema(
                              curso,
                              tema
                            )
                          }
                        >
                          <span
                            className={`welcome-section__tema-estado welcome-section__tema-estado--${estado}`}
                            title={
                              estado ===
                                "completado"
                                ? "Completado"
                                : estado ===
                                  "en_curso"
                                  ? "En curso"
                                  : "No iniciado"
                            }
                          >
                            {estado !==
                              "pendiente" && (
                                <span className="welcome-section__tema-estado-check" />
                              )}
                          </span>

                          <span>
                            {tema.tema}
                          </span>
                        </button>
                      </div>
                    </li>
                  );
                }
              )}
            </ul>

            {(haySiguiente ||
              hayAnterior) && (
                <div className="welcome-section__temas-navigation">
                  {haySiguiente && (
                    <button
                      type="button"
                      className="welcome-section__mostrar-temas"
                      onClick={() =>
                        cambiarPaginaTemas(
                          curso.codigo,
                          1
                        )
                      }
                    >
                      <span>
                        Mostrar más
                      </span>

                      <span
                        className="welcome-section__mostrar-temas-icon"
                        aria-hidden="true"
                      >
                        <FlechaAbajo />
                      </span>
                    </button>
                  )}

                  {hayAnterior && (
                    <button
                      type="button"
                      className="welcome-section__mostrar-temas"
                      onClick={() =>
                        cambiarPaginaTemas(
                          curso.codigo,
                          -1
                        )
                      }
                    >
                      <span
                        className="welcome-section__mostrar-temas-icon"
                        aria-hidden="true"
                      >
                        <FlechaArriba />
                      </span>

                      <span>
                        Mostrar menos
                      </span>
                    </button>
                  )}
                </div>
              )}
          </div>
        )}
      </article>
    );
  }

  function cambiarPaginaCurso(
    categoriaId,
    direccion
  ) {
    const cursos =
      cursosPorCategoria[
      categoriaId
      ] || [];

    const columnas =
      columnasPorCategoria[
      categoriaId
      ] || 1;

    const totalPaginas = Math.max(
      1,
      Math.ceil(
        cursos.length / columnas
      )
    );

    setPaginasCursos((actuales) => {
      const actual =
        actuales[categoriaId] || 0;

      let siguiente =
        actual + direccion;

      if (siguiente < 0) {
        siguiente =
          totalPaginas - 1;
      }

      if (
        siguiente >= totalPaginas
      ) {
        siguiente = 0;
      }

      return {
        ...actuales,
        [categoriaId]: siguiente
      };
    });
  }

  function irAPaginaCurso(
    categoriaId,
    pagina
  ) {
    setPaginasCursos((actuales) => ({
      ...actuales,
      [categoriaId]: pagina
    }));
  }

  function renderCarruselCategoria(
    categoria
  ) {
    const cursos =
      cursosPorCategoria[
      categoria.id
      ] || [];

    const columnas =
      columnasPorCategoria[
      categoria.id
      ] || 1;

    const paginaActual =
      paginasCursos[
      categoria.id
      ] || 0;

    const totalPaginas = Math.max(
      1,
      Math.ceil(
        cursos.length / columnas
      )
    );

    const inicio =
      paginaActual * columnas;

    const cursosPagina =
      cursos.slice(
        inicio,
        inicio + columnas
      );

    return (
      <section
        key={categoria.id}
        className={`welcome-section__category welcome-section__category--${categoria.id}`}
      >
        <h3 className="welcome-section__category-title">
          <i
            className={`bi ${categoria.iconoIzquierdo}`}
            aria-hidden="true"
          />

          <span>
            {categoria.titulo}
          </span>

          <i
            className={`bi ${categoria.iconoDerecho}`}
            aria-hidden="true"
          />
        </h3>

        <div
          ref={(elemento) => {
            carruselRefs.current[
              categoria.id
            ] = elemento;
          }}
          className="welcome-section__carousel-row-wrapper"
        >
          <div className="welcome-section__carousel-row-container">
            {totalPaginas > 1 && (
              <button
                type="button"
                className="welcome-section__carousel-arrow welcome-section__carousel-arrow--prev"
                onClick={() =>
                  cambiarPaginaCurso(
                    categoria.id,
                    -1
                  )
                }
                aria-label={`Cursos anteriores de ${categoria.titulo.replace(
                  /^[^a-zA-ZáéíóúÁÉÍÓÚÑñ]+/,
                  ""
                )}`}
              >
                <FlechaIzquierda />
              </button>
            )}

            <div className="welcome-section__carousel-viewport">
              <div className="welcome-section__carousel-row">
                {cursosPagina.map(
                  (curso) =>
                    renderCurso(curso)
                )}
              </div>
            </div>

            {totalPaginas > 1 && (
              <button
                type="button"
                className="welcome-section__carousel-arrow welcome-section__carousel-arrow--next"
                onClick={() =>
                  cambiarPaginaCurso(
                    categoria.id,
                    1
                  )
                }
                aria-label={`Cursos siguientes de ${categoria.titulo.replace(
                  /^[^a-zA-ZáéíóúÁÉÍÓÚÑñ]+/,
                  ""
                )}`}
              >
                <FlechaDerecha />
              </button>
            )}
          </div>

          {totalPaginas > 1 && (
            <div
              className="welcome-section__carousel-dots"
              aria-label={`Páginas de ${categoria.titulo.replace(
                /^[^a-zA-ZáéíóúÁÉÍÓÚÑñ]+/,
                ""
              )}`}
            >
              {Array.from(
                {
                  length: totalPaginas
                },
                (_, index) => (
                  <button
                    key={`${categoria.id}-dot-${index}`}
                    type="button"
                    className={`welcome-section__carousel-dot${paginaActual ===
                        index
                        ? " welcome-section__carousel-dot--active"
                        : ""
                      }`}
                    onClick={() =>
                      irAPaginaCurso(
                        categoria.id,
                        index
                      )
                    }
                    aria-label={`Ir a página ${index + 1
                      } de ${categoria.titulo.replace(
                        /^[^a-zA-ZáéíóúÁÉÍÓÚÑñ]+/,
                        ""
                      )}`}
                    aria-current={
                      paginaActual ===
                        index
                        ? "true"
                        : undefined
                    }
                  />
                )
              )}
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <div className="welcome-section">
      <section className="welcome-section__courses">
        <div className="welcome-section__intro">
          <h2 className="welcome-section__title">
            Qué encontrarás en Mi Estudio
          </h2>

          <div className="welcome-section__logros">
            <svg
              className="welcome-section__logros-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
            >
              <defs>
                <linearGradient
                  id="oroBrillante"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor="#FFE066"
                  />

                  <stop
                    offset="30%"
                    stopColor="#F5B041"
                  />

                  <stop
                    offset="70%"
                    stopColor="#D4AF37"
                  />

                  <stop
                    offset="100%"
                    stopColor="#9A7D0A"
                  />
                </linearGradient>

                <linearGradient
                  id="oroReflejo"
                  x1="100%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor="#FFF5CC"
                  />

                  <stop
                    offset="50%"
                    stopColor="#F5B041"
                  />

                  <stop
                    offset="100%"
                    stopColor="#7D6608"
                  />
                </linearGradient>

                <linearGradient
                  id="baseDegradado"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor="#2C3E50"
                  />

                  <stop
                    offset="100%"
                    stopColor="#1A252F"
                  />
                </linearGradient>

                <filter
                  id="sombraPremium"
                  x="-10%"
                  y="-10%"
                  width="130%"
                  height="130%"
                >
                  <feDropShadow
                    dx="0"
                    dy="8"
                    stdDeviation="6"
                    floodColor="#000"
                    floodOpacity="0.25"
                  />
                </filter>
              </defs>

              <g filter="url(#sombraPremium)">
                <path
                  d="M160,140 C90,140 80,240 160,260 C140,220 140,180 160,140 Z"
                  fill="url(#oroReflejo)"
                />

                <path
                  d="M352,140 C422,140 432,240 352,260 C372,220 372,180 352,140 Z"
                  fill="url(#oroBrillante)"
                />

                <path
                  d="M160,110 L352,110 C352,240 320,290 256,290 C192,290 160,240 160,110 Z"
                  fill="url(#oroBrillante)"
                />

                <path
                  d="M180,120 L240,120 C220,190 200,240 256,275 C200,260 180,210 180,120 Z"
                  fill="url(#oroReflejo)"
                  opacity="0.4"
                />

                <ellipse
                  cx="256"
                  cy="110"
                  rx="96"
                  ry="15"
                  fill="#7D6608"
                />

                <ellipse
                  cx="256"
                  cy="107"
                  rx="92"
                  ry="12"
                  fill="url(#oroReflejo)"
                  opacity="0.8"
                />

                <path
                  d="M236,285 L276,285 L286,360 L226,360 Z"
                  fill="url(#oroBrillante)"
                />

                <ellipse
                  cx="256"
                  cy="330"
                  rx="35"
                  ry="10"
                  fill="url(#oroReflejo)"
                />

                <path
                  d="M200,360 L312,360 L332,420 L180,420 Z"
                  fill="url(#baseDegradado)"
                />

                <rect
                  x="160"
                  y="420"
                  width="192"
                  height="20"
                  rx="5"
                  fill="#111"
                />

                <rect
                  x="216"
                  y="380"
                  width="80"
                  height="25"
                  rx="2"
                  fill="url(#oroBrillante)"
                />

                <line
                  x1="226"
                  y1="392"
                  x2="286"
                  y2="392"
                  stroke="#7D6608"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </g>
            </svg>

            <div className="welcome-section__logros-text">
              <span className="welcome-section__logros-num">
                {temasCompletadosLista.length}{" "}
                / {totalTemas}
              </span>

              <span className="welcome-section__logros-label">
                temas completados
              </span>
            </div>
          </div>

          <p className="welcome-section__lead">
            Poco a poco, cada tema te acerca a tu meta.
            <br />
            Tienes{" "}
            <strong>
              {cursosConTemas.length}{" "}
              cursos
            </strong>{" "}
            y{" "}
            <strong>
              {totalTemas} temas
            </strong>{" "}
            para seguir avanzando.
          </p>

          <div className="welcome-section__carousel">
            {CONFIG_CATEGORIAS.map(
              renderCarruselCategoria
            )}
          </div>
        </div>
      </section>
    </div>
  );
}