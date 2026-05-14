import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail } from "lucide-react";
import Button from "../../../components/common/Button";
import { login } from "../../../services/authService";
import { setSession } from "../../../utils/auth";
import logo from "../../../assets/logo.webp";

export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "aamir@mahimediasolutions.com",
    password: "admin12345",
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
      const res = await login({
        email: form.email.trim(),
        password: form.password,
      });

      const token =
        res.data?.access_token ||
        res.data?.token ||
        res.data?.data?.access_token ||
        res.data?.data?.token;

      const user = res.data?.user || res.data?.data?.user;

      if (res.data?.ok && token) {
        setSession(token, user);
        navigate("/dashboard", { replace: true });
        return;
      }

      setError(res.data?.message || "Login failed.");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[430px]">
      <div className="mb-8 text-center">
        <img
          src={logo}
          alt="Pet Shop Logo"
          className="mx-auto h-20 w-auto object-contain"
        />

        <h1 className="mt-8 text-3xl font-black tracking-tight text-slate-950">
          Admin Login
        </h1>

        <p className="mt-2 text-sm font-semibold text-slate-500">
          Login to manage POS, inventory and WooCommerce orders.
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
                placeholder="admin@example.com"
                className="w-full border-0 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-slate-800">
              Password
            </label>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 transition focus-within:border-slate-900 focus-within:ring-4 focus-within:ring-slate-100">
              <LockKeyhole size={18} className="text-slate-400" />

              <input
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                type="password"
                placeholder="Password"
                className="w-full border-0 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm font-black text-slate-700 hover:text-slate-950 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full !bg-slate-950 !text-white !shadow-lg !shadow-slate-200 hover:!bg-slate-800"
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
}