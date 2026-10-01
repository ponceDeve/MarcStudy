import React from "react";

// Convierte **negritas** en <strong>
export default function Texto({ children }) {
  const partes = String(children || "").split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {partes.map((p, i) =>
        p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <React.Fragment key={i}>{p}</React.Fragment>
      )}
    </>
  );
}
