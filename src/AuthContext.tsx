import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  completeRedirectSignIn,
  isLocalDev,
  onAuthStateChange,
  signInWithGoogle,
  signInWithGoogleRedirect,
  signOutUser,
} from './lib/firebase.ts';
import type { User } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    //  Finish any in-progress redirect sign-in. On a deployed domain the
    //  browser may have just returned from Google's account picker with a
    //  pending credential; calling getRedirectResult() here finalizes that
    //  round-trip so the app logs the user in. It resolves with null when there
    //  was no pending redirect (normal landing / returning session), so we
    //  don't need to branch on the result — the onAuthStateChanged listener
    //  below is the single source of truth that flips `user`.
    completeRedirectSignIn().catch((err) => {
      const code = (err as { code?: string })?.code;
      console.error('[Pebbles auth] completing redirect sign-in failed:', code, err);
    });

    // Listen for auth changes — fires after a popup sign-in, a completed
    // redirect sign-in, or a returning session. This is the single source of
    // truth that flips `user` and unblocks the app (loading → false).
    const unsubscribe = onAuthStateChange((user) => {
      console.log('[Pebbles auth] auth state changed — user:', user ? user.email : 'signed out');
      setUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    //  Popup on localhost (nicer UX); redirect on deployed domains, where the
    //  popup channel is unreliable (third-party-cookie blocking makes it fail
    //  silently — see isLocalDev in lib/firebase.ts). On production this
    //  navigates the page to Google and back; completeRedirectSignIn() +
    //  onAuthStateChanged restore the session when the browser returns.
    const local = isLocalDev();
    console.log('[Pebbles auth] signIn() invoked — isLocalDev:', local, '→ using', local ? 'popup' : 'redirect');
    if (local) {
      await signInWithGoogle();
    } else {
      await signInWithGoogleRedirect();
    }
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
