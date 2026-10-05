let voces = [];
if ("speechSynthesis" in window) {
  voces = speechSynthesis.getVoices();
  speechSynthesis.onvoiceschanged = () => {
    voces = speechSynthesis.getVoices();
  };
}
export function decir(texto, idioma = "en-US") {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const palabras = String(texto).trim().split(/\s+/);
  if (!palabras.length) return;
  const voz =
    voces.find((v) => v.lang === idioma) ||
    voces.find((v) => v.lang.startsWith("en"));
  let i = 0;
  function hablar() {
    if (i >= palabras.length) return;
    const u = new SpeechSynthesisUtterance(palabras[i++]);
    u.lang = idioma;
    u.rate = 0.8;
    if (voz) u.voice = voz;
    u.onend = () => {
      setTimeout(hablar, 10);
    };
    speechSynthesis.speak(u);
  }
  hablar();
}