import {
  getCurrentUser,
  loginUser,
  requestPasswordReset,
  resetPassword,
  verifyPasswordResetOtp,
} from "./auth.service.js";

export async function loginController(req, res) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      ok: false,
      message: "Email and password are required.",
    });
  }

  const result = await loginUser({ email, password });

  return res.status(result.status).json(result);
}

export async function meController(req, res) {
  const user = await getCurrentUser(req.user.id);

  if (!user) {
    return res.status(404).json({
      ok: false,
      message: "User not found.",
    });
  }

  return res.json({
    ok: true,
    data: user,
  });
}

export async function forgotPasswordController(req, res) {
  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({
      ok: false,
      message: "Email is required.",
    });
  }

  const result = await requestPasswordReset(email);

  return res.status(result.status).json(result);
}

export async function verifyOtpController(req, res) {
  const { email, otp_code } = req.body || {};

  if (!email || !otp_code) {
    return res.status(400).json({
      ok: false,
      message: "Email and OTP are required.",
    });
  }

  const result = await verifyPasswordResetOtp({ email, otp_code });

  return res.status(result.status).json(result);
}

export async function resetPasswordController(req, res) {
  const { email, otp_code, password, confirm_password } = req.body || {};

  if (!email || !otp_code || !password || !confirm_password) {
    return res.status(400).json({
      ok: false,
      message: "Email, OTP, password and confirm password are required.",
    });
  }

  if (password !== confirm_password) {
    return res.status(400).json({
      ok: false,
      message: "Passwords do not match.",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      ok: false,
      message: "Password must be at least 8 characters.",
    });
  }

  const result = await resetPassword({ email, otp_code, password });

  return res.status(result.status).json(result);
}