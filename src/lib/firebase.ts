import { initializeApp } from 'firebase/app';
import type { FirebaseOptions } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
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

// Sign in with Google via popup. Throws auth/popup-blocked if the browser
// blocks the popup — callers should surface a friendly error to the user.
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
