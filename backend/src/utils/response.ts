import { Response } from "express";
import { ApiSuccessResponse, ApiErrorResponse, PaginationMeta } from "../types";

export function sendSuccess<T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200,
  meta?: PaginationMeta
): Response {
  const body: ApiSuccessResponse<T> = { success: true, message, data, meta };
  return res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  errors?: Record<string, string>[]
): Response {
  const body: ApiErrorResponse = { success: false, message, errors };
  return res.status(statusCode).json(body);
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  itemCount: number
): PaginationMeta {
  const pageCount = Math.ceil(itemCount / limit);
  return {
    page,
    limit,
    itemCount,
    pageCount,
    hasPreviousPage: page > 1,
    hasNextPage: page < pageCount,
  };
}
