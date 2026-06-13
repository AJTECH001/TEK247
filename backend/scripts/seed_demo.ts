/**
 * TEK247 — testnet demo seeder (repeatable).
 *
 * Produces real, explorer-inspectable on-chain artifacts for the demo:
 *   1. A Device Passport with a 3-stage Walrus-backed repair history.
 *   2. A completed milestone escrow (create -> submit -> approve x3).
 *   3. A disputed-and-resolved escrow (create -> dispute -> arbiter split).
 *
 * Escrows are denominated in SUI here (the contract is generic over Coin<T>);
 * the live app uses USDC via the customer's zkLogin account.
 *
 * Run:  SUI_PLATFORM_SECRET_KEY=suiprivkey... npx tsx scripts/seed_demo.ts
 */
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction, coinWithBalance } from "@mysten/sui/transactions";
import { createHash } from "crypto";

const NETWORK = process.env.SUI_NETWORK ?? "testnet";
const PKG = process.env.SUI_PACKAGE_ID ?? "0x64f7db7a66b5367947bd2a6b7e3751b0b6350dde7a12680903717a2052bff9e1";
const ISSUER_CAP = process.env.SUI_ISSUER_CAP_ID ?? "0xf735ea40ee482d48077150dbb3ec9cd59ca689ca576fd893eb1c994dd34e65a3";
const ARBITER_CAP = process.env.SUI_ARBITER_CAP_ID ?? "0xa259366ad69332c5e0cb763ccc85b99c09e43cde8f8e6a10f152a57e3d26ad4e";
const SUI_T = "0x2::sui::SUI";
const CLOCK = "0x6";
const PUBLISHER = process.env.WALRUS_PUBLISHER ?? "https://publisher.walrus-testnet.walrus.space";

const client = new SuiJsonRpcClient({ url: `https://fullnode.${NETWORK}.sui.io:443` });
const signer = Ed25519Keypair.fromSecretKey(process.env.SUI_PLATFORM_SECRET_KEY!);
const ME = signer.toSuiAddress();

const objLink = (id: string) => `https://suiscan.xyz/${NETWORK}/object/${id}`;
const txLink = (d: string) => `https://suiscan.xyz/${NETWORK}/tx/${d}`;

type Created = { type: "created"; objectId: string; objectType: string };

async function run(tx: Transaction, label: string) {
  const { digest } = await client.signAndExecuteTransaction({ signer, transaction: tx, options: { showEffects: true } });
  const res = await client.waitForTransaction({ digest, options: { showObjectChanges: true, showEffects: true } });
  if (res.effects?.status.status !== "success") throw new Error(`${label}: ${res.effects?.status.error}`);
  process.stdout.write(`  ✓ ${label}\n`);
  return res;
}
function created(res: Awaited<ReturnType<typeof run>>, typeIncludes: string): string {
  const c = (res.objectChanges ?? []).find(
    (x): x is Created => (x as Created).type === "created" && String((x as Created).objectType ?? "").includes(typeIncludes)
  );
  if (!c) throw new Error(`no created object matching ${typeIncludes}`);
  return c.objectId;
}
async function walrus(text: string): Promise<string> {
  const r = await fetch(`${PUBLISHER}/v1/blobs?epochs=5`, { method: "PUT", body: text });
  const j = (await r.json()) as { newlyCreated?: { blobObject?: { blobId?: string } }; alreadyCertified?: { blobId?: string } };
  const id = j.newlyCreated?.blobObject?.blobId ?? j.alreadyCertified?.blobId;
  if (!id) throw new Error("walrus: no blob id");
  return id;
}
const tx = () => new Transaction();
const sha = (s: string) => createHash("sha256").update(s).digest();

