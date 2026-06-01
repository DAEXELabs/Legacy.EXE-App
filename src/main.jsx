import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  Brain,
  Coins,
  Heart,
  Palette,
  Shield,
  Trophy,
  Plus,
  CheckCircle2,
  RotateCcw,
  Flame,
  Skull,
  Sparkles,
  Timer,
  MessageSquareText,
  Dumbbell,
} from 'lucide-react';
import './styles.css';

const STORAGE_KEY = 'legacy-exe-state-v2';

const STAT_META = {
  health: { label: 'Health', icon: Activity, color: '#51ffa9' },
  knowledge: { label: 'Knowledge', icon: Brain, color: '#45d0ff' },
  wealth: { label: 'Wealth', icon: Coins, color: '#f6c65b' },
  relationships: { label: 'Relationships', icon: Heart, color: '#ff5da6' },
  creativity: { label: 'Creativity', icon: Palette, color: '#be74ff' },
  discipline: { label: 'Discipline', icon: Shield, color: '#8d6cff' },
};

const PROOF_META = {
  honor: { label: 'Honor', icon: CheckCircle2 },
  timer: { label: 'Timer', icon: Timer },
  checkin: { label: 'Check-in', icon: MessageSquareText },
  workout: { label: 'Workout KPI', icon: Dumbbell },
};

const BOSSES = [
  {
    name: 'The Drift',
    description: 'It feeds on delay, excuses, and unfinished intentions.',
    weakness: 'Consistent quest completion.',
    victory: 'The Drift has been broken. Momentum belongs to you.',
  },
  {
    name: 'The Noise Eater',
    description: 'It feeds on distraction, scrolling, and scattered attention.',
    weakness: 'Focus sessions and discipline quests.',
    victory: 'The noise has been silenced. Your focus is yours again.',
  },
  {
    name: 'The Doubt Wraith',
    description: 'It whispers that you are not ready, not worthy, and not enough.',
    weakness: 'Action before confidence.',
    victory: 'Doubt lost its voice. You moved anyway.',
  },
  {
    name: 'The Comfort Tyrant',
    description: 'It rules through ease, softness, and avoiding hard things.',
    weakness: 'Doing the necessary thing when it is inconvenient.',
    victory: 'Comfort no longer commands you.',
  },
  {
    name: 'The Guiltborn',
    description: 'It grows from shame, regret, and the weight of yesterday.',
    weakness: 'Repentance, responsibility, and forward movement.',
    victory: 'The past did not get the final word today.',
  },
  {
    name: 'The Spiral',
    description: 'It traps your mind in loops, what-ifs, and overthinking.',
    weakness: 'Simple next actions.',
    victory: 'The loop was cut. You returned to the present.',
  },
  {
    name: 'The False Self',
    description: 'It keeps you living in fantasy instead of execution.',
    weakness: 'Real-world proof.',
    victory: 'Fantasy bowed to evidence.',
  },
  {
    name: 'The Fear Architect',
    description: 'It builds walls out of failure, success, judgment, and uncertainty.',
    weakness: 'Courageous attempts.',
    victory: 'The walls cracked. You stepped forward.',
  },
  {
    name: 'The Fragmentor',
    description: 'It scatters your energy across too many unfinished paths.',
    weakness: 'Priority, focus, and completion.',
    victory: 'Your focus was reforged.',
  },
  {
    name: 'The Craving Maw',
    description: 'It feeds on impulse, lust, escape, and quick relief.',
    weakness: 'Self-control and replacement actions.',
    victory: 'The craving passed. You remained.',
  },
  {
    name: 'The Hollow King',
    description: 'It drains meaning and makes progress feel empty.',
    weakness: 'Connection, gratitude, and purposeful action.',
    victory: 'Meaning returned to the throne.',
  },
  {
    name: 'The Unfinished One',
    description: 'It is made of abandoned projects, broken promises, and lost momentum.',
    weakness: 'Finishing what you start.',
    victory: 'The unfinished became evidence of discipline.',
  },
];

