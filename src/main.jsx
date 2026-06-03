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
  Upload,
  Download,
  Flame,
  Skull,
  Sparkles,
  Timer,
  MessageSquareText,
  Dumbbell,
} from 'lucide-react';
import './styles.css';
import { ACHIEVEMENTS } from './data/achievements';
import { BOSSES } from './data/bosses';
import {
  xpForLevel,
  computeTier,
  todayKey,
  getWeeklyBoss,
  getStreakMultiplier,
  applyXpProgress,
  getBossDamage,
  getBossProgress,
} from './utils/progression';

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

const CHRONICLE_TYPES = [
  'Physical Progress',
  'Book / Reading',
  'Workout Proof',
  'Discipline Win',
  'Relationship Win',
  'Creative Build',
];

const starterState = {
  playerName: '',
  avatar: '⚔️',
  title: 'Uncompiled Operator',
  xp: 0,
  lifetimeXp: 0,
  level: 1,
  streak: 0,
  lastCompletedDate: null,
  onboarded: false,
  workoutLogs: [],
  dailyReflections: {},
  chroniclePosts: [],
  bossArchive: [],
  achievements: [],
  readingGoal: {
    currentBook: '',
    monthlyBooksTarget: 2,
    monthlyChaptersTarget: 12,
    booksCompleted: 0,
    chaptersCompleted: 0,
    pagesRead: 0,
    readingLogs: [],
  },
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

function getWorkoutTier(level) {
  if (level <= 5) {
    return {
      name: 'Initiate',
      intensity: 'Foundation',
      target: 'Learn form and finish clean.',
      exercises: [
        { name: 'Pushups', sets: 2, reps: 8, weight: 'Bodyweight' },
        { name: 'Bodyweight Squats', sets: 2, reps: 10, weight: 'Bodyweight' },
        { name: 'Plank', sets: 2, reps: '20 sec', weight: 'Bodyweight' },
      ],
    };
  }

  if (level <= 15) {
    return {
      name: 'Builder',
      intensity: 'Structured',
      target: 'More volume, more consistency.',
      exercises: [
        { name: 'Pushups', sets: 3, reps: 12, weight: 'Bodyweight' },
        { name: 'Squats', sets: 3, reps: 15, weight: 'Bodyweight or light dumbbell' },
        { name: 'Dumbbell Rows', sets: 3, reps: 10, weight: 'Moderate' },
        { name: 'Plank', sets: 3, reps: '30 sec', weight: 'Bodyweight' },
      ],
    };
  }

  if (level <= 30) {
    return {
      name: 'Warrior',
      intensity: 'Weighted',
      target: 'Push strength and conditioning.',
      exercises: [
        { name: 'Goblet Squat', sets: 4, reps: 10, weight: 'Moderate-heavy' },
        { name: 'Pushups or Bench Press', sets: 4, reps: 12, weight: 'Moderate' },
        { name: 'Dumbbell Rows', sets: 4, reps: 12, weight: 'Moderate-heavy' },
        { name: 'Lunges', sets: 3, reps: '12 each leg', weight: 'Moderate' },
        { name: 'Plank', sets: 3, reps: '45 sec', weight: 'Bodyweight' },
      ],
    };
  }

  if (level <= 50) {
    return {
      name: 'Ascendant',
      intensity: 'High Output',
      target: 'Volume, supersets, and a finisher.',
      exercises: [
        { name: 'Squat or Leg Press', sets: 4, reps: 10, weight: 'Heavy' },
        { name: 'Press Movement', sets: 4, reps: 10, weight: 'Heavy' },
        { name: 'Row Movement', sets: 4, reps: 12, weight: 'Heavy' },
        { name: 'Romanian Deadlift', sets: 4, reps: 10, weight: 'Moderate-heavy' },
        { name: 'Core Circuit', sets: 4, reps: '45 sec', weight: 'Bodyweight' },
        { name: 'Finisher', sets: 1, reps: '5 min AMRAP', weight: 'Conditioning' },
      ],
    };
  }

  return {
    name: 'Legacy',
    intensity: 'Elite',
    target: 'Advanced volume. No empty reps.',
    exercises: [
      { name: 'Compound Lower Body', sets: 5, reps: 8, weight: 'Heavy' },
      { name: 'Compound Upper Push', sets: 5, reps: 8, weight: 'Heavy' },
      { name: 'Compound Pull', sets: 5, reps: 10, weight: 'Heavy' },
      { name: 'Accessory Superset', sets: 4, reps: 12, weight: 'Moderate-heavy' },
      { name: 'Core Finisher', sets: 4, reps: '60 sec', weight: 'Bodyweight' },
      { name: 'Conditioning Finisher', sets: 1, reps: '8 min AMRAP', weight: 'Conditioning' },
    ],
  };
}

function getRegimenTotals(regimen) {
  return regimen.exercises.reduce(
    (total, exercise) => ({
      sets: total.sets + Number(exercise.sets || 0),
      exercises: total.exercises + 1,
    }),
    { sets: 0, exercises: 0 }
  );
}

function getAchievementIds(achievements = []) {
  return achievements.map(achievement => achievement.id);
}

function unlockAchievements(prev, candidates = []) {
  const unlockedIds = getAchievementIds(prev.achievements || []);
  const freshAchievements = candidates.filter(item => !unlockedIds.includes(item.id));

  if (freshAchievements.length === 0) {
    return {
      achievements: prev.achievements || [],
      bonusXp: 0,
      latestTitle: prev.title,
    };
  }

  const now = new Date().toISOString();
  const earned = freshAchievements.map(item => ({
    ...item,
    unlockedAt: now,
  }));

  return {
    achievements: [...earned, ...(prev.achievements || [])],
    bonusXp: earned.reduce((sum, item) => sum + Number(item.xp || 0), 0),
    latestTitle: earned[0]?.title || prev.title,
  };
}

function App() {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return starterState;

    try {
      const parsed = JSON.parse(saved);

      return {
        ...starterState,
        ...parsed,
        stats: {
          ...starterState.stats,
          ...(parsed.stats || {}),
        },
        quests: parsed.quests || starterState.quests,
        rewards: parsed.rewards || starterState.rewards,
        lifetimeXp: parsed.lifetimeXp || parsed.xp || 0,
        achievements: parsed.achievements || [],
        workoutLogs: parsed.workoutLogs || [],
        dailyReflections: parsed.dailyReflections || {},
        chroniclePosts: parsed.chroniclePosts || [],
        bossArchive: parsed.bossArchive || [],
        readingGoal: {
          ...starterState.readingGoal,
          ...(parsed.readingGoal || {}),
          readingLogs: parsed.readingGoal?.readingLogs || [],
        },
      };
    } catch {
      return starterState;
    }
  });

  const [newQuest, setNewQuest] = useState({
    title: '',
    stat: 'discipline',
    xp: 50,
    frequency: 'daily',
    proof: 'honor',
  });

  const [tab, setTab] = useState('home');
  const [backupMessage, setBackupMessage] = useState('');
  const [dailyReflection, setDailyReflection] = useState('');
  const [readingDraft, setReadingDraft] = useState({
    currentBook: state.readingGoal?.currentBook || '',
    chapters: '',
    pages: '',
    completedBook: false,
  });
  const [chronicleDraft, setChronicleDraft] = useState({
    type: 'Physical Progress',
    caption: '',
    imageUrl: '',
  });
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

  const workoutRegimen = getWorkoutTier(state.level);
  const workoutTotals = getRegimenTotals(workoutRegimen);

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
  const baseBossDamage = getBossDamage(state.quests, state.chroniclePosts || []);
  const streakMultiplier = getStreakMultiplier(state.streak);
  const bossDamage = Math.round(baseBossDamage * streakMultiplier);
  const bossProgress = Math.min(100, Math.round((bossDamage / weeklyBoss.hp) * 100));
  const bossHpRemaining = Math.max(0, weeklyBoss.hp - bossDamage);
  const bossDefeated = bossProgress >= 100;
  const isBossArchived = (state.bossArchive || []).some(
    entry => entry.name === weeklyBoss.name && entry.week === weeklyBoss.week
  );
  const tier = computeTier(state.level);
  const completedToday = state.quests.filter(q => q.completedToday).length;

  const dailyXpEarned = state.quests
    .filter(q => q.completedToday)
    .reduce((sum, quest) => sum + Number(quest.xp || 0), 0);

  const strongestStat = Object.entries(state.stats).sort((a, b) => b[1] - a[1])[0];
  const readingGoal = state.readingGoal || starterState.readingGoal;
  const booksProgress = Math.min(
    100,
    Math.round((Number(readingGoal.booksCompleted || 0) / Math.max(Number(readingGoal.monthlyBooksTarget || 1), 1)) * 100)
  );
  const chaptersProgress = Math.min(
    100,
    Math.round((Number(readingGoal.chaptersCompleted || 0) / Math.max(Number(readingGoal.monthlyChaptersTarget || 1), 1)) * 100)
  );
  const readingXpEarned = (readingGoal.readingLogs || []).reduce(
    (sum, log) => sum + Number(log.xp || 0),
    0
  );
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

      let { nextXp, nextLevel, rewards, nextLifetimeXp } = applyXpProgress(prev, Number(quest.xp));

      const today = todayKey();
      const nextStreak = prev.lastCompletedDate === today ? prev.streak : prev.streak + 1;

      const achievementCandidates = [];

      if (payload.workoutLog && (prev.workoutLogs || []).length === 0) {
        achievementCandidates.push(ACHIEVEMENTS.find(item => item.id === 'first-workout'));
      }

      if (nextStreak >= 7) {
        achievementCandidates.push(ACHIEVEMENTS.find(item => item.id === 'seven-streak'));
      }

      if (nextLifetimeXp >= 1000) {
        achievementCandidates.push(ACHIEVEMENTS.find(item => item.id === 'thousand-xp'));
      }

      const achievementResult = unlockAchievements(
        { ...prev, title: prev.title },
        achievementCandidates.filter(Boolean)
      );

      if (achievementResult.bonusXp > 0) {
        const bonusProgress = applyXpProgress(
          { ...prev, xp: nextXp, level: nextLevel, rewards, lifetimeXp: nextLifetimeXp },
          achievementResult.bonusXp
        );
        nextXp = bonusProgress.nextXp;
        nextLevel = bonusProgress.nextLevel;
        rewards = bonusProgress.rewards;
        nextLifetimeXp = bonusProgress.nextLifetimeXp;
      }

      return {
        ...prev,
        xp: nextXp,
        lifetimeXp: nextLifetimeXp,
        level: nextLevel,
        title: achievementResult.latestTitle,
        achievements: achievementResult.achievements,
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
        regimen: workoutRegimen.name,
        regimenIntensity: workoutRegimen.intensity,
        targetExercises: workoutTotals.exercises,
        targetSets: workoutTotals.sets,
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

  function logReadingProgress(e) {
    e.preventDefault();

    const chapters = Number(readingDraft.chapters || 0);
    const pages = Number(readingDraft.pages || 0);
    const currentBook = readingDraft.currentBook.trim();

    if (!currentBook || (chapters <= 0 && pages <= 0 && !readingDraft.completedBook)) return;

    const xpEarned =
      chapters * 15 +
      Math.floor(pages / 5) * 5 +
      (readingDraft.completedBook ? 100 : 0);

    setState(prev => {
      let { nextXp, nextLevel, rewards, nextLifetimeXp } = applyXpProgress(prev, xpEarned);

      const achievementCandidates = [];

      if (readingDraft.completedBook) {
        achievementCandidates.push(ACHIEVEMENTS.find(item => item.id === 'first-book'));
      }

      if (nextLifetimeXp >= 1000) {
        achievementCandidates.push(ACHIEVEMENTS.find(item => item.id === 'thousand-xp'));
      }

      const achievementResult = unlockAchievements(prev, achievementCandidates.filter(Boolean));

      if (achievementResult.bonusXp > 0) {
        const bonusProgress = applyXpProgress(
          { ...prev, xp: nextXp, level: nextLevel, rewards, lifetimeXp: nextLifetimeXp },
          achievementResult.bonusXp
        );
        nextXp = bonusProgress.nextXp;
        nextLevel = bonusProgress.nextLevel;
        rewards = bonusProgress.rewards;
        nextLifetimeXp = bonusProgress.nextLifetimeXp;
      }

      return {
        ...prev,
        xp: nextXp,
        lifetimeXp: nextLifetimeXp,
        level: nextLevel,
        title: achievementResult.latestTitle,
        achievements: achievementResult.achievements,
        rewards,
        stats: {
          ...prev.stats,
          knowledge: prev.stats.knowledge + Math.max(1, chapters + (readingDraft.completedBook ? 3 : 0)),
        },
        readingGoal: {
          ...(prev.readingGoal || starterState.readingGoal),
          currentBook,
          chaptersCompleted: Number(prev.readingGoal?.chaptersCompleted || 0) + chapters,
          pagesRead: Number(prev.readingGoal?.pagesRead || 0) + pages,
          booksCompleted:
            Number(prev.readingGoal?.booksCompleted || 0) + (readingDraft.completedBook ? 1 : 0),
          readingLogs: [
            {
              id: crypto.randomUUID(),
              book: currentBook,
              chapters,
              pages,
              completedBook: readingDraft.completedBook,
              xp: xpEarned,
              date: new Date().toISOString(),
            },
            ...((prev.readingGoal?.readingLogs) || []),
          ],
        },
      };
    });

    setReadingDraft({
      currentBook,
      chapters: '',
      pages: '',
      completedBook: false,
    });
  }

  function addChroniclePost(e) {
    e.preventDefault();

    const caption = chronicleDraft.caption.trim();
    const imageUrl = chronicleDraft.imageUrl.trim();

    if (caption.length < 5) return;

    setState(prev => {
      let { nextXp, nextLevel, rewards, nextLifetimeXp } = applyXpProgress(prev, 25);

      const achievementCandidates = [];

      if (nextLifetimeXp >= 1000) {
        achievementCandidates.push(ACHIEVEMENTS.find(item => item.id === 'thousand-xp'));
      }

      achievementCandidates.push(ACHIEVEMENTS.find(item => item.id === 'first-public-proof'));

      const achievementResult = unlockAchievements(prev, achievementCandidates.filter(Boolean));

      if (achievementResult.bonusXp > 0) {
        const bonusProgress = applyXpProgress(
          { ...prev, xp: nextXp, level: nextLevel, rewards, lifetimeXp: nextLifetimeXp },
          achievementResult.bonusXp
        );
        nextXp = bonusProgress.nextXp;
        nextLevel = bonusProgress.nextLevel;
        rewards = bonusProgress.rewards;
        nextLifetimeXp = bonusProgress.nextLifetimeXp;
      }

      return {
        ...prev,
        xp: nextXp,
        lifetimeXp: nextLifetimeXp,
        level: nextLevel,
        title: achievementResult.latestTitle,
        achievements: achievementResult.achievements,
        rewards,
        chroniclePosts: [
          {
            id: crypto.randomUUID(),
            type: chronicleDraft.type,
            caption,
            imageUrl,
            visibility: 'public',
            encouragementCount: 0,
            date: new Date().toISOString(),
            xp: 25,
          },
          ...(prev.chroniclePosts || []),
        ],
      };
    });

    setChronicleDraft({
      type: 'Physical Progress',
      caption: '',
      imageUrl: '',
    });
  }

  function archiveBossVictory() {
    if (!bossDefeated || isBossArchived) return;

    setState(prev => {
      let { nextXp, nextLevel, rewards, nextLifetimeXp } = applyXpProgress(prev, 0);

      const achievementResult = unlockAchievements(
        prev,
        [ACHIEVEMENTS.find(item => item.id === 'first-boss')].filter(Boolean)
      );

      if (achievementResult.bonusXp > 0) {
        const bonusProgress = applyXpProgress(prev, achievementResult.bonusXp);
        nextXp = bonusProgress.nextXp;
        nextLevel = bonusProgress.nextLevel;
        rewards = bonusProgress.rewards;
        nextLifetimeXp = bonusProgress.nextLifetimeXp;
      }

      return {
      ...prev,
      xp: nextXp,
      lifetimeXp: nextLifetimeXp,
      level: nextLevel,
      title: achievementResult.latestTitle,
      achievements: achievementResult.achievements,
      rewards,
      bossArchive: [
        {
          id: crypto.randomUUID(),
          name: weeklyBoss.name,
          icon: weeklyBoss.icon,
          domain: weeklyBoss.domain,
          archetype: weeklyBoss.archetype,
          week: weeklyBoss.week,
          hp: weeklyBoss.hp,
          damageDealt: bossDamage,
          baseDamage: baseBossDamage,
          multiplier: streakMultiplier,
          victory: weeklyBoss.victory,
          defeatedAt: new Date().toISOString(),
        },
        ...(prev.bossArchive || []),
      ],
    };
    });
  }

  function encourageChroniclePost(id) {
    setState(prev => ({
      ...prev,
      chroniclePosts: (prev.chroniclePosts || []).map(post =>
        post.id === id
          ? {
              ...post,
              encouragementCount: Number(post.encouragementCount || 0) + 1,
            }
          : post
      ),
    }));
  }

  function toggleChronicleVisibility(id) {
    setState(prev => ({
      ...prev,
      chroniclePosts: (prev.chroniclePosts || []).map(post =>
        post.id === id
          ? {
              ...post,
              visibility: post.visibility === 'private' ? 'public' : 'private',
            }
          : post
      ),
    }));
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

  function exportSaveData() {
    const payload = {
      app: 'Legacy.EXE',
      version: 2,
      exportedAt: new Date().toISOString(),
      state,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `legacy-exe-save-${todayKey()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setBackupMessage('Save file exported.');
  }

  function importSaveData(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const importedState = parsed.state || parsed;

        setState({
          ...starterState,
          ...importedState,
          stats: {
            ...starterState.stats,
            ...(importedState.stats || {}),
          },
          quests: importedState.quests || starterState.quests,
          rewards: importedState.rewards || starterState.rewards,
          lifetimeXp: importedState.lifetimeXp || importedState.xp || 0,
          achievements: importedState.achievements || [],
          workoutLogs: importedState.workoutLogs || [],
          dailyReflections: importedState.dailyReflections || {},
          chroniclePosts: importedState.chroniclePosts || [],
          bossArchive: importedState.bossArchive || [],
          readingGoal: {
            ...starterState.readingGoal,
            ...(importedState.readingGoal || {}),
            readingLogs: importedState.readingGoal?.readingLogs || [],
          },
        });

        setBackupMessage('Save file imported successfully.');
      } catch {
        setBackupMessage('Import failed. Use a valid Legacy.EXE save file.');
      }
    };

    reader.readAsText(file);
    event.target.value = '';
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
          {['home', 'quests', 'compile', 'reading', 'chronicle', 'achievements', 'character', 'boss'].map(item => (
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
                  <input
                    type="file"
                    accept="application/json"
                    onChange={importSaveData}
                    hidden
                  />
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
        )}

        {tab === 'reading' && (
          <section className="screen-stack">
            <div className="boss-card">
              <p className="eyebrow">Reading Campaign</p>
              <h2>Build the Knowledge stat.</h2>
              <p>
                Track books, chapters, and pages. Reading progress earns XP and strengthens your Knowledge path.
              </p>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <Brain size={20} />
                <span>Books Completed</span>
                <strong>
                  {readingGoal.booksCompleted}/{readingGoal.monthlyBooksTarget}
                </strong>
              </div>

              <div className="stat-card">
                <MessageSquareText size={20} />
                <span>Chapters Completed</span>
                <strong>
                  {readingGoal.chaptersCompleted}/{readingGoal.monthlyChaptersTarget}
                </strong>
              </div>

              <div className="stat-card">
                <Sparkles size={20} />
                <span>Reading XP</span>
                <strong>{readingXpEarned}</strong>
              </div>

              <div className="stat-card">
                <Brain size={20} />
                <span>Pages Read</span>
                <strong>{readingGoal.pagesRead}</strong>
              </div>
            </div>

            <div className="xp-card">
              <div className="row-between">
                <span>Monthly Book Goal</span>
                <strong>{booksProgress}%</strong>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${booksProgress}%` }} />
              </div>
            </div>

            <div className="xp-card">
              <div className="row-between">
                <span>Monthly Chapter Goal</span>
                <strong>{chaptersProgress}%</strong>
              </div>
              <div className="progress-track">
                <div className="progress-fill boss" style={{ width: `${chaptersProgress}%` }} />
              </div>
            </div>

            <form className="form-card" onSubmit={logReadingProgress}>
              <h3>Log Reading Progress</h3>

              <input
                value={readingDraft.currentBook}
                onChange={e =>
                  setReadingDraft({ ...readingDraft, currentBook: e.target.value })
                }
                placeholder="Current book"
              />

              <div className="form-grid">
                <input
                  type="number"
                  min="0"
                  value={readingDraft.chapters}
                  onChange={e =>
                    setReadingDraft({ ...readingDraft, chapters: e.target.value })
                  }
                  placeholder="Chapters read"
                />

                <input
                  type="number"
                  min="0"
                  value={readingDraft.pages}
                  onChange={e =>
                    setReadingDraft({ ...readingDraft, pages: e.target.value })
                  }
                  placeholder="Pages read"
                />
              </div>

              <label className="reward unlocked">
                <CheckCircle2 />
                <div>
                  <strong>Completed the book?</strong>
                  <p>Adds a 100 XP completion bonus.</p>
                </div>
                <input
                  type="checkbox"
                  checked={readingDraft.completedBook}
                  onChange={e =>
                    setReadingDraft({ ...readingDraft, completedBook: e.target.checked })
                  }
                />
              </label>

              <button
                className="primary"
                disabled={
                  !readingDraft.currentBook.trim() ||
                  (
                    Number(readingDraft.chapters || 0) <= 0 &&
                    Number(readingDraft.pages || 0) <= 0 &&
                    !readingDraft.completedBook
                  )
                }
              >
                <Plus size={18} /> Log Reading XP
              </button>
            </form>

            <div className="quest-list">
              <div className="row-between">
                <h3>Reading Log</h3>
                <span className="proof-badge">
                  {(readingGoal.readingLogs || []).length} Entries
                </span>
              </div>

              {(readingGoal.readingLogs || []).length === 0 && (
                <div className="empty-state">
                  <p>No reading logged yet.</p>
                  <strong>Your next chapter starts the campaign.</strong>
                </div>
              )}

              {(readingGoal.readingLogs || []).map(log => (
                <div className="reward unlocked" key={log.id}>
                  <Brain />
                  <div>
                    <strong>{log.book}</strong>
                    <p>
                      {log.chapters} chapters • {log.pages} pages • {new Date(log.date).toLocaleDateString()}
                    </p>
                    {log.completedBook && <p>Book completed.</p>}
                  </div>
                  <span>+{log.xp} XP</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'chronicle' && (
          <section className="screen-stack">
            <div className="boss-card chronicle-hero">
              <p className="eyebrow">Chronicle</p>
              <h2>Record your proof.</h2>
              <p>
                This is your evidence wall and showcase. Post progress, books, discipline wins,
                and real-world proof that others can encourage.
              </p>
              <div className="chronicle-reward">
                <Sparkles size={14} /> +25 XP per entry
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <Sparkles size={20} />
                <span>Public Proof</span>
                <strong>
                  {(state.chroniclePosts || []).filter(post => post.visibility !== 'private').length}
                </strong>
              </div>

              <div className="stat-card">
                <Shield size={20} />
                <span>Private Proof</span>
                <strong>
                  {(state.chroniclePosts || []).filter(post => post.visibility === 'private').length}
                </strong>
              </div>

              <div className="stat-card">
                <Heart size={20} />
                <span>Encouragements</span>
                <strong>
                  {(state.chroniclePosts || []).reduce((sum, post) => sum + Number(post.encouragementCount || 0), 0)}
                </strong>
              </div>

              <div className="stat-card">
                <Trophy size={20} />
                <span>Featured Proof</span>
                <strong>{(state.chroniclePosts || []).slice(0, 1).length}</strong>
              </div>
            </div>

            <form className="form-card" onSubmit={addChroniclePost}>
              <h3>New Chronicle Entry</h3>

              <select
                value={chronicleDraft.type}
                onChange={e =>
                  setChronicleDraft({ ...chronicleDraft, type: e.target.value })
                }
              >
                {CHRONICLE_TYPES.map(type => (
                  <option key={type}>{type}</option>
                ))}
              </select>

              <textarea
                value={chronicleDraft.caption}
                onChange={e =>
                  setChronicleDraft({ ...chronicleDraft, caption: e.target.value })
                }
                placeholder="What proof are you recording today?"
              />

              <input
                value={chronicleDraft.imageUrl}
                onChange={e =>
                  setChronicleDraft({ ...chronicleDraft, imageUrl: e.target.value })
                }
                placeholder="Optional image URL"
              />

              <button className="primary" disabled={chronicleDraft.caption.trim().length < 5}>
                <Plus size={18} /> Record Entry +25 XP
              </button>
            </form>

            <div className="quest-list">
              <div className="row-between">
                <h3>Chronicle Feed</h3>
                <span className="proof-badge">
                  {(state.chroniclePosts || []).length} Entries
                </span>
              </div>

              {(state.chroniclePosts || []).length === 0 && (
                <div className="empty-state">
                  <p>No entries yet.</p>
                  <strong>Your first proof post starts the archive.</strong>
                </div>
              )}

              <div className="chronicle-feed">
                {(state.chroniclePosts || []).map(post => (
                  <article className="chronicle-post" key={post.id}>
                    <div className="chronicle-post-header">
                      <div>
                        <span className="chronicle-type">{post.type}</span>
                        <h4>{state.playerName}</h4>
                      </div>
                      <span className="chronicle-date">
                        {post.visibility === 'private' ? 'Private' : 'Public'} • {new Date(post.date).toLocaleDateString()}
                      </span>
                    </div>

                    <p>{post.caption}</p>

                    {post.imageUrl && (
                      <img
                        className="chronicle-image"
                        src={post.imageUrl}
                        alt={post.type}
                      />
                    )}

                    <div className="chronicle-reward">
                      <Sparkles size={14} /> +{post.xp} XP Recorded
                    </div>

                    <div className="form-grid">
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => encourageChroniclePost(post.id)}
                      >
                        <Heart size={16} /> Encourage ({post.encouragementCount || 0})
                      </button>

                      <button
                        type="button"
                        className="ghost"
                        onClick={() => toggleChronicleVisibility(post.id)}
                      >
                        <Shield size={16} /> {post.visibility === 'private' ? 'Make Public' : 'Make Private'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
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

        {tab === 'achievements' && (
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
                <strong>{(state.achievements || []).length}/{ACHIEVEMENTS.length}</strong>
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

              {ACHIEVEMENTS.map(achievement => {
                const unlocked = (state.achievements || []).find(item => item.id === achievement.id);

                return (
                  <div
                    className={`reward ${unlocked ? 'unlocked' : ''}`}
                    key={achievement.id}
                  >
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
        )}

        {tab === 'character' && (
          <section className="screen-stack">
            <div className="hero-card large character-card operator-profile">
              <div className={`avatar big ${dominantStat}`}>{state.avatar}</div>
              <div>
                <p className="eyebrow">Operator Profile • {tier}</p>
                <h2>{state.playerName}</h2>
                <p>{state.title}</p>
                <p>Level {state.level} • Streak: {state.streak} completions</p>
              </div>
            </div>

            <div className="profile-metrics">
              <div className="profile-metric">
                <span>Chronicle Entries</span>
                <strong>{(state.chroniclePosts || []).length}</strong>
              </div>

              <div className="profile-metric">
                <span>Boss Progress</span>
                <strong>{bossProgress}%</strong>
              </div>

              <div className="profile-metric">
                <span>Quests Today</span>
                <strong>
                  {completedToday}/{state.quests.length}
                </strong>
              </div>

              <div className="profile-metric">
                <span>XP Today</span>
                <strong>{dailyXpEarned}</strong>
              </div>

              <div className="profile-metric">
                <span>Strongest Stat</span>
                <strong>{STAT_META[strongestStat[0]].label}</strong>
              </div>

              <div className="profile-metric">
                <span>Workout Logs</span>
                <strong>{(state.workoutLogs || []).length}</strong>
              </div>

              <div className="profile-metric">
                <span>Workout Tier</span>
                <strong>{workoutRegimen.name}</strong>
              </div>

              <div className="profile-metric">
                <span>Bosses Defeated</span>
                <strong>{(state.bossArchive || []).length}</strong>
              </div>

              <div className="profile-metric">
                <span>Damage Multiplier</span>
                <strong>{streakMultiplier}x</strong>
              </div>

              <div className="profile-metric">
                <span>Achievements</span>
                <strong>{(state.achievements || []).length}</strong>
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
              <div className="row-between">
                <h3>Reading Campaign</h3>
                <span className="proof-badge">{booksProgress}% Books</span>
              </div>

              <div className="profile-proof-list">
                <article className="profile-proof-card">
                  <div className="row-between">
                    <span className="chronicle-type">Current Book</span>
                    <span className="chronicle-date">{readingGoal.pagesRead} pages</span>
                  </div>
                  <h4>{readingGoal.currentBook || 'No book selected yet'}</h4>
                  <p>
                    {readingGoal.booksCompleted}/{readingGoal.monthlyBooksTarget} books • {readingGoal.chaptersCompleted}/{readingGoal.monthlyChaptersTarget} chapters
                  </p>
                  <div className="chronicle-reward">
                    <Brain size={14} /> {readingXpEarned} Reading XP
                  </div>
                </article>
              </div>
            </div>

            <div className="quest-list">
              <div className="row-between">
                <h3>Featured Showcase</h3>
                <span className="proof-badge">
                  {(state.chroniclePosts || []).filter(post => post.visibility !== 'private').length} Public
                </span>
              </div>

              {(state.chroniclePosts || []).filter(post => post.visibility !== 'private').length === 0 && (
                <div className="profile-empty-proof">
                  <p>No public showcase posts yet.</p>
                  <strong>Make a Chronicle post public to feature it here.</strong>
                </div>
              )}

              <div className="profile-proof-list">
                {(state.chroniclePosts || [])
                  .filter(post => post.visibility !== 'private')
                  .slice(0, 2)
                  .map(post => (
                    <article className="profile-proof-card" key={post.id}>
                      <div className="row-between">
                        <span className="chronicle-type">{post.type}</span>
                        <span className="chronicle-date">
                          {post.encouragementCount || 0} Encouragements
                        </span>
                      </div>
                      <h4>{post.caption}</h4>
                      {post.imageUrl && <img src={post.imageUrl} alt={post.type} />}
                      <div className="chronicle-reward">
                        <Heart size={14} /> Public Proof
                      </div>
                    </article>
                  ))}
              </div>
            </div>

            <div className="quest-list">
              <div className="row-between">
                <h3>Recent Proof</h3>
                <span className="proof-badge">
                  {(state.chroniclePosts || []).slice(0, 3).length}/3
                </span>
              </div>

              {(state.chroniclePosts || []).length === 0 && (
                <div className="profile-empty-proof">
                  <p>No Chronicle proof recorded yet.</p>
                  <strong>Record your first entry in Chronicle.</strong>
                </div>
              )}

              <div className="profile-proof-list">
                {(state.chroniclePosts || []).slice(0, 3).map(post => (
                  <article className="profile-proof-card" key={post.id}>
                    <div className="row-between">
                      <span className="chronicle-type">{post.type}</span>
                      <span className="chronicle-date">
                        {new Date(post.date).toLocaleDateString()}
                      </span>
                    </div>

                    <h4>{post.caption}</h4>

                    {post.imageUrl && (
                      <img src={post.imageUrl} alt={post.type} />
                    )}

                    <div className="chronicle-reward">
                      <Sparkles size={14} /> +{post.xp} XP Proof
                    </div>
                  </article>
                ))}
              </div>
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

            <div className="codex-card">
              <p className="eyebrow">
                Level {state.level} Regimen • {workoutRegimen.name}
              </p>
              <h3>{workoutRegimen.intensity} Workout</h3>
              <p>{workoutRegimen.target}</p>

              {workoutRegimen.exercises.map(exercise => (
                <div className="codex-row" key={exercise.name}>
                  <strong>{exercise.name}</strong>
                  <p>
                    {exercise.sets} sets x {exercise.reps} • {exercise.weight}
                  </p>
                </div>
              ))}

              <div className="chronicle-reward">
                <Dumbbell size={14} /> Target: {workoutTotals.exercises} exercises / {workoutTotals.sets} total sets
              </div>
            </div>

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