import { Request, Response } from "express";
import { SuiService } from "../services/sui.service";
import { UserModel } from "../models/user.model";
import { sendSuccess, sendError } from "../utils/response";

export const BalanceController = {
  async getBalance(req: Request, res: Response): Promise<void> {
    try {
      const user = await UserModel.findById(req.user!.userId);
      if (!user || !user.sui_address) {
        sendError(res, "User has no wallet address", 400);
        return;
      }

      const balanceData = await SuiService.getUsdcBalance(user.sui_address);
      const recentTransactions = await SuiService.getRecentTransactions(user.sui_address);

      sendSuccess(res, "Balance retrieved", {
        balance: balanceData,
        transactions: recentTransactions,
      });
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  }
};
