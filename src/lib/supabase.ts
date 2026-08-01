import { createClient } from '@supabase/supabase-js';
import type { User as SupabaseUser, Session, AuthError } from '@supabase/supabase-js';

//  Supabase client config — loaded from Vite env vars (see .env / .env.example).
//  Vite only exposes vars prefixed with VITE_ to the client bundle.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

//  Fail loudly & early if the env vars are missing — much better than a
//  confusing auth failure later and avoids shipping a broken deploy.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase config. Copy .env.example to .env and fill in your ' +
      'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (Supabase → Project Settings → API).'
  );
}

//  Auth options tuned for a Vercel (static/CDN) deployment:
//   - persistSession   : keeps the user signed in across visits (localStorage).
//   - autoRefreshToken : quietly refreshes the access token in the background
//                        so sessions don't unexpectedly die mid-use.
//   - detectSessionInUrl: parses any auth tokens out of the URL after Supabase
//                        redirects back here (e.g. confirming an email).
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

//  Normalized app-level user so the rest of the app doesn't have to know about
//  Supabase's user shape. Maps directly onto the fields the UI already uses.
export interface AppUser {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

const metadataOf = (u: SupabaseUser): Record<string, unknown> =>
  (u.user_metadata ?? {}) as Record<string, unknown>;

const asString = (v: unknown): string | null =>
  typeof v === 'string' && v.length > 0 ? v : null;

//  Convert a Supabase user to the normalized AppUser the components consume.
export const toAppUser = (u: SupabaseUser | null): AppUser | null => {
  if (!u) return null;
  const meta = metadataOf(u);
  const email = u.email ?? asString(meta.email);
  return {
    id: u.id,
    email: email,
    displayName:
      asString(meta.full_name) ??
      asString(meta.name) ??
      asString(meta.user_name) ??
      email,
    photoURL: asString(meta.avatar_url) ?? asString(meta.picture),
  };
};

//  Normalized result for email/password calls so callers can read `.error` and
//  `.session` without worrying about the exact Supabase response shape (v2
//  returns errors rather than throwing for these calls).
export interface AuthResult {
  user: SupabaseUser | null;
  session: Session | null;
  error: AuthError | null;
}

//  Sign in with email + password.
export const signInWithEmail = async (email: string, password: string): Promise<AuthResult> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data.user ?? null, session: data.session ?? null, error };
};

//  Create a new account with email + password. If email confirmation is enabled
//  in Supabase (the default), `session` will be null and the user must click the
//  confirmation link in their inbox before they can sign in.
export const signUpWithEmail = async (email: string, password: string): Promise<AuthResult> => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { user: data.user ?? null, session: data.session ?? null, error };
};

//  Sign out
export const signOutUser = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
