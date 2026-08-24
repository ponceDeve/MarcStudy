export default function ExercisesSection({
  examenPreguntas,
  onIniciarEjercicios,
  onModoEstudio,
}) {
  if (!examenPreguntas || examenPreguntas.length === 0) {
    return null;
  }

  return (
    <div className="exercises-section">
  <div className="exercises-header">
    <h3 className="exercises-header-title">
      <i className="bi bi-pencil-square" />
      Práctica de Ejercicios
    </h3>
  </div>

  <p className="exercises-description">
    Practica los ejercicios de este tema para reforzar la teoría.
  </p>

  <div className="exercises-buttons">
    <button
      className="exercises-btn exercises-btn-primary"
      onClick={() => onModoEstudio("solo_preguntas")}
    >
      <i className="bi bi-play-fill exercises-icon" />
      Comenzar Ejercicios
    </button>
  </div>
</div>
  );
}