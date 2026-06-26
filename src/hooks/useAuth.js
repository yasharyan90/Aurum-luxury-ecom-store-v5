// src/hooks/useAuth.js
import { useState, useEffect, useContext, createContext, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

// Generate a valid UUID v4 for demo mode
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const isOwner = profile?.role === 'owner';

  // ── Fetch profile from Supabase ───────────────────────
  const fetchProfile = useCallback(async (userId) => {
    // Skip for demo UUIDs (they won't exist in DB)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error && data) setProfile(data);
    } catch {
      // Supabase not configured — ignore
    }
  }, []);

  // ── Session listener ──────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) fetchProfile(u.id);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) fetchProfile(u.id);
      else   setProfile(null);
    });

    return () => listener.subscription.unsubscribe();
  }, [fetchProfile]);

  // ── Customer Sign Up ──────────────────────────────────
  const signUp = async ({ email, password, fullName }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: 'customer' } },
    });
    if (error) throw error;
    return data;
  };

  // ── Customer Login ────────────────────────────────────
  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  // ── Owner Login — always uses real Supabase auth ──────
  // No fake UUIDs — Supabase rejects non-UUID strings
  const ownerSignIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    // Verify the user has owner role in profiles table
    const { data: prof, error: profError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profError || !prof) {
      await supabase.auth.signOut();
      throw new Error('Profile not found. Please contact support.');
    }

    if (prof.role !== 'owner') {
      await supabase.auth.signOut();
      throw new Error('Access denied. Owner privileges required.');
    }

    // onAuthStateChange listener will update user + profile state
    return data;
  };

  // ── Demo Customer Login (only when Supabase not set up) ──
  // Uses a real UUID v4 format so it won't crash if it
  // accidentally reaches any UUID-typed column
  const demoLogin = (email, fullName) => {
    const fakeId = generateUUID();
    const u = {
      id:            fakeId,
      email,
      user_metadata: { full_name: fullName || email.split('@')[0] },
    };
    setUser(u);
    setProfile({ id: fakeId, role: 'customer', full_name: u.user_metadata.full_name, email });
  };

  // ── Sign Out ──────────────────────────────────────────
  const signOut = async () => {
    try { await supabase.auth.signOut(); } catch { /* ignore if not signed in */ }
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      user, profile, isOwner, loading,
      signUp, signIn, ownerSignIn, demoLogin, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
