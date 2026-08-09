import { useMemo, useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { useFloatingTooltip } from "../../hooks/useFloatingTooltip";

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Renderiza una expresión LaTeX utilizando KaTeX.
 */
function renderFormula(formula, key, displayMode = false) {
  try {
    return (
      <span
        key={key}
        dangerouslySetInnerHTML={{
          __html: katex.renderToString(formula, {
            throwOnError: false,
            displayMode,
          }),
        }}
      />
    );
  } catch {
    return <span key={key}>{formula}</span>;
  }
}

/**
 * Detecta fórmulas LaTeX:
 *
 * $...$
 * $$...$$
 * \(...\)
 * \[...\]
 *
 * También detecta expresiones LaTeX escritas directamente,
 * por ejemplo:
 *
 * \frac{1}{4} - \frac{1}{5} = \frac{1}{20}
 * \sin(2x)=2\sin(x)\cos(x)
 * x^2 + y^2 = z^2
 */
function renderLatex(text) {
  if (!text) return "";

  /*
   * Primero buscamos expresiones delimitadas explícitamente.
   * Esto tiene prioridad porque permite que el usuario escriba
   * cualquier expresión LaTeX sin depender del detector automático.
   */
  const delimitadoresRegex =
    /(\\[[\s\S]*?\\]|\\([\s\S]*?\\)|\$\$[\s\S]*?\$\$|\$[^$]*\$)/g;

  const partes = [];
  let ultimo = 0;
  let match;

  while ((match = delimitadoresRegex.exec(text)) !== null) {
    if (match.index > ultimo) {
      partes.push({
        tipo: "texto",
        valor: text.slice(ultimo, match.index),
      });
    }

    let formula = match[0];
    let displayMode = false;

    if (formula.startsWith("\\[")) {
      formula = formula.slice(2, -2);
      displayMode = true;
    } else if (formula.startsWith("\\(")) {
      formula = formula.slice(2, -2);
    } else if (formula.startsWith("$$")) {
      formula = formula.slice(2, -2);
      displayMode = true;
    } else if (formula.startsWith("$")) {
      formula = formula.slice(1, -1);
    }

    partes.push({
      tipo: "formula",
      valor: formula,
      displayMode,
    });

    ultimo = match.index + match[0].length;
  }

  if (ultimo < text.length) {
    partes.push({
      tipo: "texto",
      valor: text.slice(ultimo),
    });
  }

  /*
   * Si no encontramos delimitadores, todo el contenido pasa
   * por el detector automático de LaTeX.
   */
  if (partes.length === 0) {
    partes.push({
      tipo: "texto",
      valor: text,
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

    /*
     * Detecta expresiones LaTeX que están escritas directamente
     * en el texto, sin $...$.
     *
     * Ejemplos:
     *
     * \frac{1}{4}
     * \frac{a}{b}
     * \sin(x)
     * \cos(x)
     * \tan(x)
     * \sqrt{x}
     * x^2
     * x_1
     * \log(x)
     * \ln(x)
     * \sum_{i=1}^{n}
     */
    const formulaRegex =
      /(?:\\(?:frac|dfrac|tfrac|binom|sqrt|sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|sinh|cosh|tanh|log|ln|exp|max|min|lim|sum|prod|int|text|mathrm|mathbf|mathit|mathbb|overline|underline|vec|hat|bar|begin|end)\b(?:\s*(?:\{(?:[^{}]|\{[^{}]*\})*\}|\[[^\]]*\]|\([^)]*\)))*)|(?:[A-Za-z0-9]+(?:\^\{[^{}]+\}|\^[A-Za-z0-9]+|_\{[^{}]+\}|_[A-Za-z0-9]+)+)/g;

    const subPartes = [];
    let ultimoFormula = 0;
    let formulaMatch;

    while (
      (formulaMatch = formulaRegex.exec(parte.valor)) !== null
    ) {
      const formula = formulaMatch[0];

      /*
       * Evita intentar convertir una palabra normal que no sea
       * realmente una expresión matemática.
       */
      const esComandoLatex =
        formula.includes("\\") ||
        formula.includes("^") ||
        formula.includes("_");

      if (!esComandoLatex) {
        continue;
      }

      if (formulaMatch.index > ultimoFormula) {
        subPartes.push(
          <span key={`${indice}-text-${ultimoFormula}`}>
            {parte.valor.slice(ultimoFormula, formulaMatch.index)}
          </span>
        );
      }

      subPartes.push(
        renderFormula(
          formula,
          `${indice}-latex-${formulaMatch.index}`,
          false
        )
      );

      ultimoFormula =
        formulaMatch.index + formula.length;
    }

    if (ultimoFormula < parte.valor.length) {
      subPartes.push(
        <span key={`${indice}-text-end`}>
          {parte.valor.slice(ultimoFormula)}
        </span>
      );
    }

    if (subPartes.length > 0) {
      resultado.push(
        <span key={`texto-${indice}`}>
          {subPartes}
        </span>
      );
    } else {
      resultado.push(
        <span key={`texto-${indice}`}>
          {parte.valor}
        </span>
      );
    }
  });

  return resultado;
}

