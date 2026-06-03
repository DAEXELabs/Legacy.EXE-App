import { Coins, Flame, Sparkles, Trophy } from 'lucide-react';

export function AchievementsTab({ state, achievements }) {
  return (
    <section className="screen-stack">
      <div className="boss-card">
        <p className="eyebrow">Milestones / Achievements</p>
        <h2>Proof becomes legacy.</h2>
        <p>
          Unlock achievements by training, reading, defeating bosses, building streaks, and showing proof.
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <Trophy size={20} />
          <span>Unlocked</span>
          <strong>{(state.achievements || []).length}/{achievements.length}</strong>
        </div>

        <div className="stat-card">
          <Sparkles size={20} />
          <span>Achievement XP</span>
          <strong>
            {(state.achievements || []).reduce((sum, item) => sum + Number(item.xp || 0), 0)}
          </strong>
        </div>

        <div className="stat-card">
          <Flame size={20} />
          <span>Current Title</span>
          <strong>{state.title}</strong>
        </div>

        <div className="stat-card">
          <Coins size={20} />
          <span>Lifetime XP</span>
          <strong>{state.lifetimeXp || 0}</strong>
        </div>
      </div>

      <div className="quest-list">
        <h3>Achievement Path</h3>

        {achievements.map(achievement => {
          const unlocked = (state.achievements || []).find(item => item.id === achievement.id);

          return (
            <div className={`reward ${unlocked ? 'unlocked' : ''}`} key={achievement.id}>
              <Trophy />
              <div>
                <strong>{achievement.name}</strong>
                <p>{achievement.description}</p>
                {unlocked && (
                  <p>
                    Unlocked {new Date(unlocked.unlockedAt).toLocaleDateString()} • Title: {achievement.title}
                  </p>
                )}
              </div>
              <span>{unlocked ? `+${achievement.xp} XP` : 'Locked'}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
