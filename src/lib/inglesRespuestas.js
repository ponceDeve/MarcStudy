// Normaliza para comparar: minúsculas, apóstrofos y espacios; ignora puntuación final.
export function normalizar(t) {
  return String(t)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘`´]/g, "'")
    .replace(/[-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[.!?¿¡]+$/g, "")
    .replace(/^[¿¡]+/g, "")
    .trim();
}

// Devuelve { ok, mostrar } donde mostrar es la respuesta a enseñar si falló.
export function revisar(ej, texto) {
  const t = normalizar(texto);
  if (!t) return { ok: false, mostrar: "" };
  if (ej.tipo === "oracion_libre") {
    const v = ej.validacion || {};
    const palabras = t.split(" ").filter(Boolean).length;
    const contiene = (v.debeContener || []).every((w) => t.includes(normalizar(w)));
    const patron = v.patron ? new RegExp(v.patron, "i").test(String(texto).trim()) : true;
    const ok = contiene && patron && palabras >= (v.minimoPalabras || 1);
    return { ok, mostrar: ej.ejemploRespuesta || "" };
  }
  const ok = (ej.respuestas || []).some((r) => normalizar(r) === t);
  return { ok, mostrar: (ej.respuestas || [])[0] || "" };
}
