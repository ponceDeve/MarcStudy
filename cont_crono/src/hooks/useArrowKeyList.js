import { useState, useEffect } from "react";

// Reutilizado por el buscador inicial y por el modal de "buscar otro tema".
export function useArrowKeyList(items, onSelect) {
  const [focusedIdx, setFocusedIdx] = useState(-1);

  useEffect(() => {
    setFocusedIdx(items.length > 0 ? 0 : -1);
  }, [items]);

  function handleKeyDown(e) {
    if (items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIdx((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIdx((i) => (i - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const idx = focusedIdx >= 0 ? focusedIdx : 0;
      if (items[idx]) onSelect(items[idx]);
    }
  }

  return { focusedIdx, handleKeyDown };
}
