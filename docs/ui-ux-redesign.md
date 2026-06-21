# TEK247 — UI/UX Redesign & Product Critique

**Reviewer:** Senior Product Designer (fintech / Web3)
**Product:** TEK247 — trustless on-chain escrow + verifiable device passport for real-world laptop repair & resale, built on **Sui**.
**Scope reviewed:** Real source — `src/features/landing/Hero.tsx`, `src/features/authentication/AuthLogin.tsx`, `src/features/dashboard/escrow/RepairEscrowPanel.tsx`, `src/features/dashboard/passport/DevicePassportPanel.tsx`, `src/features/dashboard/shared/components/SideBar.tsx`, `tailwind.config.js`, `index.html`.
**Live build:** https://tek247.vercel.app

> **Bluntly:** the engineering (Move escrow, zkLogin, Walrus passport) is genuinely strong and ahead of most hackathon entries. The **design is the weakest link** and is actively hiding the product's value. The UI is a repurposed e‑commerce/logistics template (every color token is named `lorry*`; the page title is still `Ecom Dashboard`), and the on‑chain features — the entire reason this project exists — are buried inside a repair detail page with a dense, developer‑facing UI. This document is deliberately critical because the gap between what you built and how it presents is large and very fixable.

---

## 0. The single most important finding

**Your landing page sells a different product than the one you built.**

- `Hero.tsx` headline: *"Buy. Repair. Manage your tech."* · eyebrow *"Nigeria's trusted tech store."*
- Your actual differentiator (from `SUBMISSION.md` / `DEMO.md`): *trustless USDC escrow you fund with just a Google login, milestone‑released, with a tamper‑proof on‑chain repair history that kills counterfeit‑spec and stolen‑device fraud.*

A visitor never learns the thing that makes you special. The word "escrow," "trustless," "verifiable," or "no wallet" appears **nowhere** above the fold. This is the highest‑leverage fix in the entire product: every conversion and judging‑score problem downstream starts here.

**Everything below supports turning that real differentiator into the spine of the experience.**

---

## 1. UX Audit Report

### 1.1 User flow
| Issue | Why it's a problem | User impact | Recommendation |
|---|---|---|---|
| **Two different auth mechanisms.** `AuthLogin.tsx` uses Enoki `useEnokiFlow` → a clean "Continue with Google". But `RepairEscrowPanel.tsx` uses dapp‑kit `<ConnectButton connectText="Continue with Google" />`, which opens a **wallet‑selection modal**. | The product promises "no wallet, no seed phrase," then shows a wallet modal at the moment of payment. It also means the user authenticates **twice**. | Confusion and drop‑off at the highest‑intent moment (payment). Breaks the core trust promise. | Use the **same Enoki zkLogin session** everywhere. The user is already signed in from `AuthLogin`; the escrow panel should reuse that account, not re‑prompt. Remove `ConnectButton` from the pay flow. |
| **No "first value" path.** After login you land on a generic Overview. The on‑chain escrow/passport live inside `…/repairs/:id` and are never surfaced. | New users don't reach the magic moment (fund an escrow / see a verifiable passport). | Low activation; judges have to be *told* where to click. | Add a guided first‑run: "Fund your first protected payment" or "Verify a device" as a primary dashboard action. |
| **Dispute resolution is developer‑facing.** The arbiter UI input is literally `Customer share (bps, 0–10000)`. | Basis points are meaningless to a shop owner or customer. | The neutral‑arbiter story (a key trust pillar) is unusable by a real human. | Replace with a **percentage slider** (0–100%) + a plain‑English preview: "Customer gets $6.00, shop gets $4.00." Convert to bps under the hood. |

### 1.2 Navigation & Information Architecture
- **`SideBar.tsx` is a flat list of 10 items** (Overview, Laptops, Accessories, System Requests, Orders, Repairs, Deliveries, Notifications, Users, Profile) with no grouping.
- **The on‑chain features have zero top‑level presence.** Escrow, Device Passport, and Balance are not in the nav at all — yet they are the product. This is an IA failure: *navigation should reflect what the product is for.*
- Admin and customer share one nav with `adminOnly` flags rather than role‑shaped experiences.

