import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export function notFound(req: Request, res: Response): void {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error(err.message, err.stack);
  res.status(500).json({ success: false, message: "Internal server error" });
}
