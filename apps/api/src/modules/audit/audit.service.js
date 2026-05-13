export async function writeActivityLog(pool, req, payload = {}) {
  try {
    const user = req?.user || {};

    await pool.query(
      `
      insert into activity_logs (
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
        user_agent
      )
      values (
        $1, $2, $3, $4,
        $5, $6,
        $7, $8,
        $9, $10,
        $11, $12, $13,
        $14, $15
      )
      `,
      [
        user.id || null,
        user.name || null,
        user.email || null,
        user.role || null,

        payload.action || "unknown",
        payload.module_key || "system",

        payload.entity_type || null,
        payload.entity_id || null,

        payload.title || null,
        payload.description || null,

        payload.before_data ? JSON.stringify(payload.before_data) : null,
        payload.after_data ? JSON.stringify(payload.after_data) : null,
        payload.metadata ? JSON.stringify(payload.metadata) : null,

        req?.ip || null,
        req?.headers?.["user-agent"] || null,
      ]
    );
  } catch (error) {
    console.error("[writeActivityLog]", error);
  }
}