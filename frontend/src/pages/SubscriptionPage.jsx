import { useState } from "react";
import { api } from "../api/client";

export function SubscriptionPage() {
  const [amount, setAmount] = useState(499);
  const [transactionRef, setTransactionRef] = useState("");
  const [message, setMessage] = useState("");

  async function submitRequest(event) {
    event.preventDefault();
    setMessage("");
    try {
      await api.post("/subscription/request", { amount, transactionRef });
      setMessage(
        "Payment request submitted. Admin will review and upgrade your account.",
      );
      setTransactionRef("");
    } catch (err) {
      setMessage(
        err?.response?.data?.message || "Failed to submit payment request",
      );
    }
  }

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-slate-800 bg-slate-950/70 p-8">
      <h1 className="text-2xl font-bold text-slate-100">Upgrade to Paid</h1>
      <p className="mt-2 text-slate-300">
        UPI ID:{" "}
        <span className="font-semibold text-cyan-300">
          babarmeet@okhdfcbank
        </span>
      </p>
      <form className="mt-6 space-y-3" onSubmit={submitRequest}>
        <input
          className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2"
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="Amount"
        />
        <input
          className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2"
          value={transactionRef}
          onChange={(e) => setTransactionRef(e.target.value)}
          placeholder="UPI Transaction Reference"
        />
        <button className="rounded-lg bg-amber-400 px-4 py-2 font-semibold text-slate-900">
          Submit Payment Request
        </button>
      </form>
      {message && <p className="mt-4 text-sm text-slate-200">{message}</p>}
    </div>
  );
}
