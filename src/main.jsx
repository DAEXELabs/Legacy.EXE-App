import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, Brain, Coins, Heart, Palette, Shield, Sword, Trophy, Plus, CheckCircle2, RotateCcw } from 'lucide-react';
import './styles.css';

const STORAGE_KEY = 'legacy-exe-state-v1';

const STAT_META = {
  health: { label: 'Health', icon: Activity },
  knowledge: { label: 'Knowledge', icon: Brain },
  wealth: { label: 'Wealth', icon: Coins },
  relationships: { label: 'Relationships', icon: Heart },
  creativity: { label: 'Creativity', icon: Palette },
  discipline: { label: 'Discipline', icon: Shield },
};

const starterState = {
  playerName: 'Builder',
  xp: 0,
  level: 1,
  streak: 0,
  lastCompletedDate: null,
  stats: {
    health: 0,
    knowledge: 0,
    wealth: 0,
    relationships: 0,
    creativity: 0,
    discipline: 0,
  },
  quests: [
    { id: crypto.randomUUID(), title: 'Workout', stat: 'health', xp: 100, frequency: '3x weekly', completedToday: false },
    { id: crypto.randomUUID(), title: 'Read or study 20 minutes', stat: 'knowledge', xp: 50, frequency: 'daily', completedToday: false },
    { id: crypto.randomUUID(), title: 'Intentional family time', stat: 'relationships', xp: 50, frequency: 'daily', completedToday: false },
    { id: crypto.randomUUID(), title: 'Build one project task', stat: 'discipline', xp: 75, frequency: 'daily', completedToday: false },
  ],
  rewards: [
    { id: 1, name: 'Uncompiled', requirement: 'Start your journey', unlocked: true },
    { id: 2, name: 'Initiate Frame', requirement: 'Reach Level 3', unlocked: false, level: 3 },
    { id: 3, name: 'Builder Armor', requirement: 'Reach Level 5', unlocked: false, level: 5 },
    { id: 4, name: 'Ascendant Aura', requirement: 'Reach Level 10', unlocked: false, level: 10 },
  ],
};

