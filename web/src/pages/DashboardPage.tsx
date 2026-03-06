import { useState, useEffect } from 'react';
import { useNavigate as useNav } from 'react-router-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth, MinecraftAccount } from '../hooks/useAuth';
import api from '../api';

interface FrontMember {
  id: string; name: string; display_name: string | null;
  color: string | null; avatar_url: string | null; pronouns: string | null;
}
interface FrontData { members: FrontMember[]; started_at: string | null; }

export default function DashboardPage() {
  const { user, refresh, logout } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const navToSettings = useNav();
  const [front, setFront] = useState<FrontData | null>(null);

  const notice = params.get('success');
  const errParam = params.get('error');
  const clearParams = () => navigate('/dashboard', { replace: true });

  useEffect(() => {
    api.get('/api/me/front').then(r => setFront(r.data)).catch(() => {});
  }, []);

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
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost btn-sm" onClick={() => navToSettings('/settings')}>⚙ Settings</button>
          <button className="btn-ghost btn-sm" onClick={logout}>Sign out</button>
        </div>
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
          <div className="section-sub">Since {front.started_at ? new Date(front.started_at).toLocaleString() : 'unknown'}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {front.members.map(m => {
              const color = m.color ? `#${m.color}` : 'var(--accent)';
              const displayName = m.display_name ?? m.name;
              return (
                <div key={m.id} className="card" style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  borderColor: color, boxShadow: `0 0 0 1px ${color}30`, flex: '1 1 200px',
                }}>
                  {m.avatar_url ? (
                    <img src={m.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%', border: `2px solid ${color}`, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: `${color}22`, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color }}>
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

      <MinecraftSection user={user} onRefresh={refresh} />
      <div style={{ height: 24 }} />
      <HytaleSection user={user} onRefresh={refresh} />
      <div style={{ height: 24 }} />
      {user.plural_app === 'pluralkit' && (
        <PluralAppSection
          title="PluralKit" tokenLabel="pk;token in Discord" tokenPlaceholder="Your PluralKit token"
          linked={user.pk_linked} imported={user.pk_imported} systemId={user.pk_system_id}
          systemLabel="System ID"
          linkRoute="/api/pluralkit/link" importRoute="/api/pluralkit/import" syncRoute="/api/pluralkit/sync"
          onRefresh={refresh} bidirectional
        />
      )}
      {user.plural_app === 'simplyplural' && (
        <PluralAppSection
          title="Simply Plural" tokenLabel="Settings → Account → Tokens in the app" tokenPlaceholder="Your Simply Plural token"
          linked={user.sp_linked} imported={user.sp_imported} systemId={user.sp_system_id}
          systemLabel="System ID"
          linkRoute="/api/simplyplural/link" importRoute="/api/simplyplural/import" syncRoute="/api/simplyplural/sync"
          onRefresh={refresh} bidirectional
        />
      )}
      {user.plural_app === 'plural' && (
        <PluralAppSection
          title="/plu/ral" tokenLabel="/api command in the /plu/ral Discord bot" tokenPlaceholder="Your /plu/ral token"
          linked={user.plural_linked} imported={user.plural_imported} systemId={user.plural_user_id}
          systemLabel="User ID"
          linkRoute="/api/plural/link" importRoute="/api/plural/import" syncRoute="/api/plural/sync"
          onRefresh={refresh} bidirectional={false}
          note="Front push is not supported by the /plu/ral API. Sync is pull-only."
        />
      )}
      {!user.plural_app && (
        <div className="card" style={{ textAlign: 'center', padding: 28 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 18, marginBottom: 8 }}>No plural app selected</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>Choose a plural app in Settings to get started.</div>
          <button className="btn-primary btn-sm" onClick={() => window.location.href = '/settings'}>Go to Settings</button>
        </div>
      )}
    </div>
  );
}

// ── Minecraft section ─────────────────────────────────────────

function MinecraftSection({ user, onRefresh }: { user: any; onRefresh: () => void }) {
  const [unlinking, setUnlinking] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
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
    setAvatarBust(Date.now());
    setRefreshing(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
        <div className="section-title">Minecraft</div>
        {user.minecraft_accounts.length > 0 && (
          <button className="btn-ghost btn-sm" onClick={handleRefresh} disabled={refreshing} title="Refresh usernames and skins">
            {refreshing ? '…' : '↻ Refresh'}
          </button>
        )}
      </div>
      <div className="section-sub">Link one or more accounts. All share your system data.</div>
      {user.minecraft_accounts.length > 0 ? (
        user.minecraft_accounts.map((mc: MinecraftAccount) => (
          <div className="mc-row" key={mc.minecraft_uuid}>
            <img src={`https://mc-heads.net/avatar/${mc.minecraft_uuid}/32`}
              alt={mc.minecraft_name}
              onError={(e) => { const el = e.target as HTMLImageElement; if (!el.src.includes('crafatar')) { el.src = `https://crafatar.com/avatars/${mc.minecraft_uuid}?size=32&overlay`; } else { el.style.display = 'none'; } }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{mc.minecraft_name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>{mc.minecraft_uuid}</div>
            </div>
            <span className="badge badge-ok">linked</span>
            <button className="btn-danger btn-sm" onClick={() => unlink(mc.minecraft_uuid)} disabled={unlinking === mc.minecraft_uuid}>
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

// ── Generic plural app section ────────────────────────────────

interface PluralAppSectionProps {
  title: string;
  tokenLabel: string;
  tokenPlaceholder: string;
  linked: boolean;
  imported: boolean;
  systemId: string | null;
  systemLabel: string;
  linkRoute: string;
  importRoute: string;
  syncRoute: string;
  onRefresh: () => void;
  bidirectional: boolean;
  note?: string;
}

function PluralAppSection({
  title, tokenLabel, tokenPlaceholder, linked, imported, systemId, systemLabel,
  linkRoute, importRoute, syncRoute, onRefresh, bidirectional, note,
}: PluralAppSectionProps) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const showMsg = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 5000);
  };

  const link = async () => {
    setLoading(true);
    try {
      const r = await api.post(linkRoute, { token });
      setToken('');
      await onRefresh();
      const note = r.data.note ? ` ${r.data.note}` : '';
      showMsg(`${title} linked!${note}`, true);
    } catch (e: any) {
      showMsg(e?.response?.data?.error ?? 'Failed to link', false);
    } finally { setLoading(false); }
  };

  const unlink = async () => {
    if (!confirm(`Unlink ${title}? This will also reset the import lock.`)) return;
    setLoading(true);
    await api.delete(linkRoute);
    await onRefresh();
    setLoading(false);
  };

  const doImport = async () => {
    setLoading(true);
    try {
      const r = await api.post(importRoute);
      await onRefresh();
      showMsg(`Imported ${r.data.imported} members!`, true);
    } catch (e: any) {
      showMsg(e?.response?.data?.error ?? 'Import failed', false);
    } finally { setLoading(false); }
  };

  const doSync = async () => {
    setLoading(true);
    try {
      const r = await api.post(syncRoute);
      const pushed = r.data.front_pushed != null ? `, ${r.data.front_pushed} fronting pushed` : '';
      showMsg(`Synced! ${r.data.members_updated} updated${pushed}`, true);
    } catch (e: any) {
      showMsg(e?.response?.data?.error ?? 'Sync failed', false);
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
        <div className="section-title">{title}</div>
        {linked ? <span className="badge badge-ok">linked</span> : <span className="badge badge-muted">not linked</span>}
      </div>
      <div className="section-sub">
        {imported
          ? `Members imported. Use sync to pull updates${bidirectional ? ' and push your current front' : ''}.`
          : linked
            ? 'Token linked. Import your members to get started.'
            : `Paste your ${title} token. Get it via ${tokenLabel}.`}
      </div>

      {msg && <div className={`notice ${msg.ok ? 'notice-ok' : 'notice-err'}`}>{msg.text}</div>}

      {!linked ? (
        <div className="card" style={{ display: 'flex', gap: 10 }}>
          <input type="password" value={token} onChange={e => setToken(e.target.value)}
            placeholder={tokenPlaceholder} onKeyDown={e => e.key === 'Enter' && link()} />
          <button className="btn-primary" onClick={link} disabled={loading || !token.trim()} style={{ whiteSpace: 'nowrap' }}>
            {loading ? '…' : 'Link'}
          </button>
        </div>
      ) : (
        <div className="card">
          {systemId && (
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>
              {systemLabel}: <code style={{ color: 'var(--accent)' }}>{systemId}</code>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn-primary btn-sm" onClick={doImport}
              disabled={loading || imported}
              title={imported ? 'Already imported — use Sync to update' : undefined}>
              {imported ? 'Imported ✓' : 'Import members'}
            </button>
            {imported && (
              <button className="btn-ghost btn-sm" onClick={doSync} disabled={loading}>
                {loading ? 'Syncing…' : '↻ Sync'}
              </button>
            )}
            <button className="btn-danger btn-sm" onClick={unlink} disabled={loading}>Unlink</button>
          </div>
          {imported && (
            <p style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)' }}>
              {note ?? `Sync pulls updated member data from ${title}${bidirectional ? ' and pushes your current in-game front back' : ''}.`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Hytale section ───────────────────────────────────────────

function HytaleSection({ user, onRefresh }: { user: any; onRefresh: () => void }) {
  const [unlinking, setUnlinking] = useState<string | null>(null);

  const handleLink = () => {
    const t = localStorage.getItem('plural_token');
    window.location.href = `/auth/hytale?token=${encodeURIComponent(t ?? '')}&ts=${Date.now()}`;
  };

  const unlink = async (uuid: string) => {
    if (!confirm('Remove this Hytale account?')) return;
    setUnlinking(uuid);
    await api.delete(`/api/me/hytale/${uuid}`);
    await onRefresh();
    setUnlinking(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
        <div className="section-title">Hytale</div>
      </div>
      <div className="section-sub">Link your Hytale account. Shares your system data.</div>

      {user.hytale_accounts?.length > 0 ? (
        user.hytale_accounts.map((hy: any) => (
          <div className="mc-row" key={hy.hytale_uuid}>
            <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
              <img src={`https://hyvatar.io/render/${hy.hytale_name}?size=64&rotate=45`}
                alt="" style={{ width: 32, height: 32, borderRadius: 4 }}
                onError={(e) => { const el = e.target as HTMLImageElement; el.style.display = 'none'; }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500 }}>{hy.hytale_name}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>{hy.hytale_uuid}</div>
            </div>
            <span className="badge badge-ok">linked</span>
            <button className="btn-danger btn-sm" onClick={() => unlink(hy.hytale_uuid)}
              disabled={unlinking === hy.hytale_uuid}>
              {unlinking === hy.hytale_uuid ? '…' : 'Remove'}
            </button>
          </div>
        ))
      ) : (
        <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12 }}>No accounts linked yet.</div>
      )}

      <button className="btn-ms btn-sm" onClick={handleLink} style={{ marginTop: 4, background: 'linear-gradient(135deg, #1a1a2e, #16213e)', borderColor: '#4a9eff' }}>
        + Link Hytale account
      </button>
    </div>
  );
}