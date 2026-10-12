import { useMemo, useState, useRef, useEffect } from "react";
import manifest from "../../data/manifest.json";

const DESCRIPCIONES_CURSO = {
  CIV: "Conoce tus derechos, deberes y cómo funciona el país.",
  FIL: "Comprende las grandes preguntas sobre la vida y humanidad.",
  HIS: "Entiende los hechos históricos y cómo transformaron nuestro mundo.",
  HPE: "Comprende los procesos y hechos fundamentales de la historia del Perú.",
  ING: "Aprende vocabulario, gramática y comprensión del idioma inglés.",
  LEN: "Domina las reglas del idioma y mejora tu comunicación.",
  LIT: "Conoce autores, obras y estilos fundamentales de la literatura.",
  RMV: "Mejora tu lectura, comprensión y velocidad para el examen.",
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

// Cada categoría es una diapositiva del carrusel: título, íconos y cursos.
const CATEGORIAS = [
  {
    id: "letras",
    titulo: "Letras",
    iconoIzquierdo: "bi-book",
    iconoDerecho: "bi-feather",
    cursos: ["RMV", "LEN", "LIT", "HIS", "HPE", "FIL", "ING"]
  },
  {
    id: "ciencias",
    titulo: "Ciencias",
    iconoIzquierdo: "bi-beaker",
    iconoDerecho: "bi-eyedropper",
    cursos: ["BIO", "FIS", "QUI", "GEO", "CIV", "PSI"]
  },
  {
    id: "matematica",
    titulo: "Matemática",
    iconoIzquierdo: "bi-calculator",
    iconoDerecho: "bi-rulers",
    cursos: ["RMA", "ARI", "ALG", "GEM", "TRI", "ECO"]
  }
];

// Fracción del ancho que hay que arrastrar para cambiar de categoría
const UMBRAL_CAMBIO = 0.18;
// Movimiento mínimo (px) para considerar que es un arrastre y no un clic
const DISTANCIA_ARRASTRE = 6;

function FlechaIzquierda() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
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
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
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

export default function WelcomeSection({
  onSelectTema,
  temasCompletadosLista = []
}) {
  const [indice, setIndice] = useState(0);
  const trackRef = useRef(null);
  const gestoRef = useRef(null);
  const bloquearClickRef = useRef(false);
  const total = CATEGORIAS.length;
  const indiceRef = useRef(0);
  indiceRef.current = indice;

  function anchoSlide() {
    const track = trackRef.current;
    return track?.firstElementChild?.getBoundingClientRect().width || 0;
  }

  // Mueve el carrusel directamente en el DOM (en píxeles)
  function posicionar(i, desfase = 0, animado = true) {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    track.style.transition = animado ? "" : "none";
    track.style.transform = `translate3d(${-i * anchoSlide() + desfase}px, 0, 0)`;
  }

  useEffect(() => {
    posicionar(indice);
  }, [indice]);

  useEffect(() => {
    const alCambiarTamano = () => posicionar(indiceRef.current, 0, false);
    window.addEventListener("resize", alCambiarTamano);
    return () => window.removeEventListener("resize", alCambiarTamano);
  }, []);

  const cursos = useMemo(
    () =>
      Array.isArray(manifest.cursos)
        ? manifest.cursos.map((curso) => ({
            ...curso,
            temas: Array.isArray(curso.temas) ? curso.temas : []
          }))
        : [],
    []
  );

  const totalTemas = useMemo(
    () =>
      cursos.reduce((total, curso) => total + curso.temas.length, 0),
    [cursos]
  );

  const cursosPorCategoria = useMemo(() => {
    const resultado = {};
    CATEGORIAS.forEach((categoria) => {
      resultado[categoria.id] = categoria.cursos
        .map((codigo) => cursos.find((item) => item.codigo === codigo))
        .filter(Boolean);
    });
    return resultado;
  }, [cursos]);

  function logrosDelCurso(curso) {
    return temasCompletadosLista.filter((id) =>
      id.startsWith(`${curso.nombre}_`)
    ).length;
  }

  function abrirMapaDeTemas(curso) {
    // Mismo flujo que la búsqueda: abre el mapa de temas del curso
    onSelectTema?.({ type: "curso", nombre: curso.nombre });
  }

  // Cambio por flechas o puntos (en bucle)
  function irACategoria(destino) {
    setIndice(((destino % total) + total) % total);
  }

  // Gesto de arrastre con mouse o táctil
  function manejarPointerDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) {
      return;
    }
    gestoRef.current = {
      id: e.pointerId,
      x: e.clientX,
      base: indiceRef.current,
      movido: false
    };
  }

  function manejarPointerMove(e) {
    const gesto = gestoRef.current;
    if (!gesto || gesto.id !== e.pointerId) {
      return;
    }
    const dx = e.clientX - gesto.x;
    if (!gesto.movido) {
      if (Math.abs(dx) < DISTANCIA_ARRASTRE) {
        return;
      }
      gesto.movido = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    // En el primer y último elemento el contenido se frena un poco
    const enBorde =
      (gesto.base === 0 && dx > 0) ||
      (gesto.base === total - 1 && dx < 0);
    posicionar(gesto.base, enBorde ? dx * 0.35 : dx, false);
  }

  function finalizarGesto(e, cancelado) {
    const gesto = gestoRef.current;
    if (!gesto || gesto.id !== e.pointerId) {
      return;
    }
    gestoRef.current = null;
    if (!gesto.movido) {
      return;
    }
    const dx = cancelado ? 0 : e.clientX - gesto.x;
    const umbral = anchoSlide() * UMBRAL_CAMBIO;
    let siguiente = gesto.base;
    if (dx < -umbral) {
      siguiente = gesto.base + 1;
    } else if (dx > umbral) {
      siguiente = gesto.base - 1;
    }
    siguiente = Math.max(0, Math.min(total - 1, siguiente));
    setIndice(siguiente);
    posicionar(siguiente, 0, true);
    // Evita que el clic final del arrastre active un punto
    bloquearClickRef.current = true;
    setTimeout(() => {
      bloquearClickRef.current = false;
    }, 250);
  }

  function clickPunto(i) {
    if (bloquearClickRef.current) {
      return;
    }
    setIndice(i);
  }

  function renderCurso(curso) {
    return (
      <article
        key={curso.codigo}
        className="welcome-section__curso"
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
                <span
                  className="welcome-section__trophy"
                  aria-hidden="true"
                >
                  <i className="bi bi-trophy"></i>
                </span>
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
            onClick={() => abrirMapaDeTemas(curso)}
          >
            <span>Ver temas</span>
            <span
              className="welcome-section__ver-temas-icon"
              aria-hidden="true"
            >
              <FlechaDerecha />
            </span>
          </button>
        </div>
      </article>
    );
  }

  function renderCategoria(categoria, posicion) {
    const cursosCategoria = cursosPorCategoria[categoria.id] || [];
    return (
      <section
        key={categoria.id}
        className={`welcome-section__slide welcome-section__category welcome-section__category--${categoria.id}`}
        style={{ flex: `0 0 ${100 / total}%` }}
        aria-hidden={posicion !== indice}
      >
        <h3 className="welcome-section__category-title">
          <i
            className={`bi ${categoria.iconoIzquierdo}`}
            aria-hidden="true"
          />
          <span>{categoria.titulo}</span>
          <i
            className={`bi ${categoria.iconoDerecho}`}
            aria-hidden="true"
          />
        </h3>
        <div className="welcome-section__carousel-row">
          {cursosCategoria.map((curso) => renderCurso(curso))}
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
                {temasCompletadosLista.length} /{" "}
                {totalTemas}
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
            <strong>{cursos.length} cursos</strong> y{" "}
            <strong>{totalTemas} temas</strong> para
            seguir avanzando.
          </p>

          <div
            className="welcome-section__carousel"
            onPointerDown={manejarPointerDown}
            onPointerMove={manejarPointerMove}
            onPointerUp={(e) => finalizarGesto(e, false)}
            onPointerCancel={(e) => finalizarGesto(e, true)}
            onDragStart={(e) => e.preventDefault()}
          >
            <div className="welcome-section__stage">
              <button
                type="button"
                className="welcome-section__carousel-arrow welcome-section__carousel-arrow--prev"
                onClick={() => irACategoria(indice - 1)}
                aria-label="Categoría anterior"
              >
                <FlechaIzquierda />
              </button>

              <div className="welcome-section__viewport">
                <div
                  className="welcome-section__track"
                  ref={trackRef}
                  style={{ width: `${total * 100}%` }}
                >
                  {CATEGORIAS.map((categoria, posicion) =>
                    renderCategoria(categoria, posicion)
                  )}
                </div>
              </div>

              <button
                type="button"
                className="welcome-section__carousel-arrow welcome-section__carousel-arrow--next"
                onClick={() => irACategoria(indice + 1)}
                aria-label="Categoría siguiente"
              >
                <FlechaDerecha />
              </button>
            </div>

            <div
              className="welcome-section__carousel-dots"
              role="tablist"
              aria-label="Categorías"
            >
              {CATEGORIAS.map((categoria, posicion) => (
                <button
                  key={`${categoria.id}-dot`}
                  type="button"
                  role="tab"
                  className={`welcome-section__carousel-dot${
                    posicion === indice
                      ? " welcome-section__carousel-dot--active"
                      : ""
                  }`}
                  onClick={() => clickPunto(posicion)}
                  aria-label={`Ver categoría ${categoria.titulo}`}
                  aria-selected={posicion === indice}
                  title={categoria.titulo}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}