**Recommended IA (grouped, role‑aware):**
```
CUSTOMER                         ADMIN / SHOP
─ Home (activity + next action)  ─ Home (ops overview)
─ Shop        Laptops            ─ Repairs (queue)
              Accessories        ─ Escrows (money in flight)
─ My Repairs                     ─ Passports (issue / verify)
─ Payments    Escrows ★          ─ Inventory  Laptops / Accessories
              Wallet & USDC      ─ Orders & Deliveries
─ Device Passports ★             ─ Customers (Users)
─ Notifications  Profile         ─ Finance
```
★ = the differentiators, now first‑class.

### 1.3 Onboarding friction
- `register.tsx` and `login.tsx` are separate, but with zkLogin there is **no meaningful difference** — Google handles identity. Collapse to **one** "Continue with Google" entry; drop the register/login split entirely.
- The login `Terms of Service` / `Privacy Policy` links are `href="#"` (dead). For a *trust* product this is a credibility own‑goal — wire them up.

### 1.4 Visual hierarchy & cognitive load
- The escrow & passport panels lean on `text-xs` and even `text-[10px]` with low‑contrast grey (`inputGrey #667085`). Dense, hard to scan, and below accessibility thresholds (see §1.5).
- Status is shown two different ways: a `StatusPill` for escrow state, but milestone state is **plain text** ("Pending / Submitted / Released"). Inconsistent; the most important progression (milestones) has the weakest visual treatment.
- Hashes/blob‑ids/object‑ids are shown raw (`sha256:…`, Sui addresses). Good for verifiability, bad as default density. Hide behind a "Proof / verify" disclosure.

### 1.5 Accessibility
| Problem | Fix |
|---|---|
| Body/grey text at `text-xs`/`#667085` on white ≈ 4.0:1 and below for small text → **fails WCAG AA**. | Minimum 14px body, darken secondary text to `#475467`+ (≥4.5:1). |
| Touch targets like `px-2.5 py-1 text-xs` ("Mark done", "Approve & release") are ~24–28px tall → **below the 44×44px** guideline. | Min height 44px on all interactive controls, especially mobile. |
| Status communicated via color pills — text labels exist (good) but pill contrast varies. | Standardize semantic tokens (§7) with verified contrast. |
| Dead `#` links; some icon buttons lack labels. | Real hrefs; `aria-label` on every icon‑only control (the sidebar close button does this correctly — replicate it). |

### 1.6 Web3 onboarding friction
- **Strength:** `AuthLogin` zkLogin via Enoki is genuinely good — a single Google button. Keep this pattern and make it the *only* auth surface.
- **Problem:** the payment moment reintroduces wallet language. Sponsored‑gas ("free, no gas") is mentioned in copy once but not reinforced at signing.
- **Problem:** no human‑readable transaction confirmation. Users get a `toast.promise` ("Funding escrow on‑chain…") but no plain summary of *what they're agreeing to* before it fires.

---

## 2. UI Audit Report

### 2.1 The core problem: this is a borrowed design system
`tailwind.config.js` defines **60+ ad‑hoc colors**, all prefixed `lorry…` (`lorryBlue`, `lorryRed`, `lorryBlackBg`, `lorryReportHoverGrey`…). This is a logistics template skinned into a tech store. Symptoms:
- No semantic roles (primary/success/warning/danger with shades) — just named one‑offs.
- Two unrelated accent colors appear by feature (blue escrow, purple passport) with no rationale.
- `index.html` `<title>Ecom Dashboard</title>` and template favicons confirm the inheritance.

A trust/fintech product must look **intentional**. Borrowed tokens read as "unfinished," which is fatal for a product whose entire pitch is *trust*.

