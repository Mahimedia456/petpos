import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Mail, KeyRound } from "lucide-react";
import Button from "../../../components/common/Button";
import { verifyOtp } from "../../../services/authService";

export default function VerifyOtpPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email:
      sessionStorage.getItem("reset_email") ||
      "aamir@mahimediasolutions.com",
    otp_code: "",
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
      const res = await verifyOtp({
        email: form.email.trim(),
        otp_code: form.otp_code.trim(),
      });

      if (res.data?.ok) {
        sessionStorage.setItem("reset_email", form.email.trim());
        sessionStorage.setItem("reset_otp", form.otp_code.trim());
        navigate("/reset-password");
        return;
      }

      setError(res.data?.message || "Invalid OTP.");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[430px]">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-white shadow-lg shadow-slate-200">
          <ShieldCheck size={30} />
        </div>

        <h1 className="text-3xl font-black tracking-tight text-slate-950">
          Verify OTP
        </h1>

        <p className="mt-2 text-sm font-semibold text-slate-500">
          Enter the OTP sent to your email.
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
              Email
            </label>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 transition focus-within:border-slate-900 focus-within:ring-4 focus-within:ring-slate-100">
              <Mail size={18} className="text-slate-400" />

              <input
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                type="email"
                className="w-full border-0 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-800">
              OTP Code
            </label>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 transition focus-within:border-slate-900 focus-within:ring-4 focus-within:ring-slate-100">
              <KeyRound size={18} className="text-slate-400" />

              <input
                value={form.otp_code}
                onChange={(e) => updateField("otp_code", e.target.value)}
                placeholder="Enter OTP"
                className="w-full border-0 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full !bg-slate-950 !text-white !shadow-lg !shadow-slate-200 hover:!bg-slate-800"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </Button>

          <Link
            to="/forgot-password"
            className="block text-center text-sm font-black text-slate-700 hover:text-slate-950 hover:underline"
          >
            Generate new OTP
          </Link>
        </form>
      </div>
    </div>
  );
}