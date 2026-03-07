import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../api';

export interface MinecraftAccount {
  id: string;
  minecraft_uuid: string;
  minecraft_name: string;
  linked_at: string;
}

export interface HytaleAccount {
  id: string;
  hytale_uuid: string;
  hytale_name: string;
  linked_at: string;
  enabled?: boolean;
}

export interface User {
  id: string;
  discord_id: string | null;
  discord_tag: string | null;
  discord_avatar: string | null;
  github_id: string | null;
  github_login: string | null;
  github_avatar: string | null;
  system_name: string | null;
  pk_linked: boolean;
  pk_imported: boolean;
  pk_system_id: string | null;
  sp_linked: boolean;
  sp_imported: boolean;
  sp_system_id: string | null;
  plural_linked: boolean;
  plural_app: string | null;
  plural_imported: boolean;
  plural_user_id: string | null;
  minecraft_accounts: MinecraftAccount[];
  hytale_accounts: HytaleAccount[];
}

interface Ctx {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<Ctx>({ user: null, loading: true, refresh: async () => {}, logout: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!localStorage.getItem('plural_token')) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const r = await api.get('/api/me');
      // Set user before loading=false so Guard never sees loading=false + user=null simultaneously
      setUser(r.data);
      setLoading(false);
    } catch (e: any) {
      if (e?.response?.status === 401) {
        localStorage.removeItem('plural_token');
      }
      setUser(null);
      setLoading(false);
    }
  };

  const logout = () => { localStorage.removeItem('plural_token'); setUser(null); };

  useEffect(() => { refresh(); }, []);

  return <AuthContext.Provider value={{ user, loading, refresh, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);