import API, { BaseResponse } from "./API";

export interface PassportRecord {
  shop: string;
  summary: string;
  walrusBlobId: string;
  contentHash: string;
  timestampMs: number;
  blobUrl: string;
}

export interface PassportState {
  objectId: string;
  serialHash: string;
  brand: string;
  model: string;
  issuedBy: string;
  records: PassportRecord[];
}

export interface MirroredPassport {
  passportObjectId: string;
  serialHash: string;
  brand: string | null;
  model: string | null;
  ownerAddress: string;
  repairRequestId: number | null;
  recordCount: number;
  createdAt: string;
}

export interface RecordBody {
  serialHash: string;
  ownerAddress: string;
  summary: string;
  walrusBlobId: string;
  contentHash: string;
  brand?: string;
  model?: string;
  repairRequestId?: number;
}

const P = "passports";

export const PassportsAPI = {
  record(body: RecordBody) {
    return API.post<RecordBody, { passportObjectId: string; recordDigest: string }>(`${P}/record`, body);
  },
  getOne(objectId: string): Promise<BaseResponse<PassportState>> {
    return API.get<PassportState>(`${P}/${objectId}`);
  },
  listByRepair(repairId: number): Promise<BaseResponse<MirroredPassport[]>> {
    return API.get<MirroredPassport[]>(`${P}/repair/${repairId}`);
  },
};
