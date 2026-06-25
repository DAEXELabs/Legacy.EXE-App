import { Plus, Trash2, RotateCcw } from 'lucide-react';
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
  editingQuestId,
  editingQuest,
  setEditingQuest,
  cancelEditingQuest,
  saveEditingQuest,
  QUEST_DIFFICULTY_PRESETS,
  QUEST_XP_MIN,
  QUEST_XP_MAX,
}) {
  return (
    <section className="screen-stack">
      <form className="form-card" onSubmit={addQuest}>
        <h3>Create Quest</h3>
        <p>Choose a difficulty preset. XP is assigned automatically and capped at {QUEST_XP_MAX}.</p>

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
              <option key={key} value={key}>{meta.label}</option>
            ))}
          </select>

          <select
            value={newQuest.difficulty}
            onChange={e => {
              const difficulty = e.target.value;
              setNewQuest({
                ...newQuest,
                difficulty,
                xp: QUEST_DIFFICULTY_PRESETS[difficulty]?.xp || QUEST_DIFFICULTY_PRESETS.normal.xp,
              });
            }}
          >
            {Object.entries(QUEST_DIFFICULTY_PRESETS).map(([key, preset]) => (
              <option key={key} value={key}>{preset.label} - {preset.xp} XP</option>
            ))}
          </select>
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
              <option key={key} value={key}>{meta.label}</option>
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
              <h3><StatIcon size={18} /> {meta.label}</h3>
              <span className="proof-badge">
                {statQuests.filter(q => q.completedToday).length}/{statQuests.length}
              </span>
            </div>

            {statQuests.map(q => (
              <div className="quest-edit-shell" key={q.id}>
                <div className="quest-manage-row">
                  <QuestItem
                    quest={q}
                    onComplete={requestQuestCompletion}
                    STAT_META={STAT_META}
                    PROOF_META={PROOF_META}
                    pulseActive={editingQuestId === q.id}
                  />

                  <div className="quest-manage-actions">
                    <button type="button" className="ghost" onClick={() => setEditingQuest(q)}>Edit</button>
                    <button type="button" className="ghost danger" onClick={() => deleteQuest(q.id)} title="Delete quest">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {editingQuestId === q.id && (
                  <form className="form-card quest-edit-form" onSubmit={saveEditingQuest}>
                    <input
                      value={editingQuest.title}
                      onChange={e => setEditingQuest({ ...editingQuest, title: e.target.value })}
                      placeholder="Quest title"
                    />

                    <div className="form-grid">
                      <select
                        value={editingQuest.stat}
                        onChange={e => setEditingQuest({ ...editingQuest, stat: e.target.value })}
                      >
                        {Object.entries(STAT_META).map(([key, meta]) => (
                          <option key={key} value={key}>{meta.label}</option>
                        ))}
                      </select>

                      <select
                        value={editingQuest.difficulty}
                        onChange={e => {
                          const difficulty = e.target.value;
                          setEditingQuest({
                            ...editingQuest,
                            difficulty,
                            xp: QUEST_DIFFICULTY_PRESETS[difficulty]?.xp || QUEST_DIFFICULTY_PRESETS.normal.xp,
                          });
                        }}
                      >
                        {Object.entries(QUEST_DIFFICULTY_PRESETS).map(([key, preset]) => (
                          <option key={key} value={key}>{preset.label} - {preset.xp} XP</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-grid">
                      <input
                        value={editingQuest.frequency}
                        onChange={e => setEditingQuest({ ...editingQuest, frequency: e.target.value })}
                        placeholder="daily, weekly, 3x weekly"
                      />

                      <select
                        value={editingQuest.proof}
                        onChange={e => setEditingQuest({ ...editingQuest, proof: e.target.value })}
                      >
                        {Object.entries(PROOF_META).map(([key, meta]) => (
                          <option key={key} value={key}>{meta.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="quest-edit-actions">
                      <button className="primary" type="submit">Save Quest</button>
                      <button className="ghost" type="button" onClick={cancelEditingQuest}>Cancel</button>
                    </div>

                    <small>Difficulty controls XP automatically to keep progression fair.</small>
                  </form>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </section>
  );
}
