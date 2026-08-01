import { useState } from "react";
import { type JSX } from "react/jsx-runtime";
import { useAuth } from "../AuthContext.tsx";
import { Pebble } from "../assets/Icons.tsx";

//  Official multicolor Google "G" logo
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18A10.97 10.97 0 0 0 1 12c0 1.92.51 3.71 1.18 4.94l3.66-2.84z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

const AuthModal = ({ open, onClose }: AuthModalProps): JSX.Element | null => {
  const { signIn } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleGoogle = async () => {
    setBusy(true);
    setError(null);
    try {
      await signIn();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Couldn't sign in. Please try again."
      );
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
          onClick={handleGoogle}
          disabled={busy}
          className="flex items-center justify-center gap-3 w-full bg-white text-black font-medium py-3 min-h-12 rounded-xl hover:cursor-pointer smooth hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {busy ? (
            <span className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
          ) : (
            <GoogleIcon />
          )}
          {busy ? "Connecting to Google…" : "Continue with Google"}
        </button>

        {error && <p className="mt-3 text-red-400 text-sm">{error}</p>}

        <p className="text-gray-500 text-[11px] mt-5 leading-relaxed">
          By signing in you agree to use Pebbles only for personal,
          non-commercial purposes.
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
