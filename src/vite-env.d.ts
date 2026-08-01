/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend API base URL used by the resume optimizer. */
  readonly VITE_API_URL?: string;
  /** Supabase project URL (https://<ref>.supabase.co). */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase anon/public key — Project Settings → API. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
