import { type JSX } from "react/jsx-runtime";
import { Link } from "react-router-dom";

const Learnmore = (): JSX.Element => {
  return (
    <div className="animate-page-in relative text-txt w-[94%] sm:w-[85%] mx-auto mt-28 sm:mt-40">
      <div className="w-full px-4 sm:px-6 text-center text-txt py-5">
        
        <h2 className="animate-heading text-3xl sm:text-4xl md:text-4xl font-hero">
          Why Optimize Your Resume?
        </h2>

        <div className="max-w-5xl mx-auto text-left space-y-6 bg-prl/40 p-4 sm:p-8 rounded-2xl">
          
          <p className="animate-paragraph-1 text-base sm:text-lg md:text-xl leading-7 sm:leading-8 text-gray-300 text-left sm:text-justify">
            In today's competitive job market, recruiters spend an average of
            just 6 seconds reviewing a resume. Your application needs to make an
            instant impact. Our AI-powered engine analyzes your resume against
            industry-standard ATS (Applicant Tracking System) filters,
            highlighting exactly where your keywords, formatting, and experience
            fall short.
          </p>

          <p className="animate-paragraph-2 text-base sm:text-lg md:text-xl leading-7 sm:leading-8 text-gray-300 text-left sm:text-justify">
            We go beyond basic spell-check. Our optimizer scans for action
            verbs, quantifiable achievements, and role-specific keywords
            tailored to your target job description. By pinpointing weak spots
            and suggesting data-driven improvements, we help you present your
            skills in the language hiring managers actually want to see.
          </p>

          <p className="animate-paragraph-3 text-base sm:text-lg md:text-xl leading-7 sm:leading-8 text-gray-300 text-left sm:text-justify">
            Don't let a poorly optimized resume cost you your dream interview.
            With instant feedback and actionable suggestions, you can transform
            your existing CV into a powerful, interview-generating document in
            minutes. Stand out from the crowd and get noticed by the right
            people.
          </p>

          <Link to="/">
            <button className="animate-button mt-2 block bg-prl text-txt px-8 py-2 rounded-xl font-medium border-2 text-sm hover:cursor-pointer smooth opacity-70 hover:-translate-y-1 active:scale-95">
              Go Back
            </button>
          </Link>

        </div>
      </div>
    </div>
  );
};

export default Learnmore;
