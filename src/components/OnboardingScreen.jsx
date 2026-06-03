export function OnboardingScreen({ profileDraft, setProfileDraft, finishOnboarding }) {
  return (
    <main className="app-shell">
      <section className="phone-frame onboarding-frame">
        <p className="eyebrow">LEGACY.EXE</p>
        <h1>Stop planning. Start executing.</h1>
        <p className="intro-copy">
          Build yourself one quest at a time. Create your operator and begin compiling your legacy.
        </p>

        <form className="form-card onboarding-card" onSubmit={finishOnboarding}>
          <div className="avatar forge-avatar">{profileDraft.avatar}</div>

          <label>Operator Name</label>
          <input
            value={profileDraft.playerName}
            onChange={e => setProfileDraft({ ...profileDraft, playerName: e.target.value })}
            placeholder="Raymond, Operator, Builder..."
          />

          <label>Avatar</label>
          <div className="emoji-grid">
            {['⚔️', '🛡️', '🔥', '🧠', '👑', '🐺', '⚡', '🧱'].map(icon => (
              <button
                type="button"
                key={icon}
                className={profileDraft.avatar === icon ? 'active' : ''}
                onClick={() => setProfileDraft({ ...profileDraft, avatar: icon })}
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
      </section>
    </main>
  );
}
