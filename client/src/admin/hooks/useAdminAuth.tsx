import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  adminPublicRequest,
  adminRequest,
  clearAdminTokens,
  getAdminAccessToken,
  setAdminTokens
} from '../services/adminApi';

type AdminSession = {
  user: {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
    avatar_url?: string | null;
  };
};

type LoginResponse = AdminSession & {
  accessToken: string;
  refreshToken?: string;
};

type AdminAuthContextValue = {
  session: AdminSession | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      try {
        if (!getAdminAccessToken()) {
          setSession(null);
          return;
        }
        const nextSession = await adminRequest<AdminSession>('/auth/me');
        setSession(nextSession);
      } catch {
        clearAdminTokens();
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    }

    void loadSession();
  }, []);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      session,
      isLoading,
      isConfigured: true,
      async signIn(email, password) {
        const data = await adminPublicRequest<LoginResponse>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        setAdminTokens(data.accessToken, data.refreshToken || '');
        setSession({ user: data.user });
      },
      async signOut() {
        clearAdminTokens();
        setSession(null);
      },
      async resetPassword(email) {
        await adminPublicRequest('/auth/recover', {
          method: 'POST',
          body: JSON.stringify({
            email,
            redirectTo: `${window.location.origin}/admin/login`
          })
        });
      }
    }),
    [session, isLoading]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth deve estar dentro de AdminAuthProvider.');
  }
  return context;
}
