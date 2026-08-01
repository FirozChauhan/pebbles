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

// True when running on a local dev server. On *deployed* domains (Vercel,
// custom domains, …) popup sign-in is unreliable: modern browsers block the
// third-party cookies the popup channel relies on, so the user can complete
// Google's account picker, the popup closes, yet onAuthStateChanged still
// reports "signed out". The redirect flow runs in the top-level page context
// and is the robust choice for SPAs in production. We keep the nicer popup UX
// for local dev only.
export const isLocalDev = (): boolean => {
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
};


// Sign in with Google via popup. Throws auth/popup-blocked if the browser
// blocks the popup — callers should fall back to signInWithGoogleRedirect().
export const signInWithGoogle = async () => {
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

// Fallback: sign in with Google via redirect (navigates the current tab to
// Google, then returns). Used when the popup is blocked by the browser.
export const signInWithGoogleRedirect = async () => {
  console.log('[Pebbles auth] signInWithRedirect() called — the page should now navigate to Google…');
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    const code = (error as { code?: string })?.code;
    console.error('[Pebbles auth] signInWithRedirect threw (page did NOT navigate):', code, error);
    throw error;
  }
};

// Resolve the result of a redirect sign-in after the browser returns from
// Google. Call once on app load.
export const completeRedirectSignIn = async (): Promise<User | null> => {
  console.log('[Pebbles auth] getRedirectResult() called');
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      console.log('[Pebbles auth] getRedirectResult returned user:', result.user.email);
    } else {
      console.log('[Pebbles auth] getRedirectResult returned null — no pending redirect credential in the URL.');
    }
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
