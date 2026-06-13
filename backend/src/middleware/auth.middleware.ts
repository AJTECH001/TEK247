import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { sendError } from "../utils/response";

export type Permission = 
  | 'MANAGE_USERS'
  | 'MANAGE_SYSTEM'
  | 'VIEW_AUDIT_LOGS'
  | 'MANAGE_PAYMENTS'
  | 'MANAGE_ORDERS';

// For the hackathon/current scope, we map roles to permission sets.
// In a full production RBAC, this would be fetched from the database.
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: ['MANAGE_USERS', 'MANAGE_SYSTEM', 'VIEW_AUDIT_LOGS', 'MANAGE_PAYMENTS', 'MANAGE_ORDERS'],
  user: [],
};

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    sendError(res, "Unauthorized", 401);
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    sendError(res, "Invalid or expired token", 401);
  }
}

/**
 * Authorize based on permissions.
 * If multiple permissions are provided, the user must have AT LEAST one (OR logic).
 */
export function authorize(...requiredPermissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, "Unauthorized", 401);
      return;
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
    const hasPermission = requiredPermissions.some(p => userPermissions.includes(p));

    if (!hasPermission) {
      sendError(res, "Forbidden: Missing required permissions", 403);
      return;
    }
    next();
  };
}

/**
 * Legacy role-based authorization for compatibility.
 * @deprecated Use authorize with permissions instead.
 */
export function authorizeRole(...roles: Array<"user" | "admin">) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      sendError(res, "Forbidden", 403);
      return;
    }
    next();
  };
}
