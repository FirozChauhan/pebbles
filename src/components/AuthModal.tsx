import { useState } from "react";
import { type JSX } from "react/jsx-runtime";
import { useAuth } from "../AuthContext.tsx";
import { Pebble } from "../assets/Icons.tsx";

//  GitHub "octocat" mark — single-color, inherits currentColor so it adapts to
//  the white button it sits on.
const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.21 3.44 9.63 8.21 11.19.6.11.82-.25.82-.57 0-.28-.01-1.03-.02-2.01-3.34.71-4.04-1.59-4.04-1.59-.55-1.37-1.34-1.73-1.34-1.73-1.09-.73.08-.72.08-.72 1.2.08 1.84 1.22 1.84 1.22 1.07 1.8 2.81 1.28 3.5.98.11-.76.42-1.28.76-1.58-2.67-.3-5.47-1.31-5.47-5.84 0-1.29.47-2.35 1.24-3.18-.13-.3-.54-1.51.11-3.15 0 0 1.01-.32 3.3 1.21.96-.26 1.98-.39 3-.4 1.02 0 2.05.14 3 .4 2.28-1.53 3.29-1.21 3.29-1.21.65 1.64.24 2.85.12 3.15.77.83 1.23 1.89 1.23 3.18 0 4.54-2.81 5.53-5.49 5.83.43.36.81 1.09.81 2.2 0 1.59-.01 2.87-.01 3.26 0 .32.21.69.82.57C20.56 21.92 24 17.5 24 12.29 24 5.78 18.63.5 12 .5z" />
  </svg>
);

//  Since sign-in is a full-page OAuth redirect, most errors are network/config
//  problems rather than per-click auth errors. We surface a small map of common
//  failures and fall back to a friendly generic message instead of a raw SDK
//  string.
const friendlyAuthMessage = (err: unknown): string => {
  //  Supabase errors carry a `message` and sometimes a `status`/`code`.
  const message = err instanceof Error ? err.message : String(err ?? '');

  if (/unauthorized|redirect.*not.*allow|invalid.*redirect/i.test(message)) {
    return "This site's URL isn't whitelisted for GitHub sign-in yet. Add your Vercel domain to Supabase → Authentication → URL Configuration → Redirect URLs, then try again.";
  }
  if (/network|fetch|failed to fetch|timed out/i.test(message)) {
    return "Couldn't reach the authentication service. Check your connection and try again.";
  }
  if (/missing|invalid api key|invalid credent/i.test(message)) {
    return 'The app is missing its Supabase configuration. Please contact support.';
  }
  return message || "Couldn't sign in. Please try again.";
};


interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

const AuthModal = ({ open, onClose }: AuthModalProps): JSX.Element | null => {
  const { signIn } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleGitHub = async () => {
    setBusy(true);
    setError(null);

    try {
      //  signIn() starts a full-page GitHub redirect. For most flows the page
      //  navigates away immediately, but any synchronous/config error is caught
      //  here and shown in the modal with a friendly, actionable message.
      await signIn();
      onClose();
    } catch (err) {
      console.error('[Pebbles auth] sign-in failed:', err);
      setError(friendlyAuthMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-prd/80 backdrop-blur-sm animate-fade-in p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-prl shadow-2xl p-6 sm:p-8 text-center animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-txt hover:bg-white/10 smooth"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <Pebble className="w-12 mx-auto" />
        <h2 className="text-txt text-xl sm:text-2xl font-hero mt-4">
          Welcome to Pebbles
        </h2>
        <p className="text-gray-400 text-sm mt-1.5 mb-6 leading-relaxed">
          Sign in to optimize your resume and get hired faster.
        </p>

        <button
          onClick={handleGitHub}
          disabled={busy}
          className="flex items-center justify-center gap-3 w-full bg-white text-black font-medium py-3 min-h-12 rounded-xl hover:cursor-pointer smooth hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {busy ? (
            <span className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
          ) : (
            <GitHubIcon />
          )}
          {busy ? "Connecting to GitHub…" : "Continue with GitHub"}
        </button>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-left">
            <p className="text-red-300 text-sm leading-relaxed">{error}</p>
          </div>
        )}

        <p className="text-gray-500 text-[11px] mt-5 leading-relaxed">
          By signing in you agree to use Pebbles only for personal,
          non-commercial purposes.
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
