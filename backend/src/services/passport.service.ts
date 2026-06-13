import { Transaction } from "@mysten/sui/transactions";
import { suiClient, platformSigner } from "./sui.client";
import { env } from "../config/env";

const MODULE = "device_passport";
const CLOCK_ID = "0x6";

// Public Walrus testnet endpoints (HTTP API — no CLI/SDK needed).
const WALRUS_AGGREGATOR =
  process.env.WALRUS_AGGREGATOR ?? "https://aggregator.walrus-testnet.walrus.space";

export interface PassportRecord {
  shop: string;
  summary: string;
  walrusBlobId: string;
  contentHash: string; // hex
  timestampMs: number;
  blobUrl: string;
}

export interface PassportState {
  objectId: string;
  serialHash: string; // hex
  brand: string;
  model: string;
  issuedBy: string;
  records: PassportRecord[];
}

function hexToBytes(hex: string): number[] {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const out: number[] = [];
  for (let i = 0; i < clean.length; i += 2) out.push(parseInt(clean.slice(i, i + 2), 16));
  return out;
}

function bytesToHex(bytes: number[] | Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function execAndGetObjectChanges(tx: Transaction) {
  const { digest } = await suiClient.signAndExecuteTransaction({
    signer: platformSigner(),
    transaction: tx,
    options: { showEffects: true },
  });
  const res = await suiClient.waitForTransaction({
    digest,
    options: { showObjectChanges: true, showEffects: true },
  });
  if (res.effects?.status.status !== "success") {
    throw new Error(res.effects?.status.error ?? "Transaction failed on-chain");
  }
  return { digest, objectChanges: res.objectChanges ?? [] };
}

/** Issue a new device passport to `owner`. Returns the new passport object id. */
export async function issuePassport(params: {
  serialHashHex: string;
  brand: string;
  model: string;
  owner: string;
}): Promise<{ passportId: string; digest: string }> {
  const tx = new Transaction();
  tx.moveCall({
    target: `${env.SUI_PACKAGE_ID}::${MODULE}::issue`,
    arguments: [
      tx.object(env.SUI_ISSUER_CAP_ID),
      tx.pure.vector("u8", hexToBytes(params.serialHashHex)),
      tx.pure.string(params.brand),
      tx.pure.string(params.model),
      tx.pure.address(params.owner),
    ],
  });

  const { digest, objectChanges } = await execAndGetObjectChanges(tx);
  const created = objectChanges.find(
    (c): c is { type: "created"; objectId: string; objectType: string } =>
      typeof c === "object" && c !== null &&
      (c as { type?: string }).type === "created" &&
      String((c as { objectType?: string }).objectType ?? "").includes(`${MODULE}::DevicePassport`)
  );
  if (!created) throw new Error("Passport object not found in transaction result");
  return { passportId: created.objectId, digest };
}

/** Append a verified, Walrus-backed repair record to a passport. */
export async function addRepairRecord(params: {
  passportId: string;
  summary: string;
  walrusBlobId: string;
  contentHashHex: string;
}): Promise<{ digest: string }> {
  const tx = new Transaction();
  tx.moveCall({
    target: `${env.SUI_PACKAGE_ID}::${MODULE}::add_repair_record`,
    arguments: [
      tx.object(env.SUI_ISSUER_CAP_ID),
      tx.object(params.passportId),
      tx.pure.string(params.summary),
      tx.pure.string(params.walrusBlobId),
      tx.pure.vector("u8", hexToBytes(params.contentHashHex)),
      tx.object(CLOCK_ID),
    ],
  });
  const { digest } = await execAndGetObjectChanges(tx);
  return { digest };
}

/** Read a passport and its append-only record history from chain. */
export async function getPassport(objectId: string): Promise<PassportState | null> {
  const res = await suiClient.getObject({ id: objectId, options: { showContent: true } });
  const content = res.data?.content;
  if (!content || content.dataType !== "moveObject") return null;
  const f = content.fields as Record<string, unknown>;

  const rawRecords = (f.records as { fields: Record<string, unknown> }[]) ?? [];
  const records: PassportRecord[] = rawRecords.map((r) => {
    const rf = r.fields;
    const blobId = String(rf.walrus_blob_id ?? "");
    const contentHash = bytesToHex((rf.content_hash as number[]) ?? []);
    return {
      shop: String(rf.shop ?? ""),
      summary: String(rf.summary ?? ""),
      walrusBlobId: blobId,
      contentHash,
      timestampMs: Number(rf.timestamp_ms ?? 0),
      blobUrl: `${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`,
    };
  });

  return {
    objectId,
    serialHash: bytesToHex((f.serial_hash as number[]) ?? []),
    brand: String(f.brand ?? ""),
    model: String(f.model ?? ""),
    issuedBy: String(f.issued_by ?? ""),
    records,
  };
}