### 2.2 Component-level findings
| Element | Current | Issue | Redesign |
|---|---|---|---|
| **Buttons** | `bg-lorryBlue`, `rounded-lg`, mixes `rounded-full` (Hero) vs `rounded-lg` (app) | Inconsistent radius/sizing; tiny variants fail touch targets | One button system: 3 sizes (sm/md/lg), 4 intents (primary/secondary/ghost/danger), consistent `rounded-xl`, min‑44px |
| **Forms** | `border-inputBorderGrey`, `focus:ring-lorryBlue` | OK baseline, but labels are `text-xs` grey; the bps/address inputs are raw | 14px labels, helper text, inline validation, masked/explained inputs for addresses & shares |
| **Cards/Panels** | escrow = blue tinted, passport = purple tinted, hand‑rolled per feature | No shared `Card` primitive; spacing improvised | One `Card` (surface, border `#EAECF0`, radius `16px`, padding `20–24`, optional header/footer) |
| **Tables/lists** | milestone & passport rows are bespoke fl/grids | Inconsistent density, weak status visualization | Shared list‑row + a **milestone stepper** component |
| **Status** | `StatusPill` (escrow) vs plain text (milestones) | Inconsistent | One `<StatusBadge>` + a horizontal **3‑step milestone progress** |

### 2.3 Modernity / trust / professionalism verdict
- **Modern:** 5/10 — clean Tailwind defaults, but generic and dense.
- **Trustworthy:** 4/10 — dead legal links, dev‑grade jargon (bps, raw hashes), borrowed branding undercut a *trust* product.
- **Professional:** 5/10 — competent but clearly a template.
- **Brand consistency:** 3/10 — `lorry*` tokens, "Ecom Dashboard" title, two accent colors, mismatched landing message.

---

## 3. Redesigned User Flows

### 3.1 Customer journey (the money path)
```
Landing (leads with the escrow/no-fraud promise)
  → "Continue with Google" (Enoki zkLogin, one tap, no wallet)
  → First-run: "Pay for a repair, protected" (the activation moment)
  → Escrow created → milestone stepper (Diagnosis ▸ Repair ▸ Delivery)
  → Notified when shop marks a stage done → "Review & release" (1 tap)
  → Repair complete → Device Passport issued → shareable verify link
  → Retention loop: passport travels on resale → buyer verifies → new customer
```
| Step | User goal | Friction now | Improvement |
|---|---|---|---|
| Landing | "Can I trust this?" | Value prop absent | Hero = the trust promise + a 20‑sec explainer of milestone release |
| Sign up | Get in fast | Register/login split | One Google button, no forms |
| First value | Protect a payment | Buried in repair detail; wallet modal | Dashboard primary CTA → guided escrow with sponsored‑gas reassurance |
| Daily use | Track money & repairs | Flat nav, dense panels | Status‑first cards: "what needs your action" |
| Retention | Prove device history | Passport hidden in admin form | Public, shareable passport page with a QR/verify link |

### 3.2 Shop/Admin journey
`Repairs queue → open repair → mark milestone done → (if disputed) resolve via % slider → on completion, issue passport (auto‑prefilled from repair) → share verify link with buyer.`

---

## 4. Information Architecture (target)

```
Public
 ├─ / (landing: escrow promise, how-it-works, verify-a-device entry)
 ├─ /verify/:passportId   ← NEW public page: anyone verifies a device history
 └─ /login (single Google button)

App (role-aware shell)
 ├─ Home            (action-first: "needs your approval", "in escrow", recent)
 ├─ Shop            Laptops · Accessories
 ├─ Repairs         list → detail (Escrow + Passport live here, redesigned)
 ├─ Payments        Escrows · Wallet (USDC balance, sponsored-gas explainer)
 ├─ Passports       my devices / (admin) issue & verify
 ├─ Orders & Deliveries
 ├─ Notifications
 └─ Profile / Account (linked Google, Sui address shown as "Account ID")
Admin-only: Customers, Finance, Inventory
```

Key IA moves: **promote Escrows + Passports to top level**, add a **public `/verify/:id`** page (the resale story only matters if a stranger can open it), and reframe "Sui address" as "Account ID."

---

## 5. Dashboard Wireframes (descriptions)

