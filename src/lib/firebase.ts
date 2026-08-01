import { initializeApp } from 'firebase/app';
import type { FirebaseOptions } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
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

//  Sign in with Google via full-page redirect. We use this flow everywhere
//  (local dev AND deployed domains) because it runs in the top-level page
//  context and is therefore never affected by popup blockers or third-party
//  cookie blocking — the two things that cause the classic "sign-in completes
//  at Google but the app stays signed-out" failure on Vercel. The resulting
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
