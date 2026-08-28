import { useState, useEffect } from "react";

// Reutilizado por el buscador inicial y por el modal de "buscar otro tema".
export function useArrowKeyList(items, onSelect) {
  const [focusedIdx, setFocusedIdx] = useState(-1);

  // Antes esto ponía el primer resultado como "enfocado" apenas
  // cambiaba la lista, así que siempre se veía con el color de hover
  // aunque no lo hayas tocado con el teclado. Ahora arranca sin nada
  // enfocado; el resaltado solo aparece cuando de verdad usas las
  // flechas. Enter sigue funcionando sobre el primer resultado aunque
  // no haya nada enfocado (ver handleKeyDown).
  useEffect(() => {
    setFocusedIdx(-1);
  }, [items]);

  function handleKeyDown(e) {
    if (items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIdx((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIdx((i) =>
        i < 0 ? items.length - 1 : (i - 1 + items.length) % items.length
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const idx = focusedIdx >= 0 ? focusedIdx : 0;
      if (items[idx]) onSelect(items[idx]);
    }
  }

  return { focusedIdx, handleKeyDown };
}
