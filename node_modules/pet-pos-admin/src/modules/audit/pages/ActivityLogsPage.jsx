import { useEffect, useMemo, useState } from "react";
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

function ActionBadge({ value }) {
  const styles = {
    create: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    update: "bg-blue-50 text-blue-700 ring-blue-200",
    delete: "bg-red-50 text-red-700 ring-red-200",
    archive: "bg-orange-50 text-orange-700 ring-orange-200",
    checkout: "bg-purple-50 text-purple-700 ring-purple-200",
    stock_adjustment: "bg-cyan-50 text-cyan-700 ring-cyan-200",
    status_update: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    payment_update: "bg-teal-50 text-teal-700 ring-teal-200",
    permission_update: "bg-rose-50 text-rose-700 ring-rose-200",
    settings_update: "bg-slate-950 text-white ring-slate-950",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black capitalize ring-1 ${
        styles[value] || "bg-slate-100 text-slate-700 ring-slate-200"
      }`}
    >
      {labelize(value)}
    </span>
  );
}

function ModuleBadge({ value }) {
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black capitalize text-slate-700 ring-1 ring-slate-200">
      {labelize(value)}
    </span>
  );
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [actionSummary, setActionSummary] = useState([]);
  const [moduleSummary, setModuleSummary] = useState([]);
  const [filtersData, setFiltersData] = useState({
    modules: [],
    actions: [],
  });

  const [filters, setFilters] = useState({
    search: "",
    module_key: "",
    action: "",
    actor_email: "",
    date_from: "",
    date_to: "",
  });

  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    params.set("limit", "200");

    return params.toString();
  }, [filters]);

  function updateFilter(name, value) {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function loadLogs() {
    try {
      setLoading(true);
      setMessage("");

      const res = await apiFetch(`/admin/activity-logs?${queryString}`);
      const json = await res.json();

      if (!json?.ok) {
        setMessage(json?.message || "Failed to load activity logs.");
        return;
      }

      setLogs(json.data.logs || []);
      setSummary(json.data.summary || null);
      setActionSummary(json.data.action_summary || []);
      setModuleSummary(json.data.module_summary || []);
      setFiltersData(json.data.filters || { modules: [], actions: [] });
    } catch (error) {
      console.error("[ActivityLogsPage]", error);
      setMessage("Something went wrong while loading activity logs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadLogs, 250);
    return () => clearTimeout(timer);
  }, [queryString]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-400">
            Audit Trail
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">
            Activity Logs
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Track user actions, stock changes, order updates, settings changes,
            role permissions, and sensitive system activity.
          </p>
        </div>

        <button
          type="button"
          onClick={loadLogs}
          className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-slate-800"
        >
          Refresh
        </button>
      </div>

      {message ? (
        <div className="rounded-2xl bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {message}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Logs"
          value={summary?.total_logs || 0}
          helper="All recorded actions"
        />
        <StatCard
          title="Today"
          value={summary?.today_logs || 0}
          helper="Actions today"
        />
        <StatCard
          title="Destructive"
          value={summary?.destructive_actions || 0}
          helper="Delete/archive actions"
        />
        <StatCard
          title="Actors"
          value={summary?.active_actors || 0}
          helper="Users with activity"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">
            Top Actions
          </h2>

          <div className="mt-5 flex flex-wrap gap-2">
            {actionSummary.length ? (
              actionSummary.map((item) => (
                <span
                  key={item.action}
                  className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-700"
                >
                  {labelize(item.action)}: {item.count}
                </span>
              ))
            ) : (
              <p className="text-sm font-semibold text-slate-500">
                No action data.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">
            Top Modules
          </h2>

          <div className="mt-5 flex flex-wrap gap-2">
            {moduleSummary.length ? (
              moduleSummary.map((item) => (
                <span
                  key={item.module_key}
                  className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-700"
                >
                  {labelize(item.module_key)}: {item.count}
                </span>
              ))
            ) : (
              <p className="text-sm font-semibold text-slate-500">
                No module data.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <input
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            placeholder="Search title, user, module..."
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950 xl:col-span-2"
          />

          <select
            value={filters.module_key}
            onChange={(e) => updateFilter("module_key", e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
          >
            <option value="">All Modules</option>
            {filtersData.modules.map((module) => (
              <option key={module} value={module}>
                {labelize(module)}
              </option>
            ))}
          </select>

          <select
            value={filters.action}
            onChange={(e) => updateFilter("action", e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
          >
            <option value="">All Actions</option>
            {filtersData.actions.map((action) => (
              <option key={action} value={action}>
                {labelize(action)}
              </option>
            ))}
          </select>

          <input
            value={filters.actor_email}
            onChange={(e) => updateFilter("actor_email", e.target.value)}
            placeholder="Actor email..."
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-slate-950"
          />

          <button
            type="button"
            onClick={() =>
              setFilters({
                search: "",
                module_key: "",
                action: "",
                actor_email: "",
                date_from: "",
                date_to: "",
              })
            }
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-100"
          >
            Reset
          </button>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => updateFilter("date_from", e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
          />

          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => updateFilter("date_to", e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-slate-950"
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h2 className="text-xl font-black text-slate-950">
              Logs
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Latest activity appears first.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Activity</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Module</th>
                  <th className="px-6 py-4">Entity</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Detail</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-10 text-center font-semibold text-slate-500"
                    >
                      Loading activity logs...
                    </td>
                  </tr>
                ) : logs.length ? (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-50 ${
                        selectedLog?.id === log.id ? "bg-slate-50" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-black text-slate-950">
                          {log.title || labelize(log.action)}
                        </div>
                        <div className="max-w-sm truncate text-xs text-slate-500">
                          {log.description || "-"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-700">
                          {log.actor_name || "-"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {log.actor_email || "-"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <ActionBadge value={log.action} />
                      </td>

                      <td className="px-6 py-4">
                        <ModuleBadge value={log.module_key} />
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-500">
                        <div className="font-bold text-slate-700">
                          {log.entity_type || "-"}
                        </div>
                        <div>{log.entity_id || "-"}</div>
                      </td>

                      <td className="px-6 py-4 text-slate-500">
                        {log.created_at
                          ? new Date(log.created_at).toLocaleString()
                          : "-"}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedLog(log)}
                          className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white hover:bg-slate-800"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-10 text-center font-semibold text-slate-500"
                    >
                      No logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-950">
            Log Detail
          </h2>

          {selectedLog ? (
            <div className="mt-5 space-y-4">
              <DetailBlock label="Title" value={selectedLog.title} />
              <DetailBlock label="Description" value={selectedLog.description} />
              <DetailBlock label="Actor" value={selectedLog.actor_name} />
              <DetailBlock label="Email" value={selectedLog.actor_email} />
              <DetailBlock label="Role" value={selectedLog.actor_role} />
              <DetailBlock label="Action" value={labelize(selectedLog.action)} />
              <DetailBlock
                label="Module"
                value={labelize(selectedLog.module_key)}
              />
              <DetailBlock label="Entity Type" value={selectedLog.entity_type} />
              <DetailBlock label="Entity ID" value={selectedLog.entity_id} />
              <DetailBlock label="IP Address" value={selectedLog.ip_address} />

              <JsonBlock title="Before Data" data={selectedLog.before_data} />
              <JsonBlock title="After Data" data={selectedLog.after_data} />
              <JsonBlock title="Metadata" data={selectedLog.metadata} />
            </div>
          ) : (
            <div className="mt-5 rounded-3xl bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
              Select a log to view details.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function DetailBlock({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-bold text-slate-700">
        {value || "-"}
      </p>
    </div>
  );
}

function JsonBlock({ title, data }) {
  if (!data) return null;

  return (
    <div className="rounded-2xl bg-slate-950 p-4 text-white">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {title}
      </p>
      <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap text-xs font-semibold leading-relaxed text-slate-100">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}