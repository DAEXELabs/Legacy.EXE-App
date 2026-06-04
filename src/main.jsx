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
import {
  calculateEffortScore,
  getWorkoutTier,
  getRegimenTotals,
} from './data/workoutRegimens';
import { starterState } from './data/starterState';
import { AuthScreen } from './components/AuthScreen';
import { UserMenu } from './components/UserMenu';
import { SocialFeedTab } from './components/SocialFeedTab';
import { ChronicleTab } from './components/ChronicleTab';
import { ReadingTab } from './components/ReadingTab';
import { BossTab } from './components/BossTab';
import { CharacterTab } from './components/CharacterTab';
import { AsyncQueueDisplay } from './async/AsyncQueueDisplay';
import { advanceTrigger, readAsyncState, writeAsyncState } from './async/asyncEngine';
import { QuestItem } from './components/QuestItem';
import { WorkoutProofModal } from './components/WorkoutProofModal';
import { CheckinModal } from './components/CheckinModal';
import { TimerModal } from './components/TimerModal';
import { useCloudSync } from './hooks/useCloudSync';

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
