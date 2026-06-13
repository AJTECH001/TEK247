// Walrus testnet HTTP API. The public publisher sponsors storage, so the browser
// can upload directly — no wallet, no SUI, no SDK.

const PUBLISHER =
  (import.meta.env.VITE_WALRUS_PUBLISHER as string) ?? "https://publisher.walrus-testnet.walrus.space";
const AGGREGATOR =
  (import.meta.env.VITE_WALRUS_AGGREGATOR as string) ?? "https://aggregator.walrus-testnet.walrus.space";

/** Upload bytes to Walrus and return the content-addressed blob id. */
export async function storeBlob(data: Blob | File | ArrayBuffer | string, epochs = 5): Promise<string> {
  const res = await fetch(`${PUBLISHER}/v1/blobs?epochs=${epochs}`, {
    method: "PUT",
    body: data as BodyInit,
  });
  if (!res.ok) throw new Error(`Walrus upload failed (${res.status})`);
  const j = (await res.json()) as {
    newlyCreated?: { blobObject?: { blobId?: string } };
    alreadyCertified?: { blobId?: string };
  };
  const id = j.newlyCreated?.blobObject?.blobId ?? j.alreadyCertified?.blobId;
  if (!id) throw new Error("Walrus did not return a blob id");
  return id;
}

export function blobUrl(blobId: string): string {
  return `${AGGREGATOR}/v1/blobs/${blobId}`;
}

export async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256HexOfString(s: string): Promise<string> {
  return sha256Hex(new TextEncoder().encode(s).buffer as ArrayBuffer);
}
