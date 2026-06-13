import { useState } from "react";
import { zkLoginUtils } from "../../utils/zklogin";
import { FaGoogle } from "react-icons/fa";

export default function AuthLogin() {
  const [isLoading, setIsLoading] = useState(false);

  const handleZkLogin = async () => {
    try {
      setIsLoading(true);
      await zkLoginUtils.prepareLogin();
    } catch (error) {
      console.error("zkLogin preparation failed", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-pageWhite">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-sm border border-inputBorderGrey">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-lorryBlue rounded-xl mb-4 shadow-sm">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-lorryDarkBlack">Welcome to Tek247</h1>
          <p className="text-inputGrey text-sm mt-2">Sign in securely with your Google account to access your dashboard.</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleZkLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-inputBorderGrey text-lorryDarkBlack rounded-xl text-base font-semibold hover:bg-pageWhite hover:border-lorryBlue transition-all duration-200 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-lorryBlue border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <FaGoogle className="text-red-500 text-xl group-hover:scale-110 transition-transform" />
            )}
            {isLoading ? "Connecting to Google..." : "Continue with Google"}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-50">
          <p className="text-center text-xs text-inputGrey leading-relaxed">
            By continuing, you agree to our{" "}
            <a href="#" className="text-lorryBlue hover:underline">Terms of Service</a> and{" "}
            <a href="#" className="text-lorryBlue hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
