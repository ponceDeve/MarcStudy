import React, { useEffect, useRef, useState } from "react";
import { buscarConPuntaje } from "../../lib/buscador";

function normalizarTexto(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function ResaltarCoincidencia({ texto, query }) {
  if (!query.trim()) return texto;

  const textoOriginal = String(texto ?? "");
  const busqueda = query.trim();
  const textoNormalizado = normalizarTexto(textoOriginal);
  const busquedaNormalizada = normalizarTexto(busqueda);

  if (!busquedaNormalizada) return textoOriginal;

  const indice = textoNormalizado.indexOf(busquedaNormalizada);

  if (indice === -1) return textoOriginal;

  const antes = textoOriginal.slice(0, indice);
  const coincidencia = textoOriginal.slice(
    indice,
    indice + busqueda.length
  );
  const despues = textoOriginal.slice(indice + busqueda.length);

  return (
    <>
      {antes}
      <span className="search-match">{coincidencia}</span>
      {despues}
    </>
  );
}

export default function TopicsModal({
  open,
  onClose,
  curso,
  temaActual,
  listaTemas = [],
  onSelectTema
}) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [inputEnfocado, setInputEnfocado] = useState(false);
  const [tamanoTitulo, setTamanoTitulo] = useState(null);
  const [columnas, setColumnas] = useState(6);
  const [estrellasPorTema, setEstrellasPorTema] = useState({});
  const tituloRef = useRef(null);
  const puntoInicioToque = useRef(null);
  const UMBRAL_ARRASTRE = 10;

  useEffect(() => {
    if (!open) {
      setBusqueda("");
      setActiveIndex(null);
      setInputEnfocado(false);
      return;
    }

    try {
      setEstrellasPorTema(
        JSON.parse(localStorage.getItem("estrellasTemas") || "{}")
      );
    } catch {
      setEstrellasPorTema({});
    }
  }, [open]);

  useEffect(() => {
    const actualizarColumnas = () => {
      const ancho = window.innerWidth;

      if (ancho <= 480) {
        setColumnas(3);
      } else if (ancho <= 768) {
        setColumnas(4);
      } else if (ancho <= 1024) {
        setColumnas(5);
      } else {
        setColumnas(6);
      }
    };

    actualizarColumnas();
    window.addEventListener("resize", actualizarColumnas);

    return () => {
      window.removeEventListener("resize", actualizarColumnas);
    };
  }, []);

  useEffect(() => {
    const ajustarTitulo = () => {
      const titulo = tituloRef.current;

      if (!titulo) return;

      const estilo = window.getComputedStyle(titulo);
      const tamanoOriginal = parseFloat(estilo.fontSize);

      if (!tamanoOriginal) return;

      titulo.style.fontSize = `${tamanoOriginal}px`;
      titulo.style.whiteSpace = "nowrap";

      const TAMANO_MINIMO = 18;
      let tamano = tamanoOriginal;

      while (
        titulo.scrollWidth > titulo.clientWidth &&
        tamano > TAMANO_MINIMO
      ) {
        tamano -= 0.5;
        titulo.style.fontSize = `${tamano}px`;
      }

      setTamanoTitulo(tamano);
    };

    ajustarTitulo();

    const observer = new ResizeObserver(ajustarTitulo);

    if (tituloRef.current) {
      observer.observe(tituloRef.current);
    }

    window.addEventListener("resize", ajustarTitulo);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", ajustarTitulo);
    };
  }, [curso, activeIndex, temaActual, open]);

  function manejarClickTema(item, index) {
    if (activeIndex === index) {
      onSelectTema(item);
      onClose();
      setActiveIndex(null);
      return;
    }

    setActiveIndex(index);
  }

  function manejarToqueInicial(item, e) {
    puntoInicioToque.current = {
      x: e.clientX,
      y: e.clientY
    };
  }

  function fueArrastre(e) {
    const inicio = puntoInicioToque.current;

    if (!inicio) return false;

    const dx = e.clientX - inicio.x;
    const dy = e.clientY - inicio.y;

    return Math.sqrt(dx * dx + dy * dy) > UMBRAL_ARRASTRE;
  }

  const temasConIndice = listaTemas.map((item, index) => ({
    item,
    index
  }));

  const temasFiltrados = busqueda.trim()
    ? buscarConPuntaje(
      temasConIndice,
      busqueda,
      ({ item }) => item.tema
    )
    : temasConIndice;

  const temaEnTitulo =
    activeIndex !== null
      ? listaTemas[activeIndex]?.tema
      : null;

  const filas = [];

  for (let i = 0; i < temasFiltrados.length; i += columnas) {
    const fila = temasFiltrados.slice(i, i + columnas);

    filas.push(fila);
  }

  return (
    <div
      className={`levels-modal ${open ? "" : "is-closed"}`}
      style={{ zIndex: 1000 }}
      onClick={() => setActiveIndex(null)}
      aria-hidden={!open}
    >
      <div
        className="levels-modal__inner"
        style={{ marginTop: 76 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          ref={tituloRef}
          className="levels-modal__title levels-modal__title--live"
          style={{
            ...(tamanoTitulo !== null
              ? { fontSize: `${tamanoTitulo}px` }
              : {}),
            whiteSpace: "nowrap"
          }}
        >
          {temaEnTitulo || `Temas de ${curso}`}
        </h2>

        <div className="levels-modal__search-row">
          <div
            className="home-search levels-modal__search"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              autoComplete="off"
              type="search"
              name="buscar-tema"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onFocus={() => setInputEnfocado(true)}
              onBlur={() =>
                setTimeout(() => setInputEnfocado(false), 150)
              }
              placeholder="Buscar tema por nombre..."
              className="home-search-input"
            />

            {inputEnfocado && (
              <div className="home-search-results">
                {temasFiltrados.length === 0 && (
                  <p className="search-empty">
                    Ningún tema coincide con "{busqueda}".
                  </p>
                )}

                {temasFiltrados.map(({ item, index }) => (
                  <button
                    key={index}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSelectTema(item);
                      onClose();
                    }}
                    className={`home-search-result ${item.tema === temaActual ? "is-focused" : ""
                      }`}
                  >
                    <p>
                      <ResaltarCoincidencia
                        texto={item.tema}
                        query={busqueda}
                      />
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            className="levels-modal__close"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>

        <div className="levels-map">
          {filas.map((fila, filaIndex) => (
            <div
              key={filaIndex}
              className={`levels-map__row ${filaIndex % 2 === 1
                  ? "levels-map__row--reverse"
                  : ""
                }`}
            >
              {fila.map(({ item, index }, posicion) => {
                const esTemaActual =
                  item.tema === temaActual;

                const esArmado =
                  activeIndex === index;

                const ultimoTema =
                  temasFiltrados[
                  temasFiltrados.length - 1
                  ];

                const esUltimoNivel =
                  ultimoTema &&
                  index === ultimoTema.index;

                const esFinalDeFila =
                  posicion === fila.length - 1;

                const esFinalDeConexion =
                  esFinalDeFila && !esUltimoNivel;

                const estrellasTema =
                  estrellasPorTema[
                    `${curso}_${item.tema}`
                  ]?.estrellas || 0;

                return (
                  <div
                    key={index}
                    className={`level-cell ${esFinalDeConexion ? "level-cell--row-end" : ""
                      } ${esUltimoNivel ? "level-cell--last" : ""
                      }`}
                  >
                    <button
                      className={`level-btn ${esTemaActual ? "is-current" : ""
                        } ${esArmado ? "is-armado" : ""
                        }`}
                      onPointerDown={(e) =>
                        manejarToqueInicial(item, e)
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        if (fueArrastre(e)) return;
                        manejarClickTema(item, index);
                      }}
                    >
                      <div
                        className="level-cell__estrellas"
                        aria-hidden="true"
                      >
                        {[1, 2, 3].map((n) => (
                          <span
                            key={n}
                            className={
                              n <= estrellasTema ? "is-activa" : ""
                            }
                          >
                            ★
                          </span>
                        ))}
                      </div>

                      <span className="level-btn__numero">
                        {index + 1}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="levels-modal__bottom-close">
          <button
            className="levels-modal__close"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>

        {listaTemas.length === 0 && (
          <p className="levels-modal__empty">
            No hay temas registrados para este curso.
          </p>
        )}
      </div>
    </div>
  );
}