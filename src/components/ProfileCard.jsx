export function ProfileCard({ profile, compact = false }) {
  const avatar = profile?.avatar || '⚔️';
  const name = profile?.display_name || profile?.username || 'Operator';
  const title = profile?.title || 'Uncompiled Operator';
  const level = profile?.level || 1;

  if (compact) {
    return (
      <div className="profile-compact">
        <div className="profile-compact-avatar">{avatar}</div>
        <div className="profile-compact-info">
          <strong>{name}</strong>
          <span>{title} • LVL {level}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-card">
      <div className="profile-card-body">
        <div className="profile-card-avatar">{avatar}</div>
        <div className="profile-card-meta">
          <strong>{name}</strong>
          <span>{title}</span>
          <span>LVL {level}</span>
        </div>
      </div>
      {profile?.username && <span className="profile-handle">@{profile.username}</span>}
    </div>
  );
}
