import { CheckCircle2, Flame, MessageSquareText, Shield, Sparkles } from 'lucide-react';

export function CompileTab({
  bossProgress,
  driftMessage,
  completedToday,
  state,
  dailyXpEarned,
  streakMultiplier,
  STAT_META,
  strongestStat,
  weeklyBoss,
  saveDailyReflection,
  savedReflection,
  dailyReflection,
  setDailyReflection,
}) {
  return (
    <section className="screen-stack">
      <div className="boss-card">
        <p className="eyebrow">Daily Compile</p>
        <h2>What did today prove?</h2>
        <p>You are not just checking boxes. You are compiling evidence of who you are becoming.</p>

        <div className="progress-track">
          <div className="progress-fill boss" style={{ width: `${bossProgress}%` }} />
        </div>

        <small>{driftMessage}</small>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <CheckCircle2 size={20} />
          <span>Quests Complete</span>
          <strong>{completedToday}/{state.quests.length}</strong>
        </div>

        <div className="stat-card">
          <Sparkles size={20} />
          <span>XP Earned Today</span>
          <strong>{dailyXpEarned}</strong>
        </div>

        <div className="stat-card">
          <Flame size={20} />
          <span>Streak Multiplier</span>
          <strong>{streakMultiplier}x</strong>
        </div>

        <div className="stat-card">
          <Shield size={20} />
          <span>Strongest Stat</span>
          <strong>{STAT_META[strongestStat[0]].label}</strong>
        </div>

        <div className="stat-card">
          <span>{weeklyBoss.icon}</span>
          <span>Weekly Boss</span>
          <strong>{weeklyBoss.name}</strong>
        </div>
      </div>

      <form className="form-card" onSubmit={saveDailyReflection}>
        <h3>Reflection</h3>
        <p>Before you close the day, write one honest sentence.</p>

        {savedReflection && (
          <div className="reward unlocked">
            <MessageSquareText />
            <div>
              <strong>Saved Reflection</strong>
              <p>{savedReflection}</p>
            </div>
            <span>Today</span>
          </div>
        )}

        <textarea
          value={dailyReflection}
          onChange={e => setDailyReflection(e.target.value)}
          placeholder="Today proved that I..."
        />

        <button className="primary" disabled={dailyReflection.trim().length < 5}>
          Save Daily Compile
        </button>
      </form>
    </section>
  );
}
