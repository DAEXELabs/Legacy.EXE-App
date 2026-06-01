import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  Brain,
  Coins,
  Heart,
  Palette,
  Shield,
  Sword,
  Trophy,
  Hammer,
  Dumbbell,
  Zap,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import './styles.css';

const archetypes = [
  {
    id: 'builder',
    name: 'The Builder',
    protocol: 'Foundation Protocol',
    category: 'Productivity, Discipline & Project Mastery',
    icon: Hammer,
    theme: 'Plans do not build legacy. Execution does.',
    colors: 'Gold / Amber / Blueprint Cyan',
    stages: ['Uncompiled Builder', 'Early Builder', 'Mid Builder', 'Advanced Builder', 'Ascendant Builder'],
    skills: [
      'Blueprint Planning',
      'Resource Allocation',
      'Structural Integrity',
      'Modular Assembly',
      'Discipline Engine',
      'Reinforcement Grid',
      'Legacy Framework',
      'Ascendant Core',
    ],
  },
  {
    id: 'warrior',
    name: 'The Warrior',
    protocol: 'Vital Core Protocol',
    category: 'Health, Fitness & Recovery',
    icon: Sword,
    theme: 'The body becomes what the system repeats.',
    colors: 'Electric Blue / Neon Gold',
    stages: ['Awakened', 'Novice Warrior', 'Conditioned Warrior', 'Elite Warrior', 'Apex Titan'],
    skills: [
      'Core Ignition',
      'Vital Flow',
      'Resilience Frame',
      'Power Surge',
      'Endurance Lattice',
      'Muscle Memory',
      'Titan Overload',
      'Immortal Core',
    ],
  },
];

const stats = [
  { label: 'Health', icon: Activity, value: 0 },
  { label: 'Knowledge', icon: Brain, value: 0 },
  { label: 'Wealth', icon: Coins, value: 0 },
  { label: 'Relationships', icon: Heart, value: 0 },
  { label: 'Creativity', icon: Palette, value: 0 },
  { label: 'Discipline', icon: Shield, value: 0 },
];

function App() {
  const [active, setActive] = useState('warrior');
  const current = archetypes.find((item) => item.id === active);
  const CurrentIcon = current.icon;

  return (
    <main className="app-shell">
      <section className="phone-frame">
        <header className="topbar">
          <div>
            <p className="eyebrow">LEGACY.EXE</p>
            <h1>You are compiling yourself.</h1>
          </div>
          <div className="level-pill">MVP</div>
        </header>

        <section className="hero-card archetype-hero">
          <div className={`avatar big ${current.id}`}>
            <CurrentIcon size={76} />
          </div>

          <div className="hero-copy">
            <p className="eyebrow">{current.category}</p>
            <h2>{current.name}</h2>
            <p>{current.protocol}</p>
            <strong>{current.theme}</strong>
          </div>
        </section>

        <nav className="tabs two">
          {archetypes.map((item) => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={active === item.id ? 'active' : ''}
            >
              {item.name.replace('The ', '')}
            </button>
          ))}
        </nav>

        <section className="screen-stack">
          <div className="xp-card">
            <div className="row-between">
              <span>Compile Path</span>
              <strong>{current.colors}</strong>
            </div>
            <div className="progress-track">
              <div className={`progress-fill ${current.id}`} style={{ width: '42%' }} />
            </div>
          </div>

          <div className="quest-list">
            <div className="row-between">
              <h3>Progression Stages</h3>
              <Trophy />
            </div>

            {current.stages.map((stage, index) => (
              <article className="quest-item" key={stage}>
                <div className="quest-left">
                  <div className="quest-icon">
                    {index < 2 ? <CheckCircle2 size={20} /> : <Zap size={20} />}
                  </div>
                  <div>
                    <h4>Stage {index}: {stage}</h4>
                    <p>Levels {index === 4 ? '41–50+' : `${index * 10 + 1}–${index * 10 + 10}`}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="quest-list">
            <div className="row-between">
              <h3>{current.protocol}</h3>
              {current.id === 'warrior' ? <Dumbbell /> : <Hammer />}
            </div>

            <div className="skill-grid">
              {current.skills.map((skill) => (
                <div className={`skill-node ${current.id}`} key={skill}>
                  <Flame size={16} />
                  <span>{skill}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="stats-grid">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div className="stat-card" key={stat.label}>
                  <Icon size={20} />
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
