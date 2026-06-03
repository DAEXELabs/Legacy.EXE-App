export function CheckinModal({
  checkinQuest,
  checkinText,
  setCheckinText,
  submitCheckin,
  setCheckinQuest,
}) {
  if (!checkinQuest) return null;

  return (
    <div className="modal-backdrop">
      <form className="modal-card" onSubmit={submitCheckin}>
        <p className="eyebrow">Proof of Effort</p>
        <h3>{checkinQuest.title}</h3>
        <p>Write one honest sentence about what you did.</p>

        <textarea
          value={checkinText}
          onChange={e => setCheckinText(e.target.value)}
          placeholder="Example: I read chapter 2 and took notes."
        />

        <button className="primary" disabled={checkinText.trim().length < 5}>
          Submit Proof
        </button>

        <button
          type="button"
          className="ghost"
          onClick={() => setCheckinQuest(null)}
        >
          Cancel
        </button>
      </form>
    </div>
  );
}
