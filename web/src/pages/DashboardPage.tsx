import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth, MinecraftAccount } from '../hooks/useAuth';
import api from '../api';

interface FrontMember {
  id: string;
  name: string;
  display_name: string | null;
  color: string | null;
  avatar_url: string | null;
  pronouns: string | null;
}

interface FrontData {
  members: FrontMember[];
  started_at: string | null;
}

export default function DashboardPage() {
  const { user, refresh, logout } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [front, setFront] = useState<FrontData | null>(null);

  const notice = params.get('success');
  const errParam = params.get('error');
  const clearParams = () => navigate('/dashboard', { replace: true });

  const loadFront = async () => {
    try {
      const r = await api.get('/api/me/front');
      setFront(r.data);
    } catch {}
  };

  useEffect(() => { loadFront(); }, []);

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
            <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Dashboard</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>{user.discord_tag}</div>
          </div>
        </div>
        <button className="btn-ghost btn-sm" onClick={logout}>Sign out</button>
      </div>

      {/* Notices */}
      {notice === 'mc_linked' && (
        <div className="notice notice-ok" onClick={clearParams} style={{ cursor: 'pointer' }}>
          ✓ Minecraft account linked successfully!
        </div>
      )}
      {errParam && (
        <div className="notice notice-err" onClick={clearParams} style={{ cursor: 'pointer' }}>
          ✗ {errParam === 'mc_failed' ? 'Failed to link Minecraft account. Try again.' : errParam}
        </div>
      )}

      {/* Currently Fronting */}
      {front && front.members.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div className="section-title" style={{ marginBottom: 4 }}>Currently Fronting</div>
          <div className="section-sub">
            Since {front.started_at ? new Date(front.started_at).toLocaleString() : 'unknown'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {front.members.map(m => {
              const color = m.color ? `#${m.color}` : 'var(--accent)';
              const displayName = m.display_name ?? m.name;
              return (
                <div key={m.id} className="card" style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  borderColor: color, boxShadow: `0 0 0 1px ${color}30`,
                  flex: '1 1 200px',
                }}>
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt="" style={{
                      width: 36, height: 36, borderRadius: '50%',
                      border: `2px solid ${color}`, objectFit: 'cover',
                    }} />
                  ) : (
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: `${color}22`, border: `2px solid ${color}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, color,
                    }}>
                      {displayName[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 500, color }}>{displayName}</div>
                    {m.pronouns && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{m.pronouns}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Minecraft Accounts */}
      <MinecraftSection user={user} onRefresh={refresh} />

      <div style={{ height: 24 }} />

      {/* PluralKit */}
      <PluralKitSection user={user} onRefresh={refresh} />

      {/* Future */}
      <div style={{ marginTop: 24, opacity: 0.4 }}>
        <div className="card" style={{ borderStyle: 'dashed', textAlign: 'center', padding: 28 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 18, marginBottom: 6 }}>More coming soon</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>Hytale support, Simply Plural, and more plural apps will appear here.</div>
        </div>
      </div>
    </div>
  );
}

// ── Minecraft section ─────────────────────────────────────────

function MinecraftSection({ user, onRefresh }: { user: any; onRefresh: () => void }) {
  const [unlinking, setUnlinking] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // Bust Crafatar cache by appending a timestamp, updated on manual refresh
  const [avatarBust, setAvatarBust] = useState(() => Math.floor(Date.now() / 60000));

  const handleLink = () => {
    const t = localStorage.getItem('plural_token');
    window.location.href = `/auth/minecraft?token=${encodeURIComponent(t ?? '')}&ts=${Date.now()}`;
  };

  const unlink = async (uuid: string) => {
    if (!confirm('Remove this Minecraft account?')) return;
    setUnlinking(uuid);
    await api.delete(`/api/me/minecraft/${uuid}`);
    await onRefresh();
    setUnlinking(null);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setAvatarBust(Date.now()); // force Crafatar re-fetch
    setRefreshing(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
        <div className="section-title">Minecraft</div>
        {user.minecraft_accounts.length > 0 && (
          <button className="btn-ghost btn-sm" onClick={handleRefresh} disabled={refreshing}
            title="Refresh usernames and skins">
            {refreshing ? '…' : '↻ Refresh'}
          </button>
        )}
      </div>
      <div className="section-sub">Link one or more accounts. All share your system data.</div>

      {user.minecraft_accounts.length > 0 ? (
        user.minecraft_accounts.map((mc: MinecraftAccount) => (
          <div className="mc-row" key={mc.minecraft_uuid}>
            <img
              src={`https://crafatar.com/avatars/${mc.minecraft_uuid}?size=32&overlay&t=${avatarBust}`}
              alt={mc.minecraft_name}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{mc.minecraft_name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>{mc.minecraft_uuid}</div>
            </div>
            <span className="badge badge-ok">linked</span>
            <button className="btn-danger btn-sm" onClick={() => unlink(mc.minecraft_uuid)}
              disabled={unlinking === mc.minecraft_uuid}>
              {unlinking === mc.minecraft_uuid ? '…' : 'Remove'}
            </button>
          </div>
        ))
      ) : (
        <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>No accounts linked yet.</div>
      )}

      <button className="btn-ms btn-sm" onClick={handleLink} style={{ marginTop: 4 }}>
        + Link Minecraft account
      </button>
    </div>
  );
}

