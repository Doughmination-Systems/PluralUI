import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../api';

export interface MinecraftAccount {
  id: string;
  minecraft_uuid: string;
  minecraft_name: string;
  linked_at: string;
}

export interface User {
  id: string;
  discord_id: string;
  discord_tag: string;
  discord_avatar: string | null;
  pk_linked: boolean;
  pk_imported: boolean;
  pk_system_id: string | null;
  minecraft_accounts: MinecraftAccount[];
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
    if (!localStorage.getItem('plural_token')) { setUser(null); setLoading(false); return; }
    try {
      const r = await api.get('/api/me');
      setUser(r.data);
    } catch {
      localStorage.removeItem('plural_token');
      setUser(null);
    } finally { setLoading(false); }
  };

  const logout = () => { localStorage.removeItem('plural_token'); setUser(null); };

  useEffect(() => { refresh(); }, []);

  return <AuthContext.Provider value={{ user, loading, refresh, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
