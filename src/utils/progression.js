import { BOSSES } from '../data/bosses.js';

export function xpForLevel(level) {
  return level * 200;
}

export function computeTier(level) {
  if (level <= 5) return 'Uncompiled';
  if (level <= 15) return 'Initiate';
  if (level <= 30) return 'Builder';
  if (level <= 50) return 'Ascendant';
  if (level <= 75) return 'Champion';
  return 'Legacy';
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now - start) / 86400000);
  return Math.ceil((days + start.getDay() + 1) / 7);
}

export function getCampaignWeek(startedAt, fallbackWeek = getWeekNumber()) {
  const startedAtMs = new Date(startedAt).getTime();

  if (!Number.isFinite(startedAtMs)) return fallbackWeek;

  const elapsedMs = Math.max(0, Date.now() - startedAtMs);
  return Math.floor(elapsedMs / (7 * 86400000)) + 1;
}

export function getWeeklyBoss(requestedWeek = getWeekNumber()) {
  const week = Math.max(1, Math.floor(Number(requestedWeek) || 1));
  const index = (week - 1) % BOSSES.length;

  return {
    ...BOSSES[index],
    week,
  };
}

export function getBossDamage(quests, chroniclePosts = [], stats = {}, weeklyBoss = null) {
  const questDamage = quests
    .filter(q => q.completedToday)
    .reduce((sum, quest) => sum + Number(quest.xp || 0), 0);

  const today = todayKey();

  const chronicleDamage = chroniclePosts
    .filter(post => post.date?.slice(0, 10) === today)
    .reduce((sum, post) => sum + Number(post.xp || 25), 0);

  let baseDamage = questDamage + chronicleDamage;

  if (weeklyBoss && weeklyBoss.weaknessStat && stats) {
    const dominantStat = Object.entries(stats).sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))[0];
    if (dominantStat && dominantStat[0] === weeklyBoss.weaknessStat) {
      const statValue = Number(dominantStat[1] || 0);
      const bonusMultiplier = 1 + Math.min(statValue * 0.05, 1.5);
      baseDamage = Math.round(baseDamage * bonusMultiplier);
    }
  }

  return baseDamage;
}

export function getBossProgress(boss, quests, chroniclePosts = []) {
  const damage = getBossDamage(quests, chroniclePosts);
  return Math.min(100, Math.round((damage / boss.hp) * 100));
}

export function getStreakMultiplier(streak = 0) {
  if (streak >= 30) return 2;
  if (streak >= 14) return 1.5;
  if (streak >= 7) return 1.25;
  if (streak >= 3) return 1.1;
  return 1;
}

export function applyXpProgress(prev, xpAmount) {
  let nextXp = prev.xp + Number(xpAmount);
  let nextLevel = prev.level;
  let needed = xpForLevel(nextLevel);

  while (nextXp >= needed) {
    nextXp -= needed;
    nextLevel += 1;
    needed = xpForLevel(nextLevel);
  }

  const rewards = prev.rewards.map(reward => ({
    ...reward,
    unlocked: reward.unlocked || (reward.level && nextLevel >= reward.level),
  }));

  const nextLifetimeXp = Number(prev.lifetimeXp || 0) + Number(xpAmount);

  return { nextXp, nextLevel, rewards, nextLifetimeXp };
}

export function checkWeeklyBossReset(state, weeklyBoss) {
  const currentWeek = weeklyBoss.week;
  const stateWeek = state.currentBossWeek || state.lastBossWeek;
  
  if (stateWeek !== currentWeek) {
    const bossNotDefeated = !isBossDefeated(state, weeklyBoss);
    const penaltyDamage = bossNotDefeated ? weeklyBoss.hp * 0.25 : 0;
    const streakPenalty = bossNotDefeated ? Math.min(state.streak, 7) : 0;
    
    const newHp = Math.max(0, (state.hp || state.maxHp) - Math.round(penaltyDamage));
    
    return {
      needWeeklyReset: true,
      newHp,
      streakPenalty: bossNotDefeated ? streakPenalty : 0,
      bossDefeated: !bossNotDefeated,
    };
  }
  
  return { needWeeklyReset: false, newHp: state.hp, streakPenalty: 0, bossDefeated: true };
}

export function isBossDefeated(state, weeklyBoss) {
  const bossArchive = state.bossArchive || [];
  return bossArchive.some(
    entry => entry.name === weeklyBoss.name && entry.week === weeklyBoss.week
  );
}

export function calculateHpRegen(quests, stats) {
  const completedHealthQuests = (quests || []).filter(q => q.completedToday && q.stat === 'health').length;
  const healthStat = stats?.health || 0;
  const regenPerQuest = 3 + Math.floor(healthStat / 5);
  return completedHealthQuests * regenPerQuest;
}
