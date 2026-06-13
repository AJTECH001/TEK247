import { Link } from "react-router-dom";

export default function LandingNav() {
  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-b border-black/6">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 bg-lorryBlue rounded-md flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-lorryDarkBlack font-semibold text-base">Tek247</span>
        </Link>

        {/* Centre links */}
        <div className="hidden md:flex items-center gap-8 text-sm text-inputGrey absolute left-1/2 -translate-x-1/2">
          <a href="#services"     className="hover:text-lorryDarkBlack">Services</a>
          <a href="#how-it-works" className="hover:text-lorryDarkBlack">How it works</a>
          <a href="#repairs"      className="hover:text-lorryDarkBlack">Repairs</a>
        </div>

        {/* Right CTAs */}
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm text-inputGrey hover:text-lorryDarkBlack font-medium">
            Sign in
          </Link>
          <Link
            to="/register"
            className="px-4 py-1.5 bg-lorryBlue text-white text-sm font-semibold rounded-full hover:bg-lorryDarkBlue"
          >
            Get started
          </Link>
        </div>
      </div>
    </nav>
  );
}
