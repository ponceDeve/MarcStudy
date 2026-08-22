import { useEffect } from "react";

// Función simple para confeti sin librería externa, explota desde el centro
function crearConfeti() {
  if (typeof document === "undefined") return;
  
  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: 10000;
  `;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const particulas = [];

  const centroX = canvas.width / 2;
  const centroY = canvas.height / 2;

  // Crear particulas que explotan desde el centro en todas direcciones
  for (let i = 0; i < 100; i++) {
    const angulo = Math.random() * Math.PI * 2;
    const velocidad = Math.random() * 12 + 4;

    particulas.push({
      x: centroX,
      y: centroY,
      vx: Math.cos(angulo) * velocidad,
      vy: Math.sin(angulo) * velocidad,
      size: Math.random() * 6 + 4,
      color: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#f9ca24", "#6c5ce7"][
        Math.floor(Math.random() * 5)
      ],
    });
  }

  let frameCount = 0;
  const maxFrames = 120; // 2 segundos a 60fps

  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particulas.forEach((p) => {
      p.y += p.vy;
      p.x += p.vx;
      p.vy += 0.25; // gravedad
      p.vx *= 0.98; // fricción del aire

      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });

    frameCount++;
    if (frameCount < maxFrames) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  };

  animate();
}

export default function CongratulationsAlert({
  visible,
  onClose,
}) {
  useEffect(() => {
    if (visible) {
      crearConfeti();
      const timer = setTimeout(() => {
        onClose?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="congratulations-alert">
      <style>{`
        .congratulations-alert {
          position: fixed;
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(46, 204, 113, 0.18);
          backdrop-filter: blur(8px) saturate(140%);
          -webkit-backdrop-filter: blur(8px) saturate(140%);
          border: 1px solid rgba(46, 204, 113, 0.4);
          border-radius: 16px;
          padding: 14px 22px;
          text-align: center;
          z-index: 9999;
          box-shadow: 0 6px 24px rgba(46, 204, 113, 0.15);
          animation: congratulations-pop 0.3s ease-out;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        @keyframes congratulations-pop {
          0% {
            transform: translateX(-50%) translateY(-20px);
            opacity: 0;
          }
          100% {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }

        .congratulations-icon {
          font-size: 22px;
          color: #2ecc71;
        }

        .congratulations-title {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--ink, #333);
        }

        .congratulations-text {
          margin: 0;
          font-size: 0.8rem;
          color: var(--ink-soft, #666);
        }
      `}</style>

      <i className="fa-solid fa-circle-check congratulations-icon"></i>
      <div>
        <h2 className="congratulations-title">¡Excelente!</h2>
        <p className="congratulations-text">
          Has completado el tema
        </p>
      </div>
    </div>
  );
}