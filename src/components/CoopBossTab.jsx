import { useEffect, useState, useRef } from 'react';
import { Flame, Trophy, Skull, Swords, Bell } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { getWeekNumber } from '../utils/progression';
import {
  recordBossContribution,
  getBossPartyContributions,
  getMyBossContribution,
  getFriends,
} from '../lib/socialApi';

export function CoopBossTab({ session, currentUserId, state, weeklyBoss, bossDamage, bossHpRemaining, bossProgress, baseBossDamage, streakMultiplier, archiveBossVictory, isBossArchived, bossDefeated }) {
  const [partyDamage, setPartyDamage] = useState([]);
  const [groupTotal, setGroupTotal] = useState(0);
  const [groupProgress, setGroupProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [contributing, setContributing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const prevContributionsRef = useRef([]);
  const channelRef = useRef(null);

  const bossWeek = getWeekNumber();

  const loadPartyData = async () => {
    if (!currentUserId) return;
    try {
      const [contribsResult, myResult, friendsResult] = await Promise.all([
        getBossPartyContributions(weeklyBoss.name, bossWeek),
        getMyBossContribution(weeklyBoss.name, bossWeek, currentUserId),
        getFriends(currentUserId),
      ]);

      const contribs = contribsResult.data || [];
      setPartyDamage(contribs);

      const total = contribs.reduce((sum, c) => sum + Number(c.damage_dealt || 0), 0);
      setGroupTotal(total);
      setGroupProgress(Math.min(100, Math.round((total / weeklyBoss.hp) * 100)));

      if (!myResult.data && !contribs.some(c => c.user_id === currentUserId)) {
        const { data: friendIds } = friendsResult;
        const friendIdsArr = (friendIds || []).map(f => f.following_id);
        const hasFriends = friendIdsArr.length > 0;

        if (hasFriends || currentUserId) {
          const myDamage = baseBossDamage * streakMultiplier;
          const source = hasFriends ? 'co-op-party' : 'solo';
          await recordBossContribution({
            bossWeek,
            bossName: weeklyBoss.name,
            userId: currentUserId,
            damageDealt: myDamage,
            source,
          });
        }
      }

      prevContributionsRef.current = contribs;
    } catch (err) {
      console.error('Failed to load party data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPartyData();

    if (!supabase || !currentUserId) return;

    const channel = supabase
      .channel(`boss-party-${weeklyBoss.name}-${bossWeek}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'boss_party_contributions',
          filter: `boss_name=eq.${weeklyBoss.name},boss_week=eq.${bossWeek}`,
        },
        async (payload) => {
          const newContrib = payload.new;
          let profile = null;
          try {
            const { data } = await supabase.from('profiles').select('username, display_name, avatar, title, level').eq('id', newContrib.user_id).single();
            profile = data;
          } catch {}

          setPartyDamage(prev => {
            const exists = prev.some(c => c.user_id === newContrib.user_id && c.id === newContrib.id);
            if (exists) return prev;
            const next = [...prev, { ...newContrib, profiles: profile }];
            next.sort((a, b) => Number(b.damage_dealt || 0) - Number(a.damage_dealt || 0));
            const total = next.reduce((sum, c) => sum + Number(c.damage_dealt || 0), 0);
            setGroupTotal(total);
            setGroupProgress(Math.min(100, Math.round((total / weeklyBoss.hp) * 100)));
            return next;
          });

          if (newContrib.user_id !== currentUserId) {
            setNotifications(prev => [...prev, {
              id: crypto.randomUUID(),
              message: `${profile?.display_name || profile?.username || 'An ally'} contributed ${newContrib.damage_dealt} damage!`,
              timestamp: new Date().toISOString(),
            }]);
            setTimeout(() => {
              setNotifications(prev => prev.filter(n => n.id !== prev[0]?.id && prev[0?.id]));
            }, 4000);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [currentUserId, weeklyBoss.name, bossWeek]);

  const contributeDamage = async () => {
    if (!currentUserId || contributing) return;
    setContributing(true);
    try {
      const myDamage = baseBossDamage * streakMultiplier;
      const { data, error } = await recordBossContribution({
        bossWeek,
        bossName: weeklyBoss.name,
        userId: currentUserId,
        damageDealt: myDamage,
        source: 'solo',
      });
      if (error) throw error;
      setPartyDamage(prev => {
        const next = [...prev, { ...data, profiles: { username: state.playerName, display_name: state.playerName, avatar: state.avatar, title: state.title, level: state.level } }];
        next.sort((a, b) => Number(b.damage_dealt || 0) - Number(a.damage_dealt || 0));
        const total = next.reduce((sum, c) => sum + Number(c.damage_dealt || 0), 0);
        setGroupTotal(total);
        setGroupProgress(Math.min(100, Math.round((total / weeklyBoss.hp) * 100)));
        return next;
      });
    } catch (err) {
      console.error('Failed to contribute', err);
    } finally {
      setContributing(false);
    }
  };

  const myContribution = partyDamage.find(c => c.user_id === currentUserId);
  const myDamage = myContribution ? Number(myContribution.damage_dealt || 0) : 0;

  return (
    <section className="screen-stack">
      {notifications.length > 0 && (
        <div className="notification-toast">
          <Bell size={14} />
          {notifications[0].message}
        </div>
      )}

      <div className={`boss-card coop-boss-card ${bossDefeated ? 'victory-active' : ''}`}>
        <div className="row-between">
          <div>
            <p className="eyebrow">Co-op Boss • Week {bossWeek}</p>
            <h2>{weeklyBoss.name}</h2>
            <p className="boss-meta">
              {weeklyBoss.archetype} • Domain: {weeklyBoss.domain}
            </p>
          </div>
          <span className="boss-mini-icon">{weeklyBoss.icon}</span>
        </div>

        <p>{weeklyBoss.description}</p>

        <div className="codex-card">
          <div className="codex-row">
            <strong>Real-life form</strong>
            <p>{weeklyBoss.realLifeForm}</p>
          </div>
          <div className="codex-row">
            <strong>Countermeasure</strong>
            <p>{weeklyBoss.countermeasure}</p>
          </div>
        </div>

        <div className="progress-track">
          <div className="progress-fill boss" style={{ width: `${groupProgress}%` }} />
        </div>
        <small>
          Group: {groupTotal} / {weeklyBoss.hp} HP • {groupProgress}% • Your damage: {myDamage}
        </small>
        <strong>
          {groupProgress >= 100 ? 'Victory State Unlocked — Group Win!' : `${weeklyBoss.hp - groupTotal} HP Remaining — Group`}
        </strong>
      </div>

      <div className="quest-list">
        <div className="row-between">
          <h3><Swords size={18} /> Party Contributions</h3>
          <span className="proof-badge">{partyDamage.length} Allies</span>
        </div>

        {partyDamage.length === 0 && !loading && (
          <div className="empty-state">
            <p>No allies have engaged yet.</p>
            <strong>Contribute damage to rally the party.</strong>
          </div>
        )}

        {partyDamage.map(entry => {
          const profile = entry.profiles || {};
          return (
            <div className="party-member-row" key={entry.id}>
              <div className="profile-compact">
                <div className="profile-compact-avatar">{profile.avatar || '👤'}</div>
                <div className="profile-compact-info">
                  <strong>{profile.display_name || profile.username || 'Unknown'}</strong>
                  <span>LVL {profile.level || 1} • {profile.title || 'Operator'}</span>
                </div>
              </div>
              <div className="party-damage">
                <Skull size={14} />
                <strong>{entry.damage_dealt}</strong>
                <small>DMG</small>
              </div>
            </div>
          );
        })}
      </div>

      <div className="form-card">
        <h3>Your Contribution</h3>
        <p>
          Base damage: {baseBossDamage} × Streak multiplier: {streakMultiplier}x = <strong>{baseBossDamage * streakMultiplier} damage</strong>
        </p>
        {myDamage === 0 ? (
          <button className="primary" onClick={contributeDamage} disabled={contributing}>
            <Flame size={18} /> {contributing ? 'Contributing...' : 'Contribute Damage'}
          </button>
        ) : (
          <div className="chronicle-reward">
            <Trophy size={14} /> You contributed {myDamage} damage
          </div>
        )}
      </div>
    </section>
  );
}