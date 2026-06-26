import React, { useState, useEffect, useCallback, useRef, useContext, createContext } from 'react';
import { X, HelpCircle, ChevronRight, ChevronLeft, Sparkles, Swords, Brain, Shield, Users, Skull, Scroll, Zap } from 'lucide-react';

const STORAGE_KEY = 'legacy-exe-tutorial-v1';

const TOUR_STEPS = [
  {
    id: 'welcome',
    title: 'Operator Online',
    body: 'Legacy.EXE is a gamified execution system. You build your operator one completed quest at a time. This tour covers the core loops — quests, archetypes, skill trees, weekly bosses, and social features.',
    icon: Sparkles,
  },
  {
    id: 'home',
    title: 'Home Tab — Your Command Center',
    body: 'The Home tab shows your avatar, XP progress, current weekly boss, and today\'s quests. Your dominant stat is highlighted on your avatar. The HP bar represents your operational health.',
    icon: Brain,
  },
  {
    id: 'quests',
    title: 'Quests — Your Daily Compile',
    body: 'Quests are the core action loop. Assign a stat (Discipline, Knowledge, Health, etc.), a difficulty, and a proof type. Completing quests earns XP and deals damage to the weekly boss. Proof types include Honor, Timer, Check-in, and Workout KPI.',
    icon: Scroll,
  },
  {
    id: 'archetype',
    title: 'Archetypes — Your Path',
    body: 'Your archetype defines your operator identity. Warriors master health and endurance. Builders forge productivity systems. Scholars unravel knowledge and tech. Each archetype shapes how you compile your legacy.',
    icon: Shield,
  },
  {
    id: 'skill-tree',
    title: 'Skill Tree — Unlock Your Edge',
    body: 'The Skill Tree lets you allocate points across your stats. As you level up, you unlock new abilities and passive bonuses. Focus on your dominant stat or balance your build.',
    icon: Zap,
  },
  {
    id: 'boss',
    title: 'Weekly Bosses — The Resistance',
    body: 'Each week a new boss attacks your progress. Bosses feed on real-world struggles — procrastination, distraction, doubt, comfort. Complete quests to deal damage. Defeat the boss before Sunday to protect your streak and HP.',
    icon: Skull,
  },
  {
    id: 'social',
    title: 'Social — The Network',
    body: 'The Social tab has two sub-tabs: Feed and Friends. Encourage other operators\' chronicle posts, add friends, and build your legacy together. Co-op mode lets you fight the weekly boss as a party.',
    icon: Users,
  },
  {
    id: 'chronicle',
    title: 'Chronicle — Your Public Proof',
    body: 'Post your wins, workouts, reading progress, and creative builds to the Chronicle. Chronicle posts earn XP and inspire other operators. Toggle visibility between public and private.',
    icon: Swords,
  },
];

