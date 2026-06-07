import { LogOut, User, Volume2, VolumeX } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getSoundEnabled, setSoundEnabled } from '../lib/soundFx';

export function UserMenu({ session, onSignOut, cloudAvailable, localMode }) {
  const [soundOn, setSoundOn] = useState(getSoundEnabled());

  useEffect(() => {
    setSoundOn(getSoundEnabled());
  }, []);

  const toggleSound = () => {
    const newState = !soundOn;
    setSoundEnabled(newState);
    setSoundOn(newState);
  };

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
      <button className="sound-toggle" onClick={toggleSound} title={soundOn ? 'Sound On' : 'Sound Off'}>
        {soundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
        <span>{soundOn ? 'On' : 'Off'}</span>
      </button>
    </div>
  );
}
