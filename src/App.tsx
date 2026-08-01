import { useState } from "react";
import DotBg from "./components/DotBg";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Pebble from "./components/Pebble";
import Content from "./components/Content";
import Learnmore from "./components/Learnmore";
import AuthModal from "./components/AuthModal";
import { useAuth } from "./AuthContext.tsx";
import { type JSX } from "react/jsx-runtime";
import { Routes, Route } from "react-router-dom";

const App = (): JSX.Element => {
  const { user, loading, authError, clearAuthError } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  //  Auth is still resolving — show a brief splash instead of flashing content
  if (loading) {
    return (
      <>
        <DotBg />
        <div className="relative flex items-center justify-center h-screen">
          <span className="w-9 h-9 rounded-full border-2 border-white/10 border-t-[#10B981] animate-spin" />
        </div>
      </>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      <DotBg />
      <Navbar onOpenAuth={() => setShowAuth(true)} />
      {/*  Visible auth-error banner. After a redirect sign-in the page reloads
          fresh and the AuthModal is closed, so without this the user would only
          ever see a silent return to the landing page (the error would be
          buried in the console). This surfaces the exact cause — e.g. an
          unauthorized deployed domain — right at the top of the page. */}
      {authError && (
        <div className="relative z-20 mx-auto mt-3 w-full max-w-2xl px-4">
          <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="flex-1 text-sm leading-relaxed text-red-200">{authError}</p>
            <button
              onClick={clearAuthError}
              aria-label="Dismiss"
              className="flex-shrink-0 rounded-md p-1 text-red-300/70 hover:bg-white/10 hover:text-red-200 smooth"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      <div className="relative flex-1 z-10">
        <Routes>
          <Route
            path="/"
            element={
              user ? (
                <Pebble />
              ) : (
                <Content onGetStarted={() => setShowAuth(true)} />
              )
            }
          />
          <Route path="/learnmore" element={<Learnmore />} />
        </Routes>
      </div>
      <Footer />
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
};

export default App;