const HELP_SECTIONS = [
  {
    id: 'quests',
    title: 'Quests',
    icon: Scroll,
    entries: [
      { q: 'How do I create a quest?', a: 'Go to the Quests tab and fill in the form. Give it a title, pick a stat, set a difficulty (Easy/Normal/Hard/Major), and choose a proof type.' },
      { q: 'What are proof types?', a: 'Honor = self-report. Timer = complete within a time limit. Check-in = submit a short reflection. Workout KPI = log a verified workout with duration and effort.' },
      { q: 'Can I edit a quest?', a: 'Yes. Click the edit icon on any quest to modify its title, stat, difficulty, or proof type.' },
      { q: 'How does streak multiplier work?', a: 'Complete at least one quest each day to build your streak. Higher streaks multiply the damage you deal to the weekly boss.' },
    ],
  },
  {
    id: 'archetypes',
    title: 'Archetypes',
    icon: Shield,
    entries: [
      { q: 'What are archetypes?', a: 'Archetypes are operator paths: Warrior (health/endurance), Builder (productivity systems), and Scholar (knowledge/tech). Your archetype shapes your identity.' },
      { q: 'Can I change my archetype?', a: 'Yes. Visit the Character tab and click Change Archetype. Your progress is preserved.' },
      { q: 'Do archetypes give bonuses?', a: 'Each archetype emphasizes different stats. Warriors gain health faster, Builders gain discipline, and Scholars gain knowledge.' },
    ],
  },
  {
    id: 'bosses',
    title: 'Weekly Bosses',
    icon: Skull,
    entries: [
      { q: 'What happens if I don\'t defeat the boss?', a: 'If the boss isn\'t defeated by Sunday, you lose HP and your streak resets. The boss is archived and a new one arrives next week.' },
      { q: 'How is boss damage calculated?', a: 'Damage = base damage from completed quests and chronicle posts, multiplied by your streak multiplier. Focus on your boss\'s weakness stat.' },
      { q: 'What are boss weaknesses?', a: 'Each boss has a weakness stat (e.g., Discipline, Knowledge). Quests targeting that stat deal bonus damage.' },
      { q: 'Can I fight old bosses?', a: 'Defeated bosses are archived in the Boss tab. You can review their codex entries and victory rewards.' },
    ],
  },
  {
    id: 'social',
    title: 'Social & Co-op',
    icon: Users,
    entries: [
      { q: 'How do I add friends?', a: 'Go to Social > Friends and search by operator name or handle. Send a friend request and wait for approval.' },
      { q: 'What is co-op mode?', a: 'Co-op lets you fight the weekly boss as a party. Combined damage is tracked separately and rewards are shared.' },
      { q: 'How do I post to the Chronicle?', a: 'Go to the Chronicle tab, choose a type (Physical Progress, Reading, Workout Proof, etc.), write a caption, and optionally attach media.' },
      { q: 'Can I make posts private?', a: 'Yes. Toggle visibility on any chronicle post between public and private.' },
    ],
  },
  {
    id: 'skill-tree',
    title: 'Skill Tree',
    icon: Zap,
    entries: [
      { q: 'How do I earn skill points?', a: 'You earn 1 skill point per level-up. Leveling up requires completing quests and chronicle posts.' },
      { q: 'What do the stats do?', a: 'Health = HP pool. Knowledge = reading XP bonus. Wealth = reward multiplier. Relationships = social XP. Creativity = chronicle XP. Discipline = boss damage.' },
      { q: 'Can I respec?', a: 'Respeccing is available from the Character tab after level 5. It costs 10% of your lifetime XP.' },
    ],
  },
];

function getTutorialState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { completed: false, dismissed: [], lastStep: 0 };
    const parsed = JSON.parse(raw);
    return {
      completed: !!parsed.completed,
      dismissed: Array.isArray(parsed.dismissed) ? parsed.dismissed : [],
      lastStep: Number(parsed.lastStep) || 0,
    };
  } catch {
    return { completed: false, dismissed: [], lastStep: 0 };
  }
}

function saveTutorialState(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

const TutorialContext = createContext(null);

export function TutorialProvider({ children }) {
  const [state, setState] = useState(getTutorialState);
  const [tourOpen, setTourOpen] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    saveTutorialState(state);
  }, [state]);

  const startTour = useCallback(() => {
    setTourStep(state.completed ? 0 : state.lastStep);
    setTourOpen(true);
  }, [state.completed, state.lastStep]);

  const completeTour = useCallback(() => {
    setState(prev => ({ ...prev, completed: true }));
    setTourOpen(false);
  }, []);

  const dismissSection = useCallback((sectionId) => {
    setState(prev => ({
      ...prev,
      dismissed: prev.dismissed.includes(sectionId) ? prev.dismissed : [...prev.dismissed, sectionId],
    }));
  }, []);

  const resetTutorial = useCallback(() => {
    setState({ completed: false, dismissed: [], lastStep: 0 });
  }, []);

  return (
    <TutorialContext.Provider
      value={{
        ...state,
        tourOpen,
        tourStep,
        guideOpen,
        setTourStep,
        startTour,
        completeTour,
        dismissSection,
        resetTutorial,
        setTourOpen,
        setGuideOpen,
      }}
    >
      {children}
      {tourOpen && <TourModal />}
      {guideOpen && <GuidePanel />}
    </TutorialContext.Provider>
  );
}

