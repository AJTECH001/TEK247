import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listDeliveries,
  getDelivery,
  updateDeliveryStatus,
  addDeliveryUpdate,
  type Delivery,
  type DeliveryStatus,
} from "../../../network/deliveries";
import { PAGE_LIMIT } from "../../../network/constant";
import toast from "react-hot-toast";

const STATUSES: DeliveryStatus[] = ["pending", "picked_up", "in_transit", "out_for_delivery", "delivered", "failed", "returned"];

const STATUS_STYLES: Record<DeliveryStatus, string> = {
  pending: "bg-lorryYellowBg text-lorryYellowText",
  picked_up: "bg-lorryBlueBackground text-lorryBlueText",
  in_transit: "bg-purple-100 text-purple-700",
  out_for_delivery: "bg-orange-100 text-orange-700",
  delivered: "bg-lorryGreenBg text-lorryGreenText",
  failed: "bg-lorryRedBg text-lorryRedText",
  returned: "bg-lorryRedBg text-lorryRedText",
};

function Pill({ status }: { status: DeliveryStatus }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[status]}`}>{status.replace(/_/g, " ")}</span>;
}

function DeliveryDetailModal({ id, onClose, onChanged }: { id: number; onClose: () => void; onChanged: () => void }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["GET_DELIVERY_QUERY", id], queryFn: () => getDelivery(id) });
  const delivery: Delivery | undefined = data && !("error" in data) ? (data.data as Delivery) : undefined;

  const [newStatus, setNewStatus] = useState<DeliveryStatus>("in_transit");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [deliveredTo, setDeliveredTo] = useState("");

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["GET_DELIVERY_QUERY", id] });
    onChanged();
  };

  const statusMutation = useMutation({
    mutationFn: (status: DeliveryStatus) => updateDeliveryStatus(id, { status, deliveredTo: status === "delivered" ? (deliveredTo || undefined) : undefined }),
    onSuccess: (res) => { if ("error" in res) { toast.error(res.error); return; } toast.success("Status updated"); invalidate(); },
  });

  const updateMutation = useMutation({
    mutationFn: () => addDeliveryUpdate(id, { status: newStatus, location: location || undefined, notes: notes || undefined }),
    onSuccess: (res) => { if ("error" in res) { toast.error(res.error); return; } toast.success("Tracking update added"); setLocation(""); setNotes(""); invalidate(); },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-inputBorderGrey">
          <h2 className="text-base font-semibold text-lorryDarkBlack">Delivery — Order #{delivery?.orderId ?? id}</h2>
          <button onClick={onClose} className="text-inputGrey hover:text-lorryDarkBlack">✕</button>
        </div>
        <div className="px-6 py-5 space-y-5">
          {isLoading && <div className="py-8 text-center text-inputGrey">Loading…</div>}
          {delivery && (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <Pill status={delivery.deliveryStatus} />
                <span className="text-xs text-inputGrey">{delivery.deliveryMethod.replace(/_/g, " ")}</span>
                {delivery.trackingNumber && <span className="text-xs text-inputGrey">Tracking: {delivery.trackingNumber}</span>}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-inputGrey mb-0.5">Recipient</p><p className="font-medium text-lorryDarkBlack">{delivery.recipientName}</p></div>
                <div><p className="text-xs text-inputGrey mb-0.5">Phone</p><p className="font-medium text-lorryDarkBlack">{delivery.recipientPhone}</p></div>
                <div className="col-span-2"><p className="text-xs text-inputGrey mb-0.5">Address</p><p className="font-medium text-lorryDarkBlack">{delivery.deliveryAddress}{delivery.deliveryLga ? `, ${delivery.deliveryLga}` : ""}{delivery.deliveryState ? `, ${delivery.deliveryState}` : ""}</p></div>
              </div>

              {/* Timeline */}
              <div>
                <p className="text-xs font-semibold text-inputGrey uppercase tracking-wide mb-2">Tracking History</p>
                {delivery.updates && delivery.updates.length > 0 ? (
                  <ol className="space-y-2 border-l-2 border-inputBorderGrey pl-4">
                    {delivery.updates.map((u) => (
                      <li key={u.id} className="relative">
                        <span className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-lorryBlue" />
                        <div className="flex items-center justify-between">
                          <Pill status={u.status} />
                          <span className="text-xs text-inputGrey">{new Date(u.createdAt).toLocaleString()}</span>
                        </div>
                        {(u.location || u.notes) && <p className="text-xs text-inputGrey mt-1">{[u.location, u.notes].filter(Boolean).join(" — ")}</p>}
                      </li>
                    ))}
                  </ol>
                ) : <p className="text-xs text-inputGrey italic">No tracking updates yet.</p>}
              </div>

              {/* Admin: update status */}
              <div className="border border-inputBorderGrey rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold text-inputGrey uppercase tracking-wide">Set Delivery Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((s) => (
                    <button key={s} onClick={() => statusMutation.mutate(s)} disabled={statusMutation.isPending || s === delivery.deliveryStatus}
                      className={`px-2.5 py-1 text-xs rounded-lg border ${s === delivery.deliveryStatus ? "border-lorryBlue text-lorryBlue" : "border-inputBorderGrey hover:bg-offWhiteBackground"} disabled:opacity-50`}>
                      {s.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
                <input value={deliveredTo} onChange={(e) => setDeliveredTo(e.target.value)} placeholder="Delivered to (name, when marking delivered)"
                  className="w-full text-sm border border-inputBorderGrey rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lorryBlue" />
              </div>

              {/* Admin: add tracking update */}
              <div className="border border-inputBorderGrey rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold text-inputGrey uppercase tracking-wide">Add Tracking Update</p>
                <div className="grid grid-cols-2 gap-2">
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as DeliveryStatus)} className="text-sm border border-inputBorderGrey rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lorryBlue">
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                  </select>
                  <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className="text-sm border border-inputBorderGrey rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lorryBlue" />
                </div>
                <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" className="w-full text-sm border border-inputBorderGrey rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lorryBlue" />
                <button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending} className="w-full py-2 bg-lorryBlue text-white text-sm rounded-lg hover:bg-lorryBlue/90 disabled:opacity-50">
                  {updateMutation.isPending ? "Adding…" : "Add Update"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DeliveriesList() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["GET_DELIVERIES_QUERY", page, status],
    queryFn: () => listDeliveries({ page, limit: PAGE_LIMIT, status: status || undefined }),
  });

  const items: Delivery[] = (!data || "error" in data) ? [] : (data.data as Delivery[]) ?? [];
  const meta = (!data || "error" in data) ? null : data.meta;
  const pageCount = meta?.pageCount ?? 1;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-lg font-semibold text-lorryDarkBlack">Deliveries</h1>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="text-sm border border-inputBorderGrey rounded-lg px-3 py-1.5 text-lorryDarkBlack focus:outline-none focus:ring-2 focus:ring-lorryBlue">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-statBorderGrey overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-offWhiteBackground border-b border-inputBorderGrey">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-inputGrey uppercase tracking-wide">Order</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-inputGrey uppercase tracking-wide">Recipient</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-inputGrey uppercase tracking-wide">Method</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-inputGrey uppercase tracking-wide">Address</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-inputGrey uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-inputBorderGrey">
              {isLoading && <tr><td colSpan={5} className="px-4 py-8 text-center text-inputGrey">Loading…</td></tr>}
              {!isLoading && items.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-inputGrey">No deliveries found.</td></tr>}
              {items.map((d) => (
                <tr key={d.id} onClick={() => setSelected(d.id)} className="hover:bg-offWhiteBackground cursor-pointer transition-colors">
                  <td className="px-4 py-3 font-medium text-lorryDarkBlack">#{d.orderId}</td>
                  <td className="px-4 py-3 text-lorryDarkBlack">{d.recipientName}</td>
                  <td className="px-4 py-3 text-inputGrey">{d.deliveryMethod.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-inputGrey max-w-xs truncate">{d.deliveryAddress}</td>
                  <td className="px-4 py-3"><Pill status={d.deliveryStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pageCount > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-inputBorderGrey">
            <span className="text-xs text-inputGrey">Page {page} of {pageCount}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 text-xs rounded border border-inputBorderGrey hover:bg-offWhiteBackground disabled:opacity-40">Previous</button>
              <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount} className="px-3 py-1 text-xs rounded border border-inputBorderGrey hover:bg-offWhiteBackground disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {selected !== null && (
        <DeliveryDetailModal id={selected} onClose={() => setSelected(null)} onChanged={() => qc.invalidateQueries({ queryKey: ["GET_DELIVERIES_QUERY"] })} />
      )}
    </div>
  );
}
