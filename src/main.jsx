import React, { useEffect, useMemo, useState, useRef, useCallback, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  Brain,
  Coins,
  Heart,
  Palette,
  Shield,
  CheckCircle2,
  Skull,
  Timer,
  MessageSquareText,
  Dumbbell,
} from 'lucide-react';
import './styles.css';
import { playClick, playQuestComplete, playLevelUp, playAchievement, playBossDefeat, getSoundEnabled, setSoundEnabled } from './lib/soundFx';
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
  checkWeeklyBossReset,
  calculateHpRegen,
} from './utils/progression';
import {
  calculateEffortScore,
  getWorkoutTier,
  getRegimenTotals,
} from './data/workoutRegimens';
import { starterState } from './data/starterState';
import { upsertProfile } from './lib/socialApi';
import { calculateAge, meetsMinimumAge, MINIMUM_AGE } from './utils/ageVerification';
import { AuthScreen } from './components/AuthScreen';
import { UserMenu } from './components/UserMenu';
import { FriendList } from './components/FriendList';
import { TutorialProvider, HelpButton } from './components/TutorialHelp';
import { OnboardingScreen } from './components/OnboardingScreen';
import { WorkoutProofModal } from './components/WorkoutProofModal';
import { CheckinModal } from './components/CheckinModal';
import { TimerModal } from './components/TimerModal';
import { useCloudSync } from './hooks/useCloudSync';
import { advanceTrigger, readAsyncState, writeAsyncState } from './async/asyncEngine';

const STORAGE_KEY = 'legacy-exe-state-v2';
const QUEST_XP_MIN = 10;
const QUEST_XP_MAX = 100;

const QUEST_DIFFICULTY_PRESETS = {
  easy: { label: 'Easy', xp: 25 },
  normal: { label: 'Normal', xp: 50 },
  hard: { label: 'Hard', xp: 75 },
  major: { label: 'Major', xp: 100 },
};

function getDifficultyXp(difficulty) {
  return QUEST_DIFFICULTY_PRESETS[difficulty]?.xp || QUEST_DIFFICULTY_PRESETS.normal.xp;
}

function clampQuestXp(value) {
  return Math.min(QUEST_XP_MAX, Math.max(QUEST_XP_MIN, Number(value || QUEST_XP_MIN)));
}

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

const HomeTab = lazy(() => import('./components/HomeTab.jsx').then(m => ({ default: React.memo(m.HomeTab) })));
const CompileTab = lazy(() => import('./components/CompileTab.jsx').then(m => ({ default: React.memo(m.CompileTab) })));
const ReadingTab = lazy(() => import('./components/ReadingTab.jsx').then(m => ({ default: React.memo(m.ReadingTab) })));
const ChronicleTab = lazy(() => import('./components/ChronicleTab.jsx').then(m => ({ default: React.memo(m.ChronicleTab) })));
const SocialFeedTab = lazy(() => import('./components/SocialFeedTab.jsx').then(m => ({ default: React.memo(m.SocialFeedTab) })));
const AsyncQueueDisplay = lazy(() => import('./async/AsyncQueueDisplay.jsx').then(m => ({ default: React.memo(m.AsyncQueueDisplay) })));
const QuestsTab = lazy(() => import('./components/QuestsTab.jsx').then(m => ({ default: React.memo(m.QuestsTab) })));
const AchievementsTab = lazy(() => import('./components/AchievementsTab.jsx').then(m => ({ default: React.memo(m.AchievementsTab) })));
const CharacterTab = lazy(() => import('./components/CharacterTab.jsx').then(m => ({ default: React.memo(m.CharacterTab) })));
const BossTab = lazy(() => import('./components/BossTab.jsx').then(m => ({ default: React.memo(m.BossTab) })));
const CoopBossTab = lazy(() => import('./components/CoopBossTab.jsx').then(m => ({ default: React.memo(m.CoopBossTab) })));
const LeaderboardTab = lazy(() => import('./components/LeaderboardTab.jsx').then(m => ({ default: React.memo(m.LeaderboardTab) })));
const GuildTab = lazy(() => import('./components/GuildTab.jsx').then(m => ({ default: React.memo(m.GuildTab) })));
const SettingsTab = lazy(() => import('./components/SettingsTab.jsx').then(m => ({ default: React.memo(m.SettingsTab) })));
const MessagesTab = lazy(() => import('./components/MessagesTab.jsx').then(m => ({ default: React.memo(m.MessagesTab) })));