### 5.1 Home (customer) — action-first, progressive disclosure
```
┌───────────────────────────────────────────────────────────────┐
│  Hi Tunde 👋            [ Pay for a repair, protected ▸ ]       │  ← primary CTA
├───────────────────────────────────────────────────────────────┤
│  NEEDS YOUR ACTION (1)                                         │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ MacBook Air — "Repair" stage submitted                  │  │
│  │ Shop marked Repair done · $5.00 will release            │  │
│  │ [ Review & release ]   [ Raise issue ]                  │  │  ← 44px, plain English
│  └─────────────────────────────────────────────────────────┘  │
├───────────────────────────────────────────────────────────────┤
│  IN ESCROW          DEVICE PASSPORTS        WALLET            │
│  $24.00 protected   2 verified devices      $30.00 USDC       │  ← 3 stat cards
│  across 3 repairs   [ View ]                Gas: sponsored     │
└───────────────────────────────────────────────────────────────┘
```
Principles: one primary action; "what needs me" before "what happened"; on‑chain proof available but not in your face.

### 5.2 Repair detail — Escrow as a milestone stepper (replaces the dense panel)
```
On-chain Escrow · USDC · Sui testnet                    [● Active]
$10.00 protected   •   $2.00 released   •   gas sponsored (free)

Diagnosis ──●──── Repair ──○──── Delivery
 $2.00 ✓ released   $5.00 ready to release   $3.00 pending

  Repair — shop marked done
  [ Review & release $5.00 ]            ← single primary action
  ▾ Proof & details (object id, tx, hashes)   ← collapsed by default
```
- Horizontal **3‑step progress** instead of stacked rows.
- One contextual primary action per state (fund / release / resolve).
- All chain artifacts collapse under "Proof & details."

### 5.3 Device Passport — verifiable, shareable
```
Device Passport                              [ Share / Verify ▸ QR ]
MacBook Air M1 · SN ••••3F7              ✔ 3 verified repair records

● Jun 2026  Screen + battery replacement   [report ↗]  ✔ integrity ok
● Mar 2026  SSD upgrade 256→512GB          [report ↗]  ✔ integrity ok
● Jan 2026  Diagnostics                     [report ↗]  ✔ integrity ok

This history is anchored on Sui and cannot be edited.   [ View on explorer ↗ ]
```
- Replace raw `sha256:abc…` with a friendly **"✔ integrity verified"** badge; expose the hash on hover/expand.
- Admin "add record" form: replace "Owner Sui address" free‑text with the customer picker / linked account; prefill brand/model/serial from the repair.

---

## 6. Mobile Wireframes & UX

