export default function LandingFooter() {
  return (
    <footer className="bg-pageWhite border-t border-statBorderGrey py-10 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Top row */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-lorryBlue rounded-md flex items-center justify-center flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-lorryDarkBlack font-semibold text-sm">Tek247</span>
            </div>
            <p className="text-xs text-inputGrey max-w-xs leading-relaxed font-light">
              Nigeria's trusted platform for buying, repairing, and managing your tech devices.
            </p>
          </div>

          {/* Link columns */}
          <div className="flex gap-14">
            <div>
              <p className="text-xs font-semibold text-lorryDarkBlack uppercase tracking-wider mb-3">Services</p>
              <ul className="space-y-2.5">
                <li><a href="#services"  className="text-xs text-inputGrey hover:text-lorryDarkBlack">Laptop Store</a></li>
                <li><a href="#repairs"   className="text-xs text-inputGrey hover:text-lorryDarkBlack">Repair Workshop</a></li>
                <li><a href="#services"  className="text-xs text-inputGrey hover:text-lorryDarkBlack">Personal Shopper</a></li>
                <li><a href="#services"  className="text-xs text-inputGrey hover:text-lorryDarkBlack">Accessories</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-lorryDarkBlack uppercase tracking-wider mb-3">Account</p>
              <ul className="space-y-2.5">
                <li><a href="/register"        className="text-xs text-inputGrey hover:text-lorryDarkBlack">Create account</a></li>
                <li><a href="/login"           className="text-xs text-inputGrey hover:text-lorryDarkBlack">Sign in</a></li>
                <li><a href="/forgot-password" className="text-xs text-inputGrey hover:text-lorryDarkBlack">Reset password</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-statBorderGrey flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-inputGrey">
            © {new Date().getFullYear()} Tek247. All rights reserved.
          </p>
          <p className="text-xs text-inputGrey">Made for Nigerians 🇳🇬</p>
        </div>
      </div>
    </footer>
  );
}
