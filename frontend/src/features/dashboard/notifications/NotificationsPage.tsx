import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
} from "../../../network/notifications";
import { Query, PAGE_LIMIT } from "../../../network/constant";
import { useState } from "react";
import toast from "react-hot-toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, string> = {
  order_status:          "🛒",
  repair_status:         "🔧",
  price_drop:            "💰",
  system_recommendation: "💡",
  system:                "📢",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  <  1) return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: [Query.GET_NOTIFICATIONS_QUERY, page],
    queryFn:  () => listNotifications({ page, limit: PAGE_LIMIT }),
  });

  const notifications: Notification[] = (!data || "error" in data) ? [] : (data.data as Notification[]) ?? [];
  const meta      = (!data || "error" in data) ? null : data.meta;
  const pageCount = meta?.pageCount ?? 1;
  const unread    = notifications.filter((n) => !n.isRead).length;

  const markReadMutation = useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [Query.GET_NOTIFICATIONS_QUERY] });
      qc.invalidateQueries({ queryKey: [Query.GET_UNREAD_COUNT_QUERY] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: (res) => {
      if ("error" in res) { toast.error(res.error as string); return; }
      qc.invalidateQueries({ queryKey: [Query.GET_NOTIFICATIONS_QUERY] });
      qc.invalidateQueries({ queryKey: [Query.GET_UNREAD_COUNT_QUERY] });
    },
  });

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-lorryDarkBlack">
          Notifications
          {unread > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-lorryBlue text-white text-[10px] font-bold">
              {unread}
            </span>
          )}
        </h1>
        {unread > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="text-xs text-lorryBlue hover:underline disabled:opacity-50"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-statBorderGrey divide-y divide-inputBorderGrey overflow-hidden">
        {isLoading && (
          <div className="py-10 flex justify-center">
            <div className="w-6 h-6 border-2 border-lorryBlue border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!isLoading && notifications.length === 0 && (
          <div className="py-10 text-center text-inputGrey text-sm">
            No notifications yet.
          </div>
        )}
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => { if (!n.isRead) markReadMutation.mutate(n.id); }}
            className={`flex gap-4 px-5 py-4 transition-colors ${
              n.isRead
                ? "bg-white"
                : "bg-lorryBlueBackground/30 cursor-pointer hover:bg-lorryBlueBackground/50"
            }`}
          >
            {/* Icon */}
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-offWhiteBackground flex items-center justify-center text-lg">
              {TYPE_ICONS[n.notificationType] ?? "🔔"}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm leading-snug ${n.isRead ? "text-lorryDarkBlack" : "text-lorryDarkBlack font-semibold"}`}>
                  {n.title}
                </p>
                <span className="flex-shrink-0 text-[10px] text-inputGrey">{timeAgo(n.createdAt)}</span>
              </div>
              <p className="text-xs text-inputGrey mt-0.5 leading-relaxed">{n.message}</p>
            </div>

            {/* Unread dot */}
            {!n.isRead && (
              <div className="flex-shrink-0 mt-1.5">
                <div className="w-2 h-2 rounded-full bg-lorryBlue" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between">
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
  );
}
