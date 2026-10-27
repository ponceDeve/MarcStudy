import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { createPortal } from "react-dom";
import katex from "katex";
import "katex/dist/katex.min.css";
import { useFloatingTooltip } from "../../hooks/useFloatingTooltip";
import { SIMBOLOS_NOTACION } from "../../lib/simbolosNotacion";
/* ============================================================
   AJUSTES DEL GLOSARIO (cambia aquí los tiempos)
   ============================================================ */
// Segundos que la nube se queda visible antes de empezar a desvanecerse.
const MS_VISIBLE = 6000;
// Duración del desvanecimiento (el CSS lo toma de --glossary-fade).
const MS_DESVANECER = 400;
// Tras el autocierre no se puede volver a abrir durante este tiempo.
const MS_BLOQUEO = 800;
// Clics seguidos sobre la misma palabra para mandarla a ChatGPT...
const CLICS_PARA_CHATGPT = 5;
// ...y tiempo máximo entre un clic y el siguiente para que cuenten juntos.
const MS_ENTRE_CLICS = 500;
// Abrir la nube al pasar el mouse (desactivado: solo se abre con clic).
const ABRIR_POR_HOVER = false;
// Un clic extra sobre la palabra ya abierta la cierra (desactivado).
const CLIC_REPETIDO_CIERRA = false;
function preguntarAChatGPT(palabra, significado) {
  const base = `Explícame qué significa «${palabra}» de forma clara y breve, con un ejemplo corto. Estoy preparando el examen de admisión a la universidad. Que no me quede con dudas, pero sin rodeos.`;
  const contexto = significado
    ? ` En mi glosario aparece así: ${significado}`
    : "";
  window.open(
    `https://chatgpt.com/?q=${encodeURIComponent(base + contexto)}`,
    "_blank",
    "noopener,noreferrer"
  );
}
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function renderFormula(formula, key, displayMode = false) {
  try {
    return (
      <span
        key={key}
        dangerouslySetInnerHTML={{
          __html: katex.renderToString(formula, {
            throwOnError: false,
            displayMode
          })
        }}
      />
    );
  } catch {
    return <span key={key}>{formula}</span>;
  }
}
function renderLatex(text) {
  if (!text) return "";
  const partes = [];
  let ultimo = 0;
  const delimitadoresRegex =
    /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g;
  let match;
  while (
    (match = delimitadoresRegex.exec(text)) !== null
  ) {
    if (match.index > ultimo) {
      partes.push({
        tipo: "texto",
        valor: text.slice(
          ultimo,
          match.index
        )
      });
    }
    const delimitador = match[0];
    let formula = delimitador;
    let displayMode = false;
    if (
      delimitador.startsWith("$$") &&
      delimitador.endsWith("$$")
    ) {
      formula = delimitador.slice(2, -2);
      displayMode = true;
    } else if (
      delimitador.startsWith("\\[") &&
      delimitador.endsWith("\\]")
    ) {
      formula = delimitador.slice(2, -2);
      displayMode = true;
    } else if (
      delimitador.startsWith("\\(") &&
      delimitador.endsWith("\\)")
    ) {
      formula = delimitador.slice(2, -2);
    } else if (
      delimitador.startsWith("$") &&
      delimitador.endsWith("$")
    ) {
      formula = delimitador.slice(1, -1);
    }
    partes.push({
      tipo: "formula",
      valor: formula,
      displayMode
    });
    ultimo =
      match.index + delimitador.length;
  }
  if (ultimo < text.length) {
    partes.push({
      tipo: "texto",
      valor: text.slice(ultimo)
    });
  }
  if (partes.length === 0) {
    partes.push({
      tipo: "texto",
      valor: text
    });
  }
  const resultado = [];
  partes.forEach((parte, indice) => {
    if (parte.tipo === "formula") {
      resultado.push(
        renderFormula(
          parte.valor,
          `formula-${indice}`,
          parte.displayMode
        )
      );
      return;
    }
    const formulaRegex =
      /\\(?:frac|dfrac|tfrac|binom|sqrt|sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|sinh|cosh|tanh|log|ln|exp|max|min|lim|sum|prod|int|text|mathrm|mathbf|mathit|mathbb|overline|underline|vec|hat|bar|infty|in|leq|geq|neq|approx|pm|mp|times|div|cdot|cup|cap|triangle|subset|subseteq|supset|supseteq|forall|exists|to|rightarrow|left|right|begin|end)(?:\s*(?:\{[^{}]*\}|\[[^\]]*\]|\([^)]*\)))?|[A-Za-z0-9]+(?:\^\{[^{}]+\}|\^[A-Za-z0-9]+|\_\{[^{}]+\}|_[A-Za-z0-9]+)+/g;
    const subPartes = [];
    let ultimoFormula = 0;
    let formulaMatch;
    while (
      (formulaMatch =
        formulaRegex.exec(parte.valor)) !== null
    ) {
      const formula = formulaMatch[0];
      if (
        !formula.includes("\\") &&
        !formula.includes("^") &&
        !formula.includes("_")
      ) {
        continue;
      }
      if (
        formulaMatch.index >
        ultimoFormula
      ) {
        subPartes.push(
          <span
            key={`${indice}-text-${ultimoFormula}`}
          >
            {parte.valor.slice(
              ultimoFormula,
              formulaMatch.index
            )}
          </span>
        );
      }
      subPartes.push(
        renderFormula(
          formula,
          `${indice}-latex-${formulaMatch.index}`
        )
      );
      ultimoFormula =
        formulaMatch.index +
        formula.length;
    }
    if (
      ultimoFormula <
      parte.valor.length
    ) {
      subPartes.push(
        <span
          key={`${indice}-text-end`}
        >
          {parte.valor.slice(
            ultimoFormula
          )}
        </span>
      );
    }
    resultado.push(
      <span key={`texto-${indice}`}>
        {subPartes.length > 0
          ? subPartes
          : parte.valor}
      </span>
    );
  });
  return resultado;
}
function esSimbolo(termino) {
  return !/[a-zA-ZÀ-ÿ0-9]/.test(termino);
}
/**
 * Separa el texto en fórmulas $...$ (u otros delimitadores LaTeX)
 * y texto normal. Se ejecuta SIEMPRE antes que el glosario: un
 * símbolo como "+" o "=" dentro de una fórmula no debe cortarla,
 * así que el glosario nunca debe ver el contenido de una fórmula.
 */
