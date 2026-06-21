import { useState } from "react";
import { useEnokiFlow } from "@mysten/enoki/react";
import { FaGoogle } from "react-icons/fa";
import { Link } from "react-router-dom";
import { GOOGLE_CLIENT_ID, SUI_NETWORK } from "../../network/onchain";

const REDIRECT_URL =
  (import.meta.env.VITE_REDIRECT_URL as string) ?? `${window.location.origin}/auth/zklogin/callback`;

export default function AuthRegister() {
  const [isLoading, setIsLoading] = useState(false);
  const flow = useEnokiFlow();

  const handleZkLogin = async () => {
    try {
      setIsLoading(true);
      const url = await flow.createAuthorizationURL({
        provider: "google",
        clientId: GOOGLE_CLIENT_ID,
        redirectUrl: REDIRECT_URL,
        network: SUI_NETWORK,
        extraParams: { scope: ["openid", "email", "profile"] },
      });
      window.location.href = url;
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-lorryDarkBlack">Join Tek247</h1>
          <p className="text-inputGrey text-sm mt-2">Create your account in seconds using Google. No passwords required.</p>
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
            {isLoading ? "Preparing secure signup..." : "Sign up with Google"}
          </button>
        </div>

        <p className="text-center text-sm text-inputGrey mt-8">
          Already have an account?{" "}
          <Link to="/login" className="text-lorryBlue hover:underline font-medium">
            Sign in
          </Link>
        </p>

        <div className="mt-8 pt-6 border-t border-gray-50">
          <p className="text-center text-xs text-inputGrey leading-relaxed">
            By creating an account, you agree to our{" "}
            <a href="#" className="text-lorryBlue hover:underline">Terms of Service</a> and{" "}
            <a href="#" className="text-lorryBlue hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
