import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from '../api/client';
import { clearFetchCache } from '../hooks/useFetch';

export interface UserData {
  id: string;
  email: string;
  rol: string;
  vetId?: string;
  proId?: string;
  nombre?: string;
  apellido?: string;
  clinicas?: { id: string; nombre_comercial: string }[];
}

interface LoginResponse {
  message: string;
  user: UserData;
}

interface AuthContextType {
  user: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: UserData | null) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  setUser: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, try to restore session from cookie
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const data = await api.get<{ user: UserData }>('/usuarios/me');
        setUser(data.user);
      } catch (err) {
        // No valid session - that's fine, user needs to login
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<LoginResponse>('/auth/login', { email, password });
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Even if logout API fails, clear local state
    }
    clearFetchCache();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
