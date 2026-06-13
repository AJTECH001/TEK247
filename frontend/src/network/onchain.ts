// TEK247 on-chain constants (testnet). See move/tek247/DEPLOYMENTS.md.

export const SUI_NETWORK = (import.meta.env.VITE_SUI_NETWORK ?? "testnet") as
  | "testnet"
  | "mainnet";

export const PACKAGE_ID = import.meta.env.VITE_SUI_PACKAGE_ID as string;
export const USDC_TYPE = import.meta.env.VITE_USDC_TYPE as string;
export const ENOKI_API_KEY = import.meta.env.VITE_ENOKI_API_KEY as string;
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

/** The shop's payout address (the TEK247 business). Funds release here on approval. */
export const SHOP_ADDRESS =
  (import.meta.env.VITE_SHOP_ADDRESS as string) ??
  "0xae680876f96824ade875f6d6523ab41d08df06abefa3c187079ae72b9df21a0c";

export const ESCROW_MODULE = "repair_escrow";

/** Fully-qualified Move call targets. */
export const Target = {
  createEscrow: `${PACKAGE_ID}::${ESCROW_MODULE}::create_escrow`,
  submitMilestone: `${PACKAGE_ID}::${ESCROW_MODULE}::submit_milestone`,
  approveMilestone: `${PACKAGE_ID}::${ESCROW_MODULE}::approve_milestone`,
  raiseDispute: `${PACKAGE_ID}::${ESCROW_MODULE}::raise_dispute`,
  refundIfUnstarted: `${PACKAGE_ID}::${ESCROW_MODULE}::refund_if_unstarted`,
} as const;

// USDC on Sui has 6 decimals.
export const USDC_DECIMALS = 6;

export function toUsdcUnits(amount: number): bigint {
  return BigInt(Math.round(amount * 10 ** USDC_DECIMALS));
}

export function fromUsdcUnits(units: string | bigint): number {
  return Number(BigInt(units)) / 10 ** USDC_DECIMALS;
}

export function explorerObject(id: string): string {
  return `https://suiscan.xyz/${SUI_NETWORK}/object/${id}`;
}

export function explorerTx(digest: string): string {
  return `https://suiscan.xyz/${SUI_NETWORK}/tx/${digest}`;
}