const starterState = {
  playerName: '',
  avatar: '⚔️',
  title: 'Uncompiled Operator',
  xp: 0,
  level: 1,
  streak: 0,
  lastCompletedDate: null,
  onboarded: false,
  workoutLogs: [],
  dailyReflections: {},
  stats: {
    health: 0,
    knowledge: 0,
    wealth: 0,
    relationships: 0,
    creativity: 0,
    discipline: 0,
  },
  quests: [
    {
      id: crypto.randomUUID(),
      title: 'Workout 30 minutes',
      stat: 'health',
      xp: 100,
      frequency: 'daily',
      proof: 'workout',
      completedToday: false,
    },
    {
      id: crypto.randomUUID(),
      title: 'Read or study 20 minutes',
      stat: 'knowledge',
      xp: 50,
      frequency: 'daily',
      proof: 'checkin',
      completedToday: false,
    },
    {
      id: crypto.randomUUID(),
      title: 'Intentional family time',
      stat: 'relationships',
      xp: 50,
      frequency: 'daily',
      proof: 'checkin',
      completedToday: false,
    },
    {
      id: crypto.randomUUID(),
      title: 'Focus session 25 minutes',
      stat: 'discipline',
      xp: 75,
      frequency: 'daily',
      proof: 'timer',
      completedToday: false,
    },
    {
      id: crypto.randomUUID(),
      title: 'Budget check-in',
      stat: 'wealth',
      xp: 25,
      frequency: 'daily',
      proof: 'honor',
      completedToday: false,
    },
    {
      id: crypto.randomUUID(),
      title: 'Creative session 30 minutes',
      stat: 'creativity',
      xp: 50,
      frequency: 'daily',
      proof: 'timer',
      completedToday: false,
    },
  ],
  rewards: [
    { id: 1, name: 'Uncompiled', requirement: 'Start your journey', unlocked: true },
    { id: 2, name: 'Initiate Frame', requirement: 'Reach Level 3', unlocked: false, level: 3 },
    { id: 3, name: 'Builder Armor', requirement: 'Reach Level 5', unlocked: false, level: 5 },
    { id: 4, name: 'Ascendant Aura', requirement: 'Reach Level 10', unlocked: false, level: 10 },
  ],
};

function xpForLevel(level) {
  return level * 200;
}

function computeTier(level) {
  if (level <= 5) return 'Uncompiled';
  if (level <= 15) return 'Initiate';
  if (level <= 30) return 'Builder';
  if (level <= 50) return 'Ascendant';
  if (level <= 75) return 'Champion';
  return 'Legacy';
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - start) / 86400000);
  return Math.ceil((days + start.getDay() + 1) / 7);
}

function getWeeklyBoss() {
  const week = getWeekNumber();
  const index = (week - 1) % BOSSES.length;

  return {
    ...BOSSES[index],
    week,
  };
}

function getBossProgress(quests) {
  const completed = quests.filter(q => q.completedToday).length;
  return Math.min(100, Math.round((completed / Math.max(quests.length, 1)) * 100));
}

function calculateEffortScore(log) {
  const duration = Number(log.duration || 0);
  const effort = Number(log.effort || 0);
  const sets = Number(log.sets || 0);
  const reps = Number(log.reps || 0);

  return Math.round(
    duration +
    effort * 5 +
    sets * 2 +
    Math.floor(reps / 10)
  );
}

