import { initializeApp } from 'firebase/app';
import type { FirebaseOptions } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';

//Firebase Config — loaded from Vite env vars (see .env / .env.example).
//Vite only exposes vars prefixed with VITE_ to the client.
const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

//  Fail loudly & early if the env vars are missing — much better than a
//  confusing auth failure later.
if (!firebaseConfig.apiKey || !firebaseConfig.appId) {
  throw new Error(
    'Missing Firebase config. Copy .env.example to .env and fill in your Firebase web app credentials.'
  );
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Surface the authDomain/projectId the build actually baked in. These values
// are already public in the client bundle, so logging them is safe — and it's
// the fastest way to confirm a Vercel deploy has the right Firebase config.
console.log(
  '[Pebbles auth] firebase config — authDomain:',
  firebaseConfig.authDomain,
  'projectId:',
  firebaseConfig.projectId
);

export const googleProvider = new GoogleAuthProvider();

//  True when running on a local dev server. On *deployed* domains (Vercel,
//  custom domains, …) the popup sign-in flow is unreliable: browsers block the
//  third-party cookies / cross-origin popup channel it relies on, so the user
//  can complete Google's account picker, the popup closes, yet the app still
//  reports "signed out". The redirect flow runs in the top-level page context
//  and is the robust choice for SPAs in production. We keep the nicer popup UX
//  for local dev only.
export const isLocalDev = (): boolean => {
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
};

// Sign in with Google via popup (kept for local dev UX). Throws an explicit
// Firebase error code (e.g. auth/unauthorized-domain) on failure.
export const signInWithGoogle = async (): Promise<User> => {
  console.log('[Pebbles auth] signInWithPopup() called');
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log('[Pebbles auth] popup sign-in succeeded for:', result.user.email);
    return result.user;
  } catch (error) {
    const code = (error as { code?: string })?.code;
    console.error('[Pebbles auth] signInWithPopup threw:', code, error);
    throw error;
  }
};

//  Sign in with Google via full-page redirect. This is what we use on deployed
//  domains: it navigates the top-level page to Google and back, so it is not
//  affected by popup blockers or third-party cookie blocking. The resulting
//  session is restored by completeRedirectSignIn() on the next page load.
export const signInWithGoogleRedirect = async (): Promise<void> => {
  console.log('[Pebbles auth] signInWithRedirect() called');
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    const code = (error as { code?: string })?.code;
    console.error('[Pebbles auth] signInWithRedirect threw:', code, error);
    throw error;
  }
};

//  Called once on app boot (see AuthContext) to finish any in-progress redirect
//  sign-in — i.e. when the browser has just returned from Google's account
//  picker. Resolves with the signed-in user when a round-trip completed, or
//  null when there was nothing pending.
export const completeRedirectSignIn = async (): Promise<User | null> => {
  console.log('[Pebbles auth] getRedirectResult() called');
  try {
    const result = await getRedirectResult(auth);
    console.log(
      '[Pebbles auth] redirect result — user:',
      result?.user ? result.user.email : '(none)'
    );
    return result?.user ?? null;
  } catch (error) {
    const code = (error as { code?: string })?.code;
    console.error('[Pebbles auth] getRedirectResult threw:', code, error);
    throw error;
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
