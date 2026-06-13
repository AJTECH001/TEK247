import { useQuery } from "@tanstack/react-query";
import { getMe, getStoredUser } from "../../../network/auth";
import { Query } from "../../../network/constant";
import { FaCopy, FaCheck } from "react-icons/fa";
import { useState } from "react";
import toast from "react-hot-toast";

function Field({ label, value, copyable = false }: { label: string; value: string; copyable?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="py-4 border-b border-statBorderGrey last:border-0">
      <p className="text-xs font-medium text-inputGrey uppercase tracking-wide mb-1">{label}</p>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-lorryDarkBlack break-all">{value}</p>
        {copyable && value && (
          <button
            onClick={handleCopy}
            className="p-1.5 text-inputGrey hover:text-lorryBlue transition-colors rounded-md hover:bg-pageWhite"
            title="Copy to clipboard"
          >
            {copied ? <FaCheck className="text-green-500" /> : <FaCopy />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ProfileMain() {
  const storedUser = getStoredUser();

  const { data: res, isLoading } = useQuery({
    queryKey: [Query.GET_ME_QUERY],
    queryFn: getMe,
    staleTime: 60_000,
  });

  const user = !res || "error" in res ? storedUser : res.data ?? storedUser;

  return (
    <div className="max-w-lg space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-lorryDarkBlack">Profile</h1>
        <p className="text-sm text-inputGrey mt-0.5">Your account information.</p>
      </div>

      <div className="bg-white rounded-xl border border-statBorderGrey p-5">
        {/* Avatar */}
        <div className="flex items-center gap-4 pb-5 border-b border-statBorderGrey mb-2">
          <div className="w-14 h-14 rounded-full bg-lorryBlue flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {isLoading
              ? "?"
              : (user?.fullName.charAt(0).toUpperCase() ?? "?")}
          </div>
          <div>
            {isLoading ? (
              <>
                <div className="h-5 w-36 bg-offWhiteBackground rounded animate-pulse mb-1" />
                <div className="h-3.5 w-24 bg-offWhiteBackground rounded animate-pulse" />
              </>
            ) : (
              <>
                <p className="font-semibold text-lorryDarkBlack">{user?.fullName}</p>
                <span className={`inline-block mt-0.5 text-xs font-medium px-2 py-0.5 rounded ${
                  user?.role === "admin"
                    ? "bg-lorryBlueBackground text-lorryBlueText"
                    : "bg-offWhiteBackground text-roleTextGrey"
                }`}>
                  {user?.role}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Fields */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="py-4 border-b border-statBorderGrey last:border-0">
                <div className="h-3 w-20 bg-offWhiteBackground rounded animate-pulse mb-2" />
                <div className="h-4 w-48 bg-offWhiteBackground rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : user ? (
          <>
            <Field label="Full Name"      value={user.fullName} />
            <Field label="Email"          value={user.email} />
            <Field label="Sui Wallet Address" value={user.suiAddress || "Not assigned"} copyable={!!user.suiAddress} />
            <Field label="Account Status" value={user.status} />
            <Field label="Email Verified" value={user.isEmailVerified ? "Yes" : "Not verified"} />
            <Field
              label="Member Since"
              value={new Date(user.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit", month: "long", year: "numeric",
              })}
            />
          </>
        ) : (
          <p className="text-sm text-inputGrey py-4">Could not load profile.</p>
        )}
      </div>
    </div>
  );
}
