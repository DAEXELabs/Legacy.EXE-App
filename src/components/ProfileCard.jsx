export function ProfileCard({ profile, compact = false }) {
  const avatar = profile?.avatar || '⚔️';
  const name = profile?.display_name || profile?.username || 'Operator';
  const title = profile?.title || 'Uncompiled Operator';
  const level = profile?.level || 1;

  const renderAvatar = () => {
    if (avatar && avatar.startsWith?.('data:image')) {
      return <img src={avatar} alt="Avatar" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '14px' }} />;
    }
    return avatar;
  };

  if (compact) {
    return (
      <div className="profile-compact">
        <div className="profile-compact-avatar">{renderAvatar()}</div>
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
        <div className="profile-card-avatar">{renderAvatar()}</div>
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
