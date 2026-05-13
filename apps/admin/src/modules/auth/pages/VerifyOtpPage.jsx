import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import Button from "../../../components/common/Button";
import Input from "../../../components/common/Input";
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
      const res = await verifyOtp(form);

      if (res.data?.ok) {
        sessionStorage.setItem("reset_email", form.email);
        sessionStorage.setItem("reset_otp", form.otp_code);
        navigate("/reset-password");
      } else {
        setError(res.data?.message || "Invalid OTP.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-[2rem] border border-purple-100 bg-white p-8 shadow-2xl shadow-purple-100">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-600 text-white shadow-lg shadow-purple-200">
          <ShieldCheck size={32} />
        </div>
        <h2 className="text-3xl font-black text-slate-950">Verify OTP</h2>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          Enter the 6-digit OTP from server console.
        </p>
      </div>

      {error ? (
        <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
        />

        <Input
          label="OTP Code"
          value={form.otp_code}
          onChange={(e) => updateField("otp_code", e.target.value)}
          placeholder="Enter 6-digit OTP"
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Verifying..." : "Verify OTP"}
        </Button>

        <Link
          to="/forgot-password"
          className="block text-center text-sm font-black text-brand-700 hover:underline"
        >
          Generate new OTP
        </Link>
      </form>
    </div>
  );
}