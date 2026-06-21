import { Request, Response } from "express";
import AuthService from "../services/auth.service";
import { UserModel, toSafeUser } from "../models/user.model";
import { sendSuccess, sendError } from "../utils/response";

export const AuthController = {
  // POST /auth/enoki — log in from an Enoki zkLogin session
  async enokiLogin(req: Request, res: Response): Promise<void> {
    try {
      const { jwt, suiAddress } = req.body as { jwt: string; suiAddress: string };
      const result = await AuthService.enokiLogin({ jwt, suiAddress });
      sendSuccess(res, "Login successful", result);
    } catch (err) {
      sendError(res, (err as Error).message, 401);
    }
  },

  // POST /auth/refresh
  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      const result = await AuthService.refresh(refreshToken);
      sendSuccess(res, "Token refreshed", result);
    } catch (err) {
      sendError(res, (err as Error).message, 401);
    }
  },

  // POST /auth/logout
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      await AuthService.logout(refreshToken);
      sendSuccess(res, "Logged out successfully");
    } catch (err) {
      sendError(res, (err as Error).message, 400);
    }
  },

  // GET /auth/me
  async getMe(req: Request, res: Response): Promise<void> {
    try {
      const user = await UserModel.findById(req.user!.userId);
      if (!user) {
        sendError(res, "User not found", 404);
        return;
      }
      sendSuccess(res, "User retrieved", toSafeUser(user));
    } catch (err) {
      sendError(res, (err as Error).message, 500);
    }
  },
};
