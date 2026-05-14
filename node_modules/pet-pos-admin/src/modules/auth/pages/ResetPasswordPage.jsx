import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import Button from "../../../components/common/Button";
import { resetPassword } from "../../../services/authService";

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email:
      sessionStorage.getItem("reset_email") ||
      "aamir@mahimediasolutions.com",
    otp_code: sessionStorage.getItem("reset_otp") || "",
    password: "",
    confirm_password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField(key, value) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await resetPassword({
        email: form.email.trim(),
        otp_code: form.otp_code.trim(),
        password: form.password,
        confirm_password: form.confirm_password,
      });

      if (res.data?.ok) {
        sessionStorage.removeItem("reset_email");
        sessionStorage.removeItem("reset_otp");
        navigate("/login", { replace: true });
        return;
      }

      setError(res.data?.message || "Failed to reset password.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to reset password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[430px]">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-white shadow-lg shadow-slate-200">
          <LockKeyhole size={30} />
        </div>

        <h1 className="text-3xl font-black tracking-tight text-slate-950">
          Reset Password
        </h1>

        <p className="mt-2 text-sm font-semibold text-slate-500">
          Create a new password for your admin account.
        </p>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70">
        {error ? (
          <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-black text-slate-800">
              New Password
            </label>

            <input
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              type="password"
              placeholder="Minimum 8 characters"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-800">
              Confirm Password
            </label>

            <input
              value={form.confirm_password}
              onChange={(e) =>
                updateField("confirm_password", e.target.value)
              }
              type="password"
              placeholder="Confirm password"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full !bg-slate-950 !text-white !shadow-lg !shadow-slate-200 hover:!bg-slate-800"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </Button>

          <Link
            to="/login"
            className="block text-center text-sm font-black text-slate-700 hover:text-slate-950 hover:underline"
          >
            Back to login
          </Link>
        </form>
      </div>
    </div>
  );
}