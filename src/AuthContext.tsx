import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChange,
  signInWithGoogle,
  signInWithGoogleRedirect,
  signOutUser,
  completeRedirectSignIn,
  isLocalDev,
  consumeSignInMarker,
} from './lib/firebase.ts';
import type { User } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInRedirect: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    //  Log the full URL state on load. After a redirect sign-in, Firebase
    //  appends the credential to the URL (query string and/or hash). Whether it
    //  is present here is the fastest way to tell whether the redirect round-trip
    //  actually completed — and whether getRedirectResult() should find anything.
    console.log('[Pebbles auth] page load — href:', window.location.href);
    console.log(
      '[Pebbles auth] page load — search:', window.location.search || '(empty)',
      '| hash:', window.location.hash || '(empty)'
    );

    //  Was a sign-in initiated just before this page load? signInWithRedirect
    //  navigates away (wiping the console), but the marker survives in
    //  sessionStorage, so finding it here PROVES the redirect round-trip
    //  actually started — even though the "signInWithRedirect() called" log is
    //  gone. Its absence means no sign-in was started before this load.
    const marker = consumeSignInMarker();
    if (marker) {
      const ageMs = Date.now() - marker.ts;
      console.log(
        '[Pebbles auth] sign-in marker found on load — method:', marker.method,
        '| started', ageMs, 'ms ago | from href:', marker.href
      );
    } else {
      console.log('[Pebbles auth] no sign-in marker on load — no sign-in was initiated before this page load.');
    }

    //  Complete any in-progress redirect sign-in (browser returned from Google).
    //  getRedirectResult resolves with the credential if we just came back from
    //  a redirect sign-in, or null otherwise. We log it so the round-trip is
    //  visible in the console when debugging deploys.
    completeRedirectSignIn()
      .then((u) => {
        if (u) console.log('[Pebbles auth] redirect sign-in completed for:', u.email);
      })
      .catch((err) => {
        console.error('[Pebbles auth] redirect sign-in failed:', err);
      });

    // Listen for auth changes — fires after popup, redirect, or a returning
    // session. This is the single source of truth that flips `user` and unblocks
    // the app (loading → false).
    const unsubscribe = onAuthStateChange((user) => {
      console.log('[Pebbles auth] auth state changed — user:', user ? user.email : 'signed out');
      setUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    // Popup on localhost (nicer UX); redirect on deployed domains, where popup
    // sign-in is unreliable (third-party-cookie blocking makes the popup
    // channel fail silently — see isLocalDev). On production this navigates the
    // page to Google and back; getRedirectResult() + the onAuthStateChanged
    // listener below restore the session when the browser returns.
    const local = isLocalDev();
    console.log('[Pebbles auth] signIn() invoked — isLocalDev:', local, '→ using', local ? 'popup' : 'redirect');
    if (local) {
      await signInWithGoogle();
    } else {
      await signInWithGoogleRedirect();
    }
  };

  const signInRedirect = async () => {
    await signInWithGoogleRedirect();
  };

  const signOut = async () => {
    await signOutUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInRedirect, signOut }}>
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
