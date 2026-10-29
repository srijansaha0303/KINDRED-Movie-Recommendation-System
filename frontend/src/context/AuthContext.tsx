import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "../services/api";

interface AuthUser {
  userId: number;
  email: string;
  name?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("cinemesh_token");
    const savedUser = localStorage.getItem("cinemesh_user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      api.setAuthToken(savedToken);
    }
    setLoading(false);
  }, []);

  function persist(newToken: string, newUser: AuthUser) {
    localStorage.setItem("cinemesh_token", newToken);
    localStorage.setItem("cinemesh_user", JSON.stringify(newUser));
    api.setAuthToken(newToken);
    setToken(newToken);
    setUser(newUser);
  }

  async function login(email: string, password: string) {
    const res = await api.login(email, password);
    persist(res.token, { userId: res.userId, email: res.email, name: res.name });
  }

  async function register(email: string, name: string, password: string) {
    const res = await api.register(email, name, password);
    persist(res.token, { userId: res.userId, email: res.email, name: res.name });
  }

  function logout() {
    localStorage.removeItem("cinemesh_token");
    localStorage.removeItem("cinemesh_user");
    api.setAuthToken(null);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
