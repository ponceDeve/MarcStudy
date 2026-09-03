import { useMemo, useState } from "react";
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

export default function WelcomeSection({ onSelectTema, temasCompletadosLista = [] }) {
  const [paginaTemas, setPaginaTemas] = useState({});
  const [cursoAbierto, setCursoAbierto] = useState(null);
  const TEMAS_POR_PAGINA = 7;

  const cursosConTemas = useMemo(
    () => manifest.cursos.filter((curso) => curso.temas.length > 0),
    []
  );

  const totalTemas = useMemo(
    () => cursosConTemas.reduce((total, curso) => total + curso.temas.length, 0),
    [cursosConTemas]
  );

  function estadoTema(curso, tema) {
    const id = `${curso.nombre}_${tema.tema}`;
    if (temasCompletadosLista.includes(id)) return "completado";
    try {
      const abierto = localStorage.getItem(`ultimaCard_${curso.nombre}_${tema.tema}`);
      if (abierto !== null) return "en_curso";
    } catch {
      // localStorage no disponible: se asume pendiente
    }
    return "pendiente";
  }

  function logrosDelCurso(curso) {
    return temasCompletadosLista.filter((id) => id.startsWith(`${curso.nombre}_`)).length;
  }

  function manejarClickTema(curso, tema) {
    onSelectTema?.({
      type: "tema",
      curso: curso.nombre,
      tema: tema.tema,
      archivo: tema.archivo
    });
  }

  function cambiarPaginaTemas(cursoCodigo, direccion) {
    setPaginaTemas((prev) => {
      const paginaActual = prev[cursoCodigo] || 0;
      return {
        ...prev,
        [cursoCodigo]: Math.max(0, paginaActual + direccion)
      };
    });
  }

  function alternarCurso(cursoCodigo) {
    setCursoAbierto((actual) => (actual === cursoCodigo ? null : cursoCodigo));
  }

  return (
    <div className="welcome-section">
      <section className="welcome-section__courses">
        <div className="welcome-section__intro container">
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
                <linearGradient id="oroBrillante" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FFE066" />
                  <stop offset="30%" stopColor="#F5B041" />
                  <stop offset="70%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#9A7D0A" />
                </linearGradient>
                <linearGradient id="oroReflejo" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFF5CC" />
                  <stop offset="50%" stopColor="#F5B041" />
                  <stop offset="100%" stopColor="#7D6608" />
                </linearGradient>
                <linearGradient id="baseDegradado" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2C3E50" />
                  <stop offset="100%" stopColor="#1A252F" />
                </linearGradient>
                <filter id="sombraPremium" x="-10%" y="-10%" width="130%" height="130%">
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
                <ellipse cx="256" cy="110" rx="96" ry="15" fill="#7D6608" />
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
                <ellipse cx="256" cy="330" rx="35" ry="10" fill="url(#oroReflejo)" />
                <path
                  d="M200,360 L312,360 L332,420 L180,420 Z"
                  fill="url(#baseDegradado)"
                />
                <rect x="160" y="420" width="192" height="20" rx="5" fill="#111" />
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
                {temasCompletadosLista.length} / {totalTemas}
              </span>
              <span className="welcome-section__logros-label">
                temas completados
              </span>
            </div>
          </div>

          <p className="welcome-section__lead">
            Poco a poco, cada tema te acerca a tu meta.
            <br />
            Tienes <strong>{cursosConTemas.length} cursos</strong> y{" "}
            <strong>{totalTemas} temas</strong> para seguir avanzando.
          </p>

          <div className="welcome-section__grid">
            {cursosConTemas.map((curso, i) => {
              const paginaActual = paginaTemas[curso.codigo] || 0;
              const inicio = paginaActual * TEMAS_POR_PAGINA;
              const temasVisibles = curso.temas.slice(
                inicio,
                inicio + TEMAS_POR_PAGINA
              );
              const haySiguiente =
                inicio + TEMAS_POR_PAGINA < curso.temas.length;
              const hayAnterior = paginaActual > 0;
              const abierto = cursoAbierto === curso.codigo;

              return (
                <article
                  key={curso.codigo}
                  className={`welcome-section__curso welcome-section__curso--${
                    i % 4
                  }${abierto ? " welcome-section__curso--abierto" : ""}`}
                >
                  <div className="welcome-section__curso-top">
                    <div className="welcome-section__curso-info">
                      <span className="welcome-section__curso-nombre">
                        {curso.nombre}
                      </span>

                      <div className="box-nombre-logros">
                        <span className="welcome-section__curso-count">
                          {curso.temas.length} tema
                          {curso.temas.length !== 1 ? "s" : ""}
                        </span>

                        <span className="welcome-section__curso-logros">
                          <i className="fa-solid fa-trophy" />
                          {logrosDelCurso(curso)}/{curso.temas.length}
                        </span>
                      </div>
                    </div>

                    <p className="welcome-section__curso-desc">
                      {DESCRIPCIONES_CURSO[curso.codigo] ||
                        "Temario disponible para estudiar."}
                    </p>

                    <button
                      type="button"
                      className="welcome-section__ver-temas"
                      onClick={() => alternarCurso(curso.codigo)}
                    >
                      <span>{abierto ? "Ocultar temas" : "Ver temas"}</span>
                      <i
                        className={`fa-solid fa-chevron-${
                          abierto ? "up" : "down"
                        }`}
                      />
                    </button>
                  </div>

                  {abierto && (
                    <div className="welcome-section__temas-dropdown">
                      <ul className="welcome-section__temas">
                        {temasVisibles.map((tema) => {
                          const estado = estadoTema(curso, tema);

                          return (
                            <li
                              key={tema.archivo}
                              className="welcome-section__tema-item"
                            >
                              <div className="welcome-section__tema-content">
                                <button
                                  type="button"
                                  className="welcome-section__tema-btn"
                                  onClick={() => manejarClickTema(curso, tema)}
                                >
                                  <span
                                    className={`welcome-section__tema-estado welcome-section__tema-estado--${estado}`}
                                    title={
                                      estado === "completado"
                                        ? "Completado"
                                        : estado === "en_curso"
                                          ? "En curso"
                                          : "No iniciado"
                                    }
                                  >
                                    {estado !== "pendiente" && (
                                      <span className="welcome-section__tema-estado-check" />
                                    )}
                                  </span>

                                  <span>{tema.tema}</span>
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>

                      {(haySiguiente || hayAnterior) && (
                        <div className="welcome-section__temas-navigation">
                          {haySiguiente && (
                            <button
                              type="button"
                              className="welcome-section__mostrar-temas"
                              onClick={() =>
                                cambiarPaginaTemas(curso.codigo, 1)
                              }
                            >
                              <span>Mostrar más</span>
                              <i className="fa-solid fa-chevron-down" />
                            </button>
                          )}

                          {hayAnterior && (
                            <button
                              type="button"
                              className="welcome-section__mostrar-temas"
                              onClick={() =>
                                cambiarPaginaTemas(curso.codigo, -1)
                              }
                            >
                              <i className="fa-solid fa-chevron-up" />
                              <span>Mostrar menos</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}