import { TOKEN_NAME } from "./network/constant";
import LandingPageRoute from "./pages/landing/index";
import { Navigate, useRoutes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Login from "./pages/authentication/login";
import Register from "./pages/authentication/register";
import ZkLoginCallback from "./features/authentication/ZkLoginCallback";
import Dashboard from "./pages/dashboard/dashboard";
import DashboardMain from "./features/dashboard/dashboard/DashboardMain";
import UsersPage from "./pages/dashboard/users";
import ProfilePage from "./pages/dashboard/profile";
import LaptopsPage from "./pages/dashboard/laptops";
import SystemRequestsPage from "./pages/dashboard/system-requests";
import SystemRequestDetailPage from "./pages/dashboard/system-request-detail";
import OrdersPage from "./pages/dashboard/orders";
import RepairsPage from "./pages/dashboard/repairs";
import AccessoriesPage from "./pages/dashboard/accessories";
import DeliveriesPage from "./pages/dashboard/deliveries";
import NotificationsPage from "./pages/dashboard/notifications";
import RequireAdmin from "./features/dashboard/shared/components/RequireAdmin";
import AdminLayout from "./features/admin/shared/components/AdminLayout";
import AdminDashboardMain from "./features/admin/dashboard/AdminDashboardMain";
import Placeholder from "./features/admin/shared/components/Placeholder";

function App() {
  const isLoggedIn = sessionStorage.getItem(TOKEN_NAME);

  const element = useRoutes([
    {
      path: "/",
      element: isLoggedIn ? <Navigate to="/dashboard" /> : <LandingPageRoute />,
    },
    {
      path: "/login",
      element: isLoggedIn ? <Navigate to="/dashboard" /> : <Login />,
    },
    {
      path: "/register",
      element: isLoggedIn ? <Navigate to="/dashboard" /> : <Register />,
    },
    {
      path: "/auth/zklogin/callback",
      element: <ZkLoginCallback />,
    },
    {
      path: "/dashboard",
      element: isLoggedIn ? <Dashboard /> : <Navigate to="/" />,
      children: [
        { index: true,                           element: <DashboardMain /> },
        { path: "users",                         element: <RequireAdmin><UsersPage /></RequireAdmin> },
        { path: "profile",                       element: <ProfilePage /> },
        { path: "laptops",                       element: <LaptopsPage /> },
        { path: "system-requests",               element: <SystemRequestsPage /> },
        { path: "system-requests/:id",           element: <SystemRequestDetailPage /> },
        { path: "orders",                        element: <OrdersPage /> },
        { path: "repairs",                       element: <RepairsPage /> },
        { path: "accessories",                   element: <AccessoriesPage /> },
        { path: "deliveries",                    element: <RequireAdmin><DeliveriesPage /></RequireAdmin> },
        { path: "notifications",                 element: <NotificationsPage /> },
      ],
    },
    {
      path: "/admin",
      element: <RequireAdmin><AdminLayout /></RequireAdmin>,
      children: [
        { index: true,             element: <AdminDashboardMain /> },
        { path: "finances",        element: <Placeholder title="Financial Monitoring" /> },
        { path: "orders",          element: <Placeholder title="Order Management" /> },
        { path: "users",           element: <Placeholder title="User & Vendor Operations" /> },
        { path: "inventory",       element: <Placeholder title="Inventory Control" /> },
        { path: "repairs",         element: <Placeholder title="Service Operations" /> },
        { path: "audit-logs",      element: <Placeholder title="System Audit" /> },
        { path: "settings",        element: <Placeholder title="Platform Settings" /> },
      ],
    },
    {
      path: "*",
      element: <Navigate to="/" />,
    },
  ]);

  return (
    <>
      {element}
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </>
  );
}

export default App;
