const ROLES = ["admin", "manager", "cashier"];
const STATUSES = ["active", "inactive", "suspended"];

const MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "pos", label: "POS" },
  { key: "products", label: "Products" },
  { key: "categories", label: "Categories" },
  { key: "inventory", label: "Inventory" },
  { key: "orders", label: "Orders" },
  { key: "customers", label: "Customers" },
  { key: "delivery", label: "Delivery" },
  { key: "promotions", label: "Promotions" },
  { key: "reports", label: "Reports" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "settings", label: "Settings" },
  { key: "users", label: "Users" },
];

function cleanText(value) {
  return String(value || "").trim();
}

function nullableText(value) {
  const cleaned = cleanText(value);
  return cleaned ? cleaned : null;
}

function normalizeEmail(value) {
  return cleanText(value).toLowerCase();
}

function toBool(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function requireAdmin(req, res) {
  const role = String(req.user?.role || "").toLowerCase();

  if (role !== "admin") {
    res.status(403).json({
      ok: false,
      message: "Only admin can manage users and roles.",
    });
    return false;
  }

  return true;
}

export function getUsers(pool) {
  return async function (req, res) {
    try {
      if (!requireAdmin(req, res)) return;

      const search = cleanText(req.query.search);
      const role = cleanText(req.query.role);
      const status = cleanText(req.query.status);

      const params = [];
      const where = [`is_active = true`];

      if (search) {
        params.push(`%${search}%`);
        where.push(`
          (
            name ilike $${params.length}
            or email ilike $${params.length}
            or phone ilike $${params.length}
          )
        `);
      }

      if (role && ROLES.includes(role)) {
        params.push(role);
        where.push(`role = $${params.length}`);
      }

      if (status && STATUSES.includes(status)) {
        params.push(status);
        where.push(`status = $${params.length}`);
      }

      const result = await pool.query(
        `
        select
          id,
          name,
          email,
          role,
          status,
          phone,
          avatar_url,
          last_login_at,
          is_active,
          created_at,
          updated_at
        from admin_users
        where ${where.join(" and ")}
        order by created_at desc
        limit 300
        `,
        params
      );

      const summaryResult = await pool.query(`
        select
          count(*) filter (where is_active = true)::int as total_users,
          count(*) filter (where is_active = true and role = 'admin')::int as admins,
          count(*) filter (where is_active = true and role = 'manager')::int as managers,
          count(*) filter (where is_active = true and role = 'cashier')::int as cashiers,
          count(*) filter (where is_active = true and status = 'active')::int as active_users
        from admin_users
      `);

      res.json({
        ok: true,
        data: {
          summary: summaryResult.rows[0],
          users: result.rows,
        },
      });
    } catch (error) {
      console.error("[getUsers]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to load users.",
      });
    }
  };
}

