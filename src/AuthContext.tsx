import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, toAppUser, signInWithGitHub, signOutUser } from './lib/supabase.ts';
import type { AppUser } from './lib/supabase.ts';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    //  Restore any existing session (returning visitor). On a fresh deploy after
    //  an OAuth redirect, `detectSessionInUrl` in the Supabase client already
    //  exchanged the auth code; this getSession() picks up the result.
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setUser(toAppUser(data.session?.user ?? null));
      })
      .catch((err) => {
        console.error('[Pebbles auth] restoring session failed:', err);
      })
      .finally(() => setLoading(false));

    //  Single source of truth for auth changes — fires after a completed OAuth
    //  redirect, a session refresh, or a sign-out. Flips `user` accordingly.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log(
        '[Pebbles auth] auth state changed — user:',
        session?.user ? session.user.email : 'signed out'
      );
      setUser(toAppUser(session?.user ?? null));
      setLoading(false);
    });

    //  Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

  const signIn = async () => {
    //  Full-page OAuth redirect (no popup) — cannot be blocked by popup/third-
    //  party cookie blockers, which is the failure mode we hit with popups on a
    //  Vercel deploy. The browser navigates to GitHub and back; on return the
    //  getSession()/onAuthStateChange above restore the session. The navigation
    //  also means this promise typically resolves right away and the caller
    //  (AuthModal) is discarded — which is expected.
    console.log('[Pebbles auth] signIn() invoked — using full-page redirect');
    await signInWithGitHub();
  };

  const signOut = async () => {
    await signOutUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