function xpForLevel(level) {
  return 500 + (level - 1) * 250;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function App() {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : starterState;
  });
  const [newQuest, setNewQuest] = useState({ title: '', stat: 'discipline', xp: 50, frequency: 'daily' });
  const [tab, setTab] = useState('home');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const currentLevelXp = xpForLevel(state.level);
  const progress = Math.min(100, Math.round((state.xp / currentLevelXp) * 100));
  const completedToday = state.quests.filter(q => q.completedToday).length;
  const bossProgress = Math.round((completedToday / Math.max(state.quests.length, 1)) * 100);

  const dominantStat = useMemo(() => {
    return Object.entries(state.stats).sort((a, b) => b[1] - a[1])[0][0];
  }, [state.stats]);

  function completeQuest(id) {
    setState(prev => {
      const quest = prev.quests.find(q => q.id === id);
      if (!quest || quest.completedToday) return prev;

      let nextXp = prev.xp + Number(quest.xp);
      let nextLevel = prev.level;
      let needed = xpForLevel(nextLevel);

      while (nextXp >= needed) {
        nextXp -= needed;
        nextLevel += 1;
        needed = xpForLevel(nextLevel);
      }

      const today = todayKey();
      const nextStreak = prev.lastCompletedDate === today ? prev.streak : prev.streak + 1;

      const rewards = prev.rewards.map(reward => ({
        ...reward,
        unlocked: reward.unlocked || (reward.level && nextLevel >= reward.level),
      }));

      return {
        ...prev,
        xp: nextXp,
        level: nextLevel,
        streak: nextStreak,
        lastCompletedDate: today,
        stats: {
          ...prev.stats,
          [quest.stat]: prev.stats[quest.stat] + 1,
          discipline: quest.stat === 'discipline' ? prev.stats.discipline + 1 : prev.stats.discipline,
        },
        rewards,
        quests: prev.quests.map(q => q.id === id ? { ...q, completedToday: true } : q),
      };
    });
  }

  function addQuest(e) {
    e.preventDefault();
    if (!newQuest.title.trim()) return;
    setState(prev => ({
      ...prev,
      quests: [
        ...prev.quests,
        { id: crypto.randomUUID(), ...newQuest, xp: Number(newQuest.xp), completedToday: false },
      ],
    }));
    setNewQuest({ title: '', stat: 'discipline', xp: 50, frequency: 'daily' });
  }

  function resetDay() {
    setState(prev => ({ ...prev, quests: prev.quests.map(q => ({ ...q, completedToday: false })) }));
  }

  function resetApp() {
    localStorage.removeItem(STORAGE_KEY);
    setState(starterState);
  }

  return (
    <main className="app-shell">
      <section className="phone-frame">
        <header className="topbar">
          <div>
            <p className="eyebrow">LEGACY.EXE</p>
            <h1>Execute your legacy.</h1>
          </div>
          <div className="level-pill">LVL {state.level}</div>
        </header>

        <nav className="tabs">
          {['home', 'quests', 'character', 'rewards'].map(item => (
            <button key={item} onClick={() => setTab(item)} className={tab === item ? 'active' : ''}>{item}</button>
          ))}
        </nav>

        {tab === 'home' && (
          <section className="screen-stack">
            <div className="hero-card">
              <div className={`avatar ${dominantStat}`}>
                <Sword size={56} />
              </div>
              <div className="hero-copy">
                <p className="eyebrow">Uncompiled Character</p>
                <h2>{state.playerName}</h2>
                <p>Dominant path: {STAT_META[dominantStat].label}</p>
              </div>
            </div>

            <div className="xp-card">
              <div className="row-between">
                <span>XP Progress</span>
                <strong>{state.xp} / {currentLevelXp}</strong>
              </div>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
            </div>

            <div className="boss-card">
              <div className="row-between">
                <div>
                  <p className="eyebrow">Weekly Boss</p>
                  <h3>The Drift</h3>
                </div>
                <Trophy />
              </div>
              <p>Complete enough quests to defeat the week before it defeats your momentum.</p>
              <div className="progress-track"><div className="progress-fill boss" style={{ width: `${bossProgress}%` }} /></div>
              <small>{bossProgress}% defeated today</small>
            </div>

            <div className="quest-list">
              <div className="row-between"><h3>Today's Quests</h3><button className="ghost" onClick={resetDay}><RotateCcw size={16} /> Reset day</button></div>
              {state.quests.slice(0, 4).map(q => <QuestItem key={q.id} quest={q} onComplete={completeQuest} />)}
            </div>
          </section>
        )}

        {tab === 'quests' && (
          <section className="screen-stack">
            <form className="form-card" onSubmit={addQuest}>
              <h3>Create Quest</h3>
              <input value={newQuest.title} onChange={e => setNewQuest({ ...newQuest, title: e.target.value })} placeholder="Example: Workout" />
              <div className="form-grid">
                <select value={newQuest.stat} onChange={e => setNewQuest({ ...newQuest, stat: e.target.value })}>
                  {Object.entries(STAT_META).map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
                </select>
                <input type="number" min="10" step="5" value={newQuest.xp} onChange={e => setNewQuest({ ...newQuest, xp: e.target.value })} />
              </div>
              <input value={newQuest.frequency} onChange={e => setNewQuest({ ...newQuest, frequency: e.target.value })} placeholder="daily, weekly, 3x weekly" />
              <button className="primary"><Plus size={18} /> Add Quest</button>
            </form>
            <div className="quest-list">
              {state.quests.map(q => <QuestItem key={q.id} quest={q} onComplete={completeQuest} />)}
            </div>
          </section>
        )}

        {tab === 'character' && (
          <section className="screen-stack">
            <div className="hero-card large">
              <div className={`avatar big ${dominantStat}`}><Shield size={72} /></div>
              <div>
                <p className="eyebrow">Level {state.level}</p>
                <h2>{state.playerName}</h2>
                <p>Streak: {state.streak} completions</p>
              </div>
            </div>
            <div className="stats-grid">
              {Object.entries(STAT_META).map(([key, meta]) => {
                const Icon = meta.icon;
                return <div className="stat-card" key={key}><Icon size={20} /><span>{meta.label}</span><strong>{state.stats[key]}</strong></div>;
              })}
            </div>
          </section>
        )}

        {tab === 'rewards' && (
          <section className="screen-stack">
            <div className="quest-list">
              <h3>Rewards</h3>
              {state.rewards.map(reward => (
                <div className={`reward ${reward.unlocked ? 'unlocked' : ''}`} key={reward.id}>
                  <Trophy />
                  <div><strong>{reward.name}</strong><p>{reward.requirement}</p></div>
                  <span>{reward.unlocked ? 'Unlocked' : 'Locked'}</span>
                </div>
              ))}
            </div>
            <button className="danger" onClick={resetApp}>Reset App Data</button>
          </section>
        )}
      </section>
    </main>
  );
}

function QuestItem({ quest, onComplete }) {
  const Icon = STAT_META[quest.stat].icon;
  return (
    <article className={`quest-item ${quest.completedToday ? 'complete' : ''}`}>
      <div className="quest-left">
        <div className="quest-icon"><Icon size={20} /></div>
        <div>
          <h4>{quest.title}</h4>
          <p>{STAT_META[quest.stat].label} • {quest.frequency} • {quest.xp} XP</p>
        </div>
      </div>
      <button onClick={() => onComplete(quest.id)} disabled={quest.completedToday} className="complete-btn">
        <CheckCircle2 size={20} />
      </button>
    </article>
  );
}

createRoot(document.getElementById('root')).render(<App />);
