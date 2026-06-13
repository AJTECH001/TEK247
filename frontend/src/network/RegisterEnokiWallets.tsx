import { useEffect } from "react";
import { useSuiClientContext } from "@mysten/dapp-kit";
import { isEnokiNetwork, registerEnokiWallets } from "@mysten/enoki";
import { ENOKI_API_KEY, GOOGLE_CLIENT_ID } from "./onchain";

/**
 * Registers Google zkLogin as a dapp-kit wallet with Enoki gas sponsorship.
 * Rendered inside <SuiClientProvider> so it can read the active client/network.
 * Customers then "Connect" with Google — no wallet, no seed phrase, no gas.
 */
export function RegisterEnokiWallets() {
  const { client, network } = useSuiClientContext();

  useEffect(() => {
    if (!ENOKI_API_KEY || !GOOGLE_CLIENT_ID) return;
    if (!isEnokiNetwork(network)) return;

    const { unregister } = registerEnokiWallets({
      apiKey: ENOKI_API_KEY,
      providers: {
        google: { clientId: GOOGLE_CLIENT_ID },
      },
      client,
      network,
    });

    return unregister;
  }, [client, network]);

  return null;
}