function separarPorFormulas(texto) {
  const partes = [];
  let ultimo = 0;
  let match;
  const delimitadoresRegex =
    /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g;
  while (
    (match = delimitadoresRegex.exec(texto)) !== null
  ) {
    if (match.index > ultimo) {
      partes.push({
        tipo: "texto",
        valor: texto.slice(ultimo, match.index)
      });
    }
    const delimitador = match[0];
    let formula = delimitador;
    let displayMode = false;
    if (
      delimitador.startsWith("$$") &&
      delimitador.endsWith("$$")
    ) {
      formula = delimitador.slice(2, -2);
      displayMode = true;
    } else if (
      delimitador.startsWith("\\[") &&
      delimitador.endsWith("\\]")
    ) {
      formula = delimitador.slice(2, -2);
      displayMode = true;
    } else if (
      delimitador.startsWith("\\(") &&
      delimitador.endsWith("\\)")
    ) {
      formula = delimitador.slice(2, -2);
    } else if (
      delimitador.startsWith("$") &&
      delimitador.endsWith("$")
    ) {
      formula = delimitador.slice(1, -1);
    }
    partes.push({
      tipo: "formula",
      valor: formula,
      displayMode
    });
    ultimo = match.index + delimitador.length;
  }
  if (ultimo < texto.length) {
    partes.push({
      tipo: "texto",
      valor: texto.slice(ultimo)
    });
  }
  if (partes.length === 0) {
    partes.push({
      tipo: "texto",
      valor: texto
    });
  }
  return partes;
}
function partirPorGlosario(
  texto,
  glosarioCombinado
) {
  const claves = Object.keys(
    glosarioCombinado || {}
  ).filter(Boolean);
  if (
    !texto ||
    claves.length === 0
  ) {
    return [
      {
        tipo: "texto",
        valor: texto
      }
    ];
  }
  const ordenadas = [...claves].sort(
    (a, b) =>
      b.length - a.length
  );
  const patrones =
    ordenadas.map((k) => {
      const esPalabra =
        /^[a-zA-ZÀ-ÿ0-9\s]+$/.test(k);
      const escaped =
        escapeRegExp(k);
      return esPalabra
        ? `\\b${escaped}\\b`
        : escaped;
    });
  const regex = new RegExp(
    `(${patrones.join("|")})`,
    "giu"
  );
  const partes = [];
  let ultimoIndex = 0;
  let match;
  while (
    (match = regex.exec(texto)) !== null
  ) {
    if (
      match.index >
      ultimoIndex
    ) {
      partes.push({
        tipo: "texto",
        valor: texto.slice(
          ultimoIndex,
          match.index
        )
      });
    }
    const encontrado =
      match[0];
    const keyOriginal =
      ordenadas.find(
        (k) =>
          k.toLowerCase() ===
          encontrado.toLowerCase()
      );
    partes.push({
      tipo: "termino",
      valor: encontrado,
      key: keyOriginal
    });
    ultimoIndex =
      match.index +
      encontrado.length;
    if (
      match.index ===
      regex.lastIndex
    ) {
      regex.lastIndex++;
    }
  }
  if (
    ultimoIndex <
    texto.length
  ) {
    partes.push({
      tipo: "texto",
      valor: texto.slice(
        ultimoIndex
      )
    });
  }
  return partes;
}
/**
 * Une los dos pasos en el orden correcto: primero separa fórmulas,
 * y el glosario solo se aplica dentro de los pedazos de texto
 * normal (nunca dentro de una fórmula).
 */
