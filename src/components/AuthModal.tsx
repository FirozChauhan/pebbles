import { useState, type FormEvent } from "react";
import { type JSX } from "react/jsx-runtime";
import { useAuth } from "../AuthContext.tsx";
import { Pebble } from "../assets/Icons.tsx";

//  Map Supabase email/password error messages to short, actionable copy so the
//  user understands *why* something failed instead of a raw SDK string.
const friendlyEmailError = (message: string): string => {
  const m = message.toLowerCase();
  if (/invalid login credentials|invalid credentials/.test(m)) {
    return "Incorrect email or password. Please try again.";
  }
  if (/email not confirmed|not confirmed/.test(m)) {
    return "Your email isn't confirmed yet. Check your inbox for the confirmation link, then sign in.";
  }
  if (/already registered|already been registered|user already/i.test(m)) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (/weak password|should be at least|at least 6|shorter than/i.test(m)) {
    return "Your password is too weak — please use at least 6 characters.";
  }
  if (/invalid email|valid email/i.test(m)) {
    return "Please enter a valid email address.";
  }
  if (/rate limit|too many.*attempt|try again later/i.test(m)) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (/network|fetch|timed out/i.test(m)) {
    return "Couldn't reach the authentication service. Check your connection and try again.";
  }
  return message || "Something went wrong. Please try again.";
};

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
}

type Mode = "signin" | "signup";

const AuthModal = ({ open, onClose }: AuthModalProps): JSX.Element | null => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!open) return null;

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setNotice(null);
    setPassword("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }

    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      if (mode === "signin") {
        const { error, session } = await signIn(email, password);
        if (error) {
          setError(friendlyEmailError(error.message));
          return;
        }
        if (session) {
          onClose();
        } else {
          setError("We couldn't create a session. Please try again.");
        }
      } else {
        const { error, session } = await signUp(email, password);
        if (error) {
          setError(friendlyEmailError(error.message));
          return;
        }
        if (session) {
          //  Email confirmation is disabled → sign-up signs the user straight in.
          onClose();
        } else {
          //  Email confirmation is enabled (default) → prompt them to confirm.
          setNotice("Account created! Check your inbox for a confirmation link, then sign in.");
          switchMode("signin");
        }
      }
    } catch (err) {
      console.error("[Pebbles auth] auth failed:", err);
      setError(friendlyEmailError(err instanceof Error ? err.message : String(err)));
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
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="text-gray-400 text-sm mt-1.5 mb-6 leading-relaxed">
          Sign in to optimize your resume and get hired faster.
        </p>

        {/* Mode toggle */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-white/5 border border-white/10 p-1 mb-5">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={`py-2 min-h-10 rounded-lg text-sm font-medium smooth hover:cursor-pointer ${
                mode === m ? "bg-white text-black" : "text-gray-400 hover:text-txt"
              }`}
            >
              {m === "signin" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="text-left space-y-3">
          <div>
            <label htmlFor="auth-email" className="text-txt text-sm font-medium">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12 text-txt placeholder-gray-500 outline-none smooth focus:border-[#10B981] focus:bg-white/10"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="text-txt text-sm font-medium">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signin" ? "Your password" : "At least 6 characters"}
              className="mt-1 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12 text-txt placeholder-gray-500 outline-none smooth focus:border-[#10B981] focus:bg-white/10"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="flex items-center justify-center gap-3 w-full bg-white text-black font-medium py-3 min-h-12 rounded-xl hover:cursor-pointer smooth hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy ? (
              <span className="w-4 h-4 rounded-full border-2 border-black/20 border-t-black animate-spin" />
            ) : null}
            {busy
              ? mode === "signin"
                ? "Signing in…"
                : "Creating account…"
              : mode === "signin"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-left">
            <p className="text-red-300 text-sm leading-relaxed">{error}</p>
          </div>
        )}

        {notice && (
          <div className="mt-4 rounded-lg border border-[#10B981]/30 bg-[#10B981]/10 px-4 py-3 text-left">
            <p className="text-[#10B981] text-sm leading-relaxed">{notice}</p>
          </div>
        )}

        <p className="text-gray-500 text-[11px] mt-5 leading-relaxed">
          By using Pebbles you agree to use it only for personal, non-commercial
          purposes.
        </p>
      </div>
    </div>
  );
};

export default AuthModal;

