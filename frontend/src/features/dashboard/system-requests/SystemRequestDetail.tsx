import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  getSystemRequest,
  closeSystemRequest,
  addRecommendation,
  removeRecommendation,
  updateSystemRequestStatus,
  type SystemRequestStatus,
  type Recommendation,
} from "../../../network/system-requests";
import { listLaptops } from "../../../network/laptops";
import { getStoredUser } from "../../../network/auth";
import { Query } from "../../../network/constant";
import toast from "react-hot-toast";

// ─── Status styles ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<SystemRequestStatus, string> = {
  pending:     "bg-lorryYellowBg text-lorryYellowText",
  recommended: "bg-lorryBlueBackground text-lorryBlueText",
  purchased:   "bg-lorryGreenBg text-lorryGreenText",
  closed:      "bg-offWhiteBackground text-inputGrey",
};

const ALL_STATUSES: SystemRequestStatus[] = ["pending", "recommended", "purchased", "closed"];

function StatusBadge({ status }: { status: SystemRequestStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

// ─── Budget formatter ─────────────────────────────────────────────────────────

function formatBudget(min: number | null, max: number | null): string {
  const fmt = (n: number) => "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 0 });
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (max)        return `Up to ${fmt(max)}`;
  if (min)        return `From ${fmt(min)}`;
  return "Not specified";
}

// ─── Recommendation card ──────────────────────────────────────────────────────

interface RecCardProps {
  rec: Recommendation;
  isAdmin: boolean;
  onRemove: (id: number) => void;
  isRemoving: boolean;
  onViewSpecs: () => void;
}

function RecommendationCard({ rec, isAdmin, onRemove, isRemoving, onViewSpecs }: RecCardProps) {
  return (
    <div className="bg-white rounded-xl border border-statBorderGrey p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          {/* Rank badge */}
          <div className="w-8 h-8 rounded-full bg-lorryBlue text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
            #{rec.rank}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-lorryDarkBlack">{rec.laptop.name}</h4>
            {rec.laptop.shortSummary && (
              <p className="text-xs text-inputGrey mt-0.5">{rec.laptop.shortSummary}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <p className="text-lg font-bold text-lorryBlue">
            ₦{rec.laptop.basePrice.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </p>
          {isAdmin && (
            <button
              onClick={() => onRemove(rec.id)}
              disabled={isRemoving}
              className="text-xs font-medium text-lorryRed hover:underline disabled:opacity-50"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Reason */}
      {rec.reason && (
        <p className="text-sm text-textGrey mb-3 bg-pageWhite rounded-lg px-3 py-2 italic">
          "{rec.reason}"
        </p>
      )}

      {/* Spec tags preview */}
      {rec.laptop.specs && rec.laptop.specs.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {rec.laptop.specs.slice(0, 4).map((s) => (
            <span
              key={s.specOptionId}
              className="inline-flex items-center px-2 py-0.5 rounded bg-offWhiteBackground text-xs text-inputGrey font-medium"
            >
              {s.specName}
            </span>
          ))}
          {rec.laptop.specs.length > 4 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-offWhiteBackground text-xs text-inputGrey font-medium">
              +{rec.laptop.specs.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* View full specs button */}
      <button
        onClick={onViewSpecs}
        className="flex items-center gap-1.5 text-xs font-semibold text-lorryBlue hover:underline"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        View full specifications
      </button>
    </div>
  );
}

// ─── Laptop Specs Modal ────────────────────────────────────────────────────────

const PRIORITY_CATEGORIES = ["Processor", "RAM", "Storage", "Graphics", "Display"];

const CATEGORY_ICONS: Record<string, string> = {
  Processor:    "⚙️",
  RAM:          "⚡",
  Storage:      "💾",
  Graphics:     "🎮",
  Display:      "🖥️",
  Connectivity: "🛜",
  Ports:        "🔌",
  Battery:      "🔋",
  Webcam:       "📷",
  Security:     "🔒",
  Audio:        "🔊",
  Color:        "🎨",
  Weight:       "⚖️",
  OS:           "💻",
};

function LaptopSpecsModal({ rec, onClose }: { rec: Recommendation; onClose: () => void }) {
  const { laptop } = rec;

  // Pull out "Condition" spec if present (e.g. "New" / "Used")
  const conditionSpec = laptop.specs?.find(
    (s) => s.categoryName.toLowerCase() === "condition"
  );
  const condition = conditionSpec?.specName ?? null;

  // Group remaining specs by category
  const specGroups = (laptop.specs ?? [])
    .filter((s) => s.categoryName.toLowerCase() !== "condition")
    .reduce<Record<string, string[]>>((acc, s) => {
      (acc[s.categoryName] ??= []).push(s.specName);
      return acc;
    }, {});

  const sortedCategories = [
    ...PRIORITY_CATEGORIES.filter((c) => specGroups[c]),
    ...Object.keys(specGroups).filter((c) => !PRIORITY_CATEGORIES.includes(c)),
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="bg-lorryBlue px-5 pt-5 pb-6 relative flex-shrink-0">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Top badges row */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {condition && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold ${
                condition.toLowerCase() === "new"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}>
                {condition.toUpperCase()}
              </span>
            )}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-white/20 text-xs font-semibold text-white">
              #{rec.rank} Recommendation
            </span>
          </div>

          {/* Short summary / category label */}
          {laptop.shortSummary && (
            <p className="text-white/65 text-xs font-semibold uppercase tracking-widest mb-1">
              {laptop.shortSummary}
            </p>
          )}

          {/* Laptop name */}
          <h2 className="text-white font-bold text-lg leading-snug pr-8">{laptop.name}</h2>

          {/* Price */}
          <p className="text-white font-bold text-2xl mt-3">
            ₦{laptop.basePrice.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* ── Body ── */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Admin note */}
          {rec.reason && (
            <div className="flex gap-2.5 bg-lorryBlue/6 border border-lorryBlue/15 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 text-lorryBlue flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4-3-3z" />
              </svg>
              <p className="text-sm text-lorryDarkBlack italic leading-relaxed">"{rec.reason}"</p>
            </div>
          )}

          {/* Spec list */}
          {sortedCategories.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-inputGrey uppercase tracking-wider mb-4">
                Full Specifications
              </p>
              <div className="space-y-3">
                {sortedCategories.map((category) => (
                  <div key={category} className="flex items-start gap-3">
                    {/* Category icon */}
                    <span className="text-base flex-shrink-0 mt-0.5">
                      {CATEGORY_ICONS[category] ?? "•"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-inputGrey font-medium mb-0.5">{category}</p>
                      {specGroups[category].map((name, i) => (
                        <p
                          key={i}
                          className={`text-sm leading-snug ${
                            PRIORITY_CATEGORIES.includes(category)
                              ? "font-semibold text-lorryDarkBlack"
                              : "text-textGrey"
                          }`}
                        >
                          {name}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-inputGrey text-center py-6">No specifications listed.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Add Recommendation Modal ─────────────────────────────────────────────────

const addRecommendationSchema = Yup.object({
  configurationId: Yup.string()
    .required("Please select a laptop"),
  rank: Yup.number()
    .integer("Rank must be a whole number")
    .min(1, "Rank must be at least 1")
    .required("Rank is required"),
  reason: Yup.string()
    .trim()
    .max(1000, "Reason must be under 1000 characters"),
});

interface AddRecModalProps {
  requestId: number;
  onClose: () => void;
  onSuccess: () => void;
}

function AddRecommendationModal({ requestId, onClose, onSuccess }: AddRecModalProps) {
  // Fetch all active laptops for the dropdown
  const { data: laptopsRes, isLoading: loadingLaptops } = useQuery({
    queryKey: [Query.GET_LAPTOPS_QUERY, "all-for-rec"],
    queryFn: () => listLaptops({ limit: 100 }),
  });
  const laptops = !laptopsRes || "error" in laptopsRes ? [] : (laptopsRes.data ?? []);

  const mutation = useMutation({
    mutationFn: (values: { configurationId: string; rank: number; reason: string }) =>
      addRecommendation(requestId, {
        configurationId: parseInt(values.configurationId, 10),
        rank:            values.rank,
        reason:          values.reason.trim() || undefined,
      }),
    onSuccess: (result) => {
      if ("error" in result) { toast.error(result.error); return; }
      toast.success("Recommendation added.");
      onSuccess();
      onClose();
    },
  });

  const formik = useFormik({
    initialValues: { configurationId: "", rank: 1, reason: "" },
    validationSchema: addRecommendationSchema,
    onSubmit: (values) => mutation.mutate(values),
  });

  const fieldErr = (name: keyof typeof formik.values) =>
    formik.touched[name] && formik.errors[name]
      ? <p className="text-xs text-lorryRed mt-1">{formik.errors[name] as string}</p>
      : null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-statBorderGrey">
          <h3 className="text-base font-semibold text-lorryDarkBlack">Add Recommendation</h3>
          <p className="text-xs text-inputGrey mt-0.5">Select a laptop and set a rank for this request.</p>
        </div>

        <form onSubmit={formik.handleSubmit} className="p-6 space-y-4">
          {/* Laptop select */}
          <div>
            <label className="block text-xs font-medium text-inputGrey uppercase tracking-wide mb-1.5">
              Laptop <span className="text-lorryRed">*</span>
            </label>
            {loadingLaptops ? (
              <div className="h-9 bg-offWhiteBackground rounded-lg animate-pulse" />
            ) : (
              <select
                {...formik.getFieldProps("configurationId")}
                className={`w-full h-9 px-3 rounded-lg border text-sm text-lorryDarkBlack focus:outline-none focus:border-lorryBlue bg-inputBorderBgGrey ${
                  formik.touched.configurationId && formik.errors.configurationId
                    ? "border-lorryRed"
                    : "border-inputBorderGrey"
                }`}
              >
                <option value="">Select a laptop…</option>
                {laptops.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} — ₦{l.basePrice.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                  </option>
                ))}
              </select>
            )}
            {fieldErr("configurationId")}
          </div>

          {/* Rank */}
          <div>
            <label className="block text-xs font-medium text-inputGrey uppercase tracking-wide mb-1.5">
              Rank <span className="text-lorryRed">*</span>
            </label>
            <input
              type="number"
              {...formik.getFieldProps("rank")}
              min={1}
              className={`w-full h-9 px-3 rounded-lg border text-sm text-lorryDarkBlack focus:outline-none focus:border-lorryBlue bg-inputBorderBgGrey ${
                formik.touched.rank && formik.errors.rank ? "border-lorryRed" : "border-inputBorderGrey"
              }`}
            />
            {fieldErr("rank") ?? <p className="text-xs text-inputGrey mt-1">1 = top recommendation</p>}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-medium text-inputGrey uppercase tracking-wide mb-1.5">
              Reason (optional)
            </label>
            <textarea
              {...formik.getFieldProps("reason")}
              placeholder="Why this laptop is a good fit…"
              rows={3}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm text-lorryDarkBlack placeholder:text-inputGrey focus:outline-none focus:border-lorryBlue bg-inputBorderBgGrey resize-none ${
                formik.touched.reason && formik.errors.reason ? "border-lorryRed" : "border-inputBorderGrey"
              }`}
            />
            {fieldErr("reason")}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="flex-1 py-2.5 border border-inputBorderGrey rounded-lg text-sm font-medium text-buttonTextBlack hover:bg-pageWhite transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 py-2.5 bg-lorryBlue text-white rounded-lg text-sm font-semibold hover:bg-lorryDarkBlue transition-colors disabled:opacity-60"
            >
              {mutation.isPending ? "Adding…" : "Add Recommendation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SystemRequestDetail() {
  const { id }      = useParams<{ id: string }>();
  const navigate    = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = getStoredUser();
  const isAdmin     = currentUser?.role === "admin";
  const requestId   = parseInt(id!, 10);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);

  const { data: res, isLoading } = useQuery({
    queryKey: [Query.GET_SYSTEM_REQUEST_DETAIL_QUERY, requestId],
    queryFn: () => getSystemRequest(requestId),
    enabled: !isNaN(requestId),
  });

  const request = !res || "error" in res ? null : res.data ?? null;

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: [Query.GET_SYSTEM_REQUEST_DETAIL_QUERY, requestId],
    });

  const closeMutation = useMutation({
    mutationFn: () => closeSystemRequest(requestId),
    onSuccess: (result) => {
      if ("error" in result) { toast.error(result.error); return; }
      toast.success("Request closed.");
      invalidate();
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: SystemRequestStatus) =>
      updateSystemRequestStatus(requestId, status),
    onSuccess: (result) => {
      if ("error" in result) { toast.error(result.error); return; }
      toast.success("Status updated.");
      invalidate();
    },
  });

  const removeRecMutation = useMutation({
    mutationFn: (recId: number) => removeRecommendation(requestId, recId),
    onSuccess: (result) => {
      if ("error" in result) { toast.error(result.error); return; }
      toast.success("Recommendation removed.");
      invalidate();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-offWhiteBackground rounded animate-pulse" />
        <div className="h-40 bg-offWhiteBackground rounded-xl animate-pulse" />
        <div className="h-32 bg-offWhiteBackground rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-inputGrey">Request not found or you don't have access.</p>
        <button
          onClick={() => navigate("/dashboard/system-requests")}
          className="mt-4 text-sm text-lorryBlue hover:underline font-medium"
        >
          ← Back to requests
        </button>
      </div>
    );
  }

  const isClosed   = request.status === "closed" || request.status === "purchased";
  const canClose   = !isClosed;
  const recommendations = request.recommendations ?? [];

  return (
    <>
      <div className="space-y-5 max-w-3xl">
        {/* Back + title row */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard/system-requests")}
            className="flex items-center gap-1.5 text-sm text-inputGrey hover:text-lorryDarkBlack transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Requests
          </button>
          <span className="text-inputGrey">/</span>
          <span className="text-sm font-medium text-lorryDarkBlack">Request #{request.id}</span>
        </div>

        {/* Request details card */}
        <div className="bg-white rounded-xl border border-statBorderGrey p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <StatusBadge status={request.status} />
                <span className="text-xs text-inputGrey">
                  Submitted {new Date(request.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
                </span>
              </div>
              {isAdmin && request.user && (
                <p className="text-xs text-inputGrey">
                  By{" "}
                  <span className="font-medium text-lorryDarkBlack">{request.user.fullName}</span>
                  {" "}({request.user.email})
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Admin: status update dropdown */}
              {isAdmin && (
                <select
                  value={request.status}
                  onChange={(e) => statusMutation.mutate(e.target.value as SystemRequestStatus)}
                  disabled={statusMutation.isPending}
                  className="h-8 px-2.5 rounded-lg border border-inputBorderGrey text-xs text-lorryDarkBlack focus:outline-none focus:border-lorryBlue bg-inputBorderBgGrey disabled:opacity-60"
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
              {/* User: close button */}
              {!isAdmin && canClose && (
                <button
                  onClick={() => closeMutation.mutate()}
                  disabled={closeMutation.isPending}
                  className="h-8 px-3 border border-inputBorderGrey text-xs font-medium text-buttonTextBlack rounded-lg hover:bg-pageWhite transition-colors disabled:opacity-50"
                >
                  {closeMutation.isPending ? "Closing…" : "Close Request"}
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-medium text-inputGrey uppercase tracking-wide mb-1.5">Description</p>
            <p className="text-sm text-lorryDarkBlack leading-relaxed">{request.description}</p>
          </div>

          {/* Budget */}
          <div>
            <p className="text-xs font-medium text-inputGrey uppercase tracking-wide mb-1.5">Budget</p>
            <p className="text-sm font-medium text-lorryDarkBlack">
              {formatBudget(request.budgetMin, request.budgetMax)}
            </p>
          </div>
        </div>

        {/* Recommendations section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-lorryDarkBlack">
              Recommendations ({recommendations.length})
            </h3>
            {isAdmin && !isClosed && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 h-8 px-3 bg-lorryBlue text-white text-xs font-semibold rounded-lg hover:bg-lorryDarkBlue transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Recommendation
              </button>
            )}
          </div>

          {recommendations.length === 0 ? (
            <div className="bg-white rounded-xl border border-statBorderGrey py-12 text-center">
              <p className="text-sm text-inputGrey">
                {isAdmin
                  ? "No recommendations yet. Add one above."
                  : "No recommendations yet. Our team will review your request shortly."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations
                .sort((a: Recommendation, b: Recommendation) => a.rank - b.rank)
                .map((rec: Recommendation) => (
                  <RecommendationCard
                    key={rec.id}
                    rec={rec}
                    isAdmin={isAdmin}
                    onRemove={(recId) => removeRecMutation.mutate(recId)}
                    isRemoving={removeRecMutation.isPending}
                    onViewSpecs={() => setSelectedRec(rec)}
                  />
                ))}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddRecommendationModal
          requestId={requestId}
          onClose={() => setShowAddModal(false)}
          onSuccess={invalidate}
        />
      )}

      {selectedRec && (
        <LaptopSpecsModal
          rec={selectedRec}
          onClose={() => setSelectedRec(null)}
        />
      )}
    </>
  );
}