// ── PluralKit section ─────────────────────────────────────────

function PluralKitSection({ user, onRefresh }: { user: any; onRefresh: () => void }) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const showMsg = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  };

  const link = async () => {
    setLoading(true);
    try {
      await api.post('/api/pluralkit/link', { token });
      setToken('');
      await onRefresh();
      showMsg('PluralKit linked!', true);
    } catch (e: any) {
      showMsg(e?.response?.data?.error ?? 'Failed to link', false);
    } finally { setLoading(false); }
  };

  const unlink = async () => {
    if (!confirm('Unlink PluralKit? This will also reset the import lock.')) return;
    setLoading(true);
    await api.delete('/api/pluralkit/link');
    await onRefresh();
    setLoading(false);
  };

  const doImport = async () => {
    setLoading(true);
    try {
      const r = await api.post('/api/pluralkit/import');
      await onRefresh();
      showMsg(`Imported ${r.data.imported} members!`, true);
    } catch (e: any) {
      showMsg(e?.response?.data?.error ?? 'Import failed', false);
    } finally { setLoading(false); }
  };

  const doSync = async () => {
    setLoading(true);
    try {
      const r = await api.post('/api/pluralkit/sync');
      showMsg(`Synced! ${r.data.members_updated} updated, ${r.data.front_pushed} fronting pushed to PK`, true);
    } catch (e: any) {
      showMsg(e?.response?.data?.error ?? 'Sync failed', false);
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
        <div className="section-title">PluralKit</div>
        {user.pk_linked
          ? <span className="badge badge-ok">linked</span>
          : <span className="badge badge-muted">not linked</span>}
      </div>
      <div className="section-sub">
        {user.pk_imported
          ? 'Members imported. Use sync to pull updates and push your current front.'
          : user.pk_linked
            ? 'Token linked. Import your members to get started.'
            : 'Paste your PluralKit token to connect. Get it via pk;token in Discord.'}
      </div>

      {msg && <div className={`notice ${msg.ok ? 'notice-ok' : 'notice-err'}`}>{msg.text}</div>}

      {!user.pk_linked ? (
        <div className="card" style={{ display: 'flex', gap: 10 }}>
          <input type="password" value={token} onChange={e => setToken(e.target.value)}
            placeholder="Your PluralKit token" onKeyDown={e => e.key === 'Enter' && link()} />
          <button className="btn-primary" onClick={link} disabled={loading || !token.trim()}
            style={{ whiteSpace: 'nowrap' }}>
            {loading ? '…' : 'Link'}
          </button>
        </div>
      ) : (
        <div className="card">
          {user.pk_system_id && (
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>
              System ID: <code style={{ color: 'var(--accent)' }}>{user.pk_system_id}</code>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn-primary btn-sm" onClick={doImport}
              disabled={loading || user.pk_imported}
              title={user.pk_imported ? 'Already imported — use Sync to update' : undefined}>
              {user.pk_imported ? 'Imported ✓' : 'Import members'}
            </button>
            {user.pk_imported && (
              <button className="btn-ghost btn-sm" onClick={doSync} disabled={loading}>
                {loading ? 'Syncing…' : '↻ Sync'}
              </button>
            )}
            <button className="btn-danger btn-sm" onClick={unlink} disabled={loading}>Unlink</button>
          </div>
          {user.pk_imported && (
            <p style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)' }}>
              Sync pulls updated member data from PluralKit and pushes your current in-game front back to PK.
            </p>
          )}
        </div>
      )}
    </div>
  );
}