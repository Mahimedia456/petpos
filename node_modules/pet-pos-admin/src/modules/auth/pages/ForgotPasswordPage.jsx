import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import Button from "../../../components/common/Button";
import Input from "../../../components/common/Input";
import { forgotPassword } from "../../../services/authService";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("aamir@mahimediasolutions.com");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const res = await forgotPassword({ email });

      if (res.data?.ok) {
        sessionStorage.setItem("reset_email", email);
        setMessage(res.data.message || "OTP sent successfully.");

        setTimeout(() => {
          navigate("/verify-otp");
        }, 700);
      } else {
        setError(res.data?.message || "Failed to generate OTP.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate OTP.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-[2rem] border border-purple-100 bg-white p-8 shadow-2xl shadow-purple-100">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-600 text-white shadow-lg shadow-purple-200">
          <KeyRound size={32} />
        </div>
        <h2 className="text-3xl font-black text-slate-950">
          Forgot Password
        </h2>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          Enter your email to generate reset OTP.
        </p>
      </div>

      {message ? (
        <div className="mb-5 rounded-2xl bg-green-50 px-4 py-3 text-sm font-bold text-green-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Generating OTP..." : "Send OTP"}
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