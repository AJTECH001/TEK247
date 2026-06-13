# TEK247 — Demo Runbook (Sui Overflow 2026, DeFi & Payments)

> **One-liner:** TEK247 brings emerging-market device commerce on-chain — trustless
> USDC repair/resale escrow + zero-wallet Google onboarding + a verifiable Walrus
> device passport that kills counterfeit-spec and stolen-device fraud — running in a
> live laptop-repair business (ajtech.ng).

## The story arc (judge-facing)
1. **The problem (real-world, 50% of score).** In second-hand/repair markets, customers
   get scammed (fake specs, stolen units, "paid-but-never-fixed") and shops get stiffed.
   It's a trust problem, at scale, in an informal economy.
2. **Pay with Google, no wallet.** Customer funds a repair into an on-chain USDC escrow
   via zkLogin — no seed phrase, no gas (Enoki-sponsored).
3. **Funds release only as work is approved.** Milestones (Diagnosis / Repair / Delivery)
   release one at a time on the customer's approval. Neither side can grab the money;
   deadline + dispute protections back both parties.
4. **Verifiable device passport.** Each completed repair's report + photos go to Walrus;
   the blob id + a SHA-256 hash are anchored on the device's on-chain passport. History is
   append-only and survives resale → a buyer can verify the whole story.

## Seeded demo artifacts (live on testnet — already inspectable)
Regenerate anytime: `SUI_PLATFORM_SECRET_KEY=suiprivkey... npx tsx scripts/seed_demo.ts` (in `backend/`).

| Artifact | Object | Link |
| --- | --- | --- |
| Device Passport (3 Walrus-backed records) | `0x55a56f38f497824b0780d55cdb8050327c886384b164680d2a377275c18f3f77` | [explorer](https://suiscan.xyz/testnet/object/0x55a56f38f497824b0780d55cdb8050327c886384b164680d2a377275c18f3f77) |
| Completed milestone escrow | `0xc417664c92f6ae8e47fd4cbec4857e983f2f4cfc85e80cd9b779acda992d95cf` | [explorer](https://suiscan.xyz/testnet/object/0xc417664c92f6ae8e47fd4cbec4857e983f2f4cfc85e80cd9b779acda992d95cf) |
| Disputed → arbiter-resolved escrow | `0x72f25de29c71d06d3ff412f5b68caf4a91019a20c67ce93906f4e00fa3a85cad` | [explorer](https://suiscan.xyz/testnet/object/0x72f25de29c71d06d3ff412f5b68caf4a91019a20c67ce93906f4e00fa3a85cad) |
| Package | `0x64f7db7a66b5367947bd2a6b7e3751b0b6350dde7a12680903717a2052bff9e1` | [explorer](https://suiscan.xyz/testnet/object/0x64f7db7a66b5367947bd2a6b7e3751b0b6350dde7a12680903717a2052bff9e1) |

## Live click-path (≤5 min video)
**Pre-reqs:** Enoki portal configured (testnet sponsorship + allowlist the 5 escrow targets +
Google provider); customer zkLogin account holds a little testnet USDC; backend + frontend running.

1. **(0:00) Hook** — state the problem in one sentence over the live ajtech.ng dashboard.
2. **(0:30) Pay, no wallet** — open a repair → escrow panel → **Continue with Google** →
   enter amount → see the Diagnosis/Repair/Delivery split → **Pay into escrow**. Show the
   wallet never appeared and no gas was paid. Open the escrow on the explorer.
3. **(2:00) Work + release** — switch to the shop (admin): **Mark done** on a milestone →
   back to customer: **Approve & release**. Show the released amount tick up and the tx on
   the explorer.
4. **(3:00) Verifiable passport** — shop uploads the diagnostic report → "Store on Walrus +
   anchor on Sui" → record appears with **View report ↗** (Walrus URL) and the `sha256:` hash.
5. **(4:00) The payoff** — open the seeded passport on the explorer; show 3 records surviving
   resale, each linking to its Walrus blob. "A buyer can verify this device's whole life."
6. **(4:40) Vision** — split-payout model, mainnet, real GMV in a live business.

## Backup (no-portal) path
If Enoki sponsorship isn't ready at record time, demo the **seeded artifacts** on the explorer
(full escrow lifecycle + passport history are already on-chain) and run the escrow milestone
lifecycle from the seed script live. The product UI still shows the panels reading real chain state.

## Judging-criteria mapping
- **Real-world application (50%)** — live business, genuine trust problem, stablecoin settlement.
- **Product & UX (20%)** — Google login, no wallet/seed/gas; milestone clarity.
- **Technical (20%)** — Move escrow with real trust guarantees + Sui objects + Walrus + zkLogin.
- **Presentation & vision (10%)** — explorer-verifiable at every step; clear path to mainnet.
