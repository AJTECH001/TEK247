import { query } from "../config/database";

export interface DevicePassportRow {
  id: number;
  passport_object_id: string;
  serial_hash: string;
  brand: string | null;
  model: string | null;
  owner_address: string;
  repair_request_id: number | null;
  record_count: number;
  created_at: string;
  updated_at: string;
}

export interface SafeDevicePassport {
  id: number;
  passportObjectId: string;
  serialHash: string;
  brand: string | null;
  model: string | null;
  ownerAddress: string;
  repairRequestId: number | null;
  recordCount: number;
  createdAt: string;
}

function toSafe(r: DevicePassportRow): SafeDevicePassport {
  return {
    id: r.id,
    passportObjectId: r.passport_object_id,
    serialHash: r.serial_hash,
    brand: r.brand,
    model: r.model,
    ownerAddress: r.owner_address,
    repairRequestId: r.repair_request_id,
    recordCount: r.record_count,
    createdAt: r.created_at,
  };
}

export const DevicePassportModel = {
  async create(data: {
    passportObjectId: string;
    serialHash: string;
    brand?: string;
    model?: string;
    ownerAddress: string;
    repairRequestId?: number | null;
  }): Promise<SafeDevicePassport> {
    const rows = await query<DevicePassportRow>(
      `INSERT INTO device_passports
         (passport_object_id, serial_hash, brand, model, owner_address, repair_request_id, record_count)
       VALUES ($1,$2,$3,$4,$5,$6,0)
       RETURNING *`,
      [
        data.passportObjectId,
        data.serialHash,
        data.brand ?? null,
        data.model ?? null,
        data.ownerAddress,
        data.repairRequestId ?? null,
      ]
    );
    return toSafe(rows[0]);
  },

  async bumpRecordCount(passportObjectId: string): Promise<void> {
    await query(
      "UPDATE device_passports SET record_count = record_count + 1, updated_at = NOW() WHERE passport_object_id = $1",
      [passportObjectId]
    );
  },

  async findBySerialHash(serialHash: string): Promise<SafeDevicePassport | null> {
    const rows = await query<DevicePassportRow>(
      "SELECT * FROM device_passports WHERE serial_hash = $1 ORDER BY created_at DESC LIMIT 1",
      [serialHash]
    );
    return rows[0] ? toSafe(rows[0]) : null;
  },

  async findByObjectId(objectId: string): Promise<SafeDevicePassport | null> {
    const rows = await query<DevicePassportRow>(
      "SELECT * FROM device_passports WHERE passport_object_id = $1 LIMIT 1",
      [objectId]
    );
    return rows[0] ? toSafe(rows[0]) : null;
  },

  async findByRepair(repairRequestId: number): Promise<SafeDevicePassport[]> {
    const rows = await query<DevicePassportRow>(
      "SELECT * FROM device_passports WHERE repair_request_id = $1 ORDER BY created_at DESC",
      [repairRequestId]
    );
    return rows.map(toSafe);
  },
};