function construirPartes(texto, glosarioCombinado) {
  const partes = [];
  separarPorFormulas(texto).forEach((parte) => {
    if (parte.tipo === "formula") {
      partes.push(parte);
      return;
    }
    partirPorGlosario(
      parte.valor,
      glosarioCombinado
    ).forEach((sub) => {
      partes.push(sub);
    });
  });
  return partes;
}
export default function GlossaryText({
  text,
  glosario = {}
}) {
  const [activo, setActivo] = useState(null);
  // fijado: abierta con clic/toque (no se cierra al salir con el mouse).
  const [fijado, setFijado] = useState(false);
  // saliendo: la nube ya empezó a desvanecerse (autocierre).
  const [saliendo, setSaliendo] = useState(false);
  // Hasta cuándo no se deja abrir (bloqueo posterior al autocierre).
  const bloqueoHasta = useRef(0);
  // Conteo de clics rápidos sobre una misma palabra.
  const clics = useRef({ i: null, n: 0, t: 0 });
  const triggerRefs = useRef({});
  const tooltipRefs = useRef({});
  const {
    visible,
    pos,
    mostrarEn,
    ocultar,
    ajustarPosicion
  } = useFloatingTooltip();
  const glosarioCombinado = useMemo(
    () => ({
      ...SIMBOLOS_NOTACION,
      ...(glosario || {})
    }),
    [glosario]
  );
  const partes = useMemo(
    () => construirPartes(text, glosarioCombinado),
    [text, glosarioCombinado]
  );
  const mostrarTooltip = (i, porClic) => {
    // Si la nube ya está abierta para esta palabra (por hover), solo se
    // fija. Volver a "mostrarla" la dejaría sin medir y oculta.
    if (activo === i) {
      setFijado(porClic);
      return;
    }
    setSaliendo(false);
    setActivo(i);
    setFijado(porClic);
    mostrarEn();
  };
  const ocultarTooltip = () => {
    setActivo(null);
    setFijado(false);
    setSaliendo(false);
    ocultar();
  };
  // Se posiciona DESPUÉS de que la nube existe en el DOM (antes se
  // hacía en un requestAnimationFrame que a veces corría antes, y la
  // nube quedaba oculta hasta volver a tocar la palabra).
  // Se mide también cada vez que la nube se muestra (visible), no solo
  // cuando cambia la palabra. Así siempre queda con su posición real.
  useLayoutEffect(() => {
    if (activo === null || !visible) return;
    ajustarPosicion(
      triggerRefs.current[activo],
      tooltipRefs.current[activo]
    );
  }, [activo, visible, ajustarPosicion]);
  // Con la nube abierta por clic, tocar en cualquier otro lugar la cierra.
  useEffect(() => {
    if (activo === null) return;
    const alPresionar = (e) => {
      if (e.target.closest && e.target.closest(".glossary-term-wrap")) {
        return;
      }
      setActivo(null);
      setFijado(false);
      ocultar();
    };
    document.addEventListener("pointerdown", alPresionar);
    return () =>
      document.removeEventListener("pointerdown", alPresionar);
  }, [activo, ocultar]);
  // Mientras la nube está abierta: recolocarla si cambia la pantalla
  // y cerrarla al hacer scroll (está fija en pantalla, no sigue a la palabra).
  useEffect(() => {
    if (activo === null) return;
    const alResize = () =>
      ajustarPosicion(
        triggerRefs.current[activo],
        tooltipRefs.current[activo]
      );
    // Solo se cierra si la palabra de verdad se movió en la pantalla.
    // Un evento de scroll sin movimiento (p. ej. el que dispara el
    // propio toque en celular) no debe cerrar la nube recién abierta.
    const trigger = triggerRefs.current[activo];
    const posInicial = trigger?.getBoundingClientRect();
    const alScroll = () => {
      const actual = triggerRefs.current[activo];
      if (!actual || !posInicial) return;
      const r = actual.getBoundingClientRect();
      if (
        Math.abs(r.top - posInicial.top) > 6 ||
        Math.abs(r.left - posInicial.left) > 6
      ) {
        setActivo(null);
        setFijado(false);
        ocultar();
      }
    };
    window.addEventListener("resize", alResize);
    window.addEventListener("scroll", alScroll, true);
    return () => {
      window.removeEventListener("resize", alResize);
      window.removeEventListener("scroll", alScroll, true);
    };
  }, [activo, ajustarPosicion, ocultar]);
  // Autocierre: pasado MS_VISIBLE empieza el desvanecimiento.
  useEffect(() => {
    if (activo === null) return;
    const t = setTimeout(() => setSaliendo(true), MS_VISIBLE);
    return () => clearTimeout(t);
  }, [activo]);
  // Al terminar el desvanecimiento se cierra y se bloquea un momento.
  useEffect(() => {
    if (activo === null || !saliendo) return;
    const t = setTimeout(() => {
      bloqueoHasta.current = Date.now() + MS_BLOQUEO;
      clics.current = { i: null, n: 0, t: 0 };
      setActivo(null);
      setFijado(false);
      setSaliendo(false);
      ocultar();
    }, MS_DESVANECER);
    return () => clearTimeout(t);
  }, [activo, saliendo, ocultar]);
  return (
    <span
      onClick={() => {
        ocultarTooltip();
      }}
    >
      {partes.map((parte, i) => {
        if (parte.tipo === "formula") {
          return renderFormula(
            parte.valor,
            `formula-${i}`,
            parte.displayMode
          );
        }
        if (parte.tipo === "texto") {
          return (
            <span key={i}>{renderLatex(parte.valor)}</span>
          );
        }
        const esVisible = visible && activo === i;
        const simbolo = esSimbolo(parte.valor);
        // Hover: se conserva el código, pero solo se conecta si
        // ABRIR_POR_HOVER es true.
        const eventosHover = ABRIR_POR_HOVER
          ? {
              onMouseEnter: () => {
                // Pasar el mouse muestra la nube, también si antes se dejó
                // otra abierta con clic.
                if (!(fijado && activo === i)) {
                  mostrarTooltip(i, false);
                }
              },
              onMouseOver: () => {
                // Respaldo: si el navegador no envía "entrar", el movimiento
                // sobre la palabra también la muestra.
                if (activo !== i && !(fijado && activo === i)) {
                  mostrarTooltip(i, false);
                }
              },
              onMouseLeave: () => {
                if (activo === i && !fijado) {
                  ocultarTooltip();
                }
              }
            }
          : {};
        return (
          <span
            key={i}
            className="glossary-term-wrap"
            {...eventosHover}
            onClick={(e) => {
              e.stopPropagation();
              // En la teoría la palabra está dentro de un <label>: sin esto,
              // el clic marca el checkbox del punto y vuelve a dibujarlo.
              e.preventDefault();
              const ahora = Date.now();
              // Justo después del autocierre no se deja abrir de nuevo.
              if (ahora < bloqueoHasta.current) return;
              // Cuenta de clics rápidos sobre la misma palabra.
              const c = clics.current;
              if (c.i === i && ahora - c.t <= MS_ENTRE_CLICS) {
                c.n += 1;
              } else {
                c.i = i;
                c.n = 1;
              }
              c.t = ahora;
              if (c.n >= CLICS_PARA_CHATGPT) {
                clics.current = { i: null, n: 0, t: 0 };
                ocultarTooltip();
                preguntarAChatGPT(
                  parte.valor,
                  glosarioCombinado[parte.key]
                );
                return;
              }
              // Si ya está abierta no se cierra ni se reabre:
              // el clic solo suma al conteo.
              if (activo === i) {
                if (CLIC_REPETIDO_CIERRA && fijado) ocultarTooltip();
                return;
              }
              mostrarTooltip(i, true);
            }}
          >
            <span
              ref={(el) => {
                triggerRefs.current[i] = el;
              }}
              className={`glossary-term${
                simbolo ? " glossary-term--simbolo" : ""
              }`}
            >
              {renderLatex(parte.valor)}
            </span>
            {esVisible &&
              createPortal(
                <span
                  ref={(el) => {
                    tooltipRefs.current[i] = el;
                  }}
                  className={`glossary-tooltip${
                    pos.below ? " glossary-tooltip--below" : ""
                  }${saliendo ? " glossary-tooltip--saliendo" : ""}`}
                  style={{
                    left: `${pos.left}px`,
                    top: `${pos.top}px`,
                    "--tt-arrow": `${pos.arrow}px`,
                    "--glossary-fade": `${MS_DESVANECER}ms`
                  }}
                >
                  <span className="glossary-tooltip__arrow" />
                  {renderLatex(glosarioCombinado[parte.key])}
                </span>,
                document.body
              )}
          </span>
        );
      })}
    </span>
  );
}