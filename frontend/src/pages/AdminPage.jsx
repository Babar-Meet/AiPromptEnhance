import { useEffect, useState } from "react";
import { api } from "../api/client";

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold ${
        active ? "bg-cyan-400 text-slate-900" : "bg-slate-900 text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

export function AdminPage() {
  const [tab, setTab] = useState("models");
  const [models, setModels] = useState([]);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [settings, setSettings] = useState({
    comparisonLimit: 3,
    promptScoringModel: "gpt-oss:20b",
    guestDefaultModelId: "gpt-oss:20b",
  });
  const [newModel, setNewModel] = useState({
    name: "",
    modelId: "",
    provider: "ollama",
    apiKey: "",
    allowGuest: false,
    allowFree: true,
    allowPaid: true,
  });

  async function loadAll() {
    const [m, u, p, s] = await Promise.all([
      api.get("/admin/models"),
      api.get("/admin/users"),
      api.get("/admin/payments"),
      api.get("/admin/settings"),
    ]);
    setModels(m.data);
    setUsers(u.data);
    setPayments(p.data);
    setSettings(s.data);
  }

  useEffect(() => {
    let mounted = true;

    async function run() {
      try {
        const [m, u, p, s] = await Promise.all([
          api.get("/admin/models"),
          api.get("/admin/users"),
          api.get("/admin/payments"),
          api.get("/admin/settings"),
        ]);

        if (!mounted) return;
        setModels(m.data);
        setUsers(u.data);
        setPayments(p.data);
        setSettings(s.data);
      } catch {
        // Intentionally silent for admin dashboard initial load.
      }
    }

    run();
    return () => {
      mounted = false;
    };
  }, []);

  async function toggleModelFlag(model, key) {
    await api.patch(`/admin/models/${model._id}`, { [key]: !model[key] });
    await loadAll();
  }

  async function saveRole(userId, role) {
    await api.patch(`/admin/users/${userId}`, { role });
    await loadAll();
  }

  async function submitModel(event) {
    event.preventDefault();
    await api.post("/admin/models", newModel);
    setNewModel({
      name: "",
      modelId: "",
      provider: "ollama",
      apiKey: "",
      allowGuest: false,
      allowFree: true,
      allowPaid: true,
    });
    await loadAll();
  }

  async function saveSettings(event) {
    event.preventDefault();
    await api.patch("/admin/settings", settings);
    await loadAll();
  }

  async function updatePaymentStatus(id, status) {
    await api.patch(`/admin/payments/${id}`, { status });
    await loadAll();
  }

  async function deleteModel(id) {
    await api.delete(`/admin/models/${id}`);
    await loadAll();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-black text-slate-100">Admin Dashboard</h1>
      <div className="flex flex-wrap gap-2">
        <TabButton active={tab === "models"} onClick={() => setTab("models")}>
          Model Manager
        </TabButton>
        <TabButton active={tab === "add"} onClick={() => setTab("add")}>
          Add Model
        </TabButton>
        <TabButton active={tab === "users"} onClick={() => setTab("users")}>
          User Manager
        </TabButton>
        <TabButton
          active={tab === "settings"}
          onClick={() => setTab("settings")}
        >
          Config
        </TabButton>
        <TabButton
          active={tab === "payments"}
          onClick={() => setTab("payments")}
        >
          Payments
        </TabButton>
      </div>

      {tab === "models" && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="space-y-2">
            {models.map((m) => (
              <div
                key={m._id}
                className="rounded-lg border border-slate-800 p-3 text-sm"
              >
                <p className="font-bold text-cyan-200">
                  {m.name} ({m.modelId})
                </p>
                <p className="text-slate-400">Provider: {m.provider}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    className="rounded bg-slate-800 px-2 py-1"
                    onClick={() => toggleModelFlag(m, "enabled")}
                  >
                    Enabled: {String(m.enabled)}
                  </button>
                  <button
                    className="rounded bg-slate-800 px-2 py-1"
                    onClick={() => toggleModelFlag(m, "allowGuest")}
                  >
                    Guest: {String(m.allowGuest)}
                  </button>
                  <button
                    className="rounded bg-slate-800 px-2 py-1"
                    onClick={() => toggleModelFlag(m, "allowFree")}
                  >
                    Free: {String(m.allowFree)}
                  </button>
                  <button
                    className="rounded bg-slate-800 px-2 py-1"
                    onClick={() => toggleModelFlag(m, "allowPaid")}
                  >
                    Paid: {String(m.allowPaid)}
                  </button>
                  <button
                    className="rounded bg-rose-700 px-2 py-1 text-white"
                    onClick={() => {
                      const accepted = window.confirm(
                        `Delete model "${m.name}"? This cannot be undone.`,
                      );
                      if (accepted) deleteModel(m._id);
                    }}
                  >
                    Remove Model
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "add" && (
        <form
          className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 md:grid-cols-2"
          onSubmit={submitModel}
        >
          <input
            className="rounded border border-slate-700 bg-slate-900 p-2"
            placeholder="Model Name"
            value={newModel.name}
            onChange={(e) =>
              setNewModel((p) => ({ ...p, name: e.target.value }))
            }
          />
          <input
            className="rounded border border-slate-700 bg-slate-900 p-2"
            placeholder="Model ID"
            value={newModel.modelId}
            onChange={(e) =>
              setNewModel((p) => ({ ...p, modelId: e.target.value }))
            }
          />
          <select
            className="rounded border border-slate-700 bg-slate-900 p-2"
            value={newModel.provider}
            onChange={(e) =>
              setNewModel((p) => ({ ...p, provider: e.target.value }))
            }
          >
            {[
              "ollama",
              "openai",
              "anthropic",
              "groq",
              "openrouter",
              "custom",
            ].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <input
            className="rounded border border-slate-700 bg-slate-900 p-2"
            placeholder="API Key (optional)"
            value={newModel.apiKey}
            onChange={(e) =>
              setNewModel((p) => ({ ...p, apiKey: e.target.value }))
            }
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={newModel.allowGuest}
              onChange={(e) =>
                setNewModel((p) => ({ ...p, allowGuest: e.target.checked }))
              }
            />
            Allow Guest
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={newModel.allowFree}
              onChange={(e) =>
                setNewModel((p) => ({ ...p, allowFree: e.target.checked }))
              }
            />
            Allow Free
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={newModel.allowPaid}
              onChange={(e) =>
                setNewModel((p) => ({ ...p, allowPaid: e.target.checked }))
              }
            />
            Allow Paid
          </label>
          <button className="rounded bg-emerald-500 px-3 py-2 font-semibold text-slate-900">
            Create Model
          </button>
        </form>
      )}

      {tab === "users" && (
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u._id}
                className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-800 p-2 text-sm"
              >
                <div>
                  <p className="text-slate-100">{u.email}</p>
                  <p className="text-slate-500">
                    Created: {new Date(u.createdAt).toLocaleString()}
                  </p>
                </div>
                <select
                  value={u.role}
                  onChange={(e) => saveRole(u._id, e.target.value)}
                  className="rounded border border-slate-700 bg-slate-900 p-2"
                >
                  <option value="free">free</option>
                  <option value="paid">paid</option>
                  <option value="admin">admin</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "settings" && (
        <form
          className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 md:grid-cols-2"
          onSubmit={saveSettings}
        >
          <label className="text-sm">
            Comparison limit
            <input
              type="number"
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 p-2"
              value={settings.comparisonLimit}
              onChange={(e) =>
                setSettings((p) => ({
                  ...p,
                  comparisonLimit: Number(e.target.value),
                }))
              }
            />
          </label>
          <label className="text-sm">
            Prompt scoring model
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 p-2"
              value={settings.promptScoringModel}
              onChange={(e) =>
                setSettings((p) => ({
                  ...p,
                  promptScoringModel: e.target.value,
                }))
              }
            />
          </label>
          <label className="text-sm">
            Guest default model
            <input
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 p-2"
              value={settings.guestDefaultModelId}
              onChange={(e) =>
                setSettings((p) => ({
                  ...p,
                  guestDefaultModelId: e.target.value,
                }))
              }
            />
          </label>
          <button className="rounded bg-cyan-400 px-3 py-2 font-semibold text-slate-900">
            Save Settings
          </button>
        </form>
      )}

      {tab === "payments" && (
        <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm">
          {payments.map((p) => (
            <div key={p._id} className="rounded border border-slate-800 p-2">
              <p>
                {p.userId?.email} | {p.amount} | Ref: {p.transactionRef}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  className="rounded bg-emerald-600 px-2 py-1"
                  onClick={() => updatePaymentStatus(p._id, "approved")}
                >
                  Approve
                </button>
                <button
                  className="rounded bg-rose-600 px-2 py-1"
                  onClick={() => updatePaymentStatus(p._id, "rejected")}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
