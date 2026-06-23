import { Brain, Trophy } from 'lucide-react';
import CharacterProfile from './CharacterProfile';
import SkillTree from './SkillTree';

export function CharacterTab({
  state,
  dominantStat,
  tier,
  STAT_META,
  strongestStat,
  workoutRegimen,
  streakMultiplier,
  bossProgress,
  completedToday,
  dailyXpEarned,
  readingGoal,
  booksProgress,
  readingXpEarned,
  archetype,
  xp,
}) {
  return (
    <section className="screen-stack">
      <div className="hero-card large character-card operator-profile">
        <div className={`avatar big ${dominantStat}`}>
          {state.avatar && state.avatar.startsWith && state.avatar.startsWith('data:image') ? (
            <img src={state.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '26px' }} />
          ) : (
            state.avatar
          )}
        </div>
        <div>
          <p className="eyebrow">Operator Profile • {tier}</p>
          <h2>{state.playerName}</h2>
          <p>{state.title}</p>
          <p>Level {state.level} • Streak: {state.streak} completions</p>
        </div>
      </div>

      <div className="profile-metrics">
        <div className="profile-metric"><span>Chronicle Entries</span><strong>{(state.chroniclePosts || []).length}</strong></div>
        <div className="profile-metric"><span>Boss Progress</span><strong>{bossProgress}%</strong></div>
        <div className="profile-metric"><span>Quests Today</span><strong>{completedToday}/{state.quests.length}</strong></div>
        <div className="profile-metric"><span>XP Today</span><strong>{dailyXpEarned}</strong></div>
        <div className="profile-metric"><span>Strongest Stat</span><strong>{STAT_META[strongestStat[0]].label}</strong></div>
        <div className="profile-metric"><span>Workout Logs</span><strong>{(state.workoutLogs || []).length}</strong></div>
        <div className="profile-metric"><span>Workout Tier</span><strong>{workoutRegimen.name}</strong></div>
        <div className="profile-metric"><span>Bosses Defeated</span><strong>{(state.bossArchive || []).length}</strong></div>
        <div className="profile-metric"><span>Damage Multiplier</span><strong>{streakMultiplier}x</strong></div>
        <div className="profile-metric"><span>Achievements</span><strong>{(state.achievements || []).length}</strong></div>
      </div>

      <CharacterProfile
        archetype={archetype}
        stats={state.stats}
        level={state.level}
        xp={xp}
      />

      <div className="stats-grid">
        {Object.entries(STAT_META).map(([key, meta]) => {
          const Icon = meta.icon;
          return (
            <div className="stat-card" key={key}>
              <Icon size={20} />
              <span>{meta.label}</span>
              <strong>{state.stats[key]}</strong>
            </div>
          );
        })}
      </div>

      <div className="quest-list">
        <div className="row-between">
          <h3>Reading Campaign</h3>
          <span className="proof-badge">{booksProgress}% Books</span>
        </div>
        <article className="profile-proof-card">
          <div className="row-between">
            <span className="chronicle-type">Current Book</span>
            <span className="chronicle-date">{readingGoal.pagesRead} pages</span>
          </div>
          <h4>{readingGoal.currentBook || 'No book selected yet'}</h4>
          <p>{readingGoal.booksCompleted}/{readingGoal.monthlyBooksTarget} books • {readingGoal.chaptersCompleted}/{readingGoal.monthlyChaptersTarget} chapters</p>
          <div className="chronicle-reward"><Brain size={14} /> {readingXpEarned} Reading XP</div>
        </article>
      </div>

      <SkillTree archetype={archetype} xp={xp} />

      <div className="quest-list">
        <h3>Unlocks</h3>
        {state.rewards.map(reward => (
          <div className={`reward ${reward.unlocked ? 'unlocked' : ''}`} key={reward.id}>
            <Trophy />
            <div>
              <strong>{reward.name}</strong>
              <p>{reward.requirement}</p>
            </div>
            <span>{reward.unlocked ? 'Unlocked' : 'Locked'}</span>
          </div>
        ))}
      </div>
    </section>
  );
}