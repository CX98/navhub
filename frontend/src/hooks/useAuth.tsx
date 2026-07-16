import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { authApi } from "@/lib/api";

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check stored token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("navhub_token");
    if (storedToken) {
      authApi
        .verify()
        .then((result) => {
          if (result.valid) {
            setToken(storedToken);
            setUsername(result.username);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem("navhub_token");
          }
        })
        .catch(() => {
          localStorage.removeItem("navhub_token");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (user: string, password: string) => {
    const result = await authApi.login(user, password);
    localStorage.setItem("navhub_token", result.token);
    setToken(result.token);
    setUsername(result.username);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("navhub_token");
    setToken(null);
    setUsername(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
