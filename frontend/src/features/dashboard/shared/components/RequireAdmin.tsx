import { Navigate } from "react-router-dom";
import { getStoredUser } from "../../../../network/auth";

/**
 * Route guard — redirects non-admin users back to /dashboard.
 * Wrap any admin-only <Route> element with this component.
 * 
 * NOTE: For production, this should be expanded to check specific permissions
 * returned from the backend in the user profile.
 *
 * Usage in App.tsx:
 *   { path: "users", element: <RequireAdmin><UsersPage /></RequireAdmin> }
 */
export default function RequireAdmin({ children }: { children: React.ReactNode }) {
  const user = getStoredUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
