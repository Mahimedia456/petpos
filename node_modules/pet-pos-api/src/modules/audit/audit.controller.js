import { writeActivityLog } from "./audit.service.js";

const MODULES = [
  "dashboard",
  "pos",
  "products",
  "categories",
  "inventory",
  "orders",
  "customers",
  "delivery",
  "promotions",
  "reports",
  "whatsapp",
  "settings",
  "users",
  "roles",
  "system",
];

const ACTIONS = [
  "create",
  "update",
  "delete",
  "archive",
  "login",
  "logout",
  "checkout",
  "stock_adjustment",
  "status_update",
  "payment_update",
  "permission_update",
  "settings_update",
  "promotion_apply",
  "assign",
  "export",
  "view",
  "unknown",
];

function cleanText(value) {
  return String(value || "").trim();
}

function toLimit(value, fallback = 100) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.trunc(n), 1), 500);
}

function requireAdminOrManager(req, res) {
  const role = String(req.user?.role || "").toLowerCase();

  if (!["admin", "manager"].includes(role)) {
    res.status(403).json({
      ok: false,
      message: "Only admin or manager can view activity logs.",
    });
    return false;
  }

  return true;
}

export function getActivityLogs(pool) {
  return async function (req, res) {
    try {
      if (!requireAdminOrManager(req, res)) return;

      const search = cleanText(req.query.search);
      const moduleKey = cleanText(req.query.module_key);
      const action = cleanText(req.query.action);
      const actorEmail = cleanText(req.query.actor_email);
      const dateFrom = cleanText(req.query.date_from);
      const dateTo = cleanText(req.query.date_to);
      const limit = toLimit(req.query.limit, 150);

      const params = [];
      const where = [];

      if (search) {
        params.push(`%${search}%`);
        where.push(`
          (
            title ilike $${params.length}
            or description ilike $${params.length}
            or actor_name ilike $${params.length}
            or actor_email ilike $${params.length}
            or entity_type ilike $${params.length}
            or action ilike $${params.length}
            or module_key ilike $${params.length}
          )
        `);
      }

      if (moduleKey && MODULES.includes(moduleKey)) {
        params.push(moduleKey);
        where.push(`module_key = $${params.length}`);
      }

      if (action && ACTIONS.includes(action)) {
        params.push(action);
        where.push(`action = $${params.length}`);
      }

      if (actorEmail) {
        params.push(`%${actorEmail}%`);
        where.push(`actor_email ilike $${params.length}`);
      }

      if (dateFrom) {
        params.push(dateFrom);
        where.push(`created_at >= $${params.length}::date`);
      }

      if (dateTo) {
        params.push(dateTo);
        where.push(`created_at < ($${params.length}::date + interval '1 day')`);
      }

      params.push(limit);

      const whereSql = where.length ? `where ${where.join(" and ")}` : "";

      const result = await pool.query(
        `
        select
          id,
          actor_id,
          actor_name,
          actor_email,
          actor_role,
          action,
          module_key,
          entity_type,
          entity_id,
          title,
          description,
          before_data,
          after_data,
          metadata,
          ip_address,
          user_agent,
          created_at
        from activity_logs
        ${whereSql}
        order by created_at desc
        limit $${params.length}
        `,
        params
      );

      const summaryResult = await pool.query(`
        select
          count(*)::int as total_logs,
          count(*) filter (where created_at >= current_date)::int as today_logs,
          count(*) filter (where action in ('delete', 'archive'))::int as destructive_actions,
          count(distinct actor_email)::int as active_actors
        from activity_logs
      `);

      const actionSummaryResult = await pool.query(`
        select
          action,
          count(*)::int as count
        from activity_logs
        group by action
        order by count desc
        limit 12
      `);

      const moduleSummaryResult = await pool.query(`
        select
          module_key,
          count(*)::int as count
        from activity_logs
        group by module_key
        order by count desc
        limit 12
      `);

      res.json({
        ok: true,
        data: {
          summary: summaryResult.rows[0],
          action_summary: actionSummaryResult.rows,
          module_summary: moduleSummaryResult.rows,
          logs: result.rows,
          filters: {
            modules: MODULES,
            actions: ACTIONS,
          },
        },
      });
    } catch (error) {
      console.error("[getActivityLogs]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to load activity logs.",
      });
    }
  };
}

export function createActivityLog(pool) {
  return async function (req, res) {
    try {
      const body = req.body || {};

      await writeActivityLog(pool, req, {
        action: body.action || "unknown",
        module_key: body.module_key || "system",
        entity_type: body.entity_type || null,
        entity_id: body.entity_id || null,
        title: body.title || null,
        description: body.description || null,
        before_data: body.before_data || null,
        after_data: body.after_data || null,
        metadata: body.metadata || null,
      });

      res.status(201).json({
        ok: true,
        message: "Activity log created successfully.",
      });
    } catch (error) {
      console.error("[createActivityLog]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to create activity log.",
      });
    }
  };
}