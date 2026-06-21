# TEK247 — Sui Overflow 2026 Submission

**Primary track:** DeFi & Payments
**Status:** Deployed to Sui testnet · live business (ajtech.ng)

---

## Submission checklist

| Field | Value |
| --- | --- |
| Project Name | **TEK247** |
| Track | DeFi & Payments |
| Public GitHub repo | _<paste repo URL — make public before judging>_ |
| Demo video (≤5 min) | _<paste YouTube URL>_ |
| Website | https://ajtech.ng _(confirm/update)_ |
| Project logo (1:1) | _<attach JPG/PNG, 1:1>_ |
| Deployment | Sui **testnet** |
| Package ID | `0x64f7db7a66b5367947bd2a6b7e3751b0b6350dde7a12680903717a2052bff9e1` |
| Network | testnet |

---

## One-line pitch
Trustless, zero-wallet payments and verifiable device history for real-world laptop
repair and resale — bringing an emerging-market commerce business on-chain.

## Short description (for the submission form)
TEK247 turns laptop repair and resale into a trustless on-chain experience. Customers
pay into a **milestone escrow in USDC using just a Google login** (zkLogin, gas
sponsored — no wallet, no seed phrase). Funds release stage-by-stage only on the
customer's approval, with deadline and dispute protections for both sides. Every
completed repair is recorded as a **verifiable Device Passport on Sui**, with the full
diagnostic report and photos stored on **Walrus** and anchored on-chain by content
hash. The passport travels with the device on resale, so any future buyer can verify
its real repair history — directly attacking the counterfeit-spec and stolen-device
fraud that plagues second-hand markets. It's built on top of a real, operating repair
business (ajtech.ng), not a concept.

## Why it matters (real-world application)
In emerging markets, buying or repairing a used laptop is a trust minefield: fake
specs, stolen units, and "I paid but it was never fixed." Cash-based informal commerce
has no recourse. TEK247 replaces that with:
- **Escrow that actually protects both parties** — the shop can't take the money early,
  the customer can't grief the shop, and a neutral arbiter can only act on a *disputed*
  deal.
- **Onboarding that normal people can use** — Google login, no crypto knowledge, no gas.
- **A device's verifiable life story** — tamper-evident, resale-surviving repair history.

## What we built during the hackathon (eligibility disclosure)
The **TEK247/ajtech repair-business web app is pre-existing** (Web2 marketplace, repairs,
orders, deliveries, admin). Built **new during Overflow 2026 (May 7 – Jun 21)** and
submitted as the substantial new functionality:
- Two Move modules — `repair_escrow` (trustless milestone escrow, generic over `Coin<T>`)
  and `device_passport` (append-only, Walrus-backed history) — deployed to testnet.
- zkLogin + Enoki gas-sponsored payment flow (no wallet).
- Walrus storage integration for verifiable repair reports.
- Backend as an on-chain event indexer + arbiter/issuer signer (no longer a custodian).
- Full escrow + passport UI inside the repair flow.

We reused our existing frontend framework, UI, and Web2 backend scaffolding; all
blockchain functionality above is new.

## How Sui is used (meaningful integration)
- **Move smart contracts** as the settlement + trust layer (shared escrow objects,
  capability-gated arbiter/issuer, events for indexing).
- **zkLogin** for walletless onboarding; **Enoki** for sponsored gas.
- **Stablecoin (USDC) settlement** via `Coin<T>`-generic escrow.
- **Walrus** as the verifiable data layer for repair artifacts; blob id + SHA-256 hash
  anchored on the Sui passport object.
- Sui objects model the device passport as a transferable, history-bearing asset.

## Architecture
```
Customer (Google / zkLogin)                Shop / Admin (platform key)
        │ pay USDC (gas sponsored)                 │ submit milestone / issue passport
        ▼                                          ▼
   ┌──────────────────────── Sui Move package ─────────────────────────┐
   │  repair_escrow: milestone escrow, deadlines, dispute → arbiter     │
   │  device_passport: append-only repair history (Walrus blob + hash)  │
   └───────────────┬───────────────────────────────┬───────────────────┘
                   │ events                         │ blob id + hash
                   ▼                                ▼
        Backend indexer/signer (Express/TS)     Walrus (reports, photos)
                   │ mirror (read cache)
                   ▼
              Postgres + React dashboard
```

## Live, verifiable on-chain artifacts (testnet)
- Device Passport (3 Walrus-backed records):
  `0x55a56f38f497824b0780d55cdb8050327c886384b164680d2a377275c18f3f77`
- Completed milestone escrow:
  `0xc417664c92f6ae8e47fd4cbec4857e983f2f4cfc85e80cd9b779acda992d95cf`
- Disputed → arbiter-resolved escrow:
  `0x72f25de29c71d06d3ff412f5b68caf4a91019a20c67ce93906f4e00fa3a85cad`

## Vision & roadmap
- **Mainnet** launch with USDC settlement (unlocks the second half of the prize split).
- Expand the passport into a **resale marketplace** where verified history sets price.
- **On-chain reputation** for shops and customers, built from settled escrows.
- Partner with other repair shops → a shared, trusted device-history network.

## Business model
Take-rate on escrowed transactions; premium verified-resale listings; B2B passport
issuance for other repair shops. Real GMV today through the ajtech.ng operation.

## Team
- _<name(s), roles, GitHub handles>_
- KYC: _<which member will complete KYC>_ — at least one required to receive prizes.
- University award eligibility: _<update profiles if ≥50% students>_

---

### TODO before submitting (owner: you)
- [ ] Make the GitHub repo public.
- [ ] Record + upload demo video (≤5 min, YouTube). Use `DEMO.md` runbook.
- [ ] Add 1:1 logo (JPG/PNG).
- [ ] Configure Enoki portal so the live zero-wallet payment works on camera.
- [ ] Fill team details + confirm KYC member.
- [ ] (Optional, strong) Deploy to mainnet before Aug to unlock 100% upfront prize.
