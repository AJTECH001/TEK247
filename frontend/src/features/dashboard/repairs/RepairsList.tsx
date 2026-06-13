import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  listRepairs,
  getRepair,
  createRepair,
  listRepairServices,
  updateRepairStatus,
  diagnoseRepair,
  setRepairFinalCost,
  type RepairRequest,
  type RepairStatus,
  type RepairService,
} from "../../../network/repairs";
import { getStoredUser } from "../../../network/auth";
import { Query, PAGE_LIMIT } from "../../../network/constant";
import RepairEscrowPanel from "../escrow/RepairEscrowPanel";
import DevicePassportPanel from "../passport/DevicePassportPanel";
import toast from "react-hot-toast";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<RepairStatus, string> = {
  pending:        "bg-lorryYellowBg text-lorryYellowText",
  diagnosed:      "bg-lorryBlueBackground text-lorryBlueText",
  in_progress:    "bg-purple-100 text-purple-700",
  awaiting_parts: "bg-orange-100 text-orange-700",
  completed:      "bg-lorryGreenBg text-lorryGreenText",
  cancelled:      "bg-lorryRedBg text-lorryRedText",
};

function StatusBadge({ status }: { status: RepairStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[status]}`}>
      {status.replace("_", " ")}
    </span>
  );
}

const fmt = (n: number | null) =>
  n !== null ? "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 2 }) : "—";

// ─── Submit Repair Modal ──────────────────────────────────────────────────────

const submitRepairSchema = Yup.object({
  issueDescription: Yup.string()
    .trim()
    .min(10, "Please describe the issue in at least 10 characters")
    .max(2000, "Description must be under 2000 characters")
    .required("Issue description is required"),
  laptopBrand: Yup.string().trim().max(100, "Brand must be under 100 characters"),
  laptopModel: Yup.string().trim().max(100, "Model must be under 100 characters"),
  repairServiceId: Yup.string(),
});

function SubmitRepairModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { data: servicesData } = useQuery({
    queryKey: [Query.GET_REPAIR_SERVICES_QUERY],
    queryFn:  listRepairServices,
  });
  const services: RepairService[] = (!servicesData || "error" in servicesData) ? [] : (servicesData.data as RepairService[]) ?? [];

  const mutation = useMutation({
    mutationFn: (values: { issueDescription: string; laptopBrand: string; laptopModel: string; repairServiceId: string }) =>
      createRepair({
        issueDescription: values.issueDescription.trim(),
        laptopBrand:      values.laptopBrand.trim() || undefined,
        laptopModel:      values.laptopModel.trim() || undefined,
        repairServiceId:  values.repairServiceId ? parseInt(values.repairServiceId, 10) : undefined,
      }),
    onSuccess: (res) => {
      if ("error" in res) { toast.error(res.error); return; }
      toast.success("Repair request submitted");
      onSuccess();
      onClose();
    },
  });

  const formik = useFormik({
    initialValues: { issueDescription: "", laptopBrand: "", laptopModel: "", repairServiceId: "" },
    validationSchema: submitRepairSchema,
    onSubmit: (values) => mutation.mutate(values),
  });

  const fieldErr = (name: keyof typeof formik.values) =>
    formik.touched[name] && formik.errors[name]
      ? <p className="text-xs text-lorryRed mt-1">{formik.errors[name]}</p>
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-inputBorderGrey">
          <h2 className="text-base font-semibold text-lorryDarkBlack">New Repair Request</h2>
          <button onClick={onClose} className="text-inputGrey hover:text-lorryDarkBlack">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={formik.handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-inputGrey mb-1">Laptop Brand</label>
              <input
                type="text"
                {...formik.getFieldProps("laptopBrand")}
                placeholder="e.g. Dell, HP, Lenovo"
                className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lorryBlue ${
                  formik.touched.laptopBrand && formik.errors.laptopBrand ? "border-lorryRed" : "border-inputBorderGrey"
                }`}
              />
              {fieldErr("laptopBrand")}
            </div>
            <div>
              <label className="block text-xs font-medium text-inputGrey mb-1">Laptop Model</label>
              <input
                type="text"
                {...formik.getFieldProps("laptopModel")}
                placeholder="e.g. XPS 15, ThinkPad X1"
                className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lorryBlue ${
                  formik.touched.laptopModel && formik.errors.laptopModel ? "border-lorryRed" : "border-inputBorderGrey"
                }`}
              />
              {fieldErr("laptopModel")}
            </div>
          </div>

          {services.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-inputGrey mb-1">Repair Type (optional)</label>
              <select
                {...formik.getFieldProps("repairServiceId")}
                className="w-full text-sm border border-inputBorderGrey rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lorryBlue"
              >
                <option value="">Not sure / other</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {fmt(s.estimatedPrice)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-inputGrey mb-1">
              Issue Description <span className="text-lorryRed">*</span>
            </label>
            <textarea
              {...formik.getFieldProps("issueDescription")}
              rows={4}
              placeholder="Describe the problem in detail…"
              className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lorryBlue resize-none ${
                formik.touched.issueDescription && formik.errors.issueDescription ? "border-lorryRed" : "border-inputBorderGrey"
              }`}
            />
            {fieldErr("issueDescription")}
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full py-2.5 bg-lorryBlue text-white text-sm font-medium rounded-lg hover:bg-lorryBlue/90 disabled:opacity-50"
          >
            {mutation.isPending ? "Submitting…" : "Submit Request"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Repair Detail Modal ──────────────────────────────────────────────────────

function RepairDetailModal({ repairId, onClose }: { repairId: number; onClose: () => void }) {
  const user    = getStoredUser();
  const isAdmin = user?.role === "admin";
  const qc      = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: [Query.GET_REPAIR_DETAIL_QUERY, repairId],
    queryFn:  () => getRepair(repairId),
  });

  const { data: servicesData } = useQuery({
    queryKey: [Query.GET_REPAIR_SERVICES_QUERY],
    queryFn:  listRepairServices,
    enabled:  isAdmin,
  });
  const services: RepairService[] = (!servicesData || "error" in servicesData) ? [] : (servicesData.data as RepairService[]) ?? [];

  const [selectedService, setSelectedService] = useState("");
  const [estCost,         setEstCost]         = useState("");
  const [finalCost,       setFinalCost]       = useState("");
  const [confirmCancel,   setConfirmCancel]   = useState(false);

  const repair: RepairRequest | undefined =
    data && !("error" in data) ? (data.data as RepairRequest) : undefined;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [Query.GET_REPAIRS_QUERY] });
    qc.invalidateQueries({ queryKey: [Query.GET_REPAIR_DETAIL_QUERY, repairId] });
  };

  const diagnoseMutation = useMutation({
    mutationFn: () =>
      diagnoseRepair(repairId, {
        repairServiceId: selectedService ? parseInt(selectedService, 10) : undefined,
        estimatedCost: estCost ? parseFloat(estCost) : undefined,
      }),
    onSuccess: (res) => {
      if ("error" in res) { toast.error(res.error); return; }
      toast.success("Repair diagnosed");
      invalidate();
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: RepairStatus) => updateRepairStatus(repairId, status),
    onSuccess: (res) => {
      if ("error" in res) { toast.error(res.error); return; }
      toast.success("Status updated");
      invalidate();
    },
  });

  const finalCostMutation = useMutation({
    mutationFn: () => setRepairFinalCost(repairId, parseFloat(finalCost)),
    onSuccess: (res) => {
      if ("error" in res) { toast.error(res.error); return; }
      toast.success("Final cost set");
      invalidate();
    },
  });

  const NEXT_STATUS: Partial<Record<RepairStatus, RepairStatus>> = {
    diagnosed:  "in_progress",
    in_progress: "completed",
    awaiting_parts: "in_progress",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-inputBorderGrey">
          <h2 className="text-base font-semibold text-lorryDarkBlack">Repair #{repairId}</h2>
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

          {repair && (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={repair.status} />
                {repair.user && (
                  <span className="text-xs text-inputGrey">{repair.user.fullName} ({repair.user.email})</span>
                )}
              </div>

              {/* Device info */}
              {(repair.laptopBrand || repair.laptopModel) && (
                <div className="text-sm text-lorryDarkBlack">
                  <span className="font-medium">Device: </span>
                  {[repair.laptopBrand, repair.laptopModel].filter(Boolean).join(" ")}
                </div>
              )}

              {/* Issue */}
              <div>
                <p className="text-xs font-semibold text-inputGrey uppercase tracking-wide mb-1">Issue Description</p>
                <p className="text-sm text-lorryDarkBlack leading-relaxed">{repair.issueDescription}</p>
              </div>

              {/* Service + costs */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-inputGrey mb-0.5">Service Type</p>
                  <p className="font-medium text-lorryDarkBlack">{repair.repairServiceName ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-inputGrey mb-0.5">Estimated Cost</p>
                  <p className="font-medium text-lorryDarkBlack">{fmt(repair.estimatedCost)}</p>
                </div>
                <div>
                  <p className="text-xs text-inputGrey mb-0.5">Final Cost</p>
                  <p className="font-medium text-lorryDarkBlack">{fmt(repair.finalCost)}</p>
                </div>
                {repair.completedAt && (
                  <div>
                    <p className="text-xs text-inputGrey mb-0.5">Completed</p>
                    <p className="font-medium text-lorryDarkBlack">
                      {new Date(repair.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {/* On-chain escrow */}
              <RepairEscrowPanel repairId={repairId} isAdmin={isAdmin} />

              {/* Device passport (Sui + Walrus) */}
              <DevicePassportPanel
                repairId={repairId}
                isAdmin={isAdmin}
                defaultBrand={repair.laptopBrand}
                defaultModel={repair.laptopModel}
              />

              {/* Admin: diagnose */}
              {isAdmin && repair.status === "pending" && (
                <div className="border border-inputBorderGrey rounded-lg p-4 space-y-3">
                  <p className="text-xs font-semibold text-inputGrey uppercase tracking-wide">Diagnose</p>
                  <select
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full text-sm border border-inputBorderGrey rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lorryBlue"
                  >
                    <option value="">Select repair service</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <div>
                    <input
                      type="number"
                      value={estCost}
                      onChange={(e) => setEstCost(e.target.value)}
                      placeholder="Estimated cost (₦)"
                      min={0}
                      className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lorryBlue ${
                        estCost !== "" && parseFloat(estCost) < 0 ? "border-lorryRed" : "border-inputBorderGrey"
                      }`}
                    />
                    {estCost !== "" && parseFloat(estCost) < 0 && (
                      <p className="text-xs text-lorryRed mt-1">Estimated cost cannot be negative</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (estCost !== "" && parseFloat(estCost) < 0) {
                        toast.error("Estimated cost cannot be negative");
                        return;
                      }
                      diagnoseMutation.mutate();
                    }}
                    disabled={diagnoseMutation.isPending}
                    className="w-full py-2 bg-lorryBlue text-white text-sm rounded-lg hover:bg-lorryBlue/90 disabled:opacity-50"
                  >
                    Save Diagnosis
                  </button>
                </div>
              )}

              {/* Admin: set final cost */}
              {isAdmin && repair.status === "completed" && repair.finalCost === null && (
                <div className="space-y-1">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={finalCost}
                      onChange={(e) => setFinalCost(e.target.value)}
                      placeholder="Final cost (₦)"
                      min={0}
                      className={`flex-1 text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lorryBlue ${
                        finalCost !== "" && parseFloat(finalCost) < 0 ? "border-lorryRed" : "border-inputBorderGrey"
                      }`}
                    />
                    <button
                      onClick={() => {
                        if (!finalCost) { toast.error("Final cost is required"); return; }
                        if (parseFloat(finalCost) < 0) { toast.error("Final cost cannot be negative"); return; }
                        finalCostMutation.mutate();
                      }}
                      disabled={!finalCost || finalCostMutation.isPending}
                      className="px-4 py-2 bg-lorryBlue text-white text-sm rounded-lg hover:bg-lorryBlue/90 disabled:opacity-50"
                    >
                      Set Cost
                    </button>
                  </div>
                  {finalCost !== "" && parseFloat(finalCost) < 0 && (
                    <p className="text-xs text-lorryRed">Final cost cannot be negative</p>
                  )}
                </div>
              )}

              {/* Admin: status actions */}
              {isAdmin && (
                <div className="flex gap-2 flex-wrap">
                  {NEXT_STATUS[repair.status] && (
                    <button
                      onClick={() => statusMutation.mutate(NEXT_STATUS[repair.status]!)}
                      disabled={statusMutation.isPending}
                      className="px-3 py-1.5 bg-lorryBlue text-white text-xs rounded-lg hover:bg-lorryBlue/90 disabled:opacity-50"
                    >
                      Mark as {NEXT_STATUS[repair.status]!.replace("_", " ")}
                    </button>
                  )}
                  {repair.status === "diagnosed" && (
                    <button
                      onClick={() => statusMutation.mutate("awaiting_parts")}
                      disabled={statusMutation.isPending}
                      className="px-3 py-1.5 bg-orange-100 text-orange-700 text-xs rounded-lg hover:bg-orange-200 disabled:opacity-50"
                    >
                      Awaiting Parts
                    </button>
                  )}
                  {repair.status !== "cancelled" && repair.status !== "completed" && (
                    confirmCancel ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-lorryRedText">Are you sure?</span>
                        <button
                          onClick={() => statusMutation.mutate("cancelled")}
                          disabled={statusMutation.isPending}
                          className="px-3 py-1.5 bg-lorryRedBg text-lorryRedText text-xs rounded-lg hover:bg-red-100 disabled:opacity-50"
                        >
                          {statusMutation.isPending ? "Cancelling…" : "Yes, cancel"}
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
                        Cancel
                      </button>
                    )
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const ALL_STATUSES: RepairStatus[] = [
  "pending", "diagnosed", "in_progress", "awaiting_parts", "completed", "cancelled",
];

export default function RepairsList() {
  const user    = getStoredUser();
  const isAdmin = user?.role === "admin";
  const qc      = useQueryClient();

  const [page,           setPage]           = useState(1);
  const [statusFilter,   setStatusFilter]   = useState("");
  const [showSubmit,     setShowSubmit]     = useState(false);
  const [selectedRepair, setSelectedRepair] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: [Query.GET_REPAIRS_QUERY, page, statusFilter],
    queryFn:  () => listRepairs({ page, limit: PAGE_LIMIT, status: statusFilter || undefined }),
  });

  const repairs: RepairRequest[] = (!data || "error" in data) ? [] : (data.data as RepairRequest[]) ?? [];
  const meta                     = (!data || "error" in data) ? null : data.meta;
  const pageCount                = meta?.pageCount ?? 1;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-lg font-semibold text-lorryDarkBlack">
          {isAdmin ? "All Repairs" : "My Repairs"}
        </h1>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-sm border border-inputBorderGrey rounded-lg px-3 py-1.5 text-lorryDarkBlack focus:outline-none focus:ring-2 focus:ring-lorryBlue"
          >
            <option value="">All statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
          {!isAdmin && (
            <button
              onClick={() => setShowSubmit(true)}
              className="px-4 py-1.5 bg-lorryBlue text-white text-sm font-medium rounded-lg hover:bg-lorryBlue/90"
            >
              + New Request
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-statBorderGrey overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-offWhiteBackground border-b border-inputBorderGrey">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-inputGrey uppercase tracking-wide">#</th>
                {isAdmin && <th className="px-4 py-3 text-left text-xs font-semibold text-inputGrey uppercase tracking-wide">Customer</th>}
                <th className="px-4 py-3 text-left text-xs font-semibold text-inputGrey uppercase tracking-wide">Device</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-inputGrey uppercase tracking-wide">Issue</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-inputGrey uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-inputGrey uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-inputBorderGrey">
              {isLoading && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-inputGrey">Loading…</td>
                </tr>
              )}
              {!isLoading && repairs.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-inputGrey">No repair requests found.</td>
                </tr>
              )}
              {repairs.map((repair) => (
                <tr
                  key={repair.id}
                  onClick={() => setSelectedRepair(repair.id)}
                  className="hover:bg-offWhiteBackground cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-lorryDarkBlack">#{repair.id}</td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-inputGrey">{repair.user?.fullName ?? "—"}</td>
                  )}
                  <td className="px-4 py-3 text-lorryDarkBlack">
                    {[repair.laptopBrand, repair.laptopModel].filter(Boolean).join(" ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-inputGrey max-w-xs truncate">{repair.issueDescription}</td>
                  <td className="px-4 py-3"><StatusBadge status={repair.status} /></td>
                  <td className="px-4 py-3 text-inputGrey">
                    {new Date(repair.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </td>
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

      {showSubmit && (
        <SubmitRepairModal
          onClose={() => setShowSubmit(false)}
          onSuccess={() => qc.invalidateQueries({ queryKey: [Query.GET_REPAIRS_QUERY] })}
        />
      )}
      {selectedRepair !== null && (
        <RepairDetailModal repairId={selectedRepair} onClose={() => setSelectedRepair(null)} />
      )}
    </div>
  );
}
