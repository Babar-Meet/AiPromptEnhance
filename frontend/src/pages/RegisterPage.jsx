import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export function RegisterPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      await auth.register(email, password);
      navigate("/");
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed");
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-950/70 p-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-100">
        Create your account
      </h1>
      <form className="space-y-3" onSubmit={onSubmit}>
        <input
          className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-rose-300">{error}</p>}
        <button className="w-full rounded-lg bg-emerald-500 py-2 font-semibold text-slate-950">
          Register
        </button>
      </form>
      <p className="mt-4 text-sm text-slate-300">
        Already have an account?{" "}
        <Link to="/login" className="text-cyan-300">
          Login
        </Link>
      </p>
    </div>
  );
}
