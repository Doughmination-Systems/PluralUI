import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../api';

const PLURAL_APPS = [
  { id: 'pluralkit', label: 'PluralKit', desc: 'pk;token in Discord' },
  { id: 'simplyplural', label: 'Simply Plural', desc: 'Settings → Account → Tokens' },
  { id: 'plural', label: '/plu/ral', desc: '/api command in the bot' },
] as const;

export default function SettingsPage() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();

  const [appSwitching, setAppSwitching] = useState(false);
  const [appMsg, setAppMsg] = useState<string | null>(null);

  const selectApp = async (appId: string) => {
    if (!user) return;
    
    if (appId === user.plural_app) return;
    if (user.plural_app && !confirm('Switching plural apps will delete all imported members. Continue?')) return;
    setAppSwitching(true);
    try {
      await api.post('/api/me/plural-app', { app: appId });
      await refresh();
      setAppMsg('Plural app updated! Re-import your members from the dashboard.');
      setTimeout(() => setAppMsg(null), 5000);
    } catch {
      setAppMsg('Failed to switch app.');
      setTimeout(() => setAppMsg(null), 3000);
    } finally { setAppSwitching(false); }
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 20px 80px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {user.discord_avatar && (
            <img src={user.discord_avatar} alt=""
              style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid var(--border)' }} />
          )}
          <div>
            <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Settings</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>{user.discord_tag}</div>
          </div>
        </div>
        <button className="btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>← Dashboard</button>
      </div>

      {/* Plural app selector */}
      <div style={{ marginBottom: 28 }}>
        <div className="section-title">Plural App</div>
        <div className="section-sub">Choose which app to use for your system members. Switching will delete imported members.</div>
        {appMsg && <div className={`notice ${appMsg.includes('Failed') ? 'notice-err' : 'notice-ok'}`}>{appMsg}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PLURAL_APPS.map(app => {
            const selected = user.plural_app === app.id;
            return (
              <div key={app.id} className="card"
                onClick={() => !appSwitching && selectApp(app.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, cursor: appSwitching ? 'wait' : 'pointer',
                  borderColor: selected ? 'var(--accent)' : 'var(--border)',
                  boxShadow: selected ? '0 0 0 1px var(--accent)' : 'none',
                  padding: '14px 18px',
                }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                  background: selected ? 'var(--accent)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {selected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                </div>
                <div>
                  <div style={{ fontWeight: 500 }}>{app.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{app.desc}</div>
                </div>
                {selected && <span className="badge badge-ok" style={{ marginLeft: 'auto' }}>active</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Minecraft toggles */}
      {user.minecraft_accounts?.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div className="section-title">Minecraft Accounts</div>
          <div className="section-sub">Disabled accounts are hidden from the plugin entirely.</div>
          {user.minecraft_accounts.map((mc: any) => (
            <AccountToggleRow
              key={mc.minecraft_uuid}
              label={mc.minecraft_name}
              sublabel={mc.minecraft_uuid}
              enabled={mc.enabled ?? true}
              icon={
                <img src={`https://mc-heads.net/avatar/${mc.minecraft_uuid}/32`}
                  alt="" style={{ width: 32, height: 32, borderRadius: 4 }}
                  onError={(e) => { const el = e.target as HTMLImageElement; if (!el.src.includes('crafatar')) { el.src = `https://crafatar.com/avatars/${mc.minecraft_uuid}?size=32&overlay`; } else { el.style.display = 'none'; } }} />
              }
              onToggle={async () => {
                await api.patch(`/api/me/minecraft/${mc.minecraft_uuid}/toggle`);
                await refresh();
              }}
            />
          ))}
        </div>
      )}

      {/* Hytale toggles */}
      {user.hytale_accounts?.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div className="section-title">Hytale Accounts</div>
          <div className="section-sub">Disabled accounts are hidden from the plugin entirely.</div>
          {user.hytale_accounts.map((hy: any) => (
            <AccountToggleRow
              key={hy.hytale_uuid}
              label={hy.hytale_name}
              sublabel={hy.hytale_uuid}
              enabled={hy.enabled ?? true}
              icon={
                <img src={`https://hyvatar.io/render/${hy.hytale_name}?size=64&rotate=45`}
                  alt="" style={{ width: 32, height: 32, borderRadius: 4 }}
                  onError={(e) => { const el = e.target as HTMLImageElement; el.style.display = 'none'; }} />
              }
              onToggle={async () => {
                await api.patch(`/api/me/hytale/${hy.hytale_uuid}/toggle`);
                await refresh();
              }}
            />
          ))}
        </div>
      )}

      {user.minecraft_accounts?.length === 0 && user.hytale_accounts?.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
          No game accounts linked yet. Link accounts from the dashboard first.
        </div>
      )}
    </div>
  );
}

// ── Toggle row ────────────────────────────────────────────────

function AccountToggleRow({ label, sublabel, enabled, icon, onToggle }: {
  label: string;
  sublabel: string;
  enabled: boolean;
  icon: React.ReactNode;
  onToggle: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState(enabled);

  const handleToggle = async () => {
    setLoading(true);
    setState(s => !s); // optimistic
    try {
      await onToggle();
    } catch {
      setState(s => !s); // revert on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mc-row" style={{ opacity: state ? 1 : 0.5 }}>
      <div style={{ filter: state ? 'none' : 'grayscale(1)', transition: 'filter 0.2s' }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>{sublabel}</div>
      </div>
      <span className={`badge ${state ? 'badge-ok' : 'badge-muted'}`}>
        {state ? 'active' : 'disabled'}
      </span>
      {/* Toggle switch */}
      <div
        onClick={loading ? undefined : handleToggle}
        style={{
          width: 44, height: 24, borderRadius: 12, cursor: loading ? 'wait' : 'pointer',
          background: state ? 'var(--accent)' : 'var(--border)',
          position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: state ? 23 : 3,
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </div>
    </div>
  );
}