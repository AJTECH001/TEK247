import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { env } from "../config/env";

/** Single shared read/write RPC client for the whole backend. */
export const suiClient = new SuiJsonRpcClient({ url: env.SUI_FULLNODE_URL });

let cachedSigner: Ed25519Keypair | null = null;

/**
 * The platform keypair (publisher = arbiter + passport issuer). Loaded lazily so
 * the server still boots in environments without the key configured; cap-gated
 * admin endpoints fail loudly only when actually invoked.
 */
export function platformSigner(): Ed25519Keypair {
  if (!env.SUI_PLATFORM_SECRET_KEY) {
    throw new Error("SUI_PLATFORM_SECRET_KEY is not configured — admin on-chain actions are disabled");
  }
  if (!cachedSigner) {
    cachedSigner = Ed25519Keypair.fromSecretKey(env.SUI_PLATFORM_SECRET_KEY);
  }
  return cachedSigner;
}
