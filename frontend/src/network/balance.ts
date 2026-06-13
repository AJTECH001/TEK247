import API, { BaseResponse } from "./API";
import { Endpoints } from "./constant";

export interface BalanceData {
  balance: {
    totalBalance: string;
    symbol: string;
    decimals: number;
  };
  transactions: {
    digest: string;
    timestamp: string | null;
    type: "incoming" | "outgoing";
    status: string;
  }[];
}

export const getBalance = async (): Promise<BaseResponse<BalanceData>> => {
  return API.get<BalanceData>(Endpoints.BALANCE);
};
