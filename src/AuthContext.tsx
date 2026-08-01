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
  //  Last auth error that should be surfaced to the user (e.g. a redirect
  //  sign-in that came back empty, or auth/unauthorized-domain). null = none.
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

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
    //
    //  IMPORTANT: after a redirect, the page reloads fresh and the AuthModal is
    //  CLOSED, so an error here would otherwise only ever appear in the console
    //  — the user would just see the app land back on the landing page. So when
    //  a redirect was started (marker present) but came back with no credential,
    //  or getRedirectResult throws, we surface a user-visible authError banner.
    const startedRedirect = marker?.method === 'redirect';
    completeRedirectSignIn()
      .then((u) => {
        if (u) {
          console.log('[Pebbles auth] redirect sign-in completed for:', u.email);
          return;
        }
        //  No credential returned. If a redirect was actually started just
        //  before this load, that's a FAILED round-trip — almost always because
        //  the deployed hostname isn't in Firebase's Authorized domains list
        //  (localhost is auto-authorized, which is why it works locally but not
        //  on Vercel). Surface it so the user isn't left staring at the landing
        //  page with no explanation.
        if (startedRedirect) {
          const host = window.location.hostname;
          console.error(
            '[Pebbles auth] redirect round-trip FAILED — sign-in was started but no credential came back. ' +
            'Almost certainly an unauthorized-domain issue: add "' + host + '" to Firebase → Authentication → Settings → Authorized domains.'
          );
          setAuthError(
            'Google sign-in didn\'t complete. This is almost always because "' + host +
            '" isn\'t in Firebase\'s authorized domains. Add it in Firebase Console → Authentication → Settings → Authorized domains, then try again.'
          );
        }
      })
      .catch((err) => {
        const code = (err as { code?: string })?.code;
        console.error('[Pebbles auth] redirect sign-in failed:', code, err);
        const host = window.location.hostname;
        let msg: string;
        if (code === 'auth/unauthorized-domain' || code === 'auth/operation-not-supported-in-this-environment') {
          msg = '"' + host + '" isn\'t authorized for Google sign-in. Add it in Firebase Console → Authentication → Settings → Authorized domains, then try again.';
        } else {
          msg = (err instanceof Error ? err.message : String(err)) || 'Google sign-in failed. Please try again.';
        }
        setAuthError(msg);
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
    <AuthContext.Provider value={{ user, loading, signIn, signInRedirect, signOut, authError, clearAuthError }}>
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
