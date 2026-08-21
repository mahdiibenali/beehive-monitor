import { createContext, default as React, useContext, useEffect, useMemo, useState } from "react";
import { api, clearToken, getStoredToken, saveToken } from "src/services/api";
import { SessionUser } from "../../shared/types/types";

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (user: SessionUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function assertMobileUser(user: SessionUser) {
  if (user.role !== "apiculteur") {
    throw new Error("L'application mobile est reservee aux comptes client. Utilisez le web pour les comptes admin.");
  }
  return user;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const token = await getStoredToken();
    if (!token) {
      setUser(null);
      return;
    }
    const response = await api.get("/auth/me");
    try {
      setUser(assertMobileUser(response.data.user));
    } catch (error) {
      await clearToken();
      setUser(null);
      throw error;
    }
  }

  useEffect(() => {
    refresh()
      .catch(() => {
        void clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const response = await api.post("/auth/login", { email, password });
    const token = response.data.token;
    if (!token) throw new Error("Session mobile manquante.");
    const nextUser = assertMobileUser(response.data.user);
    await saveToken(token);
    setUser(nextUser);
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // Local logout should still succeed if the network is gone.
    }
    await clearToken();
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, loading, login, logout, refresh, setUser }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
