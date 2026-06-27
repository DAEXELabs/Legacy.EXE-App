import AvatarUploader from './AvatarUploader';
import ArchetypeSelector from './ArchetypeSelector';
import { playClick } from '../lib/soundFx';
import { MINIMUM_AGE } from '../utils/ageVerification';

export function OnboardingScreen({ profileDraft, setProfileDraft, finishOnboarding, onArchetypeSelect, session, ageError, ageBlocked }) {
  const handleAvatarChange = (url) => {
    setProfileDraft({ ...profileDraft, avatar: url });
  };

  const handleArchetypeClick = (archetype) => {
    playClick();
    if (onArchetypeSelect) onArchetypeSelect(archetype);
  };

  if (ageBlocked) {
    return (
      <main className="app-shell">
        <section className="phone-frame onboarding-frame age-blocked-frame">
          <p className="eyebrow">LEGACY.EXE</p>
          <h1>Sorry, you&rsquo;re not eligible right now.</h1>
          <p className="intro-copy">
            Legacy.EXE is designed for adults {MINIMUM_AGE}+. Because of this, we&rsquo;re unable to create an
            account for you at this time.
          </p>
          <p className="age-blocked-note">
            We respect your time &mdash; nothing else is needed from you, and no account data has been saved.
          </p>
          <a className="primary age-blocked-action" href="https://www.google.com" aria-label="Exit Legacy.EXE">
            Exit
          </a>
        </section>
      </main>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

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

          <label htmlFor="operator-name">Operator Name</label>
          <input
            id="operator-name"
            value={profileDraft.playerName}
            onChange={e => setProfileDraft({ ...profileDraft, playerName: e.target.value })}
            placeholder="Raymond, Operator, Builder..."
          />

          <label htmlFor="operator-birthday">
            Date of Birth <span className="field-hint">(18+ only)</span>
          </label>
          <input
            id="operator-birthday"
            type="date"
            max={today}
            value={profileDraft.birthday || ''}
            onChange={e => setProfileDraft({ ...profileDraft, birthday: e.target.value })}
            aria-describedby="birthday-help"
            required
          />
          <p id="birthday-help" className="field-help">
            We use this only to confirm you&rsquo;re at least {MINIMUM_AGE}. It stays on your profile and is never sold or shared.
          </p>

          {ageError && (
            <p className="field-error" role="alert">{ageError}</p>
          )}

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

          <label htmlFor="operator-title">Title</label>
          <select
            id="operator-title"
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