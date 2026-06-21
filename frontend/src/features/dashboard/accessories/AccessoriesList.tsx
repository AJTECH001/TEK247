import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  listAccessories,
  createAccessory,
  updateAccessory,
  updateAccessoryStock,
  deactivateAccessory,
  type Accessory,
  type AccessoryCategory,
} from "../../../network/accessories";
import { getStoredUser } from "../../../network/auth";
import { Query, PAGE_LIMIT } from "../../../network/constant";
import toast from "react-hot-toast";

const CATEGORIES: AccessoryCategory[] = ["bag", "mouse", "keyboard", "charger", "storage", "hub", "stand", "other"];

const fmt = (n: number) => "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 2 });

const accessorySchema = Yup.object({
  name: Yup.string().trim().min(2, "Name is too short").max(120).required("Name is required"),
  category: Yup.string().oneOf(CATEGORIES).required("Category is required"),
  price: Yup.number().min(0, "Price cannot be negative").required("Price is required"),
  quantityInStock: Yup.number().min(0, "Stock cannot be negative"),
  description: Yup.string().trim().max(1000),
});

function AccessoryModal({ existing, onClose, onSaved }: { existing?: Accessory; onClose: () => void; onSaved: () => void }) {
  const isEdit = !!existing;
  const mutation = useMutation({
    mutationFn: (v: { name: string; category: AccessoryCategory; price: number; quantityInStock: number; description: string }) =>
      isEdit
        ? updateAccessory(existing!.id, { name: v.name, price: v.price, description: v.description || null })
        : createAccessory({ name: v.name, category: v.category, price: v.price, quantityInStock: v.quantityInStock, description: v.description || undefined }),
    onSuccess: (res) => {
      if ("error" in res) { toast.error(res.error); return; }
      toast.success(isEdit ? "Accessory updated" : "Accessory created");
      onSaved(); onClose();
    },
  });

  const formik = useFormik({
    initialValues: {
      name: existing?.name ?? "",
      category: existing?.category ?? ("other" as AccessoryCategory),
      price: existing?.price ?? 0,
      quantityInStock: existing?.quantityInStock ?? 0,
      description: existing?.description ?? "",
    },
    validationSchema: accessorySchema,
    onSubmit: (v) => mutation.mutate(v),
  });

  const err = (k: keyof typeof formik.values) =>
    formik.touched[k] && formik.errors[k] ? <p className="text-xs text-lorryRed mt-1">{formik.errors[k] as string}</p> : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-inputBorderGrey">
          <h2 className="text-base font-semibold text-lorryDarkBlack">{isEdit ? "Edit Accessory" : "New Accessory"}</h2>
          <button onClick={onClose} className="text-inputGrey hover:text-lorryDarkBlack">✕</button>
        </div>
        <form onSubmit={formik.handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-inputGrey mb-1">Name</label>
            <input {...formik.getFieldProps("name")} className="w-full text-sm border border-inputBorderGrey rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lorryBlue" />
            {err("name")}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-inputGrey mb-1">Category</label>
              <select {...formik.getFieldProps("category")} disabled={isEdit} className="w-full text-sm border border-inputBorderGrey rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lorryBlue disabled:bg-offWhiteBackground">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-inputGrey mb-1">Price (₦)</label>
              <input type="number" min={0} step="0.01" {...formik.getFieldProps("price")} className="w-full text-sm border border-inputBorderGrey rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lorryBlue" />
              {err("price")}
            </div>
          </div>
          {!isEdit && (
            <div>
              <label className="block text-xs font-medium text-inputGrey mb-1">Initial Stock</label>
              <input type="number" min={0} {...formik.getFieldProps("quantityInStock")} className="w-full text-sm border border-inputBorderGrey rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lorryBlue" />
              {err("quantityInStock")}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-inputGrey mb-1">Description</label>
            <textarea {...formik.getFieldProps("description")} rows={3} className="w-full text-sm border border-inputBorderGrey rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-lorryBlue resize-none" />
          </div>
          <button type="submit" disabled={mutation.isPending} className="w-full py-2.5 bg-lorryBlue text-white text-sm font-medium rounded-lg hover:bg-lorryBlue/90 disabled:opacity-50">
            {mutation.isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Accessory"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AccessoriesList() {
  const user = getStoredUser();
  const isAdmin = user?.role === "admin";
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [modal, setModal] = useState<{ open: boolean; existing?: Accessory }>({ open: false });

  const { data, isLoading } = useQuery({
    queryKey: [Query.GET_ACCESSORIES_QUERY, page, category],
    queryFn: () => listAccessories({ page, limit: PAGE_LIMIT, category: category || undefined }),
  });

  const items: Accessory[] = (!data || "error" in data) ? [] : (data.data as Accessory[]) ?? [];
  const meta = (!data || "error" in data) ? null : data.meta;
  const pageCount = meta?.pageCount ?? 1;

  const invalidate = () => qc.invalidateQueries({ queryKey: [Query.GET_ACCESSORIES_QUERY] });

  const stockMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) => updateAccessoryStock(id, quantity),
    onSuccess: (res) => { if ("error" in res) { toast.error(res.error); return; } toast.success("Stock updated"); invalidate(); },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => deactivateAccessory(id),
    onSuccess: (res) => { if ("error" in res) { toast.error(res.error); return; } toast.success("Accessory deactivated"); invalidate(); },
  });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-lg font-semibold text-lorryDarkBlack">Accessories</h1>
        <div className="flex items-center gap-3">
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="text-sm border border-inputBorderGrey rounded-lg px-3 py-1.5 text-lorryDarkBlack focus:outline-none focus:ring-2 focus:ring-lorryBlue">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {isAdmin && (
            <button onClick={() => setModal({ open: true })} className="px-4 py-1.5 bg-lorryBlue text-white text-sm font-medium rounded-lg hover:bg-lorryBlue/90">
              + Add Accessory
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-statBorderGrey overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-offWhiteBackground border-b border-inputBorderGrey">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-inputGrey uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-inputGrey uppercase tracking-wide">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-inputGrey uppercase tracking-wide">Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-inputGrey uppercase tracking-wide">Stock</th>
                {isAdmin && <th className="px-4 py-3 text-left text-xs font-semibold text-inputGrey uppercase tracking-wide">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-inputBorderGrey">
              {isLoading && <tr><td colSpan={isAdmin ? 5 : 4} className="px-4 py-8 text-center text-inputGrey">Loading…</td></tr>}
              {!isLoading && items.length === 0 && <tr><td colSpan={isAdmin ? 5 : 4} className="px-4 py-8 text-center text-inputGrey">No accessories found.</td></tr>}
              {items.map((a) => (
                <tr key={a.id} className="hover:bg-offWhiteBackground transition-colors">
                  <td className="px-4 py-3 font-medium text-lorryDarkBlack">
                    {a.name}
                    {!a.isActive && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-lorryRedBg text-lorryRedText">inactive</span>}
                  </td>
                  <td className="px-4 py-3 text-inputGrey">{a.category}</td>
                  <td className="px-4 py-3 text-lorryDarkBlack">{fmt(a.price)}</td>
                  <td className="px-4 py-3">
                    <span className={a.quantityInStock === 0 ? "text-lorryRedText" : "text-lorryDarkBlack"}>{a.quantityInStock}</span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setModal({ open: true, existing: a })} className="text-xs text-lorryBlue hover:underline">Edit</button>
                        <button
                          onClick={() => { const v = prompt(`Set stock for "${a.name}"`, String(a.quantityInStock)); if (v !== null && !isNaN(+v)) stockMutation.mutate({ id: a.id, quantity: Math.max(0, Math.floor(+v)) }); }}
                          className="text-xs text-lorryBlue hover:underline">Stock</button>
                        {a.isActive && (
                          <button onClick={() => { if (confirm(`Deactivate "${a.name}"?`)) deactivateMutation.mutate(a.id); }} className="text-xs text-lorryRedText hover:underline">Deactivate</button>
                        )}
                      </div>
                    </td>
                  )}
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

      {modal.open && <AccessoryModal existing={modal.existing} onClose={() => setModal({ open: false })} onSaved={invalidate} />}
    </div>
  );
}
