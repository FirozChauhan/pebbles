import { type JSX } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { Pebble } from "../assets/Icons.tsx";

const Footer = (): JSX.Element => {
  return (
    <footer className="relative w-full mt-10 sm:mt-16 mb-6 px-2 sm:px-0">
      <div className="w-[94%] sm:w-[85%] mx-auto rounded-2xl border border-white/10 bg-prl backdrop-blur-md shadow-lg opacity-85">
        <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row items-center justify-between px-4 sm:px-6 py-4 sm:py-5">
          {/* Left: project name + tagline */}
          <Link
            to="/"
            className="flex items-center gap-2.5 text-gray-300 hover:text-txt smooth"
          >
            <Pebble className="w-5" />
            <div className="flex flex-col">
              <span className="font-semibold tracking-wide text-txt text-sm sm:text-base">
                PEBBLE<span className="text-[#10B981]">.</span>S
              </span>
              <span className="text-gray-500 text-[11px] -mt-0.5">
                AI Resume Optimizer
              </span>
            </div>
          </Link>

          {/* Right: author name */}
          <div className="font-semibold tracking-wide text-txt text-sm sm:text-base">
            <span>FIROZ.Khan.Chauhan</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


