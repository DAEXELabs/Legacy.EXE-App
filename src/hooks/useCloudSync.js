import { useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export function useCloudSync() {
  const cloudAvailable = useMemo(() => isSupabaseConfigured && Boolean(supabase), []);

  const [authLoading, setAuthLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [localMode, setLocalMode] = useState(() => {
    if (!cloudAvailable) return true;
    return sessionStorage.getItem('legacy-exe-local') === 'true';
  });

  useEffect(() => {
    if (localMode) sessionStorage.setItem('legacy-exe-local', 'true');
    else sessionStorage.removeItem('legacy-exe-local');
  }, [localMode]);

  useEffect(() => {
    let cancelled = false;

    if (!cloudAvailable) {
      setAuthLoading(true);
      setSession(null);
      setAuthLoading(false);
      return;
    }

    setAuthLoading(true);

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setSession(data.session);
      if (!cancelled) setAuthLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) setSession(session);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [cloudAvailable]);

  const user = useMemo(() => session?.user ?? null, [session]);

  const signOut = useMemo(() => {
    return async () => {
      if (!cloudAvailable || !supabase) return;
      await supabase.auth.signOut();
      setSession(null);
    };
  }, [cloudAvailable]);

  return {
    session,
    user,
    authLoading,
    cloudAvailable,
    localMode,
    setLocalMode,
    signOut,
  };
}
