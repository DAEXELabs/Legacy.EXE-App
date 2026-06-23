import AvatarUploader from './AvatarUploader';
import ArchetypeSelector from './ArchetypeSelector';
import { playClick } from '../lib/soundFx';

export function OnboardingScreen({ profileDraft, setProfileDraft, finishOnboarding, onArchetypeSelect, session }) {
  const handleAvatarChange = (url) => {
    setProfileDraft({ ...profileDraft, avatar: url });
  };

  const handleArchetypeClick = (archetype) => {
    playClick();
    if (onArchetypeSelect) onArchetypeSelect(archetype);
  };

  return (
    <main className="app-shell">
      <section className="phone-frame onboarding-frame">
        <p className="eyebrow">LEGACY.EXE</p>
        <h1>Stop planning. Start executing.</h1>
        <p className="intro-copy">
          Build yourself one quest at a time. Create your operator and begin compiling your legacy.
        </p>

        <form className="form-card onboarding-card" onSubmit={finishOnboarding}>
          <AvatarUploader
            currentAvatar={profileDraft.avatar}
            onAvatarChange={handleAvatarChange}
            session={session}
          />

          <label>Operator Name</label>
          <input
            value={profileDraft.playerName}
            onChange={e => setProfileDraft({ ...profileDraft, playerName: e.target.value })}
            placeholder="Raymond, Operator, Builder..."
          />

          <label>Avatar Style</label>
          <div className="emoji-grid">
            {['⚔️', '🛡️', '🔥', '🧠', '👑', '🐺', '⚡', '🧱'].map(icon => (
              <button
                type="button"
                key={icon}
                className={profileDraft.avatar === icon ? 'active' : ''}
                onClick={() => { playClick(); setProfileDraft({ ...profileDraft, avatar: icon }); }}
              >
                {icon}
              </button>
            ))}
          </div>

          <label>Title</label>
          <select
            value={profileDraft.title}
            onChange={e => setProfileDraft({ ...profileDraft, title: e.target.value })}
          >
            <option>Uncompiled Operator</option>
            <option>Discipline Builder</option>
            <option>Warrior in Training</option>
            <option>Legacy Architect</option>
          </select>

          <button className="primary">Begin Compile</button>
        </form>
        <ArchetypeSelector onSelect={handleArchetypeClick} />
      </section>
    </main>
  );
}
