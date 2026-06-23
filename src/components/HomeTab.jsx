import { Download, RotateCcw, Upload } from 'lucide-react';
import { QuestItem } from './QuestItem';

export function HomeTab({
  state,
  dominantStat,
  tier,
  STAT_META,
  currentLevelXp,
  progress,
  exportSaveData,
  importSaveData,
  backupMessage,
  weeklyBoss,
  driftMessage,
  bossProgress,
  bossDamage,
  bossHpRemaining,
  streakMultiplier,
  resetDay,
  requestQuestCompletion,
  PROOF_META,
}) {
  return (
    <section className="screen-stack">
      <div className="hero-card">
        <div className={`avatar ${dominantStat}`}>
          {state.avatar && state.avatar.startsWith && (state.avatar.startsWith('data:image') || state.avatar.startsWith('http')) ? (
            <img src={state.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '26px' }} />
          ) : (
            state.avatar
          )}
        </div>
        <div className="hero-copy">
          <p className="eyebrow">
            {tier} • {state.title}
          </p>
          <h2>{state.playerName}</h2>
          <p>Dominant path: {STAT_META[dominantStat].label}</p>
        </div>
      </div>

      <div className="xp-card">
        <div className="row-between">
          <span>XP Progress</span>
          <strong>{state.xp} / {currentLevelXp}</strong>
        </div>
        <small>Lifetime XP: {state.lifetimeXp || 0}</small>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="form-card">
        <p className="eyebrow">Data Safety</p>
        <h3>Backup Your Save</h3>
        <p>
          Legacy.EXE currently saves progress in this browser. Export your save before clearing cache,
          switching devices, or testing major updates.
        </p>

        <div className="form-grid">
          <button type="button" className="ghost" onClick={exportSaveData}>
            <Download size={16} /> Export Save
          </button>

          <label className="ghost import-label">
            <Upload size={16} /> Import Save
            <input type="file" accept="application/json" onChange={importSaveData} hidden />
          </label>
        </div>

        {backupMessage && <div className="chronicle-reward">{backupMessage}</div>}
      </div>

      <div className="boss-card">
        <div className="row-between">
          <div>
            <p className="eyebrow">Week {weeklyBoss.week} Boss</p>
            <h3>{weeklyBoss.name}</h3>
            <p className="boss-meta">
              {weeklyBoss.archetype} • Domain: {weeklyBoss.domain}
            </p>
          </div>
          <span className="boss-mini-icon">{weeklyBoss.icon}</span>
        </div>
        <p>{weeklyBoss.description}</p>
        <p>{driftMessage}</p>
        <div className="progress-track">
          <div className="progress-fill boss" style={{ width: `${bossProgress}%` }} />
        </div>
        <small>
          {bossDamage} damage dealt • {bossHpRemaining}/{weeklyBoss.hp} HP remaining • {streakMultiplier}x streak
        </small>
      </div>

      <div className="quest-list">
        <div className="row-between">
          <h3>Today&apos;s Quests</h3>
          <button className="ghost" onClick={resetDay}>
            <RotateCcw size={16} /> Reset day
          </button>
        </div>

        {state.quests.slice(0, 4).map(q => (
          <QuestItem
            key={q.id}
            quest={q}
            onComplete={requestQuestCompletion}
            STAT_META={STAT_META}
            PROOF_META={PROOF_META}
          />
        ))}
      </div>
    </section>
  );
}
