import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export function AuthScreen({ onLocalContinue, onAuthSuccess, cloudAvailable }) {
  const enabled = cloudAvailable && isSupabaseConfigured && supabase;
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!enabled) {
        throw new Error('Cloud auth is unavailable. Continue in local mode.');
      }

      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              boss_campaign_started_at: new Date().toISOString(),
            },
          },
        });
        if (error) throw error;
        setError('Sign-up successful! Check your email, then sign in.');
        setMode('signin');
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (onAuthSuccess) onAuthSuccess(data.session);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-shell">
      <section className="phone-frame auth-frame">
        <p className="eyebrow">LEGACY.EXE</p>
        <h1>Connect or continue local</h1>
        <p className="intro-copy">
          Sign in to sync your chronicle, follow operators, and share progress.
          Or continue in local browser-only mode.
        </p>

        <form className="form-card" onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="operator@legacy.exe"
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
          />

          {error && <div className="auth-error">{error}</div>}

          <button className="primary" type="submit" disabled={loading}>
            {loading ? 'Working...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>

          <button type="button" className="ghost" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
            {mode === 'signin' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
          </button>
        </form>

        <button className="secondary" onClick={onLocalContinue}>
          Continue Local
        </button>
      </section>
    </main>
  );
}
