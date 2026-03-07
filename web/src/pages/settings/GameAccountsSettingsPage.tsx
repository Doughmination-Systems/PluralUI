import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api';

export default function GameAccountsSettingsPage() {
  const { user, refresh } = useAuth();

  const [unlinkingMc, setUnlinkingMc] = useState<string | null>(null);
  const [unlinkingHy, setUnlinkingHy] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  if (!user) return null;

  const unlinkMc = async (uuid: string) => {
    if (!confirm('Remove this Minecraft account?')) return;
    setUnlinkingMc(uuid);
    try {
      await api.delete(`/api/me/minecraft/${uuid}`);
      await refresh();
    } finally { setUnlinkingMc(null); }
  };

  const unlinkHy = async (uuid: string) => {
    if (!confirm('Remove this Hytale account?')) return;
    setUnlinkingHy(uuid);
    try {
      await api.delete(`/api/me/hytale/${uuid}`);
      await refresh();
    } finally { setUnlinkingHy(null); }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const linkMc = () => {
    const t = localStorage.getItem('plural_token');
    window.location.href = `/auth/minecraft?token=${encodeURIComponent(t ?? '')}&ts=${Date.now()}`;
  };

  const linkHy = () => {
    const t = localStorage.getItem('plural_token');
    window.location.href = `/auth/hytale?token=${encodeURIComponent(t ?? '')}&ts=${Date.now()}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div className="section-title">Game Accounts</div>
        <div className="section-sub">Manage your linked game accounts. Toggle or remove them here.</div>
      </div>

      {/* Minecraft accounts */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
            Minecraft Accounts
          </div>
          {user.minecraft_accounts?.length > 0 && (
            <button className="btn-ghost btn-sm" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? '…' : '↻ Refresh'}
            </button>
          )}
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
          Disabled accounts are hidden from the plugin entirely.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {user.minecraft_accounts?.length > 0 ? (
            user.minecraft_accounts.map((mc: any) => (
              <AccountToggleRow
                key={mc.minecraft_uuid}
                label={mc.minecraft_name}
                sublabel={mc.minecraft_uuid}
                enabled={mc.enabled ?? true}
                icon={
                  <img src={`https://mc-heads.net/combo/${mc.minecraft_uuid}`} alt=""
                    style={{ width: 32, height: 32, borderRadius: 4 }} />
                }
                onToggle={async () => {
                  const r = await api.patch(`/api/me/minecraft/${mc.minecraft_uuid}/toggle`);
                  await refresh();
                  return r.data.enabled as boolean;
                }}
                onRemove={() => unlinkMc(mc.minecraft_uuid)}
                removing={unlinkingMc === mc.minecraft_uuid}
              />
            ))
          ) : (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>No Minecraft accounts linked yet.</div>
          )}
        </div>
        <button className="btn-ms btn-sm" onClick={linkMc}>+ Link Minecraft account</button>
      </div>

      {/* Hytale accounts */}
      <div className="card">
        <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
          Hytale Accounts
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
          Disabled accounts are hidden from the plugin entirely.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {user.hytale_accounts?.length > 0 ? (
            user.hytale_accounts.map((hy: any) => (
              <AccountToggleRow
                key={hy.hytale_uuid}
                label={hy.hytale_name}
                sublabel={hy.hytale_uuid}
                enabled={hy.enabled ?? true}
                icon={
                  <img src={`https://hyvatar.io/render/${hy.hytale_name}?size=64&rotate=45`} alt=""
                    style={{ width: 32, height: 32, borderRadius: 4 }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                }
                onToggle={async () => {
                  const r = await api.patch(`/api/me/hytale/${hy.hytale_uuid}/toggle`);
                  await refresh();
                  return r.data.enabled as boolean;
                }}
                onRemove={() => unlinkHy(hy.hytale_uuid)}
                removing={unlinkingHy === hy.hytale_uuid}
              />
            ))
          ) : (
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>No Hytale accounts linked yet.</div>
          )}
        </div>
        <button className="btn-ghost btn-sm" onClick={linkHy}
          style={{ borderColor: '#4a9eff', color: '#4a9eff' }}>
          + Link Hytale account
        </button>
      </div>
    </div>
  );
}

// ── Account toggle row with remove button ─────────────────────

function AccountToggleRow({ label, sublabel, enabled, icon, onToggle, onRemove, removing }: {
  label: string; sublabel: string; enabled: boolean; icon: React.ReactNode;
  onToggle: () => Promise<boolean | void>; onRemove: () => void; removing: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState(enabled);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const next = await onToggle();
      if (typeof next === 'boolean') setState(next);
      else setState(s => !s);
    } catch { /* leave state as-is on error */ }
    finally { setLoading(false); }
  };

  return (
    <div className="mc-row" style={{ opacity: state ? 1 : 0.6 }}>
      <div style={{ filter: state ? 'none' : 'grayscale(1)', transition: 'filter 0.2s' }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>{sublabel}</div>
      </div>
      <span className={`badge ${state ? 'badge-ok' : 'badge-muted'}`}>{state ? 'active' : 'disabled'}</span>
      <div onClick={loading ? undefined : handleToggle} title={state ? 'Disable' : 'Enable'}
        style={{
          width: 44, height: 24, borderRadius: 12, cursor: loading ? 'wait' : 'pointer',
          background: state ? 'var(--accent)' : 'var(--border)',
          position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        }}>
        <div style={{
          position: 'absolute', top: 3, left: state ? 23 : 3,
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </div>
      <button className="btn-danger btn-sm" onClick={onRemove} disabled={removing} style={{ flexShrink: 0 }}>
        {removing ? '…' : 'Remove'}
      </button>
    </div>
  );
}