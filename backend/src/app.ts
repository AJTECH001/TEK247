import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import routes from "./routes";
import { notFound, errorHandler } from "./middleware/error.middleware";

const app = express();

// Behind a single managed proxy (Railway/Render), trust the first hop so
// express-rate-limit keys on the real client IP, not the shared proxy IP.
app.set("trust proxy", 1);

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Support comma-separated origins: e.g. "https://ajtech.vercel.app,https://ajtech.ng"
const allowedOrigins = env.CORS_ORIGIN
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: allowedOrigins.length > 0 ? allowedOrigins : true,
  credentials: true,
};
app.use(cors(corsOptions));

// ─── Security Headers ─────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

// ─── Rate Limiting ────────────────────────────────────────────────────────────

// Global: 100 requests per IP per 15 minutes
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please try again later." },
  })
);

// Auth endpoints: 10 attempts per IP per 15 minutes (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again in 15 minutes." },
});
app.use("/api/v1/auth/login",                authLimiter);
app.use("/api/v1/auth/register",             authLimiter);
app.use("/api/v1/auth/enoki",                authLimiter);
app.use("/api/v1/auth/forgot-password",      authLimiter);
app.use("/api/v1/auth/resend-verification",  authLimiter);
app.use("/api/v1/auth/reset-password",       authLimiter);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Logging ──────────────────────────────────────────────────────────────────
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/v1", routes);

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
