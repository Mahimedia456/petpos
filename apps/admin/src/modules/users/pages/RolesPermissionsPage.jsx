import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiFetch from "../../../lib/apiFetch";

const PERMISSION_KEYS = [
  { key: "can_view", label: "View" },
  { key: "can_create", label: "Create" },
  { key: "can_edit", label: "Edit" },
  { key: "can_delete", label: "Delete" },
];

function labelize(value) {
  return String(value || "-").replaceAll("_", " ");
}

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState({});
  const [selectedRole, setSelectedRole] = useState("manager");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadPermissions() {
    try {
      setLoading(true);

      const res = await apiFetch("/admin/roles-permissions");
      const json = await res.json();

      if (json?.ok) {
        setRoles(json.data.roles || []);
        setPermissions(json.data.permissions || {});
      }
    } catch (error) {
      console.error("[RolesPermissionsPage]", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPermissions();
  }, []);

  const currentPermissions = permissions[selectedRole] || [];

  function updatePermission(moduleKey, key, value) {
    setPermissions((prev) => ({
      ...prev,
      [selectedRole]: (prev[selectedRole] || []).map((item) =>
        item.module_key === moduleKey
          ? {
              ...item,
              [key]: value,
              ...(key !== "can_view" && value ? { can_view: true } : {}),
              ...(key === "can_view" && !value
                ? {
                    can_create: false,
                    can_edit: false,
                    can_delete: false,
                  }
                : {}),
            }
          : item
      ),
    }));
  }

  async function savePermissions() {
    try {
      setSaving(true);
      setMessage("");

      const res = await apiFetch(`/admin/roles-permissions/${selectedRole}`, {
        method: "PATCH",
        body: JSON.stringify({
          permissions: currentPermissions,
        }),
      });

      const json = await res.json();

      if (!json?.ok) {
        setMessage(json?.message || "Failed to save permissions.");
        return;
      }

      setMessage("Role permissions saved successfully.");
      await loadPermissions();
    } catch (error) {
      console.error("[savePermissions]", error);
      setMessage("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm">
        Loading role permissions...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
        <div>
          <Link
            to="/users"
            className="text-sm font-black text-slate-500 hover:text-slate-950"
          >
            ← Back to Users
          </Link>

          <p className="mt-4 text-sm font-black uppercase tracking-[0.25em] text-slate-400">
            Role Access
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-950">
            Roles & Permissions
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Control module access for admin, manager, and cashier accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={savePermissions}
          disabled={saving}
          className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Permissions"}
        </button>
      </div>

      {message ? (
        <div className="rounded-2xl bg-slate-950 px-5 py-4 text-sm font-bold text-white">
          {message}
        </div>
      ) : null}

      <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-3">
          {roles.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              className={`rounded-2xl px-5 py-3 text-sm font-black capitalize ring-1 ${
                selectedRole === role
                  ? "bg-slate-950 text-white ring-slate-950"
                  : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {labelize(role)}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-xl font-black capitalize text-slate-950">
            {labelize(selectedRole)} Permissions
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Turning off View will also turn off Create, Edit, and Delete.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-4">Module</th>
                {PERMISSION_KEYS.map((perm) => (
                  <th key={perm.key} className="px-6 py-4 text-center">
                    {perm.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {currentPermissions.map((item) => (
                <tr key={item.module_key} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-black text-slate-950">
                      {item.module_label}
                    </div>
                    <div className="text-xs text-slate-500">
                      {item.module_key}
                    </div>
                  </td>

                  {PERMISSION_KEYS.map((perm) => (
                    <td key={perm.key} className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={Boolean(item[perm.key])}
                        disabled={selectedRole === "admin"}
                        onChange={(e) =>
                          updatePermission(
                            item.module_key,
                            perm.key,
                            e.target.checked
                          )
                        }
                        className="h-5 w-5 rounded border-slate-300"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedRole === "admin" ? (
          <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 text-sm font-bold text-slate-600">
            Admin role has full access by default. Editing is disabled here for
            safety.
          </div>
        ) : null}
      </div>
    </div>
  );
}