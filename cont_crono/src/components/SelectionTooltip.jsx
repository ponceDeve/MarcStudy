import { useEffect, useRef, useState } from "react";

export default function SelectionTooltip() {
  const [pos, setPos] = useState(null); // {top, left} | null
  const textRef = useRef("");

  useEffect(() => {
    function handleSelection(e) {
      if (e.target && e.target.closest && e.target.closest("#selection-tooltip")) return;
      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        if (text.length > 0) {
          textRef.current = text;
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const top = rect.top + window.scrollY - 45;
          const left = rect.left + window.scrollX + rect.width / 2;
          setPos({ top: Math.max(10, top), left: Math.max(50, left) });
        } else {
          textRef.current = "";
          setPos(null);
        }
      }, 10);
    }

    function handleMouseDown(e) {
      if (e.target && e.target.closest && !e.target.closest("#selection-tooltip")) {
        setPos(null);
      }
    }

    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("keyup", handleSelection);
    document.addEventListener("touchend", handleSelection);
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("keyup", handleSelection);
      document.removeEventListener("touchend", handleSelection);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  function buscar(e) {
    e.stopPropagation();
    if (!textRef.current) return;
    const url = `https://www.google.com/search?q=${encodeURIComponent(textRef.current)}`;
    window.open(url, "_blank");
    setPos(null);
    window.getSelection().removeAllRanges();
  }

  if (!pos) return null;

  return (
    <div
      id="selection-tooltip"
      onClick={buscar}
      title="Buscar en Google"
      className="selection-tooltip"
      style={{ top: pos.top, left: pos.left }}
    >
      <i className="fab fa-google" />
    </div>
  );
}
