// Comprime una imagen (File) a un cuadrado pequeño en base64, para poder
// guardarla en localStorage sin pasarse del límite de espacio.
export function comprimirFotoUsuario(file, { maxDim = 160, calidad = 0.75 } = {}) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();

    lector.onerror = () => reject(new Error("No se pudo leer la imagen"));
    lector.onload = () => {
      const img = new Image();

      img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
      img.onload = () => {
        // Recorta al centro para que quede cuadrada, sin deformarla.
        const lado = Math.min(img.width, img.height);
        const offsetX = (img.width - lado) / 2;
        const offsetY = (img.height - lado) / 2;

        const canvas = document.createElement("canvas");
        canvas.width = maxDim;
        canvas.height = maxDim;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, offsetX, offsetY, lado, lado, 0, 0, maxDim, maxDim);

        resolve(canvas.toDataURL("image/jpeg", calidad));
      };

      img.src = lector.result;
    };

    lector.readAsDataURL(file);
  });
}
