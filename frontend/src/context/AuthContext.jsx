import { useMemo, useState } from "react";
import { api, setAuthToken } from "../api/client";
import { AuthContext } from "./authContextValue";

const STORAGE_KEY = "aiinhance-auth";

function readInitialAuth() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { token: "", user: null };

  try {
    const parsed = JSON.parse(raw);
    return {
      token: parsed.token || "",
      user: parsed.user || null,
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return { token: "", user: null };
  }
}

export function AuthProvider({ children }) {
  const [initial] = useState(() => readInitialAuth());
  const [token, setToken] = useState(() => initial.token);
  const [user, setUser] = useState(() => initial.user);

  if (initial.token && !api.defaults.headers.common.Authorization) {
    setAuthToken(initial.token);
  }

  const value = useMemo(
    () => ({
      token,
      user,
      role: user?.role || "guest",
      isAuthenticated: Boolean(token && user),
      async login(email, password) {
        const { data } = await api.post("/auth/login", { email, password });
        setToken(data.token);
        setUser(data.user);
        setAuthToken(data.token);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      },
      async register(email, password) {
        const { data } = await api.post("/auth/register", { email, password });
        setToken(data.token);
        setUser(data.user);
        setAuthToken(data.token);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      },
      logout() {
        setToken("");
        setUser(null);
        setAuthToken("");
        localStorage.removeItem(STORAGE_KEY);
      },
    }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
