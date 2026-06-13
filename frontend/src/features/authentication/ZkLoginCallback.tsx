import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { jwtToAddress, getExtendedEphemeralPublicKey, genAddressSeed } from "@mysten/sui/zklogin";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import toast from "react-hot-toast";
import { zkLoginUtils } from "../../utils/zklogin";
import { storeAuthData } from "../../network/auth";
import { API_URL } from "../../network/constant";
import axios from "axios";

const PROVER_URL = 'https://prover-dev.mystenlabs.com/v1'; // Dev prover for testnet

export default function ZkLoginCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Processing login...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 1. Extract JWT from URL
        const params = new URLSearchParams(window.location.hash.substring(1));
        const jwt = params.get("id_token");
        if (!jwt) {
          throw new Error("No ID token found in callback");
        }

        // 2. Decode JWT
        const decoded: any = jwtDecode(jwt);
        const { sub, email, name } = decoded;

        setStatus("Fetching user salt...");
        // 3. Get Salt from backend
        const saltRes = await axios.post(`${API_URL}/auth/zklogin-salt`, { sub });
        const userSalt = saltRes.data.data.salt;

        // 4. Get stored ephemeral data
        const { ephemeralPrivateKey, randomness, maxEpoch } = zkLoginUtils.getStoredData();
        if (!ephemeralPrivateKey || !randomness || !maxEpoch) {
          throw new Error("Missing ephemeral login data. Please try again.");
        }

        const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(ephemeralPrivateKey);

        setStatus("Generating ZK proof (this may take a few seconds)...");
        // 5. Fetch ZK Proof
        const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(ephemeralKeyPair.getPublicKey());
        
        const zkpPayload = {
          jwt,
          extendedEphemeralPublicKey,
          maxEpoch: parseInt(maxEpoch),
          jwtRandomness: randomness,
          salt: userSalt,
          keyClaimName: "sub",
        };

        // Fetch ZK Proof with retry logic for 429
        let partialZkLoginSignature;
        let retries = 5;
        let delay = 2000;
        while (retries > 0) {
          try {
            const zkpRes = await axios.post(PROVER_URL, zkpPayload);
            partialZkLoginSignature = zkpRes.data;
            break;
          } catch (err: any) {
            if (err.response?.status === 429 && retries > 1) {
              setStatus(`Prover busy, retrying in ${delay / 1000}s... (${retries - 1} left)`);
              await new Promise(resolve => setTimeout(resolve, delay));
              retries--;
              delay += 1000; // Increase delay slightly each time
            } else {
              throw err;
            }
          }
        }

        // 6. Derive Sui Address
        const suiAddress = jwtToAddress(jwt, userSalt, false);

        setStatus("Finalizing login...");
        // 7. Complete login with backend
        const loginRes = await axios.post(`${API_URL}/auth/zklogin`, {
          jwt,
          sub,
          email,
          fullName: name || email.split('@')[0],
          suiAddress,
          salt: userSalt,
        });

        if (loginRes.data.data) {
          storeAuthData(loginRes.data.data.user, loginRes.data.data.tokens);
          zkLoginUtils.clearStoredData();
          toast.success(`Welcome back, ${loginRes.data.data.user.fullName.split(" ")[0]}!`);
          navigate("/dashboard");
        } else {
          throw new Error(loginRes.data.error || "Login failed");
        }

      } catch (err: any) {
        console.error("zkLogin error:", err);
        toast.error(err.message || "Failed to complete zkLogin");
        navigate("/login");
      }
    };

    handleCallback();
  }, [navigate]);

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
