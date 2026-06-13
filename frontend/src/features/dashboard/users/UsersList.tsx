import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listUsers, updateUserRole } from "../../../network/admin";
import { getStoredUser } from "../../../network/auth";
import { Query, PAGE_LIMIT } from "../../../network/constant";
import toast from "react-hot-toast";
import type { User } from "../../../network/auth";

// ─── Badges ───────────────────────────────────────────────────────────────────

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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active:    "bg-lorryGreenBg text-lorryGreenText",
    inactive:  "bg-lorryYellowBg text-lorryYellowText",
    suspended: "bg-lorryRedBg text-lorryRedText",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[status] ?? "bg-offWhiteBackground text-inputGrey"}`}>
      {status}
    </span>
  );
}

function VerifiedBadge({ verified }: { verified: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
      verified
        ? "bg-lorryGreenBg text-lorryGreenText"
        : "bg-lorryRedBg text-lorryRedText"
    }`}>
      {verified ? (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {verified ? "Verified" : "Unverified"}
    </span>
  );
}

// ─── Role Modal ───────────────────────────────────────────────────────────────

interface RoleModalProps {
  user: User;
  onClose: () => void;
  onConfirm: (role: "user" | "admin") => void;
  isLoading: boolean;
}

function RoleModal({ user, onClose, onConfirm, isLoading }: RoleModalProps) {
  const newRole = user.role === "admin" ? "user" : "admin";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-base font-semibold text-lorryDarkBlack mb-1">Change role</h3>
        <p className="text-sm text-inputGrey mb-5">
          Change <span className="font-medium text-lorryDarkBlack">{user.fullName}</span>'s role
          from <span className="font-medium">{user.role}</span> to{" "}
          <span className="font-medium">{newRole}</span>?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2 border border-inputBorderGrey rounded-lg text-sm font-medium text-buttonTextBlack hover:bg-pageWhite transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(newRole)}
            disabled={isLoading}
            className="flex-1 py-2 bg-lorryBlue text-white rounded-lg text-sm font-semibold hover:bg-lorryDarkBlue transition-colors disabled:opacity-60"
          >
            {isLoading ? "Updating..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UsersList() {
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const currentUser = getStoredUser();

  const { data: res, isLoading, isError } = useQuery({
    queryKey: [Query.GET_ALL_USERS_QUERY, page, PAGE_LIMIT],
    queryFn: () => listUsers(page, PAGE_LIMIT),
    placeholderData: (prev) => prev,
  });

  const { mutate: changeRole, isPending: isChanging } = useMutation({
    mutationFn: ({ id, role }: { id: number; role: "user" | "admin" }) =>
      updateUserRole(id, role),
    onSuccess: (result) => {
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Role updated successfully.");
      setSelectedUser(null);
      void queryClient.invalidateQueries({ queryKey: [Query.GET_ALL_USERS_QUERY] });
    },
  });

  const users = !res || "error" in res ? [] : (res.data ?? []);
  const meta  = !res || "error" in res ? null : res.meta;

  return (
    <>
      <div className="space-y-4">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-lorryDarkBlack">Users</h1>
            <p className="text-sm text-inputGrey mt-0.5">
              {meta ? `${meta.itemCount} registered accounts` : "Manage all user accounts"}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-statBorderGrey">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-statBorderGrey">
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-inputGrey uppercase tracking-wide">ID</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-inputGrey uppercase tracking-wide">Name</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-inputGrey uppercase tracking-wide">Email</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-inputGrey uppercase tracking-wide">Role</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-inputGrey uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-inputGrey uppercase tracking-wide">Email</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-inputGrey uppercase tracking-wide">Joined</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-inputGrey uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: PAGE_LIMIT }).map((_, i) => (
                      <tr key={i} className="border-b border-statBorderGrey last:border-0">
                        {Array.from({ length: 8 }).map((__, j) => (
                          <td key={j} className="px-5 py-3.5">
                            <div className="h-4 bg-offWhiteBackground rounded animate-pulse" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : isError
                  ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-10 text-center text-sm text-lorryRed">
                          Failed to load users. Please refresh.
                        </td>
                      </tr>
                    )
                  : users.map((user: User) => (
                      <tr
                        key={user.id}
                        className="border-b border-statBorderGrey last:border-0 hover:bg-pageWhite transition-colors"
                      >
                        <td className="px-5 py-3.5 text-textGrey font-mono text-xs">{user.id}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-lorryBlue/10 text-lorryBlue flex items-center justify-center text-xs font-semibold flex-shrink-0">
                              {user.fullName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-lorryDarkBlack whitespace-nowrap">{user.fullName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-textGrey">{user.email}</td>
                        <td className="px-5 py-3.5"><RoleBadge role={user.role} /></td>
                        <td className="px-5 py-3.5"><StatusBadge status={user.status} /></td>
                        <td className="px-5 py-3.5"><VerifiedBadge verified={user.isEmailVerified} /></td>
                        <td className="px-5 py-3.5 text-textGrey whitespace-nowrap">
                          {new Date(user.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                        </td>
                        <td className="px-5 py-3.5">
                          {user.id !== currentUser?.id ? (
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="text-xs font-medium text-lorryBlue hover:underline"
                            >
                              Change role
                            </button>
                          ) : (
                            <span className="text-xs text-inputGrey">You</span>
                          )}
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
                Page {meta.page} of {meta.pageCount} &middot; {meta.itemCount} users
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

      {/* Role change modal */}
      {selectedUser && (
        <RoleModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onConfirm={(role) => changeRole({ id: selectedUser.id, role })}
          isLoading={isChanging}
        />
      )}
    </>
  );
}
