import {
  buscarPosicion,
  extraerFragmento,
  normalizarTexto,
} from "../../lib/buscador";
/* ============================================================
   RESALTAR COINCIDENCIA
   ============================================================ */
// Resalta una coincidencia literal dentro de un texto.
export function ResaltarCoincidencia({ texto, query }) {
  if (!query.trim()) {
    return texto;
  }
  const textoOriginal = String(texto ?? "");
  const busqueda = query.trim();
  const textoNormalizado = normalizarTexto(textoOriginal);
  const busquedaNormalizada = normalizarTexto(busqueda);
  if (!busquedaNormalizada) {
    return textoOriginal;
  }
  const indice = textoNormalizado.indexOf(busquedaNormalizada);
  if (indice === -1) {
    return textoOriginal;
  }
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
/* ============================================================
   RESALTAR FRAGMENTO
   ============================================================ */
// Resalta una coincidencia dentro de un fragmento ya recortado.
function ResaltarFragmento({ fragmento, indice, largoCoincidencia }) {
  if (indice == null || indice < 0) {
    return fragmento;
  }
  const antes = fragmento.slice(0, indice);
  const coincidencia = fragmento.slice(
    indice,
    indice + largoCoincidencia
  );
  const despues = fragmento.slice(indice + largoCoincidencia);
  if (!coincidencia) {
    return fragmento;
  }
  return (
    <>
      {antes}
      <span className="search-match">{coincidencia}</span>
      {despues}
    </>
  );
}
/* ============================================================
   ARMAR FRAGMENTO DE EXPLICACIÓN
   ============================================================ */
// Busca dónde está la coincidencia dentro de la explicación
// original y luego recalcula su posición dentro del fragmento.
function armarFragmentoExplicacion(explicacion, query) {
  const indiceOriginal = buscarPosicion(explicacion, query);
  const fragmento = extraerFragmento(explicacion, indiceOriginal);
  if (indiceOriginal == null) {
    return {
      fragmento,
      indice: null,
      largo: 0,
    };
  }
  const queryLimpia = query.trim();
  const indiceEnFragmento = buscarPosicion(
    fragmento,
    queryLimpia
  );
  return {
    fragmento,
    indice: indiceEnFragmento,
    largo: queryLimpia.length,
  };
}
/* ============================================================
   RESULTADOS
   ============================================================ */
// Dropdown con las sugerencias del buscador de teoría.
export default function ResultadosTeoria({
  resultadosVisibles,
  queryBuscada,
  focusedIdx,
  busquedaLista,
  buscandoSemantico,
  onElegir,
}) {
  return (
    <div className="theory-search__dropdown">
      {resultadosVisibles.length > 0 ? (
        resultadosVisibles.map((r, idx) => {
          const { punto, matchTitulo, matchTexto, matchExplicacion } = r;
          // Fragmento de explicación: solo si la coincidencia está
          // únicamente en la explicación.
          const soloExplicacion =
            !!matchExplicacion && !matchTitulo && !matchTexto;
          const datosFragmento = soloExplicacion
            ? armarFragmentoExplicacion(punto.explicacion || "", queryBuscada)
            : null;
          return (
            <button
              key={punto.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onElegir(r)}
              className={`theory-search__item ${idx === focusedIdx ? "is-focused" : ""}`}
            >
              {r.esSemantico ? (
                <span>{punto.texto || punto.explicacion}</span>
              ) : matchTitulo ? (
                <>
                  <span className="theory-search__item-seccion">
                    <ResaltarCoincidencia
                      texto={punto.seccionTitulo}
                      query={queryBuscada}
                    />
                  </span>
                  {punto.texto ? (
                    <span className="theory-search__item-texto">
                      {punto.texto}
                    </span>
                  ) : null}
                </>
              ) : matchTexto ? (
                <span>
                  <ResaltarCoincidencia
                    texto={punto.texto}
                    query={queryBuscada}
                  />
                </span>
              ) : datosFragmento?.fragmento ? (
                <span className="theory-search__item-fragmento">
                  <ResaltarFragmento
                    fragmento={datosFragmento.fragmento}
                    indice={datosFragmento.indice}
                    largoCoincidencia={datosFragmento.largo}
                  />
                </span>
              ) : null}
            </button>
          );
        })
      ) : busquedaLista && !buscandoSemantico ? (
        <p className="theory-search__empty">No hay coincidencias</p>
      ) : null}
      {buscandoSemantico && (
        <div className="theory-search__semantic-loading">
          Buscando la coincidencia más parecida...
        </div>
      )}
    </div>
  );
}
