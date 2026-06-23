import React, { useEffect, useMemo, useState, useRef } from 'react';
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
} from './utils/progression';
import {
  calculateEffortScore,
  getWorkoutTier,
  getRegimenTotals,
} from './data/workoutRegimens';
import { starterState } from './data/starterState';
import { AuthScreen } from './components/AuthScreen';
import { UserMenu } from './components/UserMenu';
import { FriendList } from './components/SocialFeedTab';
import { ChronicleTab } from './components/ChronicleTab';
import { ReadingTab } from './components/ReadingTab';
import { BossTab } from './components/BossTab';
import { CharacterTab } from './components/CharacterTab';
import { SettingsTab } from './components/SettingsTab';
import { MessagesTab } from './components/MessagesTab';
import { AsyncQueueDisplay } from './async/AsyncQueueDisplay';
import { advanceTrigger, readAsyncState, writeAsyncState } from './async/asyncEngine';
import { QuestItem } from './components/QuestItem';
import { WorkoutProofModal } from './components/WorkoutProofModal';
import { CheckinModal } from './components/CheckinModal';
import { TimerModal } from './components/TimerModal';
import { useCloudSync } from './hooks/useCloudSync';
import ArchetypeSelector from './components/ArchetypeSelector';
import SkillTree from './components/SkillTree';
import DailyQuestGenerator from './components/DailyQuestGenerator';
import { OnboardingScreen } from './components/OnboardingScreen';

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

  const [asyncState, setAsyncState] = useState(readAsyncState);
  const [xpToast, setXpToast] = useState(null);
  const [levelPulse, setLevelPulse] = useState(false);
  const [bossPulse, setBossPulse] = useState(false);
  const [questPulseId, setQuestPulseId] = useState(null);
  const prevStateRef = useRef(null);
  const prevBossDamageRef = useRef(0);
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
  const dailyXpEarned = state.quests.filter(q => q.completedToday).reduce((sum, quest) => sum + Number(quest.xp || 0), 0);
  const strongestStat = Object.entries(state.stats).sort((a, b) => b[1] - a[1])[0];
  const readingGoal = state.readingGoal || starterState.readingGoal;

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
    playClick();
    const name = profileDraft.playerName.trim() || 'Operator';
    setState(prev => ({ ...prev, ...profileDraft, playerName: name, onboarded: true }));
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

  function cancelEditingQuest() {
    setEditingQuestId(null);
    setEditingQuest({
      title: '',
      stat: 'discipline',
      difficulty: 'normal',
      xp: 50,
      frequency: 'daily',
      proof: 'honor',
    });
  }

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
          <div className={`level-pill ${levelPulse ? 'glow-active' : ''}`}>LVL {state.level}</div>
        </header>

        {xpToast && <div className="xp-toast">+{xpToast} XP</div>}

        <nav className="tabs">
          {['home', 'quests', 'compile', 'reading', 'chronicle', 'social', 'async', 'achievements', 'character', 'boss', 'settings', 'messages'].map(item => (
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

<div className={`boss-card ${bossPulse ? 'shake-active' : ''}`}>
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

               <DailyQuestGenerator
                 archetype={state.archetype}
                 onQuestGenerated={(newQuest) =>
                   setState(prev => ({
                     ...prev,
                     quests: [...prev.quests, newQuest],
                   }))
                 }
               />

               {state.quests
                .slice(0, 4)
.map(q => (
                    <QuestItem
                      key={q.id}
                      quest={q}
                      onComplete={requestQuestCompletion}
                      STAT_META={STAT_META}
                      PROOF_META={PROOF_META}
                      pulseActive={questPulseId === q.id}
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
          <ReadingTab
            readingGoal={readingGoal}
            readingDraft={readingDraft}
            setReadingDraft={setReadingDraft}
            logReadingProgress={logReadingProgress}
            booksProgress={booksProgress}
            chaptersProgress={chaptersProgress}
            readingXpEarned={readingXpEarned}
          />
        )}

        {tab === 'chronicle' && (
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
        )}

        {tab === 'social' && (
          <FriendList
            session={session}
            currentUserId={session?.user?.id}
            cloudAvailable={cloudAvailable}
          />
        )}

        {tab === 'async' && (
          <AsyncQueueDisplay
            state={asyncState}
            setState={setAsyncState}
            onQr={(dataUrl) =>
              setAsyncState((prev) => ({ ...prev, qrState: { selectedId: 'latest', dataUrl } }))
            }
          />
        )}

        {tab === 'quests' && (
          <section className="screen-stack">
            <form className="form-card" onSubmit={addQuest}>
              <h3>Create Quest</h3>
              <p>Choose a difficulty preset. XP is assigned automatically and capped at {QUEST_XP_MAX}.</p>

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

                <select
                  value={newQuest.difficulty}
                  onChange={e => {
                    const difficulty = e.target.value;
                    setNewQuest({
                      ...newQuest,
                      difficulty,
                      xp: getDifficultyXp(difficulty),
                    });
                  }}
                >
                  {Object.entries(QUEST_DIFFICULTY_PRESETS).map(([key, preset]) => (
                    <option key={key} value={key}>
                      {preset.label} - {preset.xp} XP
                    </option>
                  ))}
                </select>
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
                      <div className="quest-edit-shell" key={q.id}>
                        <div className="quest-manage-row">
                          <QuestItem
                            quest={q}
                            onComplete={requestQuestCompletion}
                            STAT_META={STAT_META}
                            PROOF_META={PROOF_META}
                            pulseActive={questPulseId === q.id}
                          />

                        <div className="quest-manage-actions">
                          <button
                            type="button"
                            className="ghost"
                            onClick={() => startEditingQuest(q)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="ghost danger"
                            onClick={() => deleteQuest(q.id)}
                            title="Delete quest"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {editingQuestId === q.id && (
                        <form className="form-card quest-edit-form" onSubmit={saveEditingQuest}>
                          <input
                            value={editingQuest.title}
                            onChange={e => setEditingQuest({ ...editingQuest, title: e.target.value })}
                            placeholder="Quest title"
                          />

                          <div className="form-grid">
                            <select
                              value={editingQuest.stat}
                              onChange={e => setEditingQuest({ ...editingQuest, stat: e.target.value })}
                            >
                              {Object.entries(STAT_META).map(([key, meta]) => (
                                <option key={key} value={key}>
                                  {meta.label}
                                </option>
                              ))}
                            </select>

                            <select
                              value={editingQuest.difficulty}
                              onChange={e => {
                                const difficulty = e.target.value;
                                setEditingQuest({
                                  ...editingQuest,
                                  difficulty,
                                  xp: getDifficultyXp(difficulty),
                                });
                              }}
                            >
                              {Object.entries(QUEST_DIFFICULTY_PRESETS).map(([key, preset]) => (
                                <option key={key} value={key}>
                                  {preset.label} - {preset.xp} XP
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="form-grid">
                            <input
                              value={editingQuest.frequency}
                              onChange={e => setEditingQuest({ ...editingQuest, frequency: e.target.value })}
                              placeholder="daily, weekly, 3x weekly"
                            />

                            <select
                              value={editingQuest.proof}
                              onChange={e => setEditingQuest({ ...editingQuest, proof: e.target.value })}
                            >
                              {Object.entries(PROOF_META).map(([key, meta]) => (
                                <option key={key} value={key}>
                                  {meta.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="quest-edit-actions">
                            <button className="primary" type="submit">Save Quest</button>
                            <button className="ghost" type="button" onClick={cancelEditingQuest}>Cancel</button>
                          </div>

                          <small>Difficulty controls XP automatically to keep progression fair.</small>
                        </form>
                      )}
                    </div>
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
          )}

{tab === 'boss' && (
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
            />
          )}

        {tab === 'settings' && (
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
          )}

        {tab === 'messages' && (
            <MessagesTab
              session={session}
              localMode={localMode}
            />
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

createRoot(document.getElementById('root')).render(<App />);