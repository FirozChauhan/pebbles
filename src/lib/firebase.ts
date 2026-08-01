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

export const googleProvider = new GoogleAuthProvider();


// Sign in with Google via popup. Throws auth/popup-blocked if the browser
// blocks the popup — callers should fall back to signInWithGoogleRedirect().
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error signing in (popup):', error);
    throw error;
  }
};

// Fallback: sign in with Google via redirect (navigates the current tab to
// Google, then returns). Used when the popup is blocked by the browser.
export const signInWithGoogleRedirect = async () => {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error('Error starting redirect sign in:', error);
    throw error;
  }
};

// Resolve the result of a redirect sign-in after the browser returns from
// Google. Call once on app load.
export const completeRedirectSignIn = async (): Promise<User | null> => {
  try {
    const result = await getRedirectResult(auth);
    return result?.user ?? null;
  } catch (error) {
    console.error('Error completing redirect sign in:', error);
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
