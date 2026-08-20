import katex from "katex";
import "katex/dist/katex.min.css";

/**
 * Convierte una expresión LaTeX a HTML usando KaTeX.
 */
function renderFormula(formula, key, displayMode = false) {
  try {
    const html = katex.renderToString(formula, {
      throwOnError: false,
      displayMode,
      strict: false,
      trust: false,
    });

    return (
      <span
        key={key}
        dangerouslySetInnerHTML={{
          __html: html,
        }}
      />
    );
  } catch {
    return (
      <span key={key}>
        {formula}
      </span>
    );
  }
}

/**
 * Busca fórmulas delimitadas explícitamente:
 *
 * $...$
 * $$...$$
 * \(...\)
 * \[...\]
 */
function separarDelimitadores(texto) {
  const partes = [];

  const regex =
    /\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$\$[\s\S]*?\$\$|\$[^$\n]*?\$/g;

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

    ultimoIndex =
      match.index + match[0].length;
  }

  if (ultimoIndex < texto.length) {
    partes.push({
      tipo: "texto",
      valor: texto.slice(ultimoIndex),
    });
  }

  if (partes.length === 0) {
    partes.push({
      tipo: "texto",
      valor: texto,
    });
  }

  return partes;
}

/**
 * Busca expresiones LaTeX que aparecen dentro de
 * texto sin delimitadores explícitos.
 *
 * Ejemplos:
 *
 * \frac{a}{b}
 * \sqrt{x}
 * x^2
 * x_{1}
 * P_1V_1
 * \cdot
 * \text{mol}
 */
function separarLatexInterno(texto) {
  const partes = [];

  /*
   * Comandos LaTeX frecuentes en tus JSON.
   */
  const comandos =
    "\\(?:frac|dfrac|tfrac|binom|sqrt|sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|sinh|cosh|tanh|log|ln|exp|max|min|lim|sum|prod|int|text|mathrm|mathbf|mathit|mathbb|overline|underline|vec|hat|bar|cdot|times|pm|leq|geq|neq|approx|rightarrow|left|right|begin|end)";

  /*
   * Una expresión que contiene subíndice o superíndice.
   *
   * Ejemplos:
   * x^2
   * x^{2}
   * P_1
   * P_{1}
   * H_2O
   */
  const potenciaSubindice =
    "[A-Za-z0-9]+(?:\\^\\{[^{}]*\\}|\\^[A-Za-z0-9]+|_\\{[^{}]*\\}|_[A-Za-z0-9]+)+";

  /*
   * Comandos con sus argumentos.
   */
  const comandoConArgumentos =
    `${comandos}(?:\\s*(?:\\{(?:[^{}]|\\{[^{}]*\\})*\\}|\\[[^\\]]*\\]|\\([^)]*\\)))*`;

  const regex = new RegExp(
    `${comandoConArgumentos}|${potenciaSubindice}`,
    "g"
  );

  let ultimoIndex = 0;
  let match;

  while ((match = regex.exec(texto)) !== null) {
    const formula = match[0];

    /*
     * Evitamos convertir palabras normales.
     */
    if (
      !formula.includes("\\") &&
      !formula.includes("^") &&
      !formula.includes("_")
    ) {
      continue;
    }

    if (match.index > ultimoIndex) {
      partes.push({
        tipo: "texto",
        valor: texto.slice(
          ultimoIndex,
          match.index
        ),
      });
    }

    partes.push({
      tipo: "formula",
      valor: formula,
      displayMode: false,
    });

    ultimoIndex =
      match.index + formula.length;
  }

  if (ultimoIndex < texto.length) {
    partes.push({
      tipo: "texto",
      valor: texto.slice(ultimoIndex),
    });
  }

  if (partes.length === 0) {
    partes.push({
      tipo: "texto",
      valor: texto,
    });
  }

  return partes;
}

/**
 * Renderiza texto + fórmulas LaTeX.
 */
function renderLatex(texto) {
  if (texto === null || texto === undefined) {
    return null;
  }

  if (typeof texto !== "string") {
    texto = String(texto);
  }

  if (!texto) {
    return "";
  }

  const partes = separarDelimitadores(texto);

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

    const internas =
      separarLatexInterno(parte.valor);

    internas.forEach((subParte, subIndice) => {
      if (subParte.tipo === "formula") {
        resultado.push(
          renderFormula(
            subParte.valor,
            `inline-${indice}-${subIndice}`,
            false
          )
        );
      } else {
        resultado.push(
          <span
            key={`texto-${indice}-${subIndice}`}
          >
            {subParte.valor}
          </span>
        );
      }
    });
  });

  return resultado;
}

/**
 * Componente público.
 *
 * Uso:
 *
 * <LatexText>
 *   La fórmula es $PV=nRT$.
 * </LatexText>
 */
export default function LatexText({
  children,
  className = "",
}) {
  if (
    children === null ||
    children === undefined
  ) {
    return null;
  }

  const texto =
    typeof children === "string"
      ? children
      : String(children);

  return (
    <span className={className}>
      {renderLatex(texto)}
    </span>
  );
}