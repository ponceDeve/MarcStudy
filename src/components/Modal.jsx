export default function Modal({ open, onClose, children, wide = false, plain = false }) {
  return (
    <div
      className={`modal-backdrop ${open ? "" : "is-closed"}`}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      <div className={`modal-box ${wide ? "modal-wide" : ""} ${plain ? "modal-box--plain" : ""}`}>{children}</div>
    </div>
  );
}