import { Activity, Brain, Coins, Heart, Hammer, BookOpen, Palette, Shield, Sparkles, Sword, Trophy } from 'lucide-react';

const archetypeMeta = {
  warrior: {
    name: 'Warrior',
    title: 'Primal Fury',
    icon: Sword,
    color: '#3b82f6',
    focus: 'Health, combat, and endurance.',
  },
  builder: {
    name: 'Builder',
    title: 'Legacy Forge',
    icon: Hammer,
    color: '#10b981',
    focus: 'Systems, productivity, and empire foundations.',
  },
  scholar: {
    name: 'Scholar',
    title: 'Arcane Compiler',
    icon: BookOpen,
    color: '#8b5cf6',
    focus: 'Knowledge, research, and mastery.',
  },
};

const statMeta = {
  health: { label: 'Health', icon: Activity, color: '#51ffa9' },
  knowledge: { label: 'Knowledge', icon: Brain, color: '#45d0ff' },
  wealth: { label: 'Wealth', icon: Coins, color: '#f6c65b' },
  relationships: { label: 'Relationships', icon: Heart, color: '#ff5da6' },
  creativity: { label: 'Creativity', icon: Palette, color: '#be74ff' },
  discipline: { label: 'Discipline', icon: Shield, color: '#8d6cff' },
};

export default function CharacterProfile({ archetype, stats, level, xp }) {
  const profile = archetypeMeta[archetype] || {
    name: 'Uncompiled',
    title: 'Operator',
    icon: Sparkles,
    color: '#be74ff',
    focus: 'Choose a path to specialize your legacy.',
  };
  const ArchetypeIcon = profile.icon;
  const statEntries = Object.entries(stats || {});
  const totalStats = statEntries.reduce((sum, [, value]) => sum + Number(value || 0), 0);
  const dominantStat = statEntries
    .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))[0];
  const maxStat = Math.max(20, ...statEntries.map(([, value]) => Number(value || 0)));

  return (
    <section className="form-card">
      <div className="row-between">
        <div className="archetype-badge-wrapper">
          <p className="eyebrow">Character Profile</p>
          <div className="archetype-badge" style={{ borderColor: profile.color, backgroundColor: `${profile.color}15` }}>
            <ArchetypeIcon size={22} style={{ color: profile.color }} />
            <span style={{ color: profile.color }}>{profile.name}</span>
          </div>
          <h3>{profile.title}</h3>
          <p>{profile.focus}</p>
        </div>
        <div
          className="stat-card"
          style={{ borderColor: profile.color, minWidth: '116px' }}
        >
          <ArchetypeIcon size={24} />
          <span>Level</span>
          <strong>{level || 1}</strong>
        </div>
      </div>

      <div className="stat-card" style={{ borderColor: profile.color }}>
        <span>Legacy Progress</span>
        <strong>{totalStats} total stat points</strong>
        {dominantStat && <p>Dominant stat: {statMeta[dominantStat[0]]?.label || 'Unknown'}</p>}
        <div className="progress-track" style={{ marginTop: '10px' }}>
          <div className="progress-fill" style={{ width: `${Math.min(100, totalStats)}%`, background: `linear-gradient(90deg, ${profile.color}, ${profile.color}88)` }} />
        </div>
      </div>

      <div className="stats-grid">
        {statEntries.map(([key, value]) => {
          const meta = statMeta[key] || { label: key, icon: Sparkles, color: '#be74ff' };
          const Icon = meta.icon;
          const barPct = Math.min(100, Math.round((Number(value || 0) / maxStat) * 100));

          return (
            <div className="stat-card" key={key} style={{ borderColor: meta.color }}>
              <Icon size={20} />
              <span>{meta.label}</span>
              <strong>{Number(value || 0)}</strong>
              <div className="stat-bar-shell">
                <div className="stat-bar-label">
                  <span>Strength</span>
                  <span>{barPct}%</span>
                </div>
                <div className="stat-bar-track">
                  <div className="stat-bar-fill" style={{ width: `${barPct}%`, background: meta.color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="quest-list">
        <div className="reward unlocked">
          <Trophy size={18} />
          <div>
            <strong>{xp || 0} XP</strong>
            <p>Current XP reserve</p>
          </div>
          <span>Level {level || 1}</span>
        </div>
      </div>
    </section>
  );
}
