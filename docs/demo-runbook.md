# TEK247 — Judge Demo Runbook (operational / rehearsable)

This is the **tested click-path** for a live demo, grounded in the deployed app.
For the narrative/story arc, see `DEMO.md`. This file is the "what to actually do."

## Live endpoints
| Thing | URL |
| --- | --- |
| App (frontend) | https://tek247.vercel.app |
| Backend health | https://tek247-backend-production.up.railway.app/health |
| Explorer (testnet) | https://suiscan.xyz/testnet |
| USDC faucet (testnet) | https://faucet.circle.com (select **Sui · Testnet**) |

## Accounts you need
| Role | Who | How it's set |
| --- | --- | --- |
| **Shop / Admin** | `aladejamiudamilola@gmail.com` (your account) | Promoted to admin in the live DB. Sees "Mark done", diagnose, issue-passport, resolve-dispute. |
| **Customer** | **A different Google account** (any Gmail) | New Google logins default to a normal customer. Sees "+ New Request", "Pay into escrow", "Approve & release". |

> The full escrow handshake needs BOTH roles, so use **two browser windows** (e.g. normal
> window = customer, incognito/second profile = admin). Put them side-by-side on screen.

---

## ⚠️ Pre-flight checklist (do 30–60 min before, NOT live)

1. **Wake the backend.** Open the health URL → expect `{"status":"ok"}`. (Railway can cold-start.)
2. **Confirm login works** on both accounts (Google → lands in dashboard). If you get
   `redirect_uri_mismatch` or an Enoki error, the consoles aren't propagated yet — wait/retry.
3. **Get the customer's Sui address.** Log in as the **customer** → **Profile** → copy
   **"Sui Wallet Address"**.
4. **🔑 Fund the customer with testnet USDC (the #1 thing that breaks live demos).**
   - Go to https://faucet.circle.com → network **Sui Testnet** → paste the customer address → request.
   - This sends Circle USDC of type `0xa1ec…::usdc::USDC` (exactly what the app expects).
   - You only need a little (the demo funds ~10 USDC). **Gas is sponsored**, so you do NOT need SUI.
   - Verify it arrived: open the address on suiscan → Coins → you should see USDC.
5. **Open backup tabs** (in case live timing fails) — the seeded, already-on-chain artifacts:
   - Passport (3 records): https://suiscan.xyz/testnet/object/0x55a56f38f497824b0780d55cdb8050327c886384b164680d2a377275c18f3f77
   - Completed escrow: https://suiscan.xyz/testnet/object/0xc417664c92f6ae8e47fd4cbec4857e983f2f4cfc85e80cd9b779acda992d95cf
   - Disputed→resolved escrow: https://suiscan.xyz/testnet/object/0x72f25de29c71d06d3ff412f5b68caf4a91019a20c67ce93906f4e00fa3a85cad
6. **Have a report file ready** (a PDF or photo) to upload for the Device Passport step.
7. **Do one full dry run** end-to-end (below) so the first live run isn't your first run.

---

## The live click-path (~5 min)

### 0:00 — Hook (admin/shop window, on the dashboard)
State the problem in one line: *"Buying or repairing a used laptop in our market is a
trust minefield — fake specs, stolen units, 'I paid but it was never fixed.'"*

### 0:30 — Customer pays, no wallet (CUSTOMER window)
1. **Continue with Google** → you're in. Say: *"No wallet, no seed phrase — just Google."*
2. Left nav → **Repairs** → **+ New Request**. Fill brand/model + issue (e.g. "MacBook Air,
   screen flickering"). Submit.
3. Click the new repair row → the detail modal opens. Scroll to **On-chain Escrow**.
4. Amount defaults to **10** → the panel shows the split **Diagnosis / Repair / Delivery
   (2 / 5 / 3 USDC)** released only as work is approved. Click **Pay into escrow**.
5. Approve the toast flow. Say: *"That paid USDC into a smart-contract escrow — and notice
   the wallet never popped up and I paid zero gas."* Click **View escrow on explorer ↗**.

### 2:00 — Work + release (BOTH windows)
6. **ADMIN window** → same repair → On-chain Escrow → on **Diagnosis** click **Mark done**.
7. **CUSTOMER window** (refreshes within ~4s) → **Approve & release** on Diagnosis.
   Say: *"Funds move stage-by-stage, only on the customer's approval — neither side can grab
   the money."* Show **Released to shop** tick up; open **Latest transaction ↗**.

### 3:00 — Verifiable device passport (ADMIN window)
8. In the same modal, **Device Passport** → fill serial + summary (e.g. "Screen replacement")
   → attach your report file → **Store on Walrus + anchor on Sui**.
9. The record appears with **View report ↗** (Walrus URL) and a **`sha256:` integrity** badge.
   Say: *"The report lives on Walrus; its hash is anchored on the device's on-chain passport —
   tamper-evident and append-only."*

### 4:00 — The payoff (backup tab)
10. Open the **seeded passport** (3 records) on the explorer. Say: *"This history travels with
    the device on resale — any future buyer can verify the whole life of the machine."*

### 4:40 — Vision (one line)
*"Targets a real-world repair & resale market — escrow take-rate, verified-resale marketplace,
and a path to mainnet USDC."*

---

## Optional: show the dispute → arbiter flow (30s)
In the escrow panel, either side can **Raise dispute**. As **admin/arbiter** you then get a
**"Customer refund" slider (0–100%)** with a live payout preview ("Customer gets X, Shop gets
Y") → **Resolve dispute & split funds**. (Or just open the seeded disputed→resolved escrow.)

---

## Troubleshooting (live)
| Symptom | Cause / fix |
| --- | --- |
| `redirect_uri_mismatch` (Google) | Prod redirect URI not yet in Google console / not propagated. Wait 5 min, retry fresh tab. |
| Login spins / Enoki error | Enoki portal: origin `https://tek247.vercel.app`, testnet sponsorship, and the 5 escrow targets must be allow-listed. |
| **"Pay into escrow" fails** | Customer address has **no testnet USDC** — re-run the Circle faucet (pre-flight #4). |
| A specific escrow action fails sponsorship | That Move target isn't allow-listed in Enoki (need all 5: create/submit/approve/raise_dispute/refund). |
| First request very slow | Railway cold start — hit the health URL first. |
| Lots of "Too many requests" | Rate limit; the `trust proxy` fix is deployed so this should be per-IP, not global. |
| Everything's flaky on camera | Switch to the **backup**: walk the 3 seeded objects on the explorer; the full lifecycle is already on-chain. |

## Reset between rehearsals
Repairs/escrows you create are real and persist. To start clean, just create a **new** repair
(each gets its own escrow). The customer needs enough USDC for each run you fund.
