import { Request, Response } from "express";
import { AdminAnalyticsService } from "../services/admin_analytics.service";
import { sendSuccess, sendError } from "../utils/response";

import { logger } from "../utils/logger";

export const AdminAnalyticsController = {
  async getDashboardOverview(req: Request, res: Response) {
    try {
      const [stats, activity, chartData] = await Promise.all([
        AdminAnalyticsService.getDashboardStats(),
        AdminAnalyticsService.getRecentActivity(),
        AdminAnalyticsService.getRevenueChart()
      ]);

      sendSuccess(res, "Admin analytics retrieved", {
        stats,
        activity,
        chartData
      });
    } catch (err) {
      logger.error("Admin Analytics Overview Error:", err);
      sendError(res, (err as Error).message, 500);
    }
  }
};
