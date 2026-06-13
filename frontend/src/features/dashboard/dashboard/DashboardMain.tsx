import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listUsers } from "../../../network/admin";
import { getStoredUser } from "../../../network/auth";
import { listOrders, type Order } from "../../../network/orders";
import { listRepairs, type RepairRequest } from "../../../network/repairs";
import { getBalance } from "../../../network/balance";
import { getUnreadCount } from "../../../network/notifications";
import { Query } from "../../../network/constant";
import BalanceCard from "../balance/BalanceCard";
import TransactionHistory from "../balance/TransactionHistory";

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  loading?: boolean;
}

function StatCard({ label, value, sub, color = "lorryBlue", loading }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-statBorderGrey p-5">
      <p className="text-xs font-medium text-inputGrey uppercase tracking-wide mb-3">{label}</p>
      {loading ? (
        <div className="h-8 w-20 bg-offWhiteBackground rounded animate-pulse" />
      ) : (
        <p className={`text-3xl font-bold text-${color}`}>{value}</p>
      )}
      {sub && <p className="text-xs text-inputGrey mt-1">{sub}</p>}
    </div>
  );
}

// ─── Role Badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
      role === "admin"
        ? "bg-lorryBlueBackground text-lorryBlueText"
        : "bg-offWhiteBackground text-roleTextGrey"
    }`}>
      {role}
    </span>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active:         "bg-lorryGreenBg text-lorryGreenText",
    inactive:       "bg-lorryYellowBg text-lorryYellowText",
    suspended:      "bg-lorryRedBg text-lorryRedText",
    pending:        "bg-lorryYellowBg text-lorryYellowText",
    confirmed:      "bg-lorryBlueBackground text-lorryBlueText",
    shipped:        "bg-lorryBlueBackground text-lorryBlueText",
    delivered:      "bg-lorryGreenBg text-lorryGreenText",
    cancelled:      "bg-lorryRedBg text-lorryRedText",
    diagnosed:      "bg-lorryBlueBackground text-lorryBlueText",
    in_progress:    "bg-lorryBlueBackground text-lorryBlueText",
    completed:      "bg-lorryGreenBg text-lorryGreenText",
    awaiting_parts: "bg-lorryYellowBg text-lorryYellowText",
    recommended:    "bg-lorryBlueBackground text-lorryBlueText",
    purchased:      "bg-lorryGreenBg text-lorryGreenText",
    closed:         "bg-offWhiteBackground text-roleTextGrey",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[status] ?? "bg-offWhiteBackground text-inputGrey"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

function SkeletonRows({ cols, rows = 4 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-statBorderGrey last:border-0">
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} className="px-5 py-3.5">
              <div className="h-4 bg-offWhiteBackground rounded animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DashboardMain() {
  const currentUser = getStoredUser();
  const isAdmin = currentUser?.role === "admin";

  // Admin queries
  const { data: usersRes, isLoading: usersLoading } = useQuery({
    queryKey: [Query.GET_ALL_USERS_QUERY, 1, 5],
    queryFn: () => listUsers(1, 5),
    enabled: isAdmin,
  });

  // User queries
  const { data: ordersRes, isLoading: ordersLoading } = useQuery({
    queryKey: [Query.GET_ORDERS_QUERY, 1, 5],
    queryFn: () => listOrders({ page: 1, limit: 5 }),
    enabled: !isAdmin,
  });

  const { data: repairsRes, isLoading: repairsLoading } = useQuery({
    queryKey: [Query.GET_REPAIRS_QUERY, 1, 5],
    queryFn: () => listRepairs({ page: 1, limit: 5 }),
    enabled: !isAdmin,
  });

  const { data: unreadRes } = useQuery({
    queryKey: [Query.GET_UNREAD_COUNT_QUERY],
    queryFn: getUnreadCount,
    enabled: !isAdmin,
  });

  const { data: balanceRes, isLoading: balanceLoading, refetch: refetchBalance } = useQuery({
    queryKey: [Query.GET_BALANCE_QUERY],
    queryFn: getBalance,
    enabled: !isAdmin,
    staleTime: 30_000,
  });

  const adminUsers  = !usersRes  || "error" in usersRes  ? [] : (usersRes.data  ?? []);
  const totalUsers  = !usersRes  || "error" in usersRes  ? 0  : (usersRes.meta?.itemCount ?? 0);
  const orders      = !ordersRes || "error" in ordersRes ? [] : (ordersRes.data  ?? []);
  const totalOrders = !ordersRes || "error" in ordersRes ? 0  : (ordersRes.meta?.itemCount ?? 0);
  const repairs     = !repairsRes|| "error" in repairsRes? [] : (repairsRes.data ?? []);
  const activeRepairs = repairs.filter((r: RepairRequest) =>
    ["pending","diagnosed","in_progress","awaiting_parts"].includes(r.status)
  ).length;
  const unreadCount = !unreadRes || "error" in unreadRes ? 0 : (unreadRes.data?.count ?? 0);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-semibold text-lorryDarkBlack">
          Good day, {currentUser?.fullName.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-inputGrey mt-0.5">Here's what's happening at Tek247 today.</p>
      </div>

      {/* ── ADMIN VIEW ── */}
      {isAdmin && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Users"   value={totalUsers} sub="Registered accounts" color="lorryBlue"      loading={usersLoading} />
            <StatCard label="Total Orders"  value="—"          sub="Coming soon"          color="lorryGreen" />
            <StatCard label="Active Repairs"value="—"          sub="Coming soon"          color="lorryYellow" />
            <StatCard label="Revenue"       value="—"          sub="Coming soon"          color="lorryDarkBlack" />
          </div>

          {/* Recent Users */}
          <div className="bg-white rounded-xl border border-statBorderGrey">
            <div className="flex items-center justify-between px-5 py-4 border-b border-statBorderGrey">
              <h3 className="text-sm font-semibold text-lorryDarkBlack">Recent Users</h3>
              <Link to="/dashboard/users" className="text-xs text-lorryBlue hover:underline font-medium">View all</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-statBorderGrey">
                    <th className="px-5 py-3 text-xs font-medium text-inputGrey uppercase tracking-wide">Name</th>
                    <th className="px-5 py-3 text-xs font-medium text-inputGrey uppercase tracking-wide">Email</th>
                    <th className="px-5 py-3 text-xs font-medium text-inputGrey uppercase tracking-wide">Role</th>
                    <th className="px-5 py-3 text-xs font-medium text-inputGrey uppercase tracking-wide">Status</th>
                    <th className="px-5 py-3 text-xs font-medium text-inputGrey uppercase tracking-wide">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    <SkeletonRows cols={5} />
                  ) : adminUsers.length === 0 ? (
                    <tr><td colSpan={5} className="text-center text-sm text-inputGrey py-8">No users found.</td></tr>
                  ) : (
                    adminUsers.map((user: import("../../../network/auth").User) => (
                      <tr key={user.id} className="border-b border-statBorderGrey last:border-0 hover:bg-pageWhite transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-lorryBlue/10 text-lorryBlue flex items-center justify-center text-xs font-semibold flex-shrink-0">
                              {user.fullName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-lorryDarkBlack">{user.fullName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-textGrey">{user.email}</td>
                        <td className="px-5 py-3.5"><RoleBadge role={user.role} /></td>
                        <td className="px-5 py-3.5"><StatusBadge status={user.status} /></td>
                        <td className="px-5 py-3.5 text-textGrey">
                          {new Date(user.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── USER VIEW ── */}
      {!isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Financials */}
          <div className="lg:col-span-1 space-y-6">
            <BalanceCard 
              balance={balanceRes?.data?.balance.totalBalance || "0"} 
              symbol={balanceRes?.data?.balance.symbol || "USDC"}
              decimals={balanceRes?.data?.balance.decimals || 6}
              isLoading={balanceLoading}
              onRefresh={() => void refetchBalance()}
            />
            <TransactionHistory 
              transactions={balanceRes?.data?.transactions || []} 
              isLoading={balanceLoading}
            />
          </div>

          {/* Right Column: Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Orders"          value={totalOrders}  sub="Successful orders"   color="lorryBlue"      loading={ordersLoading} />
              <StatCard label="Active Repairs"  value={activeRepairs} sub="In progress"         color="lorryYellow"    loading={repairsLoading} />
              <StatCard label="Notifications"   value={unreadCount}  sub="Unread messages"     color="lorryDarkBlack" />
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl border border-statBorderGrey">
              <div className="flex items-center justify-between px-5 py-4 border-b border-statBorderGrey">
                <h3 className="text-sm font-semibold text-lorryDarkBlack">Recent Orders</h3>
                <Link to="/dashboard/orders" className="text-xs text-lorryBlue hover:underline font-medium">View all</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-statBorderGrey">
                      <th className="px-5 py-3 text-xs font-medium text-inputGrey uppercase tracking-wide">Order ID</th>
                      <th className="px-5 py-3 text-xs font-medium text-inputGrey uppercase tracking-wide">Status</th>
                      <th className="px-5 py-3 text-xs font-medium text-inputGrey uppercase tracking-wide">Total</th>
                      <th className="px-5 py-3 text-xs font-medium text-inputGrey uppercase tracking-wide">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersLoading ? (
                      <SkeletonRows cols={4} />
                    ) : orders.length === 0 ? (
                      <tr><td colSpan={4} className="text-center text-sm text-inputGrey py-8">No orders yet.</td></tr>
                    ) : (
                      orders.map((order: Order) => (
                        <tr key={order.id} className="border-b border-statBorderGrey last:border-0 hover:bg-pageWhite transition-colors">
                          <td className="px-5 py-3.5 font-medium text-lorryDarkBlack">#{order.id}</td>
                          <td className="px-5 py-3.5"><StatusBadge status={order.status} /></td>
                          <td className="px-5 py-3.5 text-textGrey">₦{Number(order.totalAmount).toLocaleString()}</td>
                          <td className="px-5 py-3.5 text-textGrey">
                            {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Repairs */}
            <div className="bg-white rounded-xl border border-statBorderGrey">
              <div className="flex items-center justify-between px-5 py-4 border-b border-statBorderGrey">
                <h3 className="text-sm font-semibold text-lorryDarkBlack">Recent Repairs</h3>
                <Link to="/dashboard/repairs" className="text-xs text-lorryBlue hover:underline font-medium">View all</Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-statBorderGrey">
                      <th className="px-5 py-3 text-xs font-medium text-inputGrey uppercase tracking-wide">Issue</th>
                      <th className="px-5 py-3 text-xs font-medium text-inputGrey uppercase tracking-wide">Status</th>
                      <th className="px-5 py-3 text-xs font-medium text-inputGrey uppercase tracking-wide">Est. Cost</th>
                      <th className="px-5 py-3 text-xs font-medium text-inputGrey uppercase tracking-wide">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repairsLoading ? (
                      <SkeletonRows cols={4} />
                    ) : repairs.length === 0 ? (
                      <tr><td colSpan={4} className="text-center text-sm text-inputGrey py-8">No repair requests yet.</td></tr>
                    ) : (
                      repairs.map((repair: RepairRequest) => (
                        <tr key={repair.id} className="border-b border-statBorderGrey last:border-0 hover:bg-pageWhite transition-colors">
                          <td className="px-5 py-3.5 text-lorryDarkBlack max-w-xs truncate">{repair.issueDescription}</td>
                          <td className="px-5 py-3.5"><StatusBadge status={repair.status} /></td>
                          <td className="px-5 py-3.5 text-textGrey">
                            {repair.estimatedCost ? `₦${Number(repair.estimatedCost).toLocaleString()}` : "—"}
                          </td>
                          <td className="px-5 py-3.5 text-textGrey">
                            {new Date(repair.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
