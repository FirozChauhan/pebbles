import { Link } from "react-router-dom";
import { type JSX } from "react/jsx-runtime";

const Content = ({
  onGetStarted,
}: {
  onGetStarted?: () => void;
}): JSX.Element => {

  return (
    <div className="animate-page-in mt-28 sm:mt-48 relative pb-8">
      <h1 className="text-txt text-[clamp(2rem,8.5vw,3.5rem)] sm:text-7xl md:text-8xl font-hero text-center px-3 sm:px-4 leading-[1.15] max-w-5xl mx-auto">
        Get Hired Faster. <br />
        Resume Optimized in <br />
        Seconds.
      </h1>
      <div className="text-txt flex flex-col sm:flex-row items-center justify-center mt-10 px-3 sm:px-4 max-w-5xl mx-auto">
        <button
          onClick={onGetStarted}
          className="bg-white text-black w-full sm:w-auto px-6 py-3 min-h-12 rounded-lg font-medium mb-3 sm:mb-0 sm:mr-3 border-1 text-sm hover:cursor-pointer smooth hover:bg-prl hover:text-txt hover:border-txt hover:border-1 hover:-translate-y-1 active:scale-[0.97]"
        >
          Get Started
        </button>
        <Link to="/learnmore" className="w-full sm:w-auto">
          <button className="bg-prl text-txt w-full sm:w-auto px-6 py-3 min-h-12 rounded-lg font-medium border-1 text-sm smooth hover:cursor-pointer hover:opacity-70 hover:-translate-y-1 active:scale-[0.97]">
            Learn More
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Content;
