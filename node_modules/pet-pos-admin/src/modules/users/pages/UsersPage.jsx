import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiFetch from "../../../lib/apiFetch";

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

function RoleBadge({ value }) {
  const styles = {
    admin: "bg-slate-950 text-white ring-slate-950",
    manager: "bg-blue-50 text-blue-700 ring-blue-200",
    cashier: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black capitalize ring-1 ${
        styles[value] || "bg-slate-100 text-slate-700 ring-slate-200"
      }`}
    >
      {labelize(value)}
    </span>
  );
}

function StatusBadge({ value }) {
  const styles = {
    active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    inactive: "bg-slate-100 text-slate-700 ring-slate-200",
    suspended: "bg-red-50 text-red-700 ring-red-200",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black capitalize ring-1 ${
        styles[value] || "bg-slate-100 text-slate-700 ring-slate-200"
      }`}
    >
      {labelize(value)}
    </span>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (role) params.set("role", role);
      if (status) params.set("status", status);

      const res = await apiFetch(`/admin/users?${params.toString()}`);
      const json = await res.json();

      if (json?.ok) {
        setUsers(json.data.users || []);
        setSummary(json.data.summary || null);
      }
    } catch (error) {
      console.error("[UsersPage]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadUsers, 250);
    return () => clearTimeout(timer);
  }, [search, role, status]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-400">
            Access Control
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            User Management
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Manage admins, managers, cashiers, account status, and role-based
            access.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/roles-permissions"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            Role Permissions
          </Link>

          <Link
            to="/users/new"
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800"
          >
            Add User
          </Link>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Total Users"
          value={summary?.total_users || 0}
          helper="Active records"
        />
        <StatCard title="Admins" value={summary?.admins || 0} />
        <StatCard title="Managers" value={summary?.managers || 0} />
        <StatCard title="Cashiers" value={summary?.cashiers || 0} />
        <StatCard
          title="Active"
          value={summary?.active_users || 0}
          helper="Can login"
        />
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone..."
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="cashier">Cashier</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Login</th>
                <th className="px-6 py-4">Created</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-10 text-center font-semibold text-slate-500"
                  >
                    Loading users...
                  </td>
                </tr>
              ) : users.length ? (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-black text-slate-950">
                        {user.name}
                      </div>
                      <div className="text-xs text-slate-500">{user.email}</div>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {user.phone || "-"}
                    </td>

                    <td className="px-6 py-4">
                      <RoleBadge value={user.role} />
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge value={user.status} />
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      {user.last_login_at
                        ? new Date(user.last_login_at).toLocaleString()
                        : "-"}
                    </td>

                    <td className="px-6 py-4 text-slate-500">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : "-"}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/users/${user.id}/edit`}
                        className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white hover:bg-slate-800"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-10 text-center font-semibold text-slate-500"
                  >
                    No users found.
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