function partirPorGlosario(texto, glosario) {
  const claves = Object.keys(glosario || {}).filter(Boolean);

  if (!texto || claves.length === 0) {
    return [{ tipo: "texto", valor: texto }];
  }

  const ordenadas = [...claves].sort(
    (a, b) => b.length - a.length
  );

  const patrones = ordenadas.map((k) => {
    const esPalabra = /^[a-zA-ZÀ-ÿ0-9\s]+$/.test(k);
    const escaped = escapeRegExp(k);

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

  while ((match = regex.exec(texto)) !== null) {
    if (match.index > ultimoIndex) {
      partes.push({
        tipo: "texto",
        valor: texto.slice(
          ultimoIndex,
          match.index
        ),
      });
    }

    const encontrado = match[0];

    const keyOriginal = ordenadas.find(
      (k) =>
        k.toLowerCase() ===
        encontrado.toLowerCase()
    );

    partes.push({
      tipo: "termino",
      valor: encontrado,
      key: keyOriginal,
    });

    ultimoIndex =
      match.index + encontrado.length;

    if (match.index === regex.lastIndex) {
      regex.lastIndex += 1;
    }
  }

  if (ultimoIndex < texto.length) {
    partes.push({
      tipo: "texto",
      valor: texto.slice(ultimoIndex),
    });
  }

  return partes;
}

export default function GlossaryText({
  text,
  glosario = {},
}) {
  const [activo, setActivo] = useState(null);

  const {
    pos,
    mostrarEn,
    ocultar,
  } = useFloatingTooltip(280);

  const partes = useMemo(
    () => partirPorGlosario(text, glosario),
    [text, glosario]
  );

  return (
    <span
      onClick={() => {
        setActivo(null);
        ocultar();
      }}
    >
      {partes.map((parte, i) => {
        /*
         * Texto normal:
         * aquí también se procesa LaTeX.
         */
        if (parte.tipo === "texto") {
          return (
            <span key={i}>
              {renderLatex(parte.valor)}
            </span>
          );
        }

        const visible = activo === i;

        return (
          <span
            key={i}
            className="glossary-term-wrap"
          >
            <span
              className="glossary-term"
              onMouseEnter={(e) => {
                setActivo(i);
                mostrarEn(e.currentTarget);
              }}
              onMouseLeave={() => {
                setActivo((cur) =>
                  cur === i ? null : cur
                );
                ocultar();
              }}
              onClick={(e) => {
                e.stopPropagation();

                if (activo === i) {
                  setActivo(null);
                  ocultar();
                } else {
                  setActivo(i);
                  mostrarEn(e.currentTarget);
                }
              }}
            >
              {renderLatex(parte.valor)}
            </span>

            {visible && pos && (
              <span
                className="glossary-tooltip"
                style={{
                  position: "fixed",
                  top: pos.top,
                  left: pos.left,
                  transform:
                    "translate(-50%, -100%)",
                  bottom: "auto",
                }}
              >
                {renderLatex(
                  glosario[parte.key]
                )}
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}