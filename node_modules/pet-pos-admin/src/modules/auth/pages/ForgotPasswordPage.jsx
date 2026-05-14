import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound, Mail, ArrowLeft } from "lucide-react";
import Button from "../../../components/common/Button";
import { forgotPassword } from "../../../services/authService";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("aamir@mahimediasolutions.com");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    const cleanEmail = String(email || "").trim().toLowerCase();

    setMessage("");
    setError("");

    if (!cleanEmail) {
      setError("Email is required.");
      return;
    }

    setLoading(true);

    try {
      const res = await forgotPassword({
        email: cleanEmail,
      });

      console.log("[ForgotPassword response]", res?.data);

      if (res.data?.ok) {
        sessionStorage.setItem("reset_email", cleanEmail);

        setMessage(
          res.data?.message ||
            "OTP sent successfully. Please check your email inbox."
        );

        setTimeout(() => {
          navigate("/verify-otp", { replace: true });
        }, 900);

        return;
      }

      setError(res.data?.message || "Failed to generate OTP.");
    } catch (err) {
      console.error("[ForgotPassword error]", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to generate OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[430px]">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-white shadow-lg shadow-slate-200">
          <KeyRound size={30} />
        </div>

        <h1 className="text-3xl font-black tracking-tight text-slate-950">
          Forgot Password
        </h1>

        <p className="mt-2 text-sm font-semibold text-slate-500">
          Enter your admin email to receive a password reset OTP.
        </p>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70">
        {message ? (
          <div className="mb-5 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                placeholder="admin@example.com"
                className="w-full border-0 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                required
              />
            </div>

            <p className="mt-2 text-xs font-semibold text-slate-400">
              The OTP will be sent to this email if the account exists.
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full !bg-slate-950 !text-white !shadow-lg !shadow-slate-200 hover:!bg-slate-800 disabled:!cursor-not-allowed disabled:!opacity-60"
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </Button>

          <Link
            to="/login"
            className="flex items-center justify-center gap-2 text-center text-sm font-black text-slate-700 hover:text-slate-950 hover:underline"
          >
            <ArrowLeft size={16} />
            Back to login
          </Link>
        </form>
      </div>
    </div>
  );
}