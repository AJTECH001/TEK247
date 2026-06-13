import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { PassportsAPI, type PassportState } from "../../../network/passports";
import { storeBlob, sha256Hex, sha256HexOfString } from "../../../network/walrus";
import { SHOP_ADDRESS, explorerObject } from "../../../network/onchain";

interface Props {
  repairId: number;
  isAdmin: boolean;
  defaultBrand?: string | null;
  defaultModel?: string | null;
}

export default function DevicePassportPanel({ repairId, isAdmin, defaultBrand, defaultModel }: Props) {
  const qc = useQueryClient();
  const [serial, setSerial] = useState("");
  const [brand, setBrand] = useState(defaultBrand ?? "");
  const [model, setModel] = useState(defaultModel ?? "");
  const [owner, setOwner] = useState(SHOP_ADDRESS);
  const [summary, setSummary] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const listQuery = useQuery({
    queryKey: ["PASSPORTS_BY_REPAIR", repairId],
    queryFn: () => PassportsAPI.listByRepair(repairId),
  });
  const passportId = useMemo(() => {
    const res = listQuery.data;
    if (!res || "error" in res) return null;
    return res.data?.[0]?.passportObjectId ?? null;
  }, [listQuery.data]);

  const passportQuery = useQuery({
    queryKey: ["PASSPORT_LIVE", passportId],
    queryFn: () => PassportsAPI.getOne(passportId as string),
    enabled: !!passportId,
  });
  const passport: PassportState | null =
    passportQuery.data && !("error" in passportQuery.data) ? (passportQuery.data.data as PassportState) : null;

  async function handleAnchor() {
    if (!serial.trim()) { toast.error("Device serial is required"); return; }
    if (!summary.trim()) { toast.error("A short summary is required"); return; }
    if (!file) { toast.error("Attach the diagnostic report / photo"); return; }
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const [blobId, contentHash, serialHash] = await Promise.all([
        toast.promise(storeBlob(file), { loading: "Uploading report to Walrus…", success: "Stored on Walrus", error: (e) => e.message }),
        sha256Hex(buf),
        sha256HexOfString(serial.trim()),
      ]);
      const res = await toast.promise(
        PassportsAPI.record({
          serialHash, ownerAddress: owner.trim(), summary: summary.trim(),
          walrusBlobId: blobId, contentHash, brand: brand.trim() || undefined,
          model: model.trim() || undefined, repairRequestId: repairId,
        }),
        { loading: "Anchoring record on-chain…", success: "Repair record anchored on Sui 🎉", error: (e) => e.message }
      );
      if ("error" in res) return;
      setSummary(""); setFile(null);
      qc.invalidateQueries({ queryKey: ["PASSPORTS_BY_REPAIR", repairId] });
      qc.invalidateQueries({ queryKey: ["PASSPORT_LIVE", passportId] });
    } catch { /* toast already shown */ } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border border-purple-300/50 rounded-lg p-4 space-y-4 bg-purple-50/40">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-inputGrey uppercase tracking-wide flex items-center gap-2">
          Device Passport
          <span className="text-[10px] font-normal normal-case text-inputGrey">Sui + Walrus · verifiable history</span>
        </p>
        {passport && (
          <a href={explorerObject(passport.objectId)} target="_blank" rel="noreferrer" className="text-xs text-lorryBlue hover:underline">
            On explorer ↗
          </a>
        )}
      </div>

      {/* History (visible to everyone, incl. a future resale buyer) */}
      {passport && passport.records.length > 0 ? (
        <ol className="space-y-2">
          {passport.records.map((r, i) => (
            <li key={i} className="bg-white rounded-lg px-3 py-2 border border-inputBorderGrey text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-lorryDarkBlack">{r.summary}</span>
                <span className="text-xs text-inputGrey">{new Date(r.timestampMs).toLocaleDateString()}</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                <a href={r.blobUrl} target="_blank" rel="noreferrer" className="text-xs text-lorryBlue hover:underline">
                  View report ↗
                </a>
                <span className="text-[10px] text-inputGrey font-mono" title="SHA-256 content hash (integrity)">
                  sha256:{r.contentHash.slice(0, 12)}…
                </span>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-xs text-inputGrey italic">
          No verifiable repair records yet for this device.
        </p>
      )}

      {/* Admin: anchor a new record */}
      {isAdmin && (
        <div className="space-y-2 border-t border-purple-200 pt-3">
          <p className="text-xs font-medium text-lorryDarkBlack">Add a verifiable repair record</p>
          <div className="grid grid-cols-2 gap-2">
            <input value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="Device serial no."
              className="text-sm border border-inputBorderGrey rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lorryBlue" />
            <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Owner Sui address"
              className="text-sm border border-inputBorderGrey rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lorryBlue" />
            <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand"
              className="text-sm border border-inputBorderGrey rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lorryBlue" />
            <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Model"
              className="text-sm border border-inputBorderGrey rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lorryBlue" />
          </div>
          <input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Summary, e.g. Screen + battery replacement"
            className="w-full text-sm border border-inputBorderGrey rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lorryBlue" />
          <input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-xs text-inputGrey file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-lorryBlue file:text-white hover:file:bg-lorryBlue/90" />
          <button onClick={handleAnchor} disabled={busy}
            className="w-full py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50">
            {busy ? "Anchoring…" : "Store on Walrus + anchor on Sui"}
          </button>
        </div>
      )}
    </div>
  );
}
