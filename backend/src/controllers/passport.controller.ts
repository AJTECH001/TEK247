import { Request, Response } from "express";
import { DevicePassportModel } from "../models/device_passport.model";
import { issuePassport, addRepairRecord, getPassport } from "../services/passport.service";
import { sendSuccess, sendError } from "../utils/response";

export const PassportController = {
  /**
   * Attach a Walrus-backed repair record to a device's passport. Issues a fresh
   * passport for the device if one doesn't exist yet. Admin/shop only.
   * The heavy artifact already lives on Walrus (uploaded client-side); we record
   * only the blob id + content hash on-chain.
   */
  async record(req: Request, res: Response): Promise<void> {
    try {
      const {
        serialHash, brand, model, ownerAddress, summary, walrusBlobId, contentHash, repairRequestId,
      } = req.body as {
        serialHash?: string; brand?: string; model?: string; ownerAddress?: string;
        summary?: string; walrusBlobId?: string; contentHash?: string; repairRequestId?: number;
      };

      if (!serialHash || !ownerAddress || !summary || !walrusBlobId || !contentHash) {
        sendError(res, "serialHash, ownerAddress, summary, walrusBlobId and contentHash are required", 400);
        return;
      }

      // Find or issue the passport for this device.
      let passport = await DevicePassportModel.findBySerialHash(serialHash);
      let issueDigest: string | undefined;
      if (!passport) {
        const issued = await issuePassport({
          serialHashHex: serialHash,
          brand: brand ?? "",
          model: model ?? "",
          owner: ownerAddress,
        });
        issueDigest = issued.digest;
        passport = await DevicePassportModel.create({
          passportObjectId: issued.passportId,
          serialHash,
          brand,
          model,
          ownerAddress,
          repairRequestId: repairRequestId ?? null,
        });
      }

      const { digest } = await addRepairRecord({
        passportId: passport.passportObjectId,
        summary,
        walrusBlobId,
        contentHashHex: contentHash,
      });
      await DevicePassportModel.bumpRecordCount(passport.passportObjectId);

      sendSuccess(res, "Repair record anchored on-chain", {
        passportObjectId: passport.passportObjectId,
        issueDigest,
        recordDigest: digest,
      }, 201);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  /** Public verifiable read: passport + append-only records with Walrus URLs. */
  async getOne(req: Request, res: Response): Promise<void> {
    try {
      const state = await getPassport(req.params.objectId);
      if (!state) { sendError(res, "Passport not found", 404); return; }
      sendSuccess(res, "Passport", state);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },

  /** Passports linked to a repair (mirror lookup). */
  async listByRepair(req: Request, res: Response): Promise<void> {
    try {
      const rid = parseInt(req.params.repairId, 10);
      if (isNaN(rid)) { sendError(res, "Invalid repair ID", 400); return; }
      const passports = await DevicePassportModel.findByRepair(rid);
      sendSuccess(res, "Passports retrieved", passports);
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },
};
