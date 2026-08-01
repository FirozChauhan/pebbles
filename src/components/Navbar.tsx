import { type JSX } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext.tsx";

//Import Logo SVG
import { Pebble } from "../assets/Icons.tsx";

const Navbar = ({
  onOpenAuth,
}: {
  onOpenAuth?: () => void;
}): JSX.Element => {
  const { user, signOut } = useAuth();

  return (
    <div className="relative">
      <div className="flex items-center justify-between gap-2 px-3.5 sm:px-5 py-3 sm:py-6 w-[94%] sm:w-[85%] top-6 sm:top-20 left-1/2 -translate-x-1/2 -translate-y-1/2 fixed mx-auto rounded-2xl border border-white/10 bg-prl backdrop-blur-md shadow-lg opacity-85 z-40">
        <Link to="/" className="min-w-0">
          <div className="flex items-center">
            <Pebble className="w-8 sm:w-10 shrink-0" />
            <h1 className="text-txt text-base sm:text-xl tracking-widest font-logo ml-1.5 hidden min-[360px]:block">
              PEBBLE.S
            </h1>
          </div>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/learnmore"
            className="text-gray-400 hover:cursor-pointer hover:text-txt mr-1 sm:mr-4 smooth text-sm sm:text-base py-2 active:text-txt"
          >
            About
          </Link>

          {user ? (
            <>
              {/* User chip (hidden on small screens to save space) */}
              <div className="hidden sm:flex items-center gap-2 border border-white/10 rounded-lg px-2.5 py-1.5 bg-white/5">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#10B981]/20 text-[#10B981] flex items-center justify-center text-xs font-bold uppercase">
                    {(user.displayName || user.email || "?").slice(0, 1)}
                  </div>
                )}
                <span className="text-txt text-sm font-medium max-w-[8rem] truncate">
                  {user.displayName || user.email}
                </span>
              </div>
              <button
                onClick={signOut}
                className="bg-white text-black px-4 sm:px-5 py-2 min-h-10 rounded-lg font-medium border-2 text-sm hover:cursor-pointer smooth hover:bg-prl hover:text-txt hover:border-txt hover:border-2 active:scale-95"
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="bg-white text-black px-4 sm:px-5 py-2 min-h-10 rounded-lg font-medium border-2 text-sm hover:cursor-pointer smooth hover:bg-prl hover:text-txt hover:border-txt hover:border-2 active:scale-95"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
