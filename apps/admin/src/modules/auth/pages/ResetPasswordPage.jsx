import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import Button from "../../../components/common/Button";
import Input from "../../../components/common/Input";
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
    setLoading(true);

    try {
      const res = await resetPassword(form);

      if (res.data?.ok) {
        sessionStorage.removeItem("reset_email");
        sessionStorage.removeItem("reset_otp");
        navigate("/login");
      } else {
        setError(res.data?.message || "Failed to reset password.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-[2rem] border border-purple-100 bg-white p-8 shadow-2xl shadow-purple-100">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-600 text-white shadow-lg shadow-purple-200">
          <LockKeyhole size={32} />
        </div>
        <h2 className="text-3xl font-black text-slate-950">
          Reset Password
        </h2>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          Create a new password for your account.
        </p>
      </div>

      {error ? (
        <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New Password"
          type="password"
          value={form.password}
          onChange={(e) => updateField("password", e.target.value)}
          placeholder="Minimum 8 characters"
        />

        <Input
          label="Confirm Password"
          type="password"
          value={form.confirm_password}
          onChange={(e) => updateField("confirm_password", e.target.value)}
          placeholder="Confirm password"
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Resetting..." : "Reset Password"}
        </Button>

        <Link
          to="/login"
          className="block text-center text-sm font-black text-brand-700 hover:underline"
        >
          Back to login
        </Link>
      </form>
    </div>
  );
}