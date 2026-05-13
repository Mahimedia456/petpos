import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import apiFetch from "../../../lib/apiFetch";

function money(value) {
  return `Rs ${Number(value || 0).toLocaleString()}`;
}

function labelize(value) {
  return String(value || "-").replaceAll("_", " ");
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-5">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-base font-black text-slate-950">{value || "-"}</p>
    </div>
  );
}

export default function PromotionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [promotion, setPromotion] = useState(null);
  const [usages, setUsages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadPromotion() {
    try {
      setLoading(true);

      const res = await apiFetch(`/admin/promotions/${id}`);
      const json = await res.json();

      if (json?.ok) {
        setPromotion(json.data.promotion);
        setUsages(json.data.usages || []);
      }
    } catch (error) {
      console.error("[PromotionDetailPage]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPromotion();
  }, [id]);

  async function disablePromotion() {
    try {
      setMessage("");

      const res = await apiFetch(`/admin/promotions/${id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!json?.ok) {
        setMessage(json?.message || "Failed to disable promotion.");
        return;
      }

      navigate("/promotions");
    } catch (error) {
      console.error("[disablePromotion]", error);
      setMessage("Something went wrong.");
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm">
        Loading promotion...
      </div>
    );
  }

  if (!promotion) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-sm font-bold text-red-700 shadow-sm">
        Promotion not found.
      </div>
    );
  }

  const discountLabel =
    promotion.discount_type === "percentage"
      ? `${Number(promotion.discount_value || 0)}%`
      : money(promotion.discount_value);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
        <div>
          <Link
            to="/promotions"
            className="text-sm font-black text-slate-500 hover:text-slate-950"
          >
            ← Back to Promotions
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black text-slate-950">
              {promotion.name}
            </h1>

            {promotion.is_active ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-200">
                Active
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 ring-1 ring-slate-200">
                Disabled
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-slate-500">
            {promotion.description || "Promotion details and usage history."}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to={`/promotions/${id}/edit`}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            Edit
          </Link>

          <button
            type="button"
            onClick={disablePromotion}
            className="rounded-2xl bg-red-50 px-5 py-3 text-sm font-black text-red-700 ring-1 ring-red-200 hover:bg-red-100"
          >
            Disable
          </button>
        </div>
      </div>

      {message ? (
        <div className="rounded-2xl bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">
              Promotion Rules
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <InfoCard label="Code" value={promotion.code || "Automatic"} />
              <InfoCard
                label="Promotion Type"
                value={labelize(promotion.promotion_type)}
              />
              <InfoCard
                label="Discount Type"
                value={labelize(promotion.discount_type)}
              />
              <InfoCard label="Discount Value" value={discountLabel} />
              <InfoCard
                label="Applies To"
                value={labelize(promotion.applies_to)}
              />
              <InfoCard
                label="Target"
                value={promotion.product_name || promotion.category_name || "Cart"}
              />
              <InfoCard
                label="Minimum Order"
                value={money(promotion.min_order_amount)}
              />
              <InfoCard
                label="Max Discount"
                value={
                  promotion.max_discount_amount
                    ? money(promotion.max_discount_amount)
                    : "No limit"
                }
              />
              <InfoCard
                label="Usage"
                value={`${promotion.used_count || 0}${
                  promotion.usage_limit ? ` / ${promotion.usage_limit}` : ""
                }`}
              />
              <InfoCard
                label="Per Customer Limit"
                value={promotion.per_customer_limit || "No limit"}
              />
              <InfoCard
                label="Start Date"
                value={
                  promotion.start_date
                    ? new Date(promotion.start_date).toLocaleString()
                    : "Any time"
                }
              />
              <InfoCard
                label="End Date"
                value={
                  promotion.end_date
                    ? new Date(promotion.end_date).toLocaleString()
                    : "Any time"
                }
              />
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-6">
              <h2 className="text-xl font-black text-slate-950">
                Usage History
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Latest orders using this promotion.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Order</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Order Total</th>
                    <th className="px-6 py-4">Discount</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {usages.length ? (
                    usages.map((usage) => (
                      <tr key={usage.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-black text-slate-950">
                          {usage.order_number || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-700">
                            {usage.customer_name || "-"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {usage.customer_phone || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700">
                          {money(usage.order_total)}
                        </td>
                        <td className="px-6 py-4 font-black text-emerald-700">
                          {money(usage.discount_amount)}
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {usage.created_at
                            ? new Date(usage.created_at).toLocaleString()
                            : "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-10 text-center font-semibold text-slate-500"
                      >
                        No usage history yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[32px] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
            <h2 className="text-xl font-black">POS Usage</h2>

            <p className="mt-2 text-sm text-slate-300">
              Use this code inside POS checkout to apply discount:
            </p>

            <div className="mt-4 rounded-2xl bg-white/10 p-5 text-center">
              <p className="text-3xl font-black tracking-[0.2em]">
                {promotion.code || "AUTO"}
              </p>
            </div>

            <div className="mt-4 text-sm font-semibold text-slate-300">
              Discount: {discountLabel}
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">
              Validation Notes
            </h2>

            <div className="mt-4 space-y-3 text-sm font-semibold text-slate-600">
              <p>• Code must be active.</p>
              <p>• Date must be inside valid period.</p>
              <p>• Minimum order amount must match.</p>
              <p>• Usage limit must not be reached.</p>
              <p>• Product/category rule must match cart items.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}