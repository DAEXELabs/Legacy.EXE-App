export function TimerModal({
  timerQuest,
  timerDone,
  submitTimer,
  setTimerQuest,
}) {
  if (!timerQuest) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <p className="eyebrow">Timer Proof</p>
        <h3>{timerQuest.title}</h3>

        <div className="timer-ring">{timerDone ? '✓' : '5'}</div>

        <p>
          {timerDone
            ? 'Timer complete. Claim your XP.'
            : 'Demo timer running. Full focus timer comes next.'}
        </p>

        <button
          className="primary"
          disabled={!timerDone}
          onClick={submitTimer}
        >
          Claim XP
        </button>

        <button
          type="button"
          className="ghost"
          onClick={() => setTimerQuest(null)}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}