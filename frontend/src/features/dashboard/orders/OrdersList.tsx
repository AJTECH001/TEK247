import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder,
  type Order,
  type OrderStatus,
} from "../../../network/orders";
import { getStoredUser } from "../../../network/auth";
import { Query, PAGE_LIMIT } from "../../../network/constant";
import toast from "react-hot-toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending:   "bg-lorryYellowBg text-lorryYellowText",
  confirmed: "bg-lorryBlueBackground text-lorryBlueText",
  shipped:   "bg-purple-100 text-purple-700",
  delivered: "bg-lorryGreenBg text-lorryGreenText",
  cancelled: "bg-lorryRedBg text-lorryRedText",
};

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

const fmt = (n: number) =>
  "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 2 });

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

// ─── Order Detail Modal ───────────────────────────────────────────────────────

function OrderDetailModal({ orderId, onClose }: { orderId: number; onClose: () => void }) {
  const user          = getStoredUser();
  const isAdmin       = user?.role === "admin";
  const qc            = useQueryClient();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: [Query.GET_ORDER_DETAIL_QUERY, orderId],
    queryFn:  () => getOrder(orderId),
  });

  const statusMutation = useMutation({
    mutationFn: ({ status }: { status: OrderStatus }) => updateOrderStatus(orderId, status),
    onSuccess: (res) => {
      if ("error" in res) { toast.error(res.error); return; }
      toast.success("Order status updated");
      qc.invalidateQueries({ queryKey: [Query.GET_ORDERS_QUERY] });
      qc.invalidateQueries({ queryKey: [Query.GET_ORDER_DETAIL_QUERY, orderId] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(orderId),
    onSuccess: (res) => {
      if ("error" in res) { toast.error(res.error); return; }
      toast.success("Order cancelled");
      qc.invalidateQueries({ queryKey: [Query.GET_ORDERS_QUERY] });
      onClose();
    },
  });

  const order: Order | undefined =
    data && !("error" in data) ? (data.data as Order) : undefined;

  const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
    pending:   "confirmed",
    confirmed: "shipped",
    shipped:   "delivered",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-inputBorderGrey">
          <h2 className="text-base font-semibold text-lorryDarkBlack">
            Order #{orderId}
          </h2>
          <button onClick={onClose} className="text-inputGrey hover:text-lorryDarkBlack">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-lorryBlue border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {order && (
            <>
              {/* Status + meta */}
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={order.status} />
                <span className="text-xs text-inputGrey">{formatDate(order.createdAt)}</span>
                {order.user && (
                  <span className="text-xs text-inputGrey">{order.user.fullName} ({order.user.email})</span>
                )}
              </div>

              {/* Admin actions */}
              {isAdmin && (
                <div className="flex gap-2 flex-wrap">
                  {NEXT_STATUS[order.status] && (
                    <button
                      onClick={() => statusMutation.mutate({ status: NEXT_STATUS[order.status]! })}
                      disabled={statusMutation.isPending}
                      className="px-3 py-1.5 bg-lorryBlue text-white text-xs rounded-lg hover:bg-lorryBlue/90 disabled:opacity-50"
                    >
                      Mark as {NEXT_STATUS[order.status]}
                    </button>
                  )}
                  {order.status !== "cancelled" && order.status !== "delivered" && (
                    confirmCancel ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-lorryRedText">Are you sure?</span>
                        <button
                          onClick={() => cancelMutation.mutate()}
                          disabled={cancelMutation.isPending}
                          className="px-3 py-1.5 bg-lorryRedBg text-lorryRedText text-xs rounded-lg hover:bg-red-100 disabled:opacity-50"
                        >
                          {cancelMutation.isPending ? "Cancelling…" : "Yes, cancel"}
                        </button>
                        <button
                          onClick={() => setConfirmCancel(false)}
                          className="px-3 py-1.5 text-xs rounded-lg border border-inputBorderGrey hover:bg-offWhiteBackground"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmCancel(true)}
                        className="px-3 py-1.5 bg-lorryRedBg text-lorryRedText text-xs rounded-lg hover:bg-red-100"
                      >
                        Cancel Order
                      </button>
                    )
                  )}
                </div>
              )}

              {/* Items */}
              {(order.items ?? []).length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-inputGrey uppercase tracking-wide mb-2">Laptops</h3>
                  <div className="space-y-2">
                    {order.items!.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <span className="text-lorryDarkBlack font-medium">{item.laptopName}</span>
                        <span className="text-inputGrey">
                          {item.quantity} × {fmt(item.unitPrice)} = <span className="text-lorryDarkBlack font-semibold">{fmt(item.subtotal)}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Accessories */}
              {(order.accessories ?? []).length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-inputGrey uppercase tracking-wide mb-2">Accessories</h3>
                  <div className="space-y-2">
                    {order.accessories!.map((acc) => (
                      <div key={acc.id} className="flex items-center justify-between text-sm">
                        <span className="text-lorryDarkBlack font-medium">{acc.accessoryName}</span>
                        <span className="text-inputGrey">
                          {acc.quantity} × {fmt(acc.unitPrice)} = <span className="text-lorryDarkBlack font-semibold">{fmt(acc.subtotal)}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="border-t border-inputBorderGrey pt-3 flex justify-end">
                <span className="text-sm font-bold text-lorryDarkBlack">
                  Total: {fmt(order.totalAmount)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const ALL_STATUSES: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export default function OrdersList() {
  const user    = getStoredUser();
  const isAdmin = user?.role === "admin";

  const [page,           setPage]           = useState(1);
  const [statusFilter,   setStatusFilter]   = useState("");
  const [selectedOrder,  setSelectedOrder]  = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [Query.GET_ORDERS_QUERY, page, statusFilter],
    queryFn:  () => listOrders({ page, limit: PAGE_LIMIT, status: statusFilter || undefined }),
  });

  const orders: Order[]  = (!data || "error" in data) ? [] : (data.data as Order[]) ?? [];
  const meta             = (!data || "error" in data) ? null : data.meta;
  const pageCount        = meta?.pageCount ?? 1;

  return (
    <div className="p-6 space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-lg font-semibold text-lorryDarkBlack">
          {isAdmin ? "All Orders" : "My Orders"}
        </h1>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="text-sm border border-inputBorderGrey rounded-lg px-3 py-1.5 text-lorryDarkBlack focus:outline-none focus:ring-2 focus:ring-lorryBlue"
        >
          <option value="">All statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-statBorderGrey overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-offWhiteBackground border-b border-inputBorderGrey">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-inputGrey uppercase tracking-wide">Order #</th>
                {isAdmin && <th className="px-4 py-3 text-left text-xs font-semibold text-inputGrey uppercase tracking-wide">Customer</th>}
                <th className="px-4 py-3 text-left text-xs font-semibold text-inputGrey uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-inputGrey uppercase tracking-wide">Total</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-inputGrey uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-inputBorderGrey">
              {isLoading && (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-4 py-8 text-center text-inputGrey">
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoading && orders.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-4 py-8 text-center text-inputGrey">
                    No orders found.
                  </td>
                </tr>
              )}
              {orders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => setSelectedOrder(order.id)}
                  className="hover:bg-offWhiteBackground cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-lorryDarkBlack">#{order.id}</td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-inputGrey">
                      {order.user?.fullName ?? "—"}
                    </td>
                  )}
                  <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                  <td className="px-4 py-3 font-semibold text-lorryDarkBlack">{fmt(order.totalAmount)}</td>
                  <td className="px-4 py-3 text-inputGrey">{formatDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pageCount > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-inputBorderGrey">
            <span className="text-xs text-inputGrey">Page {page} of {pageCount}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs rounded border border-inputBorderGrey hover:bg-offWhiteBackground disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page === pageCount}
                className="px-3 py-1 text-xs rounded border border-inputBorderGrey hover:bg-offWhiteBackground disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedOrder !== null && (
        <OrderDetailModal orderId={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}
