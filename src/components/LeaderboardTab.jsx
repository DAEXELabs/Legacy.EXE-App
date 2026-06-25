import { useEffect, useState } from 'react';
import { Trophy, Flame, Skull, Crown } from 'lucide-react';
import { getWeekNumber } from '../utils/progression';
import { getWeeklyLeaderboard, getOverallLegacyLeaderboard } from '../lib/socialApi';

export function LeaderboardTab({ session, currentUserId }) {
  const [weeklyData, setWeeklyData] = useState([]);
  const [overallData, setOverallData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('weekly');

  const week = getWeekNumber();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [weeklyResult, overallResult] = await Promise.all([
        getWeeklyLeaderboard(week),
        getOverallLegacyLeaderboard(50),
      ]);
      setWeeklyData(weeklyResult.data || []);
      setOverallData(overallResult.data || []);
      setLoading(false);
    };
    load();
  }, [week]);

  const isFriendHighlight = (entry) => {
    const uid = entry.user_id || entry.id;
    return uid === currentUserId;
  };

  const renderRow = (entry, index, showUser = true) => {
    const profile = entry.profiles || {};
    const userId = entry.user_id || entry.id;
    const xp = entry.total_xp ?? entry.lifetime_xp ?? 0;
    const level = entry.level || 1;
    const isCurrentUser = userId === currentUserId;
    const rankClass = index === 0 ? 'rank-first' : index === 1 ? 'rank-second' : index === 2 ? 'rank-third' : '';

    return (
      <div className={`leaderboard-row ${isCurrentUser ? 'highlight-row' : ''} ${rankClass}`} key={entry.id || userId}>
        <div className="leaderboard-rank">
          {index < 3 ? <Crown size={16} className={`rank-${index + 1}`} /> : (
            <span className="rank-number">#{index + 1}</span>
          )}
        </div>
        {showUser && (
          <div className="profile-compact">
            <div className="profile-compact-avatar">{profile.avatar || '👤'}</div>
            <div className="profile-compact-info">
              <strong>{profile.display_name || profile.username || 'Unknown'}</strong>
              <span>LVL {level} • {profile.title || 'Operator'}</span>
            </div>
          </div>
        )}
        <div className="leaderboard-stats">
          <div className="leaderboard-stat">
            <Flame size={14} />
            <span>{xp.toLocaleString()} XP</span>
          </div>
          {entry.quests_completed !== undefined && (
            <div className="leaderboard-stat">
              <Skull size={14} />
              <span>{entry.quests_completed} quests</span>
            </div>
          )}
          {entry.boss_damage !== undefined && (
            <div className="leaderboard-stat">
              <Skull size={14} />
              <span>{entry.boss_damage} boss DMG</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="screen-stack">
      <div className="leaderboard-header">
        <Trophy size={20} />
        <h2>Leaderboards</h2>
      </div>

      <div className="leaderboard-tabs">
        <button className={`leaderboard-tab ${activeView === 'weekly' ? 'active' : ''}`} onClick={() => setActiveView('weekly')}>
          Weekly • Week {week}
        </button>
        <button className={`leaderboard-tab ${activeView === 'overall' ? 'active' : ''}`} onClick={() => setActiveView('overall')}>
          Overall Legacy Score
        </button>
      </div>

      {activeView === 'weekly' && (
        <div className="leaderboard-list">
          {loading ? (
            <div className="empty-state"><p>Loading rankings...</p></div>
          ) : weeklyData.length === 0 ? (
            <div className="empty-state">
              <p>No entries yet this week.</p>
              <strong>Complete quests and contribute to the boss to appear.</strong>
            </div>
          ) : (
            weeklyData.map((entry, idx) => renderRow(entry, idx))
          )}
        </div>
      )}

      {activeView === 'overall' && (
        <div className="leaderboard-list">
          {loading ? (
            <div className="empty-state"><p>Loading rankings...</p></div>
          ) : overallData.length === 0 ? (
            <div className="empty-state">
              <p>No legacy scores recorded.</p>
            </div>
          ) : (
            overallData.map((entry, idx) => renderRow(entry, idx))
          )}
        </div>
      )}

      <div className="leaderboard-footer">
        <p>Rankings update weekly. Top 10 friendly operators are highlighted.</p>
      </div>
    </section>
  );
}