function TourModal() {
  const ctx = useContext(TutorialContext);
  const { tourStep, setTourStep, completeTour, setTourOpen } = ctx;
  const step = TOUR_STEPS[tourStep];
  const Icon = step?.icon || HelpCircle;
  const total = TOUR_STEPS.length;
  const isLast = tourStep >= total - 1;

  const next = () => {
    if (isLast) {
      completeTour();
    } else {
      setTourStep(tourStep + 1);
    }
  };

  const prev = () => {
    if (tourStep > 0) setTourStep(tourStep - 1);
  };

  const skip = () => setTourOpen(false);

  return (
    <div className="tutorial-overlay" role="dialog" aria-modal="true" aria-label="Onboarding tutorial">
      <div className="tutorial-modal">
        <button className="tutorial-close" onClick={skip} aria-label="Close tutorial">
          <X size={18} />
        </button>

        <div className="tutorial-icon-shell">
          <Icon size={28} />
        </div>

        <p className="tutorial-step-indicator">
          Step {tourStep + 1} / {total}
        </p>

        <h2 className="tutorial-title">{step.title}</h2>
        <p className="tutorial-body">{step.body}</p>

        <div className="tutorial-progress">
          {TOUR_STEPS.map((s, i) => (
            <span
              key={s.id}
              className={`tutorial-dot ${i === tourStep ? 'active' : ''} ${i < tourStep ? 'done' : ''}`}
            />
          ))}
        </div>

        <div className="tutorial-actions">
          {tourStep > 0 && (
            <button className="ghost tutorial-btn" onClick={prev}>
              <ChevronLeft size={16} /> Back
            </button>
          )}
          <button className="primary tutorial-btn" onClick={next}>
            {isLast ? 'Begin Compile' : 'Next'} {!isLast && <ChevronRight size={16} />}
          </button>
        </div>

        <button className="tutorial-skip" onClick={skip}>
          Skip tour
        </button>
      </div>
    </div>
  );
}

function GuidePanel() {
  const ctx = useContext(TutorialContext);
  const { setGuideOpen } = ctx;
  const [activeSection, setActiveSection] = useState('quests');
  const section = HELP_SECTIONS.find(s => s.id === activeSection);

  return (
    <div className="tutorial-overlay" role="dialog" aria-modal="true" aria-label="Help guide">
      <div className="tutorial-modal guide-modal">
        <button className="tutorial-close" onClick={() => setGuideOpen(false)} aria-label="Close guide">
          <X size={18} />
        </button>

        <p className="eyebrow">LEGACY.EXE Codex</p>
        <h2 className="tutorial-title">Operator Guide</h2>

        <div className="guide-tabs">
          {HELP_SECTIONS.map(s => {
            const SIcon = s.icon;
            return (
              <button
                key={s.id}
                className={`guide-tab ${activeSection === s.id ? 'active' : ''}`}
                onClick={() => setActiveSection(s.id)}
              >
                <SIcon size={14} /> {s.title}
              </button>
            );
          })}
        </div>

        {section && (
          <div className="guide-content">
            {section.entries.map((entry, i) => (
              <details key={i} className="guide-entry" open={i === 0}>
                <summary>{entry.q}</summary>
                <p>{entry.a}</p>
              </details>
            ))}
          </div>
        )}

        <div className="tutorial-actions">
          <button className="ghost tutorial-btn" onClick={() => setGuideOpen(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function HelpTooltip({ content, children, id }) {
  const ctx = useContext(TutorialContext);
  const { dismissed, dismissSection } = ctx;
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (dismissed.includes(id)) return children || null;

  return (
    <span className="help-tooltip-wrapper" ref={ref}>
      {children}
      <button
        className="help-tooltip-trigger"
        onClick={() => setOpen(!open)}
        aria-label="Show help"
        aria-expanded={open}
      >
        <HelpCircle size={14} />
      </button>
      {open && (
        <span className="help-tooltip-popup" role="tooltip">
          {content}
          <button
            className="help-tooltip-dismiss"
            onClick={() => { dismissSection(id); setOpen(false); }}
            aria-label="Dismiss help"
          >
            <X size={12} />
          </button>
        </span>
      )}
    </span>
  );
}

export function HelpButton({ className = '' }) {
  const ctx = useContext(TutorialContext);
  const { startTour } = ctx;
  return (
    <button
      className={`ghost help-btn ${className}`}
      onClick={startTour}
      title="Start tutorial"
      aria-label="Open tutorial and help guide"
    >
      <HelpCircle size={16} /> Help
    </button>
  );
}

export function TutorialSettings({ onReset }) {
  const ctx = useContext(TutorialContext);
  const { completed, dismissed, startTour, resetTutorial } = ctx;

  return (
    <div className="form-card settings-section">
      <h3>Tutorial & Help</h3>
      <div className="settings-row">
        <span>Onboarding tour</span>
        <button className="ghost small" onClick={startTour}>
          {completed ? 'Replay Tour' : 'Start Tour'}
        </button>
      </div>
      <div className="settings-row">
        <span>Dismissed tips ({dismissed.length})</span>
        <button
          className="ghost small"
          disabled={dismissed.length === 0}
          onClick={() => { resetTutorial(); onReset?.(); }}
        >
          Restore Tips
        </button>
      </div>
    </div>
  );
}
