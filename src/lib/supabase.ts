import { createClient } from '@supabase/supabase-js';
import type { User as SupabaseUser } from '@supabase/supabase-js';

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

//  auth options tuned for a Vercel (static/CDN) deployment:
//   - flowType 'pkce'  : uses the PKCE flow so no auth code / refresh token is
//                        stored server-side — this is the recommended flow for
//                        frontend-only apps and works reliably on Vercel.
//   - persistSession   : keeps the user signed in across visits (localStorage).
//   - autoRefreshToken : quietly refreshes the access token in the background.
//   - detectSessionInUrl: parses the auth code after Google redirects back.
//   - We deliberately do NOT use a popup anywhere — on a deployed domain popup
//     channels get blocked by third-party cookie / popup blockers. A full-page
//     redirect navigates the top-level page to Google and back, so it cannot be
//     blocked, which is exactly what we want on Vercel.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
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
    displayName: asString(meta.full_name) ?? asString(meta.name) ?? email,
    photoURL: asString(meta.avatar_url) ?? asString(meta.picture),
  };
};

//  Start Google sign-in via a full-page OAuth redirect. Set `redirectTo` to the
//  current URL so Supabase sends the user (and the auth code) right back here.
//  The session is then picked up by getSession()/onAuthStateChange on return,
//  so the app logs the user in with no popup and nothing for the browser to block.
export const signInWithGoogle = async (): Promise<void> => {
  const redirectTo = window.location.href || window.location.origin;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
  if (error) throw error;
  //  signInWithOAuth() with the default (non-skip) redirect will navigate the
  //  whole tab to Google's account picker before this resolves in most cases.
};

//  Sign out
export const signOutUser = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
