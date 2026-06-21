import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthCallback, useZkLogin, useZkLoginSession } from "@mysten/enoki/react";
import toast from "react-hot-toast";
import { enokiLogin, storeAuthData } from "../../network/auth";

export default function ZkLoginCallback() {
  const navigate = useNavigate();
  const { handled } = useAuthCallback();
  const zkLogin = useZkLogin();
  const session = useZkLoginSession();
  const [status, setStatus] = useState("Completing sign-in…");
  const submitted = useRef(false);

  useEffect(() => {
    if (!handled || submitted.current) return;
    const address = zkLogin.address;
    const jwt = session?.jwt;
    if (!address || !jwt) return;
    submitted.current = true;

    (async () => {
      try {
        setStatus("Verifying with TEK247…");
        const res = await enokiLogin({ jwt, suiAddress: address });
        if ("error" in res) throw new Error(res.error);
        if (!res.data) throw new Error("Login failed");
        storeAuthData(res.data.user, res.data.tokens);
        toast.success(`Welcome, ${res.data.user.fullName.split(" ")[0]}!`);
        navigate("/dashboard");
      } catch (err) {
        console.error("Enoki login error:", err);
        toast.error((err as Error).message || "Sign-in failed");
        navigate("/login");
      }
    })();
  }, [handled, zkLogin.address, session?.jwt, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-pageWhite">
      <div className="p-8 bg-white rounded-xl shadow-sm border border-inputBorderGrey text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lorryBlue mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-lorryDarkBlack mb-2">Authenticating</h2>
        <p className="text-inputGrey text-sm">{status}</p>
      </div>
    </div>
  );
}
