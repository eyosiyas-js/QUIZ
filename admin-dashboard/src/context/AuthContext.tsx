import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import client from '../api/client';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (name: string, phone: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('admin_token');
    if (stored) {
      setToken(stored);
    }
    setIsLoading(false);
  }, []);

  const login = async (name: string, phone: string, password: string) => {
    const res = await client.post('/auth/admin', {
      name,
      phone_number: phone,
      password,
    });
    const jwt = res.data.auth_token;
    localStorage.setItem('admin_token', jwt);
    setToken(jwt);
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{ token, isAuthenticated: !!token, isLoading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