function App() {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : starterState;
  });

  const [newQuest, setNewQuest] = useState({
    title: '',
    stat: 'discipline',
    xp: 50,
    frequency: 'daily',
    proof: 'honor',
  });

  const [tab, setTab] = useState('home');
  const [dailyReflection, setDailyReflection] = useState('');
  const [checkinQuest, setCheckinQuest] = useState(null);
  const [checkinText, setCheckinText] = useState('');
  const [timerQuest, setTimerQuest] = useState(null);
  const [timerDone, setTimerDone] = useState(false);

  const [workoutQuest, setWorkoutQuest] = useState(null);
  const [workoutProof, setWorkoutProof] = useState({
    type: 'Strength',
    duration: 30,
    effort: 6,
    sets: 6,
    reps: 60,
    notes: '',
  });

  const [profileDraft, setProfileDraft] = useState({
    playerName: '',
    avatar: '⚔️',
    title: 'Uncompiled Operator',
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!timerQuest || timerDone) return;
    const timeout = setTimeout(() => setTimerDone(true), 5000);
    return () => clearTimeout(timeout);
  }, [timerQuest, timerDone]);

  const weeklyBoss = getWeeklyBoss();
  const currentLevelXp = xpForLevel(state.level);
  const progress = Math.min(100, Math.round((state.xp / currentLevelXp) * 100));
  const bossProgress = getBossProgress(state.quests);
  const tier = computeTier(state.level);
  const completedToday = state.quests.filter(q => q.completedToday).length;

  const dailyXpEarned = state.quests
    .filter(q => q.completedToday)
    .reduce((sum, quest) => sum + Number(quest.xp || 0), 0);

  const strongestStat = Object.entries(state.stats).sort((a, b) => b[1] - a[1])[0];
  const savedReflection = state.dailyReflections?.[todayKey()] || '';

  const driftMessage =
    bossProgress >= 100
      ? weeklyBoss.victory
      : bossProgress >= 75
        ? 'Victory is close. Finish the compile.'
        : bossProgress >= 50
          ? `${weeklyBoss.name} is weakening.`
          : bossProgress >= 25
            ? 'Momentum is forming.'
            : `${weeklyBoss.name} is still feeding.`;

  const dominantStat = useMemo(() => {
    return Object.entries(state.stats).sort((a, b) => b[1] - a[1])[0][0];
  }, [state.stats]);

  function finishOnboarding(e) {
    e.preventDefault();
    const name = profileDraft.playerName.trim() || 'Operator';
    setState(prev => ({ ...prev, ...profileDraft, playerName: name, onboarded: true }));
  }

  function completeQuest(id, payload = {}) {
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
        workoutLogs: payload.workoutLog
          ? [...(prev.workoutLogs || []), payload.workoutLog]
          : (prev.workoutLogs || []),
        dailyReflections: prev.dailyReflections || {},
        stats: {
          ...prev.stats,
          [quest.stat]: prev.stats[quest.stat] + 1,
          discipline:
            quest.stat === 'discipline'
              ? prev.stats.discipline + 1
              : prev.stats.discipline,
        },
        rewards,
        quests: prev.quests.map(q =>
          q.id === id ? { ...q, completedToday: true } : q
        ),
      };
    });
  }

  function requestQuestCompletion(quest) {
    if (quest.completedToday) return;

    if (quest.proof === 'workout') {
      setWorkoutQuest(quest);
      setWorkoutProof({
        type: 'Strength',
        duration: 30,
        effort: 6,
        sets: 6,
        reps: 60,
        notes: '',
      });
      return;
    }

    if (quest.proof === 'checkin') {
      setCheckinQuest(quest);
      setCheckinText('');
      return;
    }

    if (quest.proof === 'timer') {
      setTimerQuest(quest);
      setTimerDone(false);
      return;
    }

    completeQuest(quest.id);
  }

  function submitWorkout(e) {
    e.preventDefault();

    if (!workoutQuest) return;

    const effortScore = calculateEffortScore(workoutProof);

    if (
      Number(workoutProof.duration || 0) < 10 ||
      Number(workoutProof.effort || 0) < 3 ||
      effortScore < 25
    ) {
      return;
    }

    completeQuest(workoutQuest.id, {
      workoutLog: {
        ...workoutProof,
        effortScore,
        date: todayKey(),
      },
    });

    setWorkoutQuest(null);
  }

  function submitCheckin(e) {
    e.preventDefault();

    if (!checkinQuest || checkinText.trim().length < 5) return;

    completeQuest(checkinQuest.id);
    setCheckinQuest(null);
    setCheckinText('');
  }

  function submitTimer() {
    if (!timerQuest || !timerDone) return;

    completeQuest(timerQuest.id);
    setTimerQuest(null);
    setTimerDone(false);
  }

  function saveDailyReflection(e) {
    e.preventDefault();

    const text = dailyReflection.trim();
    if (text.length < 5) return;

    setState(prev => ({
      ...prev,
      dailyReflections: {
        ...(prev.dailyReflections || {}),
        [todayKey()]: text,
      },
    }));

    setDailyReflection('');
  }

  function addQuest(e) {
    e.preventDefault();

    if (!newQuest.title.trim()) return;

    setState(prev => ({
      ...prev,
      quests: [
        ...prev.quests,
        {
          id: crypto.randomUUID(),
          ...newQuest,
          xp: Number(newQuest.xp),
          completedToday: false,
        },
      ],
    }));

    setNewQuest({
      title: '',
      stat: 'discipline',
      xp: 50,
      frequency: 'daily',
      proof: 'honor',
    });
  }

  function resetDay() {
    setState(prev => ({
      ...prev,
      quests: prev.quests.map(q => ({ ...q, completedToday: false })),
    }));
  }

  function resetApp() {
    localStorage.removeItem(STORAGE_KEY);
    setState(starterState);
  }

  if (!state.onboarded) {
    return (
      <main className="app-shell">
        <section className="phone-frame onboarding-frame">
          <p className="eyebrow">LEGACY.EXE</p>
          <h1>Stop planning. Start executing.</h1>
          <p className="intro-copy">
            Build yourself one quest at a time. Create your operator and begin compiling your legacy.
          </p>

          <form className="form-card onboarding-card" onSubmit={finishOnboarding}>
            <div className="avatar forge-avatar">{profileDraft.avatar}</div>

            <label>Operator Name</label>
            <input
              value={profileDraft.playerName}
              onChange={e =>
                setProfileDraft({ ...profileDraft, playerName: e.target.value })
              }
              placeholder="Raymond, Operator, Builder..."
            />

            <label>Avatar</label>
            <div className="emoji-grid">
              {['⚔️', '🛡️', '🔥', '🧠', '👑', '🐺', '⚡', '🧱'].map(icon => (
                <button
                  type="button"
                  key={icon}
                  className={profileDraft.avatar === icon ? 'active' : ''}
                  onClick={() => setProfileDraft({ ...profileDraft, avatar: icon })}
                >
                  {icon}
                </button>
              ))}
            </div>

            <label>Title</label>
            <select
              value={profileDraft.title}
              onChange={e =>
                setProfileDraft({ ...profileDraft, title: e.target.value })
              }
            >
              <option>Uncompiled Operator</option>
              <option>Discipline Builder</option>
              <option>Warrior in Training</option>
              <option>Legacy Architect</option>
            </select>

            <button className="primary">Begin Compile</button>
          </form>
        </section>
      </main>
    );
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
          {['home', 'quests', 'compile', 'character', 'boss'].map(item => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={tab === item ? 'active' : ''}
            >
              {item}
            </button>
          ))}
        </nav>

        {tab === 'home' && (
          <section className="screen-stack">
            <div className="hero-card">
              <div className={`avatar ${dominantStat}`}>{state.avatar}</div>
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
                <strong>
                  {state.xp} / {currentLevelXp}
                </strong>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="boss-card">
              <div className="row-between">
                <div>
                  <p className="eyebrow">Week {weeklyBoss.week} Boss</p>
                  <h3>{weeklyBoss.name}</h3>
                </div>
                <Skull />
              </div>
              <p>{weeklyBoss.description}</p>
              <p>{driftMessage}</p>
              <div className="progress-track">
                <div className="progress-fill boss" style={{ width: `${bossProgress}%` }} />
              </div>
              <small>
                {bossProgress}% defeated today • {completedToday}/{state.quests.length} quests complete
              </small>
            </div>

            <div className="quest-list">
              <div className="row-between">
                <h3>Today&apos;s Quests</h3>
                <button className="ghost" onClick={resetDay}>
                  <RotateCcw size={16} /> Reset day
                </button>
              </div>

              {state.quests
                .slice(0, 4)
                .map(q => (
                  <QuestItem
                    key={q.id}
                    quest={q}
                    onComplete={requestQuestCompletion}
                  />
                ))}
            </div>
          </section>
        )}

        {tab === 'compile' && (
          <section className="screen-stack">
            <div className="boss-card">
              <p className="eyebrow">Daily Compile</p>
              <h2>What did today prove?</h2>
              <p>
                You are not just checking boxes. You are compiling evidence of who you are becoming.
              </p>

              <div className="progress-track">
                <div className="progress-fill boss" style={{ width: `${bossProgress}%` }} />
              </div>

              <small>{driftMessage}</small>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <CheckCircle2 size={20} />
                <span>Quests Complete</span>
                <strong>
                  {completedToday}/{state.quests.length}
                </strong>
              </div>

              <div className="stat-card">
                <Sparkles size={20} />
                <span>XP Earned Today</span>
                <strong>{dailyXpEarned}</strong>
              </div>

              <div className="stat-card">
                <Shield size={20} />
                <span>Strongest Stat</span>
                <strong>{STAT_META[strongestStat[0]].label}</strong>
              </div>

              <div className="stat-card">
                <Skull size={20} />
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
        )}

        {tab === 'quests' && (
          <section className="screen-stack">
            <form className="form-card" onSubmit={addQuest}>
              <h3>Create Quest</h3>

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
                    <option key={key} value={key}>
                      {meta.label}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="10"
                  step="5"
                  value={newQuest.xp}
                  onChange={e => setNewQuest({ ...newQuest, xp: e.target.value })}
                />
              </div>

              <div className="form-grid">
                <input
                  value={newQuest.frequency}
                  onChange={e =>
                    setNewQuest({ ...newQuest, frequency: e.target.value })
                  }
                  placeholder="daily, weekly, 3x weekly"
                />

                <select
                  value={newQuest.proof}
                  onChange={e => setNewQuest({ ...newQuest, proof: e.target.value })}
                >
                  {Object.entries(PROOF_META).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.label}
                    </option>
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
                    <h3>
                      <StatIcon size={18} /> {meta.label}
                    </h3>
                    <span className="proof-badge">
                      {statQuests.filter(q => q.completedToday).length}/{statQuests.length}
                    </span>
                  </div>

                  {statQuests.map(q => (
                    <QuestItem
                      key={q.id}
                      quest={q}
                      onComplete={requestQuestCompletion}
                    />
                  ))}
                </div>
              );
            })}
          </section>
        )}

        {tab === 'character' && (
          <section className="screen-stack">
            <div className="hero-card large character-card">
              <div className={`avatar big ${dominantStat}`}>{state.avatar}</div>
              <div>
                <p className="eyebrow">{tier}</p>
                <h2>{state.playerName}</h2>
                <p>{state.title}</p>
                <p>Streak: {state.streak} completions</p>
              </div>
            </div>

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
              <h3>Unlocks</h3>

              {state.rewards.map(reward => (
                <div
                  className={`reward ${reward.unlocked ? 'unlocked' : ''}`}
                  key={reward.id}
                >
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
        )}

        {tab === 'boss' && (
          <section className="screen-stack">
            <div className="boss-card boss-screen">
              <div className="boss-avatar">
                <Skull size={70} />
              </div>
              <p className="eyebrow">Week {weeklyBoss.week} Boss</p>
              <h2>{weeklyBoss.name}</h2>
              <p>{weeklyBoss.description}</p>
              <p>
                <strong>Weakness:</strong> {weeklyBoss.weakness}
              </p>
              <p>{driftMessage}</p>
              <div className="progress-track">
                <div className="progress-fill boss" style={{ width: `${bossProgress}%` }} />
              </div>
              <strong>
                {bossProgress >= 100
                  ? 'Victory State Unlocked'
                  : `${100 - bossProgress}% HP Remaining`}
              </strong>
            </div>

            <div className="quest-list">
              <h3>Victory Conditions</h3>

              <div className="reward unlocked">
                <Flame />
                <div>
                  <strong>Complete quests</strong>
                  <p>Every completed quest damages {weeklyBoss.name}.</p>
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

              <div className={`reward ${state.streak >= 3 ? 'unlocked' : ''}`}>
                <Shield />
                <div>
                  <strong>Build a 3-completion streak</strong>
                  <p>Prove you can return to the system.</p>
                </div>
                <span>{state.streak >= 3 ? 'Done' : 'Pending'}</span>
              </div>
            </div>

            <button className="danger" onClick={resetApp}>
              Reset Operator
            </button>
          </section>
        )}
      </section>

      {workoutQuest && (
        <div className="modal-backdrop">
          <form className="modal-card" onSubmit={submitWorkout}>
            <p className="eyebrow">Workout Proof KPI</p>
            <h3>{workoutQuest.title}</h3>
            <p>
              Log measurable effort before XP unlocks. Minimum: 10 minutes, effort 3+, score 25+.
            </p>

            <div className="form-grid">
              <select
                value={workoutProof.type}
                onChange={e =>
                  setWorkoutProof({ ...workoutProof, type: e.target.value })
                }
              >
                <option>Strength</option>
                <option>Cardio</option>
                <option>Mobility</option>
                <option>Sport</option>
                <option>Other</option>
              </select>

              <input
                type="number"
                min="0"
                value={workoutProof.duration}
                onChange={e =>
                  setWorkoutProof({ ...workoutProof, duration: e.target.value })
                }
                placeholder="Minutes"
              />
            </div>

            <div className="form-grid">
              <input
                type="number"
                min="1"
                max="10"
                value={workoutProof.effort}
                onChange={e =>
                  setWorkoutProof({ ...workoutProof, effort: e.target.value })
                }
                placeholder="Effort 1-10"
              />

              <input
                type="number"
                min="0"
                value={workoutProof.sets}
                onChange={e =>
                  setWorkoutProof({ ...workoutProof, sets: e.target.value })
                }
                placeholder="Sets"
              />
            </div>

            <input
              type="number"
              min="0"
              value={workoutProof.reps}
              onChange={e =>
                setWorkoutProof({ ...workoutProof, reps: e.target.value })
              }
              placeholder="Reps"
            />

            <textarea
              value={workoutProof.notes}
              onChange={e =>
                setWorkoutProof({ ...workoutProof, notes: e.target.value })
              }
              placeholder="What did you actually do?"
            />

            <div className="kpi-score">
              Effort Score: {calculateEffortScore(workoutProof)}
            </div>

            <button
              className="primary"
              disabled={
                Number(workoutProof.duration || 0) < 10 ||
                Number(workoutProof.effort || 0) < 3 ||
                calculateEffortScore(workoutProof) < 25
              }
            >
              Submit Workout Proof
            </button>

            <button
              type="button"
              className="ghost"
              onClick={() => setWorkoutQuest(null)}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {checkinQuest && (
        <div className="modal-backdrop">
          <form className="modal-card" onSubmit={submitCheckin}>
            <p className="eyebrow">Proof of Effort</p>
            <h3>{checkinQuest.title}</h3>
            <p>Write one honest sentence about what you did.</p>

            <textarea
              value={checkinText}
              onChange={e => setCheckinText(e.target.value)}
              placeholder="Example: I read chapter 2 and took notes."
            />

            <button className="primary" disabled={checkinText.trim().length < 5}>
              Submit Proof
            </button>

            <button
              type="button"
              className="ghost"
              onClick={() => setCheckinQuest(null)}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {timerQuest && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <p className="eyebrow">Timer Proof</p>
            <h3>{timerQuest.title}</h3>

            <div className="timer-ring">{timerDone ? '✓' : '5'}</div>

            <p>
              {timerDone
                ? 'Timer complete. Claim your XP.'
                : 'Demo timer running. Full focus timer comes next.'}
            </p>

            <button className="primary" disabled={!timerDone} onClick={submitTimer}>
              Claim XP
            </button>

            <button
              type="button"
              className="ghost"
              onClick={() => setTimerQuest(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function QuestItem({ quest, onComplete }) {
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

createRoot(document.getElementById('root')).render(<App />);