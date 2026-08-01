/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend API base URL used by the resume optimizer. */
  readonly VITE_API_URL?: string;
  /** Firebase web app — API key. */
  readonly VITE_FIREBASE_API_KEY?: string;
  /** Firebase web app — auth domain. */
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  /** Firebase web app — project ID. */
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  /** Firebase web app — storage bucket. */
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  /** Firebase web app — messaging sender ID. */
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  /** Firebase web app — app ID. */
  readonly VITE_FIREBASE_APP_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
