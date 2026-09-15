import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function Modal({
  open,
  onClose,
  children,
  wide = false,
  plain = false,
}) {
  useEffect(() => {
    if (open) {
      document.documentElement.classList.add("modal-open");
      document.body.classList.add("modal-open");
    } else {
      document.documentElement.classList.remove("modal-open");
      document.body.classList.remove("modal-open");
    }

    return () => {
      document.documentElement.classList.remove("modal-open");
      document.body.classList.remove("modal-open");
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div
        className={`modal-box ${wide ? "modal-wide" : ""} ${
          plain ? "modal-box--plain" : ""
        }`}
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <i className="bi bi-x"></i>
        </button>

        {children}
      </div>
    </div>,
    document.body
  );
}