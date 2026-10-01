export function decir(texto, idioma = "en-US") {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(texto);
  u.lang = idioma; u.rate = 0.9;
  window.speechSynthesis.speak(u);
}
