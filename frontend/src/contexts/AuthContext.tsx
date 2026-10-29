import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { api } from "../services/api";

interface AuthState {
  token: string | null;
  userId: number | null;
  username: string | null;
}

interface AuthContextValue extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string, email?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "kindred_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { token: null, userId: null, username: null };
    } catch {
      return { token: null, userId: null, username: null };
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  async function login(username: string, password: string) {
    const res = await api.login(username, password);
    setState({ token: res.token, userId: res.userId, username: res.username });
  }

  async function signup(username: string, password: string, email?: string) {
    const res = await api.signup(username, password, email);
    setState({ token: res.token, userId: res.userId, username: res.username });
  }

  function logout() {
    setState({ token: null, userId: null, username: null });
  }

  return (
    <AuthContext.Provider
      value={{ ...state, login, signup, logout, isAuthenticated: !!state.token }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
