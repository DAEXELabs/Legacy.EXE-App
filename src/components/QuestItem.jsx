import { CheckCircle2 } from 'lucide-react';

export function QuestItem({ quest, onComplete, STAT_META, PROOF_META }) {
  const Icon = STAT_META[quest.stat].icon;
  const ProofIcon = PROOF_META[quest.proof]?.icon || CheckCircle2;

  return (
    <article className={`quest-item ${quest.completedToday ? 'complete' : ''}`}>
      <div className="quest-left">
        <div className="quest-icon">
          <Icon size={20} />
        </div>

        <div>
          <h4>{quest.title}</h4>
          <p>
            {STAT_META[quest.stat].label} • {quest.frequency} • {quest.xp} XP
          </p>
          <span className="proof-badge">
            <ProofIcon size={12} /> {PROOF_META[quest.proof]?.label || 'Honor'}
          </span>
        </div>
      </div>

      <button
        onClick={() => onComplete(quest)}
        disabled={quest.completedToday}
        className="complete-btn"
      >
        <CheckCircle2 size={20} />
      </button>
    </article>
  );
}
