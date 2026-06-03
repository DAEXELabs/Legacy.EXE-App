import { Plus, Trash2 } from 'lucide-react';
import { QuestItem } from './QuestItem';

export function QuestsTab({
  addQuest,
  newQuest,
  setNewQuest,
  STAT_META,
  PROOF_META,
  state,
  requestQuestCompletion,
  deleteQuest,
}) {
  return (
    <section className="screen-stack">
      <form className="form-card" onSubmit={addQuest}>
        <h3>Create Quest</h3>

        <input
          value={newQuest.title}
          onChange={e => setNewQuest({ ...newQuest, title: e.target.value })}
          placeholder="Example: Workout"
        />

        <div className="form-grid">
          <select
            value={newQuest.stat}
            onChange={e => setNewQuest({ ...newQuest, stat: e.target.value })}
          >
            {Object.entries(STAT_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="10"
            step="5"
            value={newQuest.xp}
            onChange={e => setNewQuest({ ...newQuest, xp: e.target.value })}
          />
        </div>

        <div className="form-grid">
          <input
            value={newQuest.frequency}
            onChange={e => setNewQuest({ ...newQuest, frequency: e.target.value })}
            placeholder="daily, weekly, 3x weekly"
          />

          <select
            value={newQuest.proof}
            onChange={e => setNewQuest({ ...newQuest, proof: e.target.value })}
          >
            {Object.entries(PROOF_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>

        <button className="primary">
          <Plus size={18} /> Add Quest
        </button>
      </form>

      {Object.entries(STAT_META).map(([statKey, meta]) => {
        const StatIcon = meta.icon;
        const statQuests = state.quests.filter(q => q.stat === statKey);

        if (statQuests.length === 0) return null;

        return (
          <div className="quest-list" key={statKey}>
            <div className="row-between">
              <h3>
                <StatIcon size={18} /> {meta.label}
              </h3>
              <span className="proof-badge">
                {statQuests.filter(q => q.completedToday).length}/{statQuests.length}
              </span>
            </div>

            {statQuests.map(q => (
              <div className="quest-manage-row" key={q.id}>
                <QuestItem
                  quest={q}
                  onComplete={requestQuestCompletion}
                  STAT_META={STAT_META}
                  PROOF_META={PROOF_META}
                />

                <button
                  type="button"
                  className="ghost danger"
                  onClick={() => deleteQuest(q.id)}
                  title="Delete quest"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        );
      })}
    </section>
  );
}
