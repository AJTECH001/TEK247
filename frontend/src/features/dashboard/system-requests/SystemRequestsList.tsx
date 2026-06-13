import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  listSystemRequests,
  createSystemRequest,
  type SystemRequest,
  type SystemRequestStatus,
} from "../../../network/system-requests";
import { getStoredUser } from "../../../network/auth";
import { Query, PAGE_LIMIT } from "../../../network/constant";
import toast from "react-hot-toast";

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<SystemRequestStatus, string> = {
  pending:     "bg-lorryYellowBg text-lorryYellowText",
  recommended: "bg-lorryBlueBackground text-lorryBlueText",
  purchased:   "bg-lorryGreenBg text-lorryGreenText",
  closed:      "bg-offWhiteBackground text-inputGrey",
};

function StatusBadge({ status }: { status: SystemRequestStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

// ─── Budget formatter ─────────────────────────────────────────────────────────

function formatBudget(min: number | null, max: number | null): string {
  const fmt = (n: number) =>
    "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 0 });
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (max)        return `Up to ${fmt(max)}`;
  if (min)        return `From ${fmt(min)}`;
  return "Not specified";
}

// ─── Submit request modal ─────────────────────────────────────────────────────

interface SubmitModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const submitRequestSchema = Yup.object({
  description: Yup.string()
    .trim()
    .min(10, "Please describe your needs in at least 10 characters")
    .max(2000, "Description must be under 2000 characters")
    .required("Description is required"),
  budgetMin: Yup.number()
    .min(0, "Budget cannot be negative")
    .nullable()
    .transform((v, orig) => (orig === "" ? null : v)),
  budgetMax: Yup.number()
    .min(0, "Budget cannot be negative")
    .nullable()
    .transform((v, orig) => (orig === "" ? null : v))
    .when("budgetMin", ([budgetMin], schema) =>
      budgetMin != null
        ? schema.min(budgetMin, "Max budget must be greater than or equal to min budget")
        : schema
    ),
});

function SubmitRequestModal({ onClose, onSuccess }: SubmitModalProps) {
  const mutation = useMutation({
    mutationFn: (values: { description: string; budgetMin: number | null; budgetMax: number | null }) =>
      createSystemRequest({
        description: values.description.trim(),
        budgetMin:   values.budgetMin   ?? undefined,
        budgetMax:   values.budgetMax   ?? undefined,
      }),
    onSuccess: (result) => {
      if ("error" in result) { toast.error(result.error); return; }
      toast.success("Request submitted successfully!");
      onSuccess();
      onClose();
    },
  });

  const formik = useFormik({
    initialValues: { description: "", budgetMin: "" as unknown as number | null, budgetMax: "" as unknown as number | null },
    validationSchema: submitRequestSchema,
    onSubmit: (values) => {
      mutation.mutate({
        description: values.description,
        budgetMin:   values.budgetMin as number | null,
        budgetMax:   values.budgetMax as number | null,
      });
    },
  });

  const fieldErr = (name: keyof typeof formik.values) =>
    formik.touched[name] && formik.errors[name]
      ? <p className="text-xs text-lorryRed mt-1">{formik.errors[name] as string}</p>
      : null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-statBorderGrey">
          <h3 className="text-base font-semibold text-lorryDarkBlack">Submit a System Request</h3>
          <p className="text-xs text-inputGrey mt-0.5">
            Describe what you need — our team will recommend the best laptop for you.
          </p>
        </div>

        <form onSubmit={formik.handleSubmit} className="p-6 space-y-4">
          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-inputGrey uppercase tracking-wide mb-1.5">
              What do you need? <span className="text-lorryRed">*</span>
            </label>
            <textarea
              {...formik.getFieldProps("description")}
              placeholder="e.g. I need a laptop for engineering CAD work, heavy multitasking, and occasional gaming. Must handle AutoCAD and SolidWorks."
              rows={4}
              maxLength={2000}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm text-lorryDarkBlack placeholder:text-inputGrey focus:outline-none focus:border-lorryBlue bg-inputBorderBgGrey resize-none ${
                formik.touched.description && formik.errors.description
                  ? "border-lorryRed"
                  : "border-inputBorderGrey"
              }`}
            />
            <div className="flex items-center justify-between mt-1">
              {fieldErr("description")}
              <p className="text-xs text-inputGrey ml-auto">{formik.values.description.length}/2000</p>
            </div>
          </div>

          {/* Budget */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-inputGrey uppercase tracking-wide mb-1.5">
                Min Budget (₦)
              </label>
              <input
                type="number"
                {...formik.getFieldProps("budgetMin")}
                placeholder="Optional"
                min={0}
                className={`w-full h-9 px-3 rounded-lg border text-sm text-lorryDarkBlack placeholder:text-inputGrey focus:outline-none focus:border-lorryBlue bg-inputBorderBgGrey ${
                  formik.touched.budgetMin && formik.errors.budgetMin
                    ? "border-lorryRed"
                    : "border-inputBorderGrey"
                }`}
              />
              {fieldErr("budgetMin")}
            </div>
            <div>
              <label className="block text-xs font-medium text-inputGrey uppercase tracking-wide mb-1.5">
                Max Budget (₦)
              </label>
              <input
                type="number"
                {...formik.getFieldProps("budgetMax")}
                placeholder="Optional"
                min={0}
                className={`w-full h-9 px-3 rounded-lg border text-sm text-lorryDarkBlack placeholder:text-inputGrey focus:outline-none focus:border-lorryBlue bg-inputBorderBgGrey ${
                  formik.touched.budgetMax && formik.errors.budgetMax
                    ? "border-lorryRed"
                    : "border-inputBorderGrey"
                }`}
              />
              {fieldErr("budgetMax")}
            </div>
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
              {mutation.isPending ? "Submitting…" : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SystemRequestsList() {
  const [page, setPage]       = useState(1);
  const [showModal, setModal] = useState(false);
  const navigate              = useNavigate();
  const queryClient           = useQueryClient();
  const currentUser           = getStoredUser();
  const isAdmin               = currentUser?.role === "admin";

  const { data: res, isLoading } = useQuery({
    queryKey: [Query.GET_SYSTEM_REQUESTS_QUERY, page, PAGE_LIMIT],
    queryFn: () => listSystemRequests(page, PAGE_LIMIT),
    placeholderData: (prev) => prev,
  });

  const requests = !res || "error" in res ? [] : (res.data ?? []);
  const meta     = !res || "error" in res ? null : res.meta;

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-lorryDarkBlack">System Requests</h1>
            <p className="text-sm text-inputGrey mt-0.5">
              {isAdmin
                ? `${meta?.itemCount ?? "—"} total requests`
                : "Your personal shopper requests"}
            </p>
          </div>
          {!isAdmin && (
            <button
              onClick={() => setModal(true)}
              className="flex items-center gap-2 h-9 px-4 bg-lorryBlue text-white text-sm font-semibold rounded-lg hover:bg-lorryDarkBlue transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Request
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-statBorderGrey">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-statBorderGrey">
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-inputGrey uppercase tracking-wide">ID</th>
                  {isAdmin && (
                    <th className="px-5 py-3.5 text-left text-xs font-medium text-inputGrey uppercase tracking-wide">User</th>
                  )}
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-inputGrey uppercase tracking-wide">Description</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-inputGrey uppercase tracking-wide">Budget</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-inputGrey uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-inputGrey uppercase tracking-wide">Date</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-inputGrey uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: PAGE_LIMIT }).map((_, i) => (
                      <tr key={i} className="border-b border-statBorderGrey last:border-0">
                        {Array.from({ length: isAdmin ? 7 : 6 }).map((__, j) => (
                          <td key={j} className="px-5 py-3.5">
                            <div className="h-4 bg-offWhiteBackground rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : requests.length === 0
                  ? (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 6} className="px-5 py-14 text-center text-sm text-inputGrey">
                        {isAdmin ? "No requests yet." : "You haven't submitted any requests yet."}
                      </td>
                    </tr>
                  )
                  : requests.map((req: SystemRequest) => (
                    <tr
                      key={req.id}
                      className="border-b border-statBorderGrey last:border-0 hover:bg-pageWhite transition-colors"
                    >
                      <td className="px-5 py-3.5 text-xs font-mono text-textGrey">#{req.id}</td>
                      {isAdmin && (
                        <td className="px-5 py-3.5">
                          <div>
                            <p className="text-xs font-medium text-lorryDarkBlack">{req.user?.fullName ?? "—"}</p>
                            <p className="text-xs text-inputGrey">{req.user?.email ?? ""}</p>
                          </div>
                        </td>
                      )}
                      <td className="px-5 py-3.5 max-w-xs">
                        <p className="text-sm text-lorryDarkBlack line-clamp-2">{req.description}</p>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-sm text-textGrey">
                        {formatBudget(req.budgetMin, req.budgetMax)}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-textGrey">
                        {new Date(req.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => navigate(`/dashboard/system-requests/${req.id}`)}
                          className="text-xs font-medium text-lorryBlue hover:underline"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.pageCount > 1 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-statBorderGrey">
              <p className="text-xs text-inputGrey">
                Page {meta.page} of {meta.pageCount}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={!meta.hasPreviousPage}
                  className="px-3 py-1.5 text-xs font-medium border border-inputBorderGrey rounded-lg text-buttonTextBlack hover:bg-pageWhite disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!meta.hasNextPage}
                  className="px-3 py-1.5 text-xs font-medium border border-inputBorderGrey rounded-lg text-buttonTextBlack hover:bg-pageWhite disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <SubmitRequestModal
          onClose={() => setModal(false)}
          onSuccess={() => {
            void queryClient.invalidateQueries({ queryKey: [Query.GET_SYSTEM_REQUESTS_QUERY] });
          }}
        />
      )}
    </>
  );
}
