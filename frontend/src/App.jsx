import { Navigate, Route, Routes, Link } from "react-router-dom";
import { useAuth } from "./context/useAuth";
import { ChatPage } from "./pages/ChatPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { AdminPage } from "./pages/AdminPage";
import { SubscriptionPage } from "./pages/SubscriptionPage";
import { ShortcutsPage } from "./pages/ShortcutsPage";

function AdminOnly({ children }) {
  const auth = useAuth();
  if (auth.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

function PageShell({ children }) {
  const auth = useAuth();

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#343541]">
      <header className="flex items-center justify-between border-b border-white/10 bg-[#202123] px-4 py-2">
        <Link
          to="/"
          className="text-sm font-semibold text-white/90 hover:text-white"
        >
          ← Back to Chat
        </Link>
        <div className="flex items-center gap-3 text-sm text-white/60">
          {auth.user && <span>{auth.user.email}</span>}
          {auth.isAuthenticated && (
            <button
              onClick={auth.logout}
              className="rounded bg-white/10 px-3 py-1 text-white/80 hover:bg-white/20"
            >
              Logout
            </button>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ChatPage />} />
      <Route
        path="/login"
        element={
          <PageShell>
            <LoginPage />
          </PageShell>
        }
      />
      <Route
        path="/register"
        element={
          <PageShell>
            <RegisterPage />
          </PageShell>
        }
      />
      <Route
        path="/subscription"
        element={
          <PageShell>
            <SubscriptionPage />
          </PageShell>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminOnly>
            <PageShell>
              <AdminPage />
            </PageShell>
          </AdminOnly>
        }
      />
      <Route
        path="/shortcuts"
        element={
          <PageShell>
            <ShortcutsPage />
          </PageShell>
        }
      />
    </Routes>
  );
}