export function createUser(pool) {
  return async function (req, res) {
    try {
      if (!requireAdmin(req, res)) return;

      const body = req.body || {};
      const name = cleanText(body.name);
      const email = normalizeEmail(body.email);

      if (!name) {
        return res.status(400).json({
          ok: false,
          message: "User name is required.",
        });
      }

      if (!email) {
        return res.status(400).json({
          ok: false,
          message: "User email is required.",
        });
      }

      const role = ROLES.includes(body.role) ? body.role : "cashier";
      const status = STATUSES.includes(body.status) ? body.status : "active";

      const result = await pool.query(
        `
        insert into admin_users (
          name,
          email,
          role,
          status,
          phone,
          avatar_url,
          is_active
        )
        values ($1, $2, $3, $4, $5, $6, true)
        returning
          id,
          name,
          email,
          role,
          status,
          phone,
          avatar_url,
          last_login_at,
          is_active,
          created_at,
          updated_at
        `,
        [
          name,
          email,
          role,
          status,
          nullableText(body.phone),
          nullableText(body.avatar_url),
        ]
      );

      res.status(201).json({
        ok: true,
        message: "User created successfully.",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("[createUser]", error);

      if (error.code === "23505") {
        return res.status(409).json({
          ok: false,
          message: "User email already exists.",
        });
      }

      res.status(500).json({
        ok: false,
        message: "Failed to create user.",
      });
    }
  };
}

export function getUserById(pool) {
  return async function (req, res) {
    try {
      if (!requireAdmin(req, res)) return;

      const { id } = req.params;

      const result = await pool.query(
        `
        select
          id,
          name,
          email,
          role,
          status,
          phone,
          avatar_url,
          last_login_at,
          is_active,
          created_at,
          updated_at
        from admin_users
        where id = $1
        limit 1
        `,
        [id]
      );

      if (!result.rows.length) {
        return res.status(404).json({
          ok: false,
          message: "User not found.",
        });
      }

      res.json({
        ok: true,
        data: result.rows[0],
      });
    } catch (error) {
      console.error("[getUserById]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to load user.",
      });
    }
  };
}

export function updateUser(pool) {
  return async function (req, res) {
    try {
      if (!requireAdmin(req, res)) return;

      const { id } = req.params;
      const body = req.body || {};

      const name = cleanText(body.name);
      const email = normalizeEmail(body.email);

      if (!name) {
        return res.status(400).json({
          ok: false,
          message: "User name is required.",
        });
      }

      if (!email) {
        return res.status(400).json({
          ok: false,
          message: "User email is required.",
        });
      }

      const role = ROLES.includes(body.role) ? body.role : "cashier";
      const status = STATUSES.includes(body.status) ? body.status : "active";

      const result = await pool.query(
        `
        update admin_users
        set
          name = $1,
          email = $2,
          role = $3,
          status = $4,
          phone = $5,
          avatar_url = $6,
          updated_at = now()
        where id = $7
        returning
          id,
          name,
          email,
          role,
          status,
          phone,
          avatar_url,
          last_login_at,
          is_active,
          created_at,
          updated_at
        `,
        [
          name,
          email,
          role,
          status,
          nullableText(body.phone),
          nullableText(body.avatar_url),
          id,
        ]
      );

      if (!result.rows.length) {
        return res.status(404).json({
          ok: false,
          message: "User not found.",
        });
      }

      res.json({
        ok: true,
        message: "User updated successfully.",
        data: result.rows[0],
      });
    } catch (error) {
      console.error("[updateUser]", error);

      if (error.code === "23505") {
        return res.status(409).json({
          ok: false,
          message: "User email already exists.",
        });
      }

      res.status(500).json({
        ok: false,
        message: "Failed to update user.",
      });
    }
  };
}

export function deleteUser(pool) {
  return async function (req, res) {
    try {
      if (!requireAdmin(req, res)) return;

      const { id } = req.params;

      const result = await pool.query(
        `
        update admin_users
        set is_active = false,
            status = 'inactive',
            updated_at = now()
        where id = $1
        returning id
        `,
        [id]
      );

      if (!result.rows.length) {
        return res.status(404).json({
          ok: false,
          message: "User not found.",
        });
      }

      res.json({
        ok: true,
        message: "User archived successfully.",
      });
    } catch (error) {
      console.error("[deleteUser]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to archive user.",
      });
    }
  };
}

export function getRolesPermissions(pool) {
  return async function (req, res) {
    try {
      if (!requireAdmin(req, res)) return;

      const result = await pool.query(`
        select *
        from role_permissions
        order by
          case role
            when 'admin' then 1
            when 'manager' then 2
            when 'cashier' then 3
            else 4
          end,
          module_key asc
      `);

      const grouped = {};

      for (const role of ROLES) {
        grouped[role] = MODULES.map((module) => {
          const existing = result.rows.find(
            (row) => row.role === role && row.module_key === module.key
          );

          return {
            role,
            module_key: module.key,
            module_label: module.label,
            can_view: Boolean(existing?.can_view),
            can_create: Boolean(existing?.can_create),
            can_edit: Boolean(existing?.can_edit),
            can_delete: Boolean(existing?.can_delete),
          };
        });
      }

      res.json({
        ok: true,
        data: {
          modules: MODULES,
          roles: ROLES,
          permissions: grouped,
        },
      });
    } catch (error) {
      console.error("[getRolesPermissions]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to load role permissions.",
      });
    }
  };
}

export function updateRolePermissions(pool) {
  return async function (req, res) {
    const client = await pool.connect();

    try {
      if (!requireAdmin(req, res)) return;

      const { role } = req.params;

      if (!ROLES.includes(role)) {
        return res.status(400).json({
          ok: false,
          message: "Invalid role.",
        });
      }

      const permissions = Array.isArray(req.body?.permissions)
        ? req.body.permissions
        : [];

      await client.query("begin");

      for (const item of permissions) {
        const moduleKey = cleanText(item.module_key);

        if (!MODULES.some((module) => module.key === moduleKey)) continue;

        await client.query(
          `
          insert into role_permissions (
            role,
            module_key,
            can_view,
            can_create,
            can_edit,
            can_delete
          )
          values ($1, $2, $3, $4, $5, $6)
          on conflict (role, module_key)
          do update set
            can_view = excluded.can_view,
            can_create = excluded.can_create,
            can_edit = excluded.can_edit,
            can_delete = excluded.can_delete,
            updated_at = now()
          `,
          [
            role,
            moduleKey,
            toBool(item.can_view, false),
            toBool(item.can_create, false),
            toBool(item.can_edit, false),
            toBool(item.can_delete, false),
          ]
        );
      }

      await client.query("commit");

      res.json({
        ok: true,
        message: "Role permissions updated successfully.",
      });
    } catch (error) {
      await client.query("rollback");
      console.error("[updateRolePermissions]", error);
      res.status(500).json({
        ok: false,
        message: "Failed to update role permissions.",
      });
    } finally {
      client.release();
    }
  };
}