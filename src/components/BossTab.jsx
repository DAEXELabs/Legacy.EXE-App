import {
  Flame,
  Shield,
  Sparkles,
  Trophy,
  Skull,
} from 'lucide-react';

export function BossTab({
  state,
  weeklyBoss,
  bossHpRemaining,
  baseBossDamage,
  streakMultiplier,
  driftMessage,
  bossProgress,
  bossDefeated,
  isBossArchived,
  archiveBossVictory,
  completedToday,
  resetApp,
  bossPulse,
  dominantStat,
}) {
  return (
    <section className="screen-stack">
      <div className={`boss-card boss-screen ${bossPulse ? 'pulse-active' : ''}`}>
        <div className="boss-avatar">
          <span className="boss-icon">{weeklyBoss.icon}</span>
        </div>
        <p className="eyebrow">Week {weeklyBoss.week} Boss</p>
        <h2>{weeklyBoss.name}</h2>
        <p className="boss-meta">
          {weeklyBoss.archetype} • Domain: {weeklyBoss.domain}
        </p>
        <p className="boss-meta">
          HP: {bossHpRemaining} / {weeklyBoss.hp}
        </p>
        <p className="boss-meta">
          Base Damage: {baseBossDamage} • Streak Multiplier: {streakMultiplier}x
        </p>
        <p>{weeklyBoss.description}</p>
        <p>
          <strong>Weakness:</strong> {weeklyBoss.weakness}
        </p>

        {weeklyBoss.weaknessStat && (() => {
          const isExploited = dominantStat && dominantStat[0] === weeklyBoss.weaknessStat;
          return (
            <div className={`boss-weakness-badge ${isExploited ? 'exploitable' : 'neutral'}`}>
              <Skull size={14} />
              {isExploited ? `Your ${dominantStat[0]} exploits this weakness!` : `Weakness: ${weeklyBoss.weaknessStat}`}
            </div>
          );
        })()}

        <div className="codex-card">
          <p className="eyebrow">Codex Entry</p>
          <h3>{weeklyBoss.domain}</h3>
          <p>{weeklyBoss.codex}</p>

          <div className="codex-row">
            <strong>Real-life form</strong>
            <p>{weeklyBoss.realLifeForm}</p>
          </div>

          <div className="codex-row">
            <strong>Countermeasure</strong>
            <p>{weeklyBoss.countermeasure}</p>
          </div>
        </div>

        <p>{driftMessage}</p>
        <div className="progress-track">
          <div className="progress-fill boss" style={{ width: `${bossProgress}%` }} />
        </div>
        <strong>
          {bossProgress >= 100
            ? 'Victory State Unlocked'
            : `${bossHpRemaining} HP Remaining`}
        </strong>

        {bossDefeated && !isBossArchived && (
          <button className="primary" onClick={archiveBossVictory}>
            <Trophy size={18} /> Archive Victory
          </button>
        )}

        {isBossArchived && (
          <div className="chronicle-reward">
            <Trophy size={14} /> Victory Archived
          </div>
        )}
      </div>

      <div className="quest-list">
        <h3>Victory Conditions</h3>

        <div className="reward unlocked">
          <Flame />
          <div>
            <strong>Complete quests</strong>
            <p>Quest XP and Chronicle proof damage {weeklyBoss.name}.</p>
          </div>
          <span>
            {completedToday}/{state.quests.length}
          </span>
        </div>

        <div className={`reward ${completedToday >= 3 ? 'unlocked' : ''}`}>
          <Sparkles />
          <div>
            <strong>Complete 3 today</strong>
            <p>Reach a daily momentum threshold.</p>
          </div>
          <span>{completedToday >= 3 ? 'Done' : 'Pending'}</span>
        </div>

        <div className={`reward ${streakMultiplier > 1 ? 'unlocked' : ''}`}>
          <Flame />
          <div>
            <strong>Streak Damage Multiplier</strong>
            <p>3 days: 1.1x • 7 days: 1.25x • 14 days: 1.5x • 30 days: 2x.</p>
          </div>
          <span>{streakMultiplier}x</span>
        </div>

        <div className={`reward ${state.streak >= 3 ? 'unlocked' : ''}`}>
          <Shield />
          <div>
            <strong>Build a 3-completion streak</strong>
            <p>Prove you can return to the system.</p>
          </div>
          <span>{state.streak >= 3 ? 'Done' : 'Pending'}</span>
        </div>
      </div>

      <div className="quest-list">
        <div className="row-between">
          <h3>Boss Archive</h3>
          <span className="proof-badge">
            {(state.bossArchive || []).length} Defeated
          </span>
        </div>

        {(state.bossArchive || []).length === 0 && (
          <div className="empty-state">
            <p>No bosses archived yet.</p>
            <strong>Defeat a weekly boss to begin the campaign record.</strong>
          </div>
        )}

        {(state.bossArchive || []).map(entry => (
          <div className="reward unlocked" key={entry.id}>
            <span className="boss-mini-icon">{entry.icon}</span>
            <div>
              <strong>{entry.name}</strong>
              <p>
                {entry.domain} • Week {entry.week} •{' '}
                {new Date(entry.defeatedAt).toLocaleDateString()}
              </p>
              <p>{entry.damageDealt} damage dealt / {entry.hp} HP • {entry.multiplier || 1}x</p>
              <p>{entry.victory}</p>
            </div>
            <span>Defeated</span>
          </div>
        ))}
      </div>

      <button className="danger" onClick={resetApp}>
        Reset Operator
      </button>
    </section>
  );
}
