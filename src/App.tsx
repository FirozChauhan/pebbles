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
  const { user, loading } = useAuth();
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
