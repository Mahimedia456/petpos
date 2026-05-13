import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiFetch from "../../../lib/apiFetch";

function money(value) {
  return `Rs ${Number(value || 0).toLocaleString()}`;
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

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadCustomers() {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("active", "true");

      const res = await apiFetch(`/admin/customers?${params.toString()}`);
      const json = await res.json();

      if (json?.ok) {
        setCustomers(json.data.customers || []);
        setSummary(json.data.summary || null);
      }
    } catch (error) {
      console.error("[CustomersPage]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadCustomers, 250);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-400">
            Customer CRM
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            Customers & Pets
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Manage customer profiles, pet details, purchase history, WhatsApp
            communication, and pet care notes.
          </p>
        </div>

        <Link
          to="/customers/new"
          className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800"
        >
          Add Customer
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Customers"
          value={summary?.total_customers || 0}
          helper="Active customers"
        />
        <StatCard
          title="WhatsApp Opt-in"
          value={summary?.whatsapp_customers || 0}
          helper="Can receive updates"
        />
        <StatCard
          title="Total Orders"
          value={summary?.total_orders || 0}
          helper="Linked CRM orders"
        />
        <StatCard
          title="Total Spent"
          value={money(summary?.total_spent)}
          helper="Customer lifetime sales"
        />
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customer by name, phone, email, city..."
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
        />
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-xl font-black text-slate-950">Customer List</h2>
          <p className="mt-1 text-sm text-slate-500">
            Latest customers appear first.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">City</th>
                <th className="px-6 py-4">Pets</th>
                <th className="px-6 py-4">Orders</th>
                <th className="px-6 py-4">Spent</th>
                <th className="px-6 py-4">WhatsApp</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-10 text-center font-semibold text-slate-500"
                  >
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length ? (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-black text-slate-950">
                        {customer.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        Since{" "}
                        {customer.created_at
                          ? new Date(customer.created_at).toLocaleDateString()
                          : "-"}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-700">
                        {customer.phone || "-"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {customer.email || "-"}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {customer.city || "-"}
                    </td>

                    <td className="px-6 py-4 font-black text-slate-950">
                      {customer.pets_count || 0}
                    </td>

                    <td className="px-6 py-4 font-bold text-slate-700">
                      {customer.total_orders || 0}
                    </td>

                    <td className="px-6 py-4 font-black text-slate-950">
                      {money(customer.total_spent)}
                    </td>

                    <td className="px-6 py-4">
                      {customer.whatsapp_opt_in ? (
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-green-700 ring-1 ring-green-200">
                          Enabled
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 ring-1 ring-slate-200">
                          Disabled
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/customers/${customer.id}`}
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
                    colSpan="8"
                    className="px-6 py-10 text-center font-semibold text-slate-500"
                  >
                    No customers found.
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