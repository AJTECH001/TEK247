import dotenv from "dotenv";
dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env variable: ${key}`);
  return value;
}

// Railway provides a single DATABASE_URL connection string.
// Individual DB_* vars are only required when DATABASE_URL is absent (local dev).
const DATABASE_URL = process.env.DATABASE_URL;

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: parseInt(process.env.PORT ?? "5000", 10),

  // DB — use DATABASE_URL (Railway) or individual vars (local dev)
  DATABASE_URL,
  DB_HOST:     DATABASE_URL ? (process.env.DB_HOST ?? "")     : required("DB_HOST"),
  DB_PORT:     parseInt(process.env.DB_PORT ?? "5432", 10),
  DB_NAME:     DATABASE_URL ? (process.env.DB_NAME ?? "")     : required("DB_NAME"),
  DB_USER:     DATABASE_URL ? (process.env.DB_USER ?? "")     : required("DB_USER"),
  DB_PASSWORD: DATABASE_URL ? (process.env.DB_PASSWORD ?? "") : required("DB_PASSWORD"),

  JWT_SECRET:              required("JWT_SECRET"),
  JWT_EXPIRES_IN:          process.env.JWT_EXPIRES_IN ?? "15m",
  JWT_REFRESH_SECRET:      required("JWT_REFRESH_SECRET"),
  JWT_REFRESH_EXPIRES_IN:  process.env.JWT_REFRESH_EXPIRES_IN ?? "30d",

  // Email (Resend) is optional. When unset, email sends are skipped (logged) so
  // the server still boots and the Google/zkLogin demo path works without it.
  RESEND_API_KEY:    process.env.RESEND_API_KEY ?? "",
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL ?? "noreply@tek247.app",

  FRONTEND_URL: process.env.FRONTEND_URL ?? "http://localhost:5173",

  // Google OAuth client id (must match the frontend / Enoki provider) — used to
  // verify the `aud` claim of the Google ID token on login.
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "597702663809-gmnoiqjnkd2gvbfto9n37rmvnqi4ekci.apps.googleusercontent.com",

  // Sui
  SUI_NETWORK:      process.env.SUI_NETWORK ?? "testnet",
  SUI_FULLNODE_URL: process.env.SUI_FULLNODE_URL ?? "https://fullnode.testnet.sui.io:443",
  USDC_TYPE:        process.env.USDC_TYPE ?? "0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC",

  // TEK247 on-chain package (testnet) — see move/tek247/DEPLOYMENTS.md
  SUI_PACKAGE_ID:      process.env.SUI_PACKAGE_ID ?? "0x64f7db7a66b5367947bd2a6b7e3751b0b6350dde7a12680903717a2052bff9e1",
  SUI_ARBITER_CAP_ID:  process.env.SUI_ARBITER_CAP_ID ?? "0xa259366ad69332c5e0cb763ccc85b99c09e43cde8f8e6a10f152a57e3d26ad4e",
  SUI_ISSUER_CAP_ID:   process.env.SUI_ISSUER_CAP_ID ?? "0xf735ea40ee482d48077150dbb3ec9cd59ca689ca576fd893eb1c994dd34e65a3",
  // Platform key (publisher/arbiter). Bech32 `suiprivkey...`. Signs ONLY cap-gated
  // admin txs (dispute resolution, passport issuance). Optional in local dev.
  SUI_PLATFORM_SECRET_KEY: process.env.SUI_PLATFORM_SECRET_KEY ?? "",

  // Comma-separated list of allowed origins, e.g.:
  // "https://ajtech.vercel.app,https://ajtech.ng"
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:5173",
};
