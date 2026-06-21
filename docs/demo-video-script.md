# TEK247 — Demo Video Script (Sui Overflow 2026)

Matches the Overflow format: **30–60s problem · ~3min demo · 30–60s conclusion/vision.**
Live app: **https://tek247.vercel.app** · Package: `0x64f7…f9e1` (Sui testnet).

> Record in **two browser windows** side by side: **Customer** (`ajtech255@gmail.com`,
> `0x89df…`) and **Shop/Admin** (`aladejamiudamilola@gmail.com`, `0x9d2e34…`). Both are
> funded with testnet SUI + USDC. Keep the seeded explorer tabs open as backup (see end).

---

## [0:00–0:50] Problem (30–60s)
**Say:** "In emerging markets, buying or repairing a used laptop is a trust minefield —
fake specs, stolen units, and 'I paid but it was never fixed.' Cash-based informal commerce
has no recourse for either side. TEK247 fixes this by putting the money and the device's
history on-chain — for a real-world laptop repair & resale use case."

**Show:** the live landing page (https://tek247.vercel.app) — the hero says
*"Pay for repairs without the risk."*

---

## [0:50–3:50] Product demo (~3 min)
> Pre-step (off camera): make sure the demo device's passport is **pre-created** (do one
> anchor beforehand) so the on-camera anchor just *appends* — avoids first-time timing.

**1. Walletless onboarding (0:50–1:20)**
- Customer window → **Continue with Google** → lands in the dashboard.
- **Say:** "No wallet, no seed phrase — the customer signs in with Google. Under the hood
  this is **Sui zkLogin** via Enoki: a real Sui account derived from their Google identity."

**2. Trustless milestone escrow (1:20–2:30)**
- Repairs → open the repair → **On-chain Escrow** → amount **10 USDC** → show the split
  **Diagnosis 2 / Repair 5 / Delivery 3** → **Pay into escrow**.
- **Say:** "The customer funds a **milestone escrow in USDC**. Funds release stage-by-stage,
  *only* on the customer's approval — the shop can't grab the money early, and the customer
  can't stiff the shop." Click **View escrow on explorer ↗** (show it's real, on-chain).
- Switch to **Admin** window → **Mark done** on Diagnosis.
- Back to **Customer** → **Approve & release** → show **Released to shop** tick up to 2.00 USDC,
  open **Latest transaction ↗**.
- **Say:** "Every step is a Move smart-contract call with real trust guarantees — deadlines,
  disputes, and a neutral arbiter, all enforced on Sui."

**3. Verifiable device passport (2:30–3:30)**
- Admin window → **Device Passport** → attach the diagnostic report PDF + summary →
  **Store on Walrus + anchor on Sui**.
- **Say:** "When the repair's done, the diagnostic report goes to **Walrus**, and its
  **SHA-256 hash is anchored on the device's on-chain passport**. The history is append-only
  and tamper-evident."
- Show the new record with **View report ↗** (opens the PDF from Walrus) and the **`sha256:`** badge.
- **Say (the kicker):** "Anyone can download this report, hash it, and confirm it matches the
  on-chain hash — so a future *resale buyer* can verify the device's entire repair history.
  That directly attacks the counterfeit-spec and stolen-device fraud in second-hand markets."

---

## [3:50–4:40] Conclusion & vision (30–60s)
**Say:** "TEK247 brings emerging-market device commerce on-chain: trustless USDC escrow,
walletless onboarding, and a verifiable device passport — for real-world laptop repair & resale.
Next: true Enoki gas-sponsorship for a zero-fee experience, a verified-resale marketplace
where provable history sets price, on-chain reputation, and mainnet USDC settlement. We're
turning a real, cash-based trust problem into a verifiable, on-chain one."

**Show:** the seeded passport with 3 records on the explorer (history surviving resale).

---

## How TEK247 uses the Sui stack (state this clearly — judges score it)
- **Move smart contracts** — `repair_escrow` (milestone escrow generic over `Coin<T>`, deadlines,
  disputes, capability-gated arbiter) + `device_passport` (append-only, Walrus-anchored history).
- **zkLogin (via Enoki)** — walletless Google onboarding; real Sui accounts, no seed phrase.
- **Stablecoin settlement** — escrow funded and released in **USDC** on Sui.
- **Walrus** — verifiable storage for repair reports/photos; blob id + SHA-256 anchored on-chain.
- **Sui objects** — the passport is a transferable, history-bearing asset that survives resale.

## Live, verifiable artifacts (show/link these)
- App: https://tek247.vercel.app · API: https://tek247-backend-production.up.railway.app/health
- Package: https://suiscan.xyz/testnet/object/0x64f7db7a66b5367947bd2a6b7e3751b0b6350dde7a12680903717a2052bff9e1
- Seeded passport (3 records): https://suiscan.xyz/testnet/object/0x55a56f38f497824b0780d55cdb8050327c886384b164680d2a377275c18f3f77
- Completed escrow: https://suiscan.xyz/testnet/object/0xc417664c92f6ae8e47fd4cbec4857e983f2f4cfc85e80cd9b779acda992d95cf
- Disputed→resolved escrow: https://suiscan.xyz/testnet/object/0x72f25de29c71d06d3ff412f5b68caf4a91019a20c67ce93906f4e00fa3a85cad

## ⚠️ Honesty / risk notes for recording
- **Gas:** true Enoki sponsorship needs a *private* key + backend (not built yet — public keys
  can't sponsor). Today the signer's account holds a little testnet SUI. **Recommendation:**
  don't claim "$0 gas / gasless" on camera unless you say it's *coming via Enoki sponsorship*.
  The genuinely-true claims are **"no wallet, no seed phrase"** (zkLogin) — lead with those.
- **First-time passport anchor** can hit a timing error; **pre-create the passport** before recording.
- If anything is flaky live, cut to the **seeded explorer artifacts** — the full lifecycle is
  already on-chain and inspectable.

---

## Pre-submission checklist (their rubric)
- [ ] **Demo video** recorded to the timing above (≤5 min total).
- [ ] **GitHub repo public** (SUBMISSION.md still lists this TODO — make it public before judging).
- [ ] **Docs in repo:** `SUBMISSION.md`, `DEMO.md`, `docs/demo-runbook.md`, this script.
- [ ] **Submission form** filled: project name, track (DeFi & Payments), repo URL, video URL,
      website (https://tek247.vercel.app), package id + network (testnet), logo (1:1), team + KYC.
- [ ] **Sui integration explained** (use the "How TEK247 uses the Sui stack" section verbatim).
- [ ] **Product value explained** (use the Problem + kicker lines).
- [ ] Avoid the listed mistakes: complete the demo end-to-end, repo **public**, links work.
