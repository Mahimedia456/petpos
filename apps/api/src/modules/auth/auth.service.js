import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../../config/db.js";

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

export async function loginUser({ email, password }) {
  const result = await pool.query(
    `
    SELECT id, name, email, password_hash, role, is_active
    FROM users
    WHERE LOWER(email) = LOWER($1)
    LIMIT 1
    `,
    [email]
  );

  const user = result.rows[0];

  if (!user || !user.is_active) {
    return {
      ok: false,
      status: 401,
      message: "Invalid login credentials.",
    };
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);

  if (!validPassword) {
    return {
      ok: false,
      status: 401,
      message: "Invalid login credentials.",
    };
  }

  await pool.query(
    `
    UPDATE users
    SET last_login_at = NOW(), updated_at = NOW()
    WHERE id = $1
    `,
    [user.id]
  );

  const token = createToken(user);

  return {
    ok: true,
    status: 200,
    access_token: token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}

export async function getCurrentUser(userId) {
  const result = await pool.query(
    `
    SELECT id, name, email, role, is_active, created_at, last_login_at
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [userId]
  );

  return result.rows[0] || null;
}

export async function requestPasswordReset(email) {
  const userResult = await pool.query(
    `
    SELECT id, email, is_active
    FROM users
    WHERE LOWER(email) = LOWER($1)
    LIMIT 1
    `,
    [email]
  );

  const user = userResult.rows[0];

  if (!user || !user.is_active) {
    return {
      ok: false,
      status: 404,
      message: "No active account found with this email.",
    };
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await pool.query(
    `
    UPDATE password_reset_otps
    SET is_used = TRUE
    WHERE LOWER(email) = LOWER($1)
      AND is_used = FALSE
    `,
    [email]
  );

  await pool.query(
    `
    INSERT INTO password_reset_otps (email, otp_code, expires_at)
    VALUES ($1, $2, $3)
    `,
    [email, otp, expiresAt]
  );

  console.log("Password reset OTP for", email, "is:", otp);

  return {
    ok: true,
    status: 200,
    message: "OTP generated successfully. Check server console for now.",
    dev_otp: otp,
  };
}

export async function verifyPasswordResetOtp({ email, otp_code }) {
  const result = await pool.query(
    `
    SELECT id, email, otp_code, is_used, expires_at
    FROM password_reset_otps
    WHERE LOWER(email) = LOWER($1)
      AND otp_code = $2
      AND is_used = FALSE
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [email, otp_code]
  );

  const record = result.rows[0];

  if (!record) {
    return {
      ok: false,
      status: 400,
      message: "Invalid OTP.",
    };
  }

  if (new Date(record.expires_at).getTime() < Date.now()) {
    return {
      ok: false,
      status: 400,
      message: "OTP has expired.",
    };
  }

  return {
    ok: true,
    status: 200,
    message: "OTP verified successfully.",
  };
}

export async function resetPassword({ email, otp_code, password }) {
  const verify = await verifyPasswordResetOtp({ email, otp_code });

  if (!verify.ok) {
    return verify;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await pool.query(
    `
    UPDATE users
    SET password_hash = $1, updated_at = NOW()
    WHERE LOWER(email) = LOWER($2)
    `,
    [passwordHash, email]
  );

  await pool.query(
    `
    UPDATE password_reset_otps
    SET is_used = TRUE
    WHERE LOWER(email) = LOWER($1)
      AND otp_code = $2
    `,
    [email, otp_code]
  );

  return {
    ok: true,
    status: 200,
    message: "Password reset successfully.",
  };
}