import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  supabase,
  toAppUser,
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
} from './lib/supabase.ts';
import type { AppUser, AuthResult } from './lib/supabase.ts';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    //  Restore any existing session for a returning visitor.
    supabase.auth
      .getSession()
      .then(({ data }) => {
        setUser(toAppUser(data.session?.user ?? null));
      })
      .catch((err) => {
        console.error('[Pebbles auth] restoring session failed:', err);
      })
      .finally(() => setLoading(false));

    //  Single source of truth for auth changes — fires after a sign-in, sign-up,
    //  email confirmation, session refresh, or sign-out. Flips `user` accordingly.
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

  const signIn = async (email: string, password: string): Promise<AuthResult> =>
    signInWithEmail(email, password);

  const signUp = async (email: string, password: string): Promise<AuthResult> =>
    signUpWithEmail(email, password);

  const signOut = async (): Promise<void> => {
    await signOutUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
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
