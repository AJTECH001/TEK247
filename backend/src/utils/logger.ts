import { env } from "../config/env";

const isDev = env.NODE_ENV === "development";

export const logger = {
  info: (...args: unknown[]) => isDev && console.log("[INFO]", ...args),
  warn: (...args: unknown[]) => console.warn("[WARN]", ...args),
  error: (...args: unknown[]) => console.error("[ERROR]", ...args),
};
