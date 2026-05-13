import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiFetch from "../../../lib/apiFetch";

function money(value) {
  return `Rs ${Number(value || 0).toLocaleString()}`;
}

function labelize(value) {
  return String(value || "-").replaceAll("_", " ");
}

function StatCard({ title, value, helper }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <h3 className="mt-2 text-3xl font-black text-slate-950">{value}</h3>
      {helper ? (
        <p className="mt-1 text-xs font-semibold text-slate-400">{helper}</p>
      ) : null}
    </div>
  );
}

function StatusBadge({ active }) {
  return active ? (
    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-200">
      Active
    </span>
  ) : (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 ring-1 ring-slate-200">
      Disabled
    </span>
  );
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState("");
  const [promotionType, setPromotionType] = useState("");
  const [active, setActive] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadPromotions() {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (promotionType) params.set("promotion_type", promotionType);
      if (active) params.set("active", active);

      const res = await apiFetch(`/admin/promotions?${params.toString()}`);
      const json = await res.json();

      if (json?.ok) {
        setPromotions(json.data.promotions || []);
        setSummary(json.data.summary || null);
      }
    } catch (error) {
      console.error("[PromotionsPage]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadPromotions, 250);
    return () => clearTimeout(timer);
  }, [search, promotionType, active]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-400">
            Sales Engine
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            Promotions & Discounts
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Create coupon codes, automatic cart discounts, product/category
            promotions, and POS discount rules.
          </p>
        </div>

        <Link
          to="/promotions/new"
          className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800"
        >
          Create Promotion
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Promotions"
          value={summary?.total_promotions || 0}
          helper="All rules"
        />
        <StatCard
          title="Active"
          value={summary?.active_promotions || 0}
          helper="Enabled rules"
        />
        <StatCard
          title="Currently Valid"
          value={summary?.currently_valid || 0}
          helper="Date valid"
        />
        <StatCard
          title="Total Uses"
          value={summary?.total_uses || 0}
          helper="All-time usage"
        />
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, code, description..."
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950 xl:col-span-2"
          />

          <select
            value={promotionType}
            onChange={(e) => setPromotionType(e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
          >
            <option value="">All Types</option>
            <option value="coupon">Coupon</option>
            <option value="automatic">Automatic</option>
            <option value="bogo">BOGO</option>
          </select>

          <select
            value={active}
            onChange={(e) => setActive(e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Disabled</option>
          </select>
        </div>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Promotion</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Discount</th>
                <th className="px-6 py-4">Applies To</th>
                <th className="px-6 py-4">Usage</th>
                <th className="px-6 py-4">Validity</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-6 py-10 text-center font-semibold text-slate-500"
                  >
                    Loading promotions...
                  </td>
                </tr>
              ) : promotions.length ? (
                promotions.map((promo) => (
                  <tr key={promo.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-black text-slate-950">
                        {promo.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {promo.description || "-"}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {promo.code ? (
                        <span className="rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">
                          {promo.code}
                        </span>
                      ) : (
                        <span className="text-slate-400">Automatic</span>
                      )}
                    </td>

                    <td className="px-6 py-4 font-bold capitalize text-slate-700">
                      {labelize(promo.promotion_type)}
                    </td>

                    <td className="px-6 py-4 font-black text-slate-950">
                      {promo.discount_type === "percentage"
                        ? `${Number(promo.discount_value || 0)}%`
                        : money(promo.discount_value)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold capitalize text-slate-700">
                        {labelize(promo.applies_to)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {promo.product_name || promo.category_name || "-"}
                      </div>
                    </td>

                    <td className="px-6 py-4 font-bold text-slate-700">
                      {promo.used_count || 0}
                      {promo.usage_limit ? ` / ${promo.usage_limit}` : ""}
                    </td>

                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                      <div>
                        Start:{" "}
                        {promo.start_date
                          ? new Date(promo.start_date).toLocaleDateString()
                          : "Any"}
                      </div>
                      <div>
                        End:{" "}
                        {promo.end_date
                          ? new Date(promo.end_date).toLocaleDateString()
                          : "Any"}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge active={promo.is_active} />
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/promotions/${promo.id}`}
                        className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white hover:bg-slate-800"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="9"
                    className="px-6 py-10 text-center font-semibold text-slate-500"
                  >
                    No promotions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}