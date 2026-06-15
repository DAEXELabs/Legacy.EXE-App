import { Brain, Heart, Sparkles, Trophy, Skull, Flame } from 'lucide-react';

const archetypeSkills = {
  warrior: {
    name: 'Warrior',
    color: '#3b82f6',
    icon: Skull,
    skills: [
      { id: 'vitality', name: 'Vitality', description: 'Increase health stat gains', icon: Heart, unlocked: false },
      { id: 'strength', name: 'Relentless Strength', description: 'Workout XP bonus', icon: Flame, unlocked: false },
      { id: 'endurance', name: 'Primal Endurance', description: 'Streak resilience', icon: Trophy, unlocked: false },
    ],
  },
  builder: {
    name: 'Builder',
    color: '#10b981',
    icon: Flame,
    skills: [
      { id: 'productivity', name: 'Deep Work', description: 'Discipline boost', icon: Brain, unlocked: false },
      { id: 'system', name: 'System Architecture', description: 'Quest efficiency', icon: Sparkles, unlocked: false },
      { id: 'empire', name: 'Legacy Foundations', description: 'XP multiplier', icon: Trophy, unlocked: false },
    ],
  },
  scholar: {
    name: 'Scholar',
    color: '#8b5cf6',
    icon: Brain,
    skills: [
      { id: 'knowledge', name: 'Knowledge Absorption', description: 'Reading XP bonus', icon: Brain, unlocked: false },
      { id: 'arcane', name: 'Arcane Debugging', description: 'Unlock hidden bonuses', icon: Sparkles, unlocked: false },
      { id: 'wisdom', name: 'Wisdom Ascendant', description: 'All stats +1', icon: Trophy, unlocked: false },
    ],
  },
};

export default function SkillTree({ archetype, xp }) {
  const archData = archetypeSkills[archetype] || archetypeSkills.scholar;
  const Icon = archData.icon;

  const getUnlockedCount = () => {
    return Math.min(archData.skills.length, Math.floor((xp || 0) / 500));
  };

  const unlockedCount = getUnlockedCount();

  return (
    <div className="quest-list">
      <div className="row-between">
        <h3>
          <Icon size={18} /> Skill Tree
        </h3>
        <span className="proof-badge">{unlockedCount}/{archData.skills.length} Unlocked</span>
      </div>
      <div style={{ display: 'grid', gap: '10px' }}>
        {archData.skills.map((skill, index) => {
          const SkillIcon = skill.icon;
          const isUnlocked = index < unlockedCount;
          return (
            <div
              className="reward"
              style={{
                opacity: isUnlocked ? 1 : 0.4,
                borderLeft: `3px solid ${isUnlocked ? archData.color : 'rgba(255,255,255,.1)'}`,
              }}
              key={skill.id}
            >
              <SkillIcon size={18} />
              <div>
                <strong>{skill.name}</strong>
                <p>{skill.description}</p>
              </div>
              <span>{isUnlocked ? 'Unlocked' : `${((index + 1) * 500 - (xp || 0))} XP`}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}