- **Nav:** keep the slide‑over `SideBar` (it's already responsive), but add a **bottom tab bar** for the 4 core customer destinations (Home · Repairs · Passports · Wallet) — thumb‑reachable, fintech‑standard (Revolut/Cash App).
- **Touch targets:** raise every action button to **min 44px**; the current `text-xs` milestone buttons are too small to tap reliably.
- **Escrow on mobile:** the `grid-cols-2` stat block + tiny text is cramped — switch to a single‑column stepper; numbers at 16–18px.
- **Forms:** `inputmode="decimal"` for USDC amount; native pickers; sticky primary CTA at the bottom of the viewport during fund/release.
- **Passport share:** native share sheet + QR so a resale buyer can scan in person.

---

## 7. Design System

> Replace the entire `lorry*` palette with semantic tokens. Keep your blue as the brand primary (it's fine), but give it a real scale and remove the one‑off names.

### 7.1 Color palette (semantic, with shades)
```js
// tailwind.config.js → theme.extend.colors
colors: {
  brand: {  // primary — your existing #2044FF, scaled
    50:'#EEF2FF',100:'#E0E7FF',200:'#C7D2FE',300:'#A5B4FC',
    400:'#6680FF',500:'#2044FF',600:'#1B3AE0',700:'#132999',800:'#0F2178',900:'#0B1957'
  },
  gray: { // neutrals (text/surfaces/borders)
    50:'#F9FAFB',100:'#F2F4F7',200:'#EAECF0',300:'#D0D5DD',400:'#98A2B3',
    500:'#667085',600:'#475467',700:'#344054',800:'#1D2939',900:'#101828'
  },
  success:{50:'#ECFDF3',500:'#12B76A',700:'#027A48'},
  warning:{50:'#FFFAEB',500:'#F79009',700:'#B54708'},
  danger: {50:'#FEF3F2',500:'#F04438',700:'#B42318'},
  // semantic aliases
  surface:'#FFFFFF', canvas:'#F9FAFB', border:'#EAECF0',
  'text-strong':'#101828','text':'#344054','text-muted':'#667085',
}
```
Rules: secondary text never lighter than `gray-600` on white; success/danger only from these tokens; **one** accent (brand) — drop the ad‑hoc purple, use `brand` for passport too (or define a deliberate secondary if you truly want two).

### 7.2 Typography scale
Add a real type system (use **Inter** — it's the fintech default and free):
```
Display  36/44  700   (landing headline tier)
H1       28/36  700
H2       22/30  600
H3       18/26  600
Body L   16/24  400   ← default body (NOT 12px)
Body     14/20  400   ← dense tables only
Caption  12/18  500   ← labels/badges only, never paragraphs
Mono     13/20  — for hashes/ids (JetBrains Mono)
```

### 7.3 Spacing & grid
- 4px base scale: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 48 · 64`.
- Card padding `20–24`; section gap `24–32`.
- Content max‑width `1200px`; 12‑col grid on desktop, single column < 640px.
- Radius scale: `sm 8 · md 12 · lg 16 · pill 9999`. Pick **one** for buttons (recommend `lg/12`) and stop mixing `rounded-full` and `rounded-lg`.

### 7.4 Component specs
- **Button:** `h-11` (md) / `h-9` (sm) / `h-12` (lg); `rounded-xl`; primary `bg-brand-500 hover:bg-brand-600 text-white`; secondary `border-gray-300 text-text`; ghost; danger `bg-danger-500`. Loading spinner inline. Disabled `opacity-50`.
- **Input:** `h-11`, `border-gray-300`, `focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500`, label `14/20 text-text`, helper/error row.
- **Card:** `bg-surface border border-border rounded-2xl p-5/6`, optional header (`H3` + actions) and footer.
- **StatusBadge:** `success|warning|danger|info|neutral` → token bg/fg; `Caption` weight 500; used **everywhere** status appears.
- **MilestoneStepper:** horizontal steps with states `released | ready | pending`, amount under each, single primary action.
- **StatBlock:** label (`Caption muted`) + value (`H2`) + sublabel; used on Home.
- **ProofDisclosure:** collapsible row revealing object id / tx / hash with copy + explorer links (replaces always‑on raw hashes).

---

## 8. Conversion Optimization Report

| Lever | Current gap | Specific change | Expected effect |
|---|---|---|---|
| **Activation** | No first‑value path post‑login | Dashboard primary CTA "Pay for a repair, protected" → guided escrow | More users reach the on‑chain magic moment |
| **Landing → signup** | Value prop missing | Hero rewritten around trustless escrow + "no wallet" (see §10) | Higher signup intent; better judge comprehension |
| **Payment completion** | Wallet modal + jargon at the critical step | Reuse zkLogin session; show "Free · gas sponsored" and a plain‑English confirm before signing | Fewer drop‑offs at payment |
| **Trust** | Dead legal links, raw hashes, borrowed brand | Real ToS/Privacy, "✔ integrity verified" badges, intentional brand | Higher perceived legitimacy |
| **Retention / virality** | Passport is internal only | Public `/verify/:id` + QR/share → every resale is an acquisition surface | Built‑in growth loop |
| **Feature adoption** | Escrow/Passport hidden in nav | Promote to top‑level; Home stat cards link in | More usage of differentiators |

**Micro‑copy wins:** "Continue with Google" ✔ keep · "Pay into escrow" → "Pay — protected until work is approved" · "bps" → "% to customer" · "Store on Walrus + anchor on Sui" → "Save verifiable repair record."

---

## 9. Competitor Benchmarking

| Pattern to adopt | From | Apply to TEK247 |
|---|---|---|
| One‑line value prop + product visual above the fold | **Stripe** | Landing hero shows the milestone stepper in action |
| Hide crypto; show money | **Coinbase / Cash App** | "Account ID" not "Sui address"; "$10 protected" not object ids |
| Action‑first dashboard ("what needs you") | **Linear / Ramp** | Home = "Needs your action" feed before history |
| Calm, semantic, restrained palette + Inter | **Linear / Notion** | Replace `lorry*` tokens with §7 system |
| Spend/flow clarity, status badges, approvals | **Brex / Ramp** | Escrow as approval flow with badges + stepper |
| Trust signals (security, audit, verifiable) made visible | **Coinbase** | "Anchored on Sui · cannot be edited" + integrity badges |
| Bottom tab nav, native share, big touch targets | **Revolut / Cash App** | Mobile shell (§6) |

---

## 10. Final UI/UX Improvement Roadmap

### Phase 0 — Credibility quick wins (hours, do before judging)
1. `index.html`: title → **"TEK247 — Trustless repairs & verifiable devices on Sui"**; replace template favicons.
2. Rewrite `Hero.tsx`:
   - Eyebrow: *"On‑chain escrow for real‑world repairs"*
   - H1: **"Pay for repairs without the risk."**
   - Sub: *"Fund a repair with just your Google account. Money releases only as work is approved — and every fix is recorded as a verifiable device history that survives resale. No wallet. No seed phrase. No gas."*
   - CTAs: **"Continue with Google"** + **"Verify a device"**.
3. Wire real **Terms / Privacy** links (kill the `#`s).
4. Fix milestone & action buttons to **min 44px**; bump body text from `text-xs` to `text-sm/base`.

### Phase 1 — Trust & clarity (this week)
5. Unify auth: remove dapp‑kit `ConnectButton` from `RepairEscrowPanel`; reuse the Enoki zkLogin session. One login, everywhere.
6. Replace bps dispute input with a **% slider** + plain‑English payout preview.
7. Add **"Free · gas sponsored"** reassurance + a plain‑language confirm before any signature.
8. Collapse raw hashes/ids into a **"Proof & details"** disclosure; add **"✔ integrity verified"** badges.

### Phase 2 — Design system (1–2 weeks)
9. Replace the `lorry*` palette with the semantic tokens (§7.1); adopt Inter + the type scale (§7.2).
10. Build the shared component library: `Button`, `Input`, `Card`, `StatusBadge`, `MilestoneStepper`, `StatBlock`, `ProofDisclosure`.
11. Refactor escrow & passport panels onto the new components (stepper + shareable passport).

### Phase 3 — IA, activation & growth (2–4 weeks)
12. Restructure nav into role‑aware groups; **promote Escrows + Passports** to top level.
13. Build **action‑first Home** ("Needs your action" + stat cards).
14. Ship the **public `/verify/:id`** passport page with QR/native share (the resale growth loop).
15. Mobile shell: bottom tab bar, sticky CTAs, native share.

### Phase 4 — Polish
16. Empty/loading/error states for every panel; skeleton loaders (you already depend on `react-loading-skeleton`).
17. Onboarding checklist ("Protect a payment", "Verify a device").
18. Accessibility pass: contrast, focus rings, `aria-label`s, keyboard nav.

---

### Scorecard (today → target)
| Dimension | Now | After roadmap |
|---|---|---|
| Simple | 4 | 9 |
| Intuitive | 4 | 9 |
| Modern | 5 | 9 |
| Conversion‑focused | 3 | 8 |
| Mobile‑first | 5 | 8 |
| Accessible | 4 | 8 |
| Trustworthy | 4 | 9 |
| Fast to use | 5 | 9 |

**Bottom line:** you don't have a technology problem — you have a *presentation* problem. Lead with the trust promise, hide the blockchain, unify the login, and replace the borrowed template with one intentional design system. Do Phase 0 before judging; it alone will materially change first impressions.
```
