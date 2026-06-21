# TEK247 — Deployment Runbook (judge-ready)

Two services: **frontend → Vercel**, **backend (Express + Postgres) → Render**.
The Sui Move package + seeded demo artifacts are already live on testnet.

> Order matters: backend first (to get its URL), then frontend, then wire CORS back.
> Because Render's URL is deterministic from the service name, you can also do them
> in parallel using the predicted URL `https://tek247-backend.onrender.com`.

---

## 1. Backend → Render (Blueprint)

1. Push this repo to GitHub (must be reachable by Render).
2. Render Dashboard → **New → Blueprint** → connect this repo. Render reads
   `render.yaml` and provisions a free **Postgres** + the **web service**.
3. When prompted, fill the `sync: false` env vars:
   | Var | Value |
   | --- | --- |
   | `CORS_ORIGIN` | your Vercel URL, e.g. `https://tek247.vercel.app` |
   | `FRONTEND_URL` | same Vercel URL |
   | `GOOGLE_CLIENT_ID` | the Google OAuth client id wired into Enoki |
   | `SUI_PLATFORM_SECRET_KEY` | *(optional)* `suiprivkey...` — only for backend-signed dispute/passport actions |
   | `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | *(optional)* email; skipped if unset |
   `JWT_SECRET` / `JWT_REFRESH_SECRET` are auto-generated; `DATABASE_URL` is wired from the DB.
4. Deploy. Confirm health: `curl https://<backend>.onrender.com/health` → `{"status":"ok"}`.

### Run database migrations (one-time, after the DB exists)
From `backend/`, using the database's **External** connection string from Render:
```bash
DATABASE_URL='postgresql://...@...render.com/tek247_db?sslmode=require' npx dbmate up
```
(`dbmate` reads `db/migrations/*.sql`.) Verify: `... npx dbmate status`.

> Note: Render's **free** web service sleeps after ~15 min idle → first request has a
> ~50s cold start. Hit `/health` right before the judges test, or upgrade to the
> $7 starter plan for the demo window.

---

## 2. Frontend → Vercel

Root directory: **`frontend`**. `vercel.json` sets the Vite build + SPA rewrites.

Set these Environment Variables (Production) in the Vercel project:
| Var | Value |
| --- | --- |
| `VITE_API_BASE_URL` | `https://<backend>.onrender.com/api/v1` *(note the `/api/v1`)* |
| `VITE_ENOKI_API_KEY` | your Enoki public key |
| `VITE_GOOGLE_CLIENT_ID` | same Google client id as the backend |
| `VITE_REDIRECT_URL` | `https://<your-vercel-domain>/auth/zklogin/callback` |
| `VITE_SUI_NETWORK` | `testnet` |
| `VITE_SUI_PACKAGE_ID` | `0x64f7db7a66b5367947bd2a6b7e3751b0b6350dde7a12680903717a2052bff9e1` |
| `VITE_USDC_TYPE` | `0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC` |

Deploy: `cd frontend && npx vercel --prod` (or via the dashboard).

---

## 3. Wire the two together (after both URLs exist)
- Render: set `CORS_ORIGIN` + `FRONTEND_URL` = the Vercel URL → redeploy backend.
- Vercel: set `VITE_API_BASE_URL` = `https://<backend>.onrender.com/api/v1` → redeploy.

## 4. Auth consoles (required for the walletless Google login)
- **Google OAuth console**: add authorized redirect URI
  `https://<vercel-domain>/auth/zklogin/callback` and the origin `https://<vercel-domain>`.
- **Enoki portal**: enable testnet gas sponsorship, allow-list the redirect URI and the
  5 escrow Move call targets (`create_escrow`, `submit_milestone`, `approve_milestone`,
  `raise_dispute`, `refund_if_unstarted`), and the Google provider.

## 5. Smoke test (what judges will do)
1. `GET /health` on the backend → ok.
2. Open the Vercel site → **Continue with Google** → returns to the app logged in (zkLogin).
3. Open a repair → escrow panel renders on-chain state.
4. Explorer links resolve (seeded artifacts in `DEMO.md`).