async function seedPassport() {
  console.log("\n📘 Device Passport");
  const serial = `DELL-LAT7420-${Date.now()}`;
  let res = await run(
    (() => {
      const t = tx();
      t.moveCall({
        target: `${PKG}::device_passport::issue`,
        arguments: [
          t.object(ISSUER_CAP),
          t.pure.vector("u8", Array.from(sha(serial))),
          t.pure.string("Dell"),
          t.pure.string("Latitude 7420"),
          t.pure.address(ME),
        ],
      });
      return t;
    })(),
    "issue passport"
  );
  const passportId = created(res, "device_passport::DevicePassport");

  const stages: [string, string][] = [
    ["Diagnosis", "Initial diagnostics: failed battery cell + cracked screen panel. Quote approved."],
    ["Screen + battery replacement", "Installed OEM screen assembly and battery. 2h stress test passed."],
    ["Final QA + handover", "Full QA: keyboard, ports, thermals nominal. Cleaned and handed over."],
  ];
  for (const [summary, body] of stages) {
    const report = `TEK247 — ${summary}\nDevice: Dell Latitude 7420 (${serial})\n${body}\n${new Date().toISOString()}`;
    const blobId = await walrus(report);
    const t = tx();
    t.moveCall({
      target: `${PKG}::device_passport::add_repair_record`,
      arguments: [
        t.object(ISSUER_CAP),
        t.object(passportId),
        t.pure.string(summary),
        t.pure.string(blobId),
        t.pure.vector("u8", Array.from(sha(report))),
        t.object(CLOCK),
      ],
    });
    await run(t, `record: ${summary}  (walrus ${blobId.slice(0, 8)}…)`);
  }
  return passportId;
}

async function seedCompletedEscrow() {
  console.log("\n💧 Completed milestone escrow (SUI)");
  const ms = [12_000_000, 30_000_000, 18_000_000]; // 0.06 SUI total
  const total = ms.reduce((a, b) => a + b, 0);
  const t = tx();
  t.moveCall({
    target: `${PKG}::repair_escrow::create_escrow`,
    typeArguments: [SUI_T],
    arguments: [
      coinWithBalance({ balance: total }),
      t.pure.address(ME),
      t.pure.u64(1001n),
      t.pure.vector("u64", ms.map((m) => BigInt(m))),
      t.pure.u64(BigInt(Date.now() + 72 * 3_600_000)),
    ],
  });
  const escrowId = created(await run(t, "create escrow A"), "repair_escrow::RepairEscrow");
  for (let i = 0; i < ms.length; i++) {
    const s = tx();
    s.moveCall({ target: `${PKG}::repair_escrow::submit_milestone`, typeArguments: [SUI_T], arguments: [s.object(escrowId), s.pure.u64(BigInt(i))] });
    await run(s, `submit milestone ${i}`);
    const a = tx();
    a.moveCall({ target: `${PKG}::repair_escrow::approve_milestone`, typeArguments: [SUI_T], arguments: [a.object(escrowId), a.pure.u64(BigInt(i))] });
    await run(a, `approve milestone ${i}`);
  }
  return escrowId;
}

async function seedDisputedEscrow() {
  console.log("\n⚖️  Disputed-and-resolved escrow (SUI)");
  const t = tx();
  t.moveCall({
    target: `${PKG}::repair_escrow::create_escrow`,
    typeArguments: [SUI_T],
    arguments: [
      coinWithBalance({ balance: 30_000_000 }),
      t.pure.address(ME),
      t.pure.u64(1002n),
      t.pure.vector("u64", [30_000_000n]),
      t.pure.u64(BigInt(Date.now() + 72 * 3_600_000)),
    ],
  });
  const escrowId = created(await run(t, "create escrow B"), "repair_escrow::RepairEscrow");
  const d = tx();
  d.moveCall({ target: `${PKG}::repair_escrow::raise_dispute`, typeArguments: [SUI_T], arguments: [d.object(escrowId)] });
  await run(d, "raise dispute");
  const r = tx();
  r.moveCall({
    target: `${PKG}::repair_escrow::resolve_dispute`,
    typeArguments: [SUI_T],
    arguments: [r.object(ARBITER_CAP), r.object(escrowId), r.pure.u64(5000n)],
  });
  await run(r, "arbiter resolves 50/50");
  return escrowId;
}

async function main() {
  console.log(`Seeding TEK247 demo on ${NETWORK} as ${ME}`);
  const passportId = await seedPassport();
  const escrowA = await seedCompletedEscrow();
  const escrowB = await seedDisputedEscrow();

  console.log("\n──────────── DEMO ARTIFACTS ────────────");
  console.log("Device Passport (3 records):", objLink(passportId));
  console.log("Completed escrow:           ", objLink(escrowA));
  console.log("Disputed→resolved escrow:   ", objLink(escrowB));
  console.log("Package:                    ", objLink(PKG));
  console.log("✅ seed complete");
}

main().catch((e) => { console.error("❌", e.message ?? e); process.exit(1); });