function LoadingFallback() {
  return <div className="empty-state"><p>Loading...</p></div>;
}

function App() {
  const {
    session,
    user,
    authLoading,
    cloudAvailable,
    localMode,
    setLocalMode,
    signOut,
  } = useCloudSync();

  const currentUserId = session?.user?.id;
  const handleLocalContinue = () => setLocalMode(true);

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
    difficulty: 'normal',
    xp: 50,
    frequency: 'daily',
    proof: 'honor',
  });

  const [editingQuestId, setEditingQuestId] = useState(null);
  const [editingQuest, setEditingQuest] = useState({
    title: '',
    stat: 'discipline',
    difficulty: 'normal',
    xp: 50,
    frequency: 'daily',
    proof: 'honor',
  });

  const [tab, setTab] = useState('home');
  const [socialSubTab, setSocialSubTab] = useState('feed');
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

  const workoutRegimen = useMemo(() => getWorkoutTier(state.level), [state.level]);
  const workoutTotals = useMemo(() => getRegimenTotals(workoutRegimen), [workoutRegimen]);

  const [profileDraft, setProfileDraft] = useState({
    playerName: '',
    avatar: '⚔️',
    title: 'Uncompiled Operator',
    birthday: '',
  });

  const [ageError, setAgeError] = useState('');
  const [ageBlocked, setAgeBlocked] = useState(false);

  const [asyncState, setAsyncState] = useState(readAsyncState);
  const [xpToast, setXpToast] = useState(null);
  const [levelPulse, setLevelPulse] = useState(false);
  const [bossPulse, setBossPulse] = useState(false);
  const [questPulseId, setQuestPulseId] = useState(null);
  const [damageToast, setDamageToast] = useState(null);
  const [hpRegenToast, setHpRegenToast] = useState(null);
  const prevStateRef = useRef(null);
  const prevBossDamageRef = useRef(0);
  const prevWeeklyBossWeek = useRef(0);
  const cloudSyncInProgressRef = useRef(false);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('legacy-exe-settings-v1');
    return saved ? JSON.parse(saved) : {
      soundEnabled: true,
      reducedMotion: false,
      defaultChroniclePrivacy: 'public'
    };
  });

  useEffect(() => {
    getSoundEnabled();
  }, []);

  useEffect(() => {
    localStorage.setItem('legacy-exe-settings-v1', JSON.stringify(settings));
    setSoundEnabled(settings.soundEnabled);
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const id = setInterval(() => {
      setAsyncState((prev) => {
        if (prev.lockedSlots.length === 0) return prev;
        const next = advanceTrigger(prev);
        writeAsyncState(next);
        return next;
      });
    }, 60000);

    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    writeAsyncState(asyncState);
  }, [asyncState]);

  useEffect(() => {
    if (!state.onboarded || !state.hp) return;
    
    const hpRegen = calculateHpRegen(state.quests, state.stats);
    if (hpRegen > 0 && state.hp < state.maxHp) {
      const newHp = Math.min(state.maxHp, state.hp + hpRegen);
      setState(prev => ({ ...prev, hp: newHp }));
      setHpRegenToast(hpRegen);
      setTimeout(() => setHpRegenToast(null), 3000);
    }
  }, [state.quests, state.hp, state.onboarded]);

  const weeklyBoss = useMemo(() => getWeeklyBoss(), []);
  const currentLevelXp = useMemo(() => xpForLevel(state.level), [state.level]);
  const progress = useMemo(
    () => Math.min(100, Math.round((state.xp / currentLevelXp) * 100)),
    [state.xp, currentLevelXp]
  );
  const baseBossDamage = useMemo(
    () => getBossDamage(state.quests, state.chroniclePosts || [], state.stats, weeklyBoss),
    [state.quests, state.chroniclePosts, state.stats, weeklyBoss]
  );
  const streakMultiplier = useMemo(() => getStreakMultiplier(state.streak), [state.streak]);
  const bossDamage = useMemo(
    () => Math.round(baseBossDamage * streakMultiplier),
    [baseBossDamage, streakMultiplier]
  );
  const bossProgress = useMemo(
    () => Math.min(100, Math.round((bossDamage / weeklyBoss.hp) * 100)),
    [bossDamage, weeklyBoss.hp]
  );
  const bossHpRemaining = useMemo(
    () => Math.max(0, weeklyBoss.hp - bossDamage),
    [weeklyBoss.hp, bossDamage]
  );
  const bossDefeated = useMemo(() => bossProgress >= 100, [bossProgress]);
  const isBossArchived = useMemo(
    () => (state.bossArchive || []).some(
      entry => entry.name === weeklyBoss.name && entry.week === weeklyBoss.week
    ),
    [state.bossArchive, weeklyBoss.name, weeklyBoss.week]
  );
  const tier = useMemo(() => computeTier(state.level), [state.level]);
  const completedToday = useMemo(
    () => state.quests.filter(q => q.completedToday).length,
    [state.quests]
  );
  const dailyXpEarned = useMemo(
    () => state.quests.filter(q => q.completedToday).reduce((sum, quest) => sum + Number(quest.xp || 0), 0),
    [state.quests]
  );
  const strongestStat = useMemo(
    () => Object.entries(state.stats).sort((a, b) => b[1] - a[1])[0],
    [state.stats]
  );
  const readingGoal = useMemo(
    () => state.readingGoal || starterState.readingGoal,
    [state.readingGoal]
  );

  useEffect(() => {
    if (!state.currentBossWeek) return;
    
    const reset = checkWeeklyBossReset(state, weeklyBoss);
    if (reset.needWeeklyReset) {
      setState(prev => ({
        ...prev,
        currentBossWeek: weeklyBoss.week,
        hp: reset.newHp,
        streak: reset.bossDefeated ? prev.streak : 0,
      }));
      
      if (reset.streakPenalty > 0 || reset.newHp < (prev.hp || prev.maxHp)) {
        setDamageToast({
          hp: reset.newHp,
          streakLost: reset.streakPenalty,
          bossNotDefeated: !reset.bossDefeated,
        });
        setTimeout(() => setDamageToast(null), 4000);
      }
    }
  }, [weeklyBoss.week, state.currentBossWeek]);

  useEffect(() => {
    if (prevStateRef.current) {
      const { prevLevel, prevAchievements, questXp, isBossVictory, questId } = prevStateRef.current;

      if (isBossVictory) {
        playBossDefeat();
      } else if (state.level > prevLevel) {
        playLevelUp();
        setLevelPulse(true);
        setTimeout(() => setLevelPulse(false), 800);
      } else {
        playQuestComplete();
        setXpToast(questXp);
        setQuestPulseId(questId);
        setTimeout(() => {
          setXpToast(null);
          setQuestPulseId(null);
        }, 1500);
      }

      const currentAchievements = (state.achievements || []).length;
      if (currentAchievements > prevAchievements && !isBossVictory) {
        playAchievement();
      }

      prevStateRef.current = null;
    }
  }, [state.level, state.achievements]);

  useEffect(() => {
    if (bossProgress >= 100 && !isBossArchived) {
      setBossPulse(true);
      setTimeout(() => setBossPulse(false), 500);
    }
  }, [bossProgress, isBossArchived]);

  useEffect(() => {
    if (bossDamage > prevBossDamageRef.current) {
      setBossPulse(true);
      setTimeout(() => setBossPulse(false), 500);
    }
    prevBossDamageRef.current = bossDamage;
  }, [bossDamage]);

 useEffect(() => {
    if (!timerQuest || timerDone) return;
    const timeout = setTimeout(() => setTimerDone(true), 5000);
    return () => clearTimeout(timeout);
  }, [timerQuest, timerDone]);

  const booksProgress = useMemo(
    () => Math.min(
      100,
      Math.round((Number(readingGoal.booksCompleted || 0) / Math.max(Number(readingGoal.monthlyBooksTarget || 1), 1)) * 100)
    ),
    [readingGoal.booksCompleted, readingGoal.monthlyBooksTarget]
  );
  const chaptersProgress = useMemo(
    () => Math.min(
      100,
      Math.round((Number(readingGoal.chaptersCompleted || 0) / Math.max(Number(readingGoal.monthlyChaptersTarget || 1), 1)) * 100)
    ),
    [readingGoal.chaptersCompleted, readingGoal.monthlyChaptersTarget]
  );
  const readingXpEarned = useMemo(
    () => (readingGoal.readingLogs || []).reduce((sum, log) => sum + Number(log.xp || 0), 0),
    [readingGoal.readingLogs]
  );
  const savedReflection = useMemo(
    () => state.dailyReflections?.[todayKey()] || '',
    [state.dailyReflections]
  );

  const driftMessage = useMemo(
    () => bossProgress >= 100
      ? weeklyBoss.victory
      : bossProgress >= 75
        ? 'Victory is close. Finish the compile.'
        : bossProgress >= 50
          ? `${weeklyBoss.name} is weakening.`
          : bossProgress >= 25
            ? 'Momentum is forming.'
            : `${weeklyBoss.name} is still feeding.`,
    [bossProgress, weeklyBoss.victory, weeklyBoss.name]
  );

  const dominantStat = useMemo(() => {
    return Object.entries(state.stats).sort((a, b) => b[1] - a[1])[0][0];
  }, [state.stats]);

  function finishOnboarding(e) {
    e.preventDefault();
    setAgeError('');

    const name = profileDraft.playerName.trim() || 'Operator';
    const birthday = profileDraft.birthday;

    if (!birthday) {
      setAgeError(`Please enter your date of birth. Legacy.EXE is for users ${MINIMUM_AGE} and older.`);
      return;
    }

    const age = calculateAge(birthday);

    if (age === null) {
      setAgeError('That date doesn\u2019t look right. Please enter a valid date of birth.');
      return;
    }

    if (age < MINIMUM_AGE) {
      setAgeBlocked(true);
      return;
    }

    if (!meetsMinimumAge(birthday)) {
      setAgeError(`Sorry, you must be at least ${MINIMUM_AGE} to use Legacy.EXE.`);
      return;
    }

    playClick();

    setState(prev => ({
      ...prev,
      ...profileDraft,
      birthday,
      playerName: name,
      ageVerified: true,
      onboarded: true,
    }));

    if (session?.user?.id) {
      upsertProfile({
        id: session.user.id,
        username: profileDraft.playerName.trim() || 'operator',
        display_name: name,
        avatar: profileDraft.avatar,
        title: profileDraft.title,
        birthday,
      }).catch(() => {});
    }
  }

  const handleArchetypeSelect = (archetype) => {
    playClick();
    setState(prev => ({ 
      ...prev, 
      archetype: archetype.id, 
      title: archetype.title || 'The Uncompiled' 
    }));
  };

  function completeQuest(id, payload = {}) {
    const prevLevel = state.level;
    const prevAchievements = (state.achievements || []).length;
    const quest = state.quests.find(q => q.id === id);
    if (!quest || quest.completedToday) return;

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

      prevStateRef.current = { prevLevel, prevAchievements, questXp: quest.xp, questId: id };

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
            visibility: settings.defaultChroniclePrivacy,
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

    const prevLevel = state.level;
    const prevAchievements = (state.achievements || []).length;

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

      prevStateRef.current = { prevLevel, prevAchievements, questXp: 0, isBossVictory: true };

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
    playClick();

    if (!newQuest.title.trim()) return;

    const difficulty = newQuest.difficulty || 'normal';
    const safeXp = clampQuestXp(getDifficultyXp(difficulty));

    setState(prev => ({
      ...prev,
      quests: [
        ...prev.quests,
        {
          id: crypto.randomUUID(),
          ...newQuest,
          title: newQuest.title.trim(),
          difficulty,
          xp: safeXp,
          completedToday: false,
        },
      ],
    }));

    setNewQuest({
      title: '',
      stat: 'discipline',
      difficulty: 'normal',
      xp: 50,
      frequency: 'daily',
      proof: 'honor',
    });
  }

  function deleteQuest(id) {
    setState(prev => ({
      ...prev,
      quests: prev.quests.filter(q => q.id !== id),
    }));

    if (editingQuestId === id) {
      cancelEditingQuest();
    }
  }

  function startEditingQuest(quest) {
    setEditingQuestId(quest.id);
    setEditingQuest({
      title: quest.title,
      stat: quest.stat,
      difficulty: quest.difficulty || 'normal',
      xp: clampQuestXp(getDifficultyXp(quest.difficulty || 'normal')),
      frequency: quest.frequency,
      proof: quest.proof,
    });
  }

  const cancelEditingQuest = useCallback(() => {
    setEditingQuestId(null);
    setEditingQuest({
      title: '',
      stat: 'discipline',
      difficulty: 'normal',
      xp: 50,
      frequency: 'daily',
      proof: 'honor',
    });
  }, []);

  function saveEditingQuest(e) {
    e.preventDefault();

    if (!editingQuestId || !editingQuest.title.trim()) return;

    const difficulty = editingQuest.difficulty || 'normal';
    const safeXp = clampQuestXp(getDifficultyXp(difficulty));

    setState(prev => ({
      ...prev,
      quests: prev.quests.map(q =>
        q.id === editingQuestId
          ? {
              ...q,
              ...editingQuest,
              title: editingQuest.title.trim(),
              difficulty,
              xp: safeXp,
            }
          : q
      ),
    }));

    cancelEditingQuest();
  }

  const resetDay = useCallback(() => {
    setState(prev => ({
      ...prev,
      quests: prev.quests.map(q => ({ ...q, completedToday: false })),
    }));
  }, []);

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

  const resetApp = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(starterState);
  }, []);

  if (!authLoading && !session && !localMode) {
    return (
      <AuthScreen
        cloudAvailable={cloudAvailable}
        onLocalContinue={handleLocalContinue}
        onAuthSuccess={handleLocalContinue}
      />
    );
  }

  if (!state.onboarded) {
    return (
      <OnboardingScreen
        profileDraft={profileDraft}
        setProfileDraft={setProfileDraft}
        finishOnboarding={finishOnboarding}
        onArchetypeSelect={handleArchetypeSelect}
        session={session}
        ageError={ageError}
        ageBlocked={ageBlocked}
      />
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
          <div className="topbar-right">
            <div className="hp-bar-container" title={`${state.hp || state.maxHp}/${state.maxHp} HP`}>
              <div className="hp-bar-track">
                <div className="hp-bar-fill" style={{ width: `${Math.max(0, ((state.hp || state.maxHp) / state.maxHp) * 100)}%` }} />
              </div>
              <small className="hp-label">
                <Heart size={12} /> {state.hp || state.maxHp}/{state.maxHp}
              </small>
            </div>
            <div className={`level-pill ${levelPulse ? 'glow-active' : ''}`}>LVL {state.level}</div>
          </div>
        </header>

        {xpToast && <div className="xp-toast">+{xpToast} XP</div>}
        {damageToast && (
          <div className="damage-toast">
            <Skull size={16} /> -{damageToast.hp > 0 ? Math.round(damageToast.streakLost * 10) : (state.maxHp - state.hp)} HP
            {damageToast.streakLost > 0 && ` • Streak: -${damageToast.streakLost}`}
          </div>
        )}
        {hpRegenToast && (
          <div className="hp-regen-toast">
            <Heart size={16} /> +{hpRegenToast} HP Regen
          </div>
        )}

        <nav className="tabs">
          {['home', 'quests', 'compile', 'reading', 'chronicle', 'social', 'async', 'achievements', 'character', 'boss', 'co-op', 'leaderboard', 'guild', 'settings', 'messages'].map(item => (
            <button
              key={item}
              onClick={() => { playClick(); setTab(item); }}
              className={tab === item ? 'active' : ''}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="user-menu-slot">
          <HelpButton />
          <UserMenu
            session={session}
            onSignOut={signOut}
            cloudAvailable={cloudAvailable}
            localMode={localMode}
          />
        </div>

        {!cloudAvailable && (
          <small className="cloud-notice">Cloud sync unavailable — running in local mode.</small>
        )}

        {tab === 'home' && (
          <Suspense fallback={<LoadingFallback />}>
            <HomeTab
              state={state}
              dominantStat={dominantStat}
              tier={tier}
              STAT_META={STAT_META}
              currentLevelXp={currentLevelXp}
              progress={progress}
              exportSaveData={exportSaveData}
              importSaveData={importSaveData}
              backupMessage={backupMessage}
              weeklyBoss={weeklyBoss}
              driftMessage={driftMessage}
              bossProgress={bossProgress}
              bossPulse={bossPulse}
              bossDamage={bossDamage}
              bossHpRemaining={bossHpRemaining}
              streakMultiplier={streakMultiplier}
              resetDay={resetDay}
              requestQuestCompletion={requestQuestCompletion}
              PROOF_META={PROOF_META}
            />
          </Suspense>
        )}

        {tab === 'compile' && (
          <Suspense fallback={<LoadingFallback />}>
            <CompileTab
              bossProgress={bossProgress}
              driftMessage={driftMessage}
              completedToday={completedToday}
              state={state}
              dailyXpEarned={dailyXpEarned}
              streakMultiplier={streakMultiplier}
              STAT_META={STAT_META}
              strongestStat={strongestStat}
              weeklyBoss={weeklyBoss}
              saveDailyReflection={saveDailyReflection}
              savedReflection={savedReflection}
              dailyReflection={dailyReflection}
              setDailyReflection={setDailyReflection}
              bossPulse={bossPulse}
            />
          </Suspense>
        )}

        {tab === 'reading' && (
          <Suspense fallback={<LoadingFallback />}>
            <ReadingTab
              readingGoal={readingGoal}
              readingDraft={readingDraft}
              setReadingDraft={setReadingDraft}
              logReadingProgress={logReadingProgress}
              booksProgress={booksProgress}
              chaptersProgress={chaptersProgress}
              readingXpEarned={readingXpEarned}
            />
          </Suspense>
        )}

        {tab === 'chronicle' && (
          <Suspense fallback={<LoadingFallback />}>
            <ChronicleTab
              chronicleDraft={chronicleDraft}
              setChronicleDraft={setChronicleDraft}
              chroniclePosts={state.chroniclePosts || []}
              playerName={state.playerName}
              chronicleTypes={CHRONICLE_TYPES}
              addChroniclePost={addChroniclePost}
              encourageChroniclePost={encourageChroniclePost}
              toggleChronicleVisibility={toggleChronicleVisibility}
            />
          </Suspense>
        )}

        {tab === 'social' && (
           <section className="screen-stack">
             <div className="tabs social-sub-tabs">
               <button
                 key="feed"
                 onClick={() => { playClick(); setSocialSubTab('feed'); }}
                 className={socialSubTab === 'feed' ? 'active' : ''}
               >
                 Feed
               </button>
               <button
                 key="friends"
                 onClick={() => { playClick(); setSocialSubTab('friends'); }}
                 className={socialSubTab === 'friends' ? 'active' : ''}
               >
                 Friends
               </button>
             </div>

             {socialSubTab === 'feed' && (
               <Suspense fallback={<LoadingFallback />}>
                 <SocialFeedTab
                   session={session}
                   currentUserId={session?.user?.id}
                   cloudAvailable={cloudAvailable}
                 />
               </Suspense>
             )}
             {socialSubTab === 'friends' && (
               <Suspense fallback={<LoadingFallback />}>
                 <FriendList
                   session={session}
                   currentUserId={session?.user?.id}
                   cloudAvailable={cloudAvailable}
                 />
               </Suspense>
             )}
           </section>
         )}

        {tab === 'async' && (
          <Suspense fallback={<LoadingFallback />}>
            <AsyncQueueDisplay
              state={asyncState}
              setState={setAsyncState}
              onQr={(dataUrl) =>
                setAsyncState((prev) => ({ ...prev, qrState: { selectedId: 'latest', dataUrl } }))
              }
            />
          </Suspense>
        )}

        {tab === 'quests' && (
          <Suspense fallback={<LoadingFallback />}>
            <QuestsTab
              addQuest={addQuest}
              newQuest={newQuest}
              setNewQuest={setNewQuest}
              STAT_META={STAT_META}
              PROOF_META={PROOF_META}
              state={state}
              requestQuestCompletion={requestQuestCompletion}
              deleteQuest={deleteQuest}
              editingQuestId={editingQuestId}
              editingQuest={editingQuest}
              setEditingQuest={setEditingQuest}
              cancelEditingQuest={cancelEditingQuest}
              saveEditingQuest={saveEditingQuest}
              QUEST_DIFFICULTY_PRESETS={QUEST_DIFFICULTY_PRESETS}
              QUEST_XP_MIN={QUEST_XP_MIN}
              QUEST_XP_MAX={QUEST_XP_MAX}
            />
          </Suspense>
        )}

        {tab === 'achievements' && (
          <Suspense fallback={<LoadingFallback />}>
            <AchievementsTab
              state={state}
              achievements={ACHIEVEMENTS}
            />
          </Suspense>
        )}

        {tab === 'character' && (
          <Suspense fallback={<LoadingFallback />}>
            <CharacterTab
              state={state}
              dominantStat={dominantStat}
              tier={tier}
              STAT_META={STAT_META}
              strongestStat={strongestStat}
              workoutRegimen={workoutRegimen}
              streakMultiplier={streakMultiplier}
              bossProgress={bossProgress}
              completedToday={completedToday}
              dailyXpEarned={dailyXpEarned}
              readingGoal={readingGoal}
              booksProgress={booksProgress}
              readingXpEarned={readingXpEarned}
              archetype={state.archetype}
              xp={state.xp}
              session={session}
              setState={setState}
            />
          </Suspense>
        )}

        {tab === 'boss' && (
          <Suspense fallback={<LoadingFallback />}>
            <BossTab
              state={state}
              weeklyBoss={weeklyBoss}
              bossHpRemaining={bossHpRemaining}
              baseBossDamage={baseBossDamage}
              streakMultiplier={streakMultiplier}
              driftMessage={driftMessage}
              bossProgress={bossProgress}
              bossDefeated={bossDefeated}
              isBossArchived={isBossArchived}
              archiveBossVictory={archiveBossVictory}
              completedToday={completedToday}
              resetApp={resetApp}
              bossPulse={bossPulse}
              dominantStat={dominantStat}
            />
          </Suspense>
        )}

        {tab === 'co-op' && currentUserId && (
          <Suspense fallback={<LoadingFallback />}>
            <CoopBossTab
              session={session}
              currentUserId={currentUserId}
              state={state}
              weeklyBoss={weeklyBoss}
              bossDamage={bossDamage}
              bossHpRemaining={bossHpRemaining}
              bossProgress={bossProgress}
              baseBossDamage={baseBossDamage}
              streakMultiplier={streakMultiplier}
              archiveBossVictory={archiveBossVictory}
              isBossArchived={isBossArchived}
              bossDefeated={bossDefeated}
            />
          </Suspense>
        )}

        {tab === 'leaderboard' && (
          <Suspense fallback={<LoadingFallback />}>
            <LeaderboardTab
              session={session}
              currentUserId={currentUserId}
            />
          </Suspense>
        )}

        {tab === 'guild' && currentUserId && (
          <Suspense fallback={<LoadingFallback />}>
            <GuildTab
              session={session}
              currentUserId={currentUserId}
              state={state}
            />
          </Suspense>
        )}

        {tab === 'settings' && (
          <Suspense fallback={<LoadingFallback />}>
            <SettingsTab
              session={session}
              cloudAvailable={cloudAvailable}
              localMode={localMode}
              signOut={signOut}
              settings={settings}
              setSettings={setSettings}
              exportSaveData={exportSaveData}
              importSaveData={importSaveData}
              resetApp={resetApp}
              backupMessage={backupMessage}
            />
          </Suspense>
        )}

        {tab === 'messages' && (
          <Suspense fallback={<LoadingFallback />}>
            <MessagesTab
              session={session}
              localMode={localMode}
            />
          </Suspense>
        )}
      </section>

      <WorkoutProofModal
        workoutQuest={workoutQuest}
        workoutProof={workoutProof}
        setWorkoutProof={setWorkoutProof}
        submitWorkout={submitWorkout}
        setWorkoutQuest={setWorkoutQuest}
        workoutRegimen={workoutRegimen}
        workoutTotals={workoutTotals}
        calculateEffortScore={calculateEffortScore}
        level={state.level}
      />

      <CheckinModal
        checkinQuest={checkinQuest}
        checkinText={checkinText}
        setCheckinText={setCheckinText}
        submitCheckin={submitCheckin}
        setCheckinQuest={setCheckinQuest}
      />

      <TimerModal
        timerQuest={timerQuest}
        timerDone={timerDone}
        submitTimer={submitTimer}
        setTimerQuest={setTimerQuest}
      />
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <TutorialProvider>
    <App />
  </TutorialProvider>
);