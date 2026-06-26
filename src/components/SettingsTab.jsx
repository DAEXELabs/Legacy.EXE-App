import { useState } from 'react';
import { LogOut, Download, Upload, Volume2, VolumeX, Zap } from 'lucide-react';
import { deleteUserAppData } from '../lib/socialApi';
import { TutorialSettings } from '../components/TutorialHelp';

export function SettingsTab({
  session,
  cloudAvailable,
  localMode,
  signOut,
  settings,
  setSettings,
  exportSaveData,
  importSaveData,
  resetApp,
  backupMessage,
}) {
  const [resetConfirm, setResetConfirm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteStatus, setDeleteStatus] = useState('');

  const handleSoundToggle = () => {
    setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  const handleReducedMotionToggle = () => {
    setSettings(prev => ({ ...prev, reducedMotion: !prev.reducedMotion }));
  };

  const handlePrivacyChange = (e) => {
    setSettings(prev => ({ ...prev, defaultChroniclePrivacy: e.target.value }));
  };

  const handleDeleteAppData = async () => {
    if (!session?.user?.id) return;
    setDeleteStatus('Deleting...');
    const { error } = await deleteUserAppData(session.user.id);
    if (error) {
      setDeleteStatus(`Error: ${error.message}`);
    } else {
      setDeleteStatus('Cloud app data deleted');
      setDeleteConfirm('');
    }
  };

  return (
    <section className="screen-stack">
      <div className="boss-card">
        <p className="eyebrow">Settings</p>
        <h2>Control Panel</h2>
        <p>Manage your account, preferences, and data.</p>
      </div>

      <TutorialSettings />

      <div className="form-card settings-section">
        <h3>Account</h3>
        {session ? (
          <div className="settings-row">
            <span>{session.user.email}</span>
            <button className="ghost" onClick={signOut}>
              <LogOut size={14} /> Sign out
            </button>
          </div>
        ) : localMode ? (
          <div className="settings-row">
            <span>Local Mode</span>
          </div>
        ) : null}

        {!cloudAvailable && session && (
          <div className="warning-card">
            Cloud sync unavailable — Supabase not configured.
          </div>
        )}
      </div>

      <div className="form-card settings-section">
        <h3>Preferences</h3>

        <div className="toggle-row">
          <span>Sound Effects</span>
          <button
            className="sound-toggle"
            onClick={handleSoundToggle}
            title={settings.soundEnabled ? 'Sound On' : 'Sound Off'}
          >
            {settings.soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span>{settings.soundEnabled ? 'On' : 'Off'}</span>
          </button>
        </div>

        <div className="toggle-row">
          <span>Reduced Motion</span>
          <button
            className="sound-toggle"
            onClick={handleReducedMotionToggle}
          >
            <Zap size={14} />
            <span>{settings.reducedMotion ? 'On' : 'Off'}</span>
          </button>
        </div>

        <div className="toggle-row">
          <span>Default Chronicle Privacy</span>
          <select
            value={settings.defaultChroniclePrivacy}
            onChange={handlePrivacyChange}
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
        </div>
      </div>

      <div className="form-card settings-section">
        <h3>Data Tools</h3>

        <div className="settings-row">
          <button type="button" className="ghost" onClick={exportSaveData}>
            <Download size={16} /> Export Save
          </button>

          <label className="ghost import-label">
            <Upload size={16} /> Import Save
            <input
              type="file"
              accept="application/json"
              onChange={importSaveData}
              hidden
            />
          </label>
        </div>

        {backupMessage && (
          <div className="chronicle-reward">{backupMessage}</div>
        )}
      </div>

      <div className="form-card danger-zone">
        <h3>Danger Zone</h3>

        <div className="settings-row">
          <p>Reset Local Progress - Clears all saved progress from this browser.</p>
          <input
            type="text"
            placeholder="Type RESET to confirm"
            value={resetConfirm}
            onChange={e => setResetConfirm(e.target.value)}
          />
          <button
            className="danger"
            disabled={resetConfirm !== 'RESET'}
            onClick={resetApp}
          >
            Reset Local Progress
          </button>
        </div>

        {session && (
          <div className="settings-row">
            <p>Delete Cloud App Data - Removes your chronicle posts, reactions, and profile.</p>
            <p className="warning-text">
              Permanent cloud account deletion requires a secure server/admin function.
            </p>
            {deleteStatus && <p>{deleteStatus}</p>}
            <input
              type="text"
              placeholder="Type DELETE to confirm"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
            />
            <button
              className="danger"
              disabled={deleteConfirm !== 'DELETE'}
              onClick={handleDeleteAppData}
            >
              Delete Cloud App Data
            </button>
          </div>
        )}
      </div>
    </section>
  );
}