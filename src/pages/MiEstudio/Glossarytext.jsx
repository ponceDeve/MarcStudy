import { useMemo, useRef, useState } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { useFloatingTooltip } from "../../hooks/useFloatingTooltip";

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

  const delimitadoresRegex =
    /\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$\$[\s\S]*?\$\$|\$[^$]*?\$/g;

  const partes = [];
  let ultimo = 0;
  let match;

  while ((match = delimitadoresRegex.exec(text)) !== null) {
    if (match.index > ultimo) {
      partes.push({
        tipo: "texto",
        valor: text.slice(ultimo, match.index)
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
      displayMode
    });

    ultimo = match.index + match[0].length;
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
      /(?:\\(?:frac|dfrac|tfrac|binom|sqrt|sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|sinh|cosh|tanh|log|ln|exp|max|min|lim|sum|prod|int|text|mathrm|mathbf|mathit|mathbb|overline|underline|vec|hat|bar|begin|end)\b(?:\s*(?:\{(?:[^{}]|\{[^{}]*\})*\}|\[[^\]]*\]|\([^)]*\)))*)|(?:[A-Za-z0-9]+(?:\^\{[^{}]+\}|\^[A-Za-z0-9]+|\_\{[^{}]+\}|_[A-Za-z0-9]+)+)/g;

    const subPartes = [];
    let ultimoFormula = 0;
    let formulaMatch;

    while (
      (formulaMatch = formulaRegex.exec(parte.valor)) !== null
    ) {
      const formula = formulaMatch[0];

      if (
        !formula.includes("\\") &&
        !formula.includes("^") &&
        !formula.includes("_")
      ) {
        continue;
      }

      if (formulaMatch.index > ultimoFormula) {
        subPartes.push(
          <span key={`${indice}-text-${ultimoFormula}`}>
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
        formulaMatch.index + formula.length;
    }

    if (ultimoFormula < parte.valor.length) {
      subPartes.push(
        <span key={`${indice}-text-end`}>
          {parte.valor.slice(ultimoFormula)}
        </span>
      );
    }

    resultado.push(
      <span key={`texto-${indice}`}>
        {subPartes.length > 0 ? subPartes : parte.valor}
      </span>
    );
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
        )
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
      key: keyOriginal
    });

    ultimoIndex =
      match.index + encontrado.length;

    if (match.index === regex.lastIndex) {
      regex.lastIndex++;
    }
  }

  if (ultimoIndex < texto.length) {
    partes.push({
      tipo: "texto",
      valor: texto.slice(ultimoIndex)
    });
  }

  return partes;
}

export default function GlossaryText({
  text,
  glosario = {}
}) {
  const [activo, setActivo] = useState(null);

  const triggerRefs = useRef({});
  const tooltipRefs = useRef({});

  const {
    visible,
    placement,
    mostrarEn,
    ocultar,
    ajustarPosicion
  } = useFloatingTooltip();

  const partes = useMemo(
    () => partirPorGlosario(text, glosario),
    [text, glosario]
  );

  const mostrarTooltip = (i) => {
    setActivo(i);
    mostrarEn();

    requestAnimationFrame(() => {
      ajustarPosicion(
        triggerRefs.current[i],
        tooltipRefs.current[i]
      );
    });
  };

  const ocultarTooltip = () => {
    setActivo(null);
    ocultar();
  };

  return (
    <span
      onClick={() => {
        setActivo(null);
        ocultar();
      }}
    >
      {partes.map((parte, i) => {
        if (parte.tipo === "texto") {
          return (
            <span key={i}>
              {renderLatex(parte.valor)}
            </span>
          );
        }

        const esVisible =
          visible && activo === i;

        return (
          <span
            key={i}
            className="glossary-term-wrap"
            onMouseEnter={() => {
              mostrarTooltip(i);
            }}
            onMouseLeave={() => {
              ocultarTooltip();
            }}
            onClick={(e) => {
              e.stopPropagation();

              if (activo === i) {
                ocultarTooltip();
              } else {
                mostrarTooltip(i);
              }
            }}
          >
            <span
              ref={(el) => {
                triggerRefs.current[i] = el;
              }}
              className="glossary-term"
            >
              {renderLatex(parte.valor)}
            </span>

            {esVisible && (
              <span
                ref={(el) => {
                  tooltipRefs.current[i] = el;
                }}
                className={`glossary-tooltip glossary-tooltip--${placement}`}
              >
                {renderLatex(glosario[parte.key])}
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}