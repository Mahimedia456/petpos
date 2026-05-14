import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

export async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({
        ok: false,
        message: "Unauthorized. Token is missing.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user = {
      ...decoded,
      role: String(decoded.role || "").toLowerCase(),
    };

    if (!user.role || user.role === "undefined") {
      const params = [];
      const where = [];

      if (decoded.id) {
        params.push(decoded.id);
        where.push(`id = $${params.length}`);
      }

      if (decoded.email) {
        params.push(String(decoded.email).toLowerCase());
        where.push(`lower(email) = $${params.length}`);
      }

      if (where.length) {
        const userResult = await pool.query(
          `
          select
            id,
            name,
            email,
            role,
            status,
            is_active
          from admin_users
          where (${where.join(" or ")})
          limit 1
          `,
          params
        );

        if (userResult.rows.length) {
          user = {
            ...user,
            ...userResult.rows[0],
            role: String(userResult.rows[0].role || "").toLowerCase(),
          };
        }
      }
    }

    if (
      String(user.email || "").toLowerCase() ===
      "aamir@mahimediasolutions.com"
    ) {
      user.role = "admin";
    }

    req.user = user;

    return next();
  } catch (error) {
    console.error("[authMiddleware]", error);

    return res.status(401).json({
      ok: false,
      message: "Invalid or expired token.",
    });
  }
}