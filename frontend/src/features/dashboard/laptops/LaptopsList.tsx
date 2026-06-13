import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listLaptops, type Laptop } from "../../../network/laptops";
import { getStoredUser } from "../../../network/auth";
import { Query, PAGE_LIMIT } from "../../../network/constant";

// ─── Spec pill ────────────────────────────────────────────────────────────────

function SpecPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded bg-offWhiteBackground text-xs text-inputGrey font-medium">
      {label}
    </span>
  );
}

// ─── Laptop card ──────────────────────────────────────────────────────────────

function LaptopCard({ laptop }: { laptop: Laptop }) {
  const specs = laptop.specs ?? [];
  // Show at most 4 key specs in the card
  const preview = specs.slice(0, 4);

  return (
    <div className="bg-white rounded-xl border border-statBorderGrey p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-lorryDarkBlack leading-snug">{laptop.name}</h3>
          {laptop.shortSummary && (
            <p className="text-xs text-inputGrey mt-0.5 line-clamp-2">{laptop.shortSummary}</p>
          )}
        </div>
        {!laptop.isActive && (
          <span className="flex-shrink-0 text-[10px] font-medium bg-lorryRedBg text-lorryRedText px-1.5 py-0.5 rounded">
            Inactive
          </span>
        )}
      </div>

      {/* Price */}
      <p className="text-2xl font-bold text-lorryBlue">
        ₦{laptop.basePrice.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
      </p>

      {/* Specs */}
      {preview.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {preview.map((s) => (
            <SpecPill key={s.specOptionId} label={s.specName} />
          ))}
          {specs.length > 4 && (
            <span className="text-xs text-inputGrey self-center">+{specs.length - 4} more</span>
          )}
        </div>
      ) : (
        <p className="text-xs text-inputGrey italic">No specs listed</p>
      )}
    </div>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function LaptopCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-statBorderGrey p-5 flex flex-col gap-3">
      <div className="h-4 w-36 bg-offWhiteBackground rounded animate-pulse" />
      <div className="h-3 w-48 bg-offWhiteBackground rounded animate-pulse" />
      <div className="h-7 w-24 bg-offWhiteBackground rounded animate-pulse" />
      <div className="flex gap-1.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-5 w-16 bg-offWhiteBackground rounded animate-pulse" />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LaptopsList() {
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState("");
  const [minPrice, setMin]    = useState("");
  const [maxPrice, setMax]    = useState("");
  const [applied, setApplied] = useState<{ search: string; min?: number; max?: number }>({ search: "" });

  const currentUser    = getStoredUser();
  const isAdmin        = currentUser?.role === "admin";

  const { data: res, isLoading } = useQuery({
    queryKey: [Query.GET_LAPTOPS_QUERY, page, PAGE_LIMIT, applied],
    queryFn: () =>
      listLaptops({
        page,
        limit: PAGE_LIMIT,
        search: applied.search || undefined,
        minPrice: applied.min,
        maxPrice: applied.max,
        includeInactive: isAdmin,
      }),
    placeholderData: (prev) => prev,
  });

  const laptops = !res || "error" in res ? [] : (res.data ?? []);
  const meta    = !res || "error" in res ? null : res.meta;

  const handleApply = () => {
    setPage(1);
    setApplied({
      search,
      min: minPrice ? parseFloat(minPrice) : undefined,
      max: maxPrice ? parseFloat(maxPrice) : undefined,
    });
  };

  const handleClear = () => {
    setSearch("");
    setMin("");
    setMax("");
    setPage(1);
    setApplied({ search: "" });
  };

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-lorryDarkBlack">Laptops</h1>
        <p className="text-sm text-inputGrey mt-0.5">
          {meta ? `${meta.itemCount} configurations available` : "Browse available laptop configurations"}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-statBorderGrey p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs font-medium text-inputGrey uppercase tracking-wide block mb-1">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleApply()}
              placeholder="Name or summary…"
              className="w-full h-9 px-3 rounded-lg border border-inputBorderGrey text-sm text-lorryDarkBlack placeholder:text-inputGrey focus:outline-none focus:border-lorryBlue bg-inputBorderBgGrey"
            />
          </div>
          <div className="w-28">
            <label className="text-xs font-medium text-inputGrey uppercase tracking-wide block mb-1">Min ₦</label>
            <input
              type="number"
              value={minPrice}
              onChange={(e) => setMin(e.target.value)}
              placeholder="0"
              min={0}
              className="w-full h-9 px-3 rounded-lg border border-inputBorderGrey text-sm text-lorryDarkBlack placeholder:text-inputGrey focus:outline-none focus:border-lorryBlue bg-inputBorderBgGrey"
            />
          </div>
          <div className="w-28">
            <label className="text-xs font-medium text-inputGrey uppercase tracking-wide block mb-1">Max ₦</label>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => setMax(e.target.value)}
              placeholder="Any"
              min={0}
              className="w-full h-9 px-3 rounded-lg border border-inputBorderGrey text-sm text-lorryDarkBlack placeholder:text-inputGrey focus:outline-none focus:border-lorryBlue bg-inputBorderBgGrey"
            />
          </div>
          <button
            onClick={handleApply}
            className="h-9 px-4 bg-lorryBlue text-white text-sm font-semibold rounded-lg hover:bg-lorryDarkBlue transition-colors"
          >
            Filter
          </button>
          {(applied.search || applied.min || applied.max) && (
            <button
              onClick={handleClear}
              className="h-9 px-4 border border-inputBorderGrey text-sm font-medium text-buttonTextBlack rounded-lg hover:bg-pageWhite transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: PAGE_LIMIT }).map((_, i) => <LaptopCardSkeleton key={i} />)
          : laptops.length === 0
          ? (
            <div className="col-span-full py-16 text-center">
              <p className="text-sm text-inputGrey">No laptops found.</p>
            </div>
          )
          : laptops.map((laptop) => <LaptopCard key={laptop.id} laptop={laptop} />)}
      </div>

      {/* Pagination */}
      {meta && meta.pageCount > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-inputGrey">
            Page {meta.page} of {meta.pageCount} &middot; {meta.itemCount} laptops
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
  );
}
