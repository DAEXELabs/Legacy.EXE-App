import { LogOut, User } from 'lucide-react';

export function UserMenu({ session, onSignOut, cloudAvailable, localMode }) {
  if (!session && !cloudAvailable) {
    return (
      <div className="user-menu">
        <User size={16} />
        <span>Local Mode</span>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="user-menu">
      <User size={16} />
      <span>{session.user.email || session.user.user_metadata?.username || 'Operator'}</span>
      <button className="ghost" onClick={onSignOut}>
        <LogOut size={14} /> Sign out
      </button>
    </div>
  );
}
