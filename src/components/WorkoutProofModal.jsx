import { Dumbbell } from 'lucide-react';

export function WorkoutProofModal({
  workoutQuest,
  workoutProof,
  setWorkoutProof,
  submitWorkout,
  setWorkoutQuest,
  workoutRegimen,
  workoutTotals,
  calculateEffortScore,
  level,
}) {
  if (!workoutQuest) return null;

  return (
    <div className="modal-backdrop">
      <form className="modal-card" onSubmit={submitWorkout}>
        <p className="eyebrow">Workout Proof KPI</p>
        <h3>{workoutQuest.title}</h3>
        <p>
          Log measurable effort before XP unlocks. Minimum: 10 minutes, effort 3+, score 25+.
        </p>

        <div className="codex-card">
          <p className="eyebrow">
            Level {level} Regimen • {workoutRegimen.name}
          </p>
          <h3>{workoutRegimen.intensity} Workout</h3>
          <p>{workoutRegimen.target}</p>

          {workoutRegimen.exercises.map(exercise => (
            <div className="codex-row" key={exercise.name}>
              <strong>{exercise.name}</strong>
              <p>
                {exercise.sets} sets x {exercise.reps} • {exercise.weight}
              </p>
            </div>
          ))}

          <div className="chronicle-reward">
            <Dumbbell size={14} /> Target: {workoutTotals.exercises} exercises / {workoutTotals.sets} total sets
          </div>
        </div>

        <div className="form-grid">
          <label>
            <span>Workout Type</span>
            <small>What kind of training did you do?</small>
            <select
              value={workoutProof.type}
              onChange={e => setWorkoutProof({ ...workoutProof, type: e.target.value })}
            >
              <option>Strength</option>
              <option>Cardio</option>
              <option>Mobility</option>
              <option>Sport</option>
              <option>Other</option>
            </select>
          </label>

          <label>
            <span>Duration Minutes</span>
            <small>How many minutes did you train?</small>
            <input
              type="number"
              min="0"
              value={workoutProof.duration}
              onChange={e => setWorkoutProof({ ...workoutProof, duration: e.target.value })}
              placeholder="Example: 30"
            />
          </label>
        </div>

        <div className="form-grid">
          <label>
            <span>Effort Level</span>
            <small>1 = easy, 10 = all out.</small>
            <input
              type="number"
              min="1"
              max="10"
              value={workoutProof.effort}
              onChange={e => setWorkoutProof({ ...workoutProof, effort: e.target.value })}
              placeholder="Example: 6"
            />
          </label>

          <label>
            <span>Total Sets</span>
            <small>Count all sets completed across the workout.</small>
            <input
              type="number"
              min="0"
              value={workoutProof.sets}
              onChange={e => setWorkoutProof({ ...workoutProof, sets: e.target.value })}
              placeholder="Example: 6"
            />
          </label>
        </div>

        <label>
          <span>Total Reps</span>
          <small>Approximate total reps completed. Cardio users can enter 0.</small>
          <input
            type="number"
            min="0"
            value={workoutProof.reps}
            onChange={e => setWorkoutProof({ ...workoutProof, reps: e.target.value })}
            placeholder="Example: 60"
          />
        </label>

        <label>
          <span>Workout Notes</span>
          <small>Briefly describe what you actually did.</small>
          <textarea
            value={workoutProof.notes}
            onChange={e => setWorkoutProof({ ...workoutProof, notes: e.target.value })}
            placeholder="Example: Pushups, squats, plank, and 10 minutes walking."
          />
        </label>

        <div className="kpi-score">
          Effort Score: {calculateEffortScore(workoutProof)}
        </div>

        <button
          className="primary"
          disabled={
            Number(workoutProof.duration || 0) < 10 ||
            Number(workoutProof.effort || 0) < 3 ||
            calculateEffortScore(workoutProof) < 25
          }
        >
          Submit Workout Proof
        </button>

        <button type="button" className="ghost" onClick={() => setWorkoutQuest(null)}>
          Cancel
        </button>
      </form>
    </div>
  );
}