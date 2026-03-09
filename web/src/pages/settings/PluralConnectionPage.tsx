import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api';

const PLURAL_APPS = [
  {
    id: 'pluralkit',
    label: 'PluralKit',
    desc: 'pk;token in Discord',
    placeholder: 'Your PluralKit token',
    linkRoute: '/api/pluralkit/link',
    importRoute: '/api/pluralkit/import',
    syncRoute: '/api/pluralkit/sync',
    systemLabel: 'System ID',
    bidirectional: true,
    recommended: true,
  },
  {
    id: 'plural',
    label: '/plu/ral',
    desc: '/api command in the bot',
    placeholder: 'Your /plu/ral token',
    linkRoute: '/api/plural/link',
    importRoute: '/api/plural/import',
    syncRoute: '/api/plural/sync',
    systemLabel: 'User ID',
    bidirectional: false,
    note: 'Front push is not supported by the /plu/ral API. Sync is pull-only.',
  },
] as const;

export default function PluralConnectionPage() {
  const { user, refresh } = useAuth();
  const [appSwitching, setAppSwitching] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  if (!user) return null;

  const showMsg = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 5000);
  };

  const selectApp = async (appId: string) => {
    if (appId === user.plural_app) return;
    if (user.plural_app && !confirm('Switching plural apps will delete all imported members. Continue?')) return;
    setAppSwitching(true);
    try {
      await api.post('/api/me/plural-app', { app: appId });
      await refresh();
      showMsg('Plural app updated!', true);
    } catch {
      showMsg('Failed to switch app.', false);
    } finally { setAppSwitching(false); }
  };

  const activeApp = PLURAL_APPS.find(a => a.id === user.plural_app);

  const linked = user.plural_app === 'pluralkit' ? user.pk_linked
    : user.plural_app === 'plural' ? user.plural_linked
    : false;

  const imported = user.plural_app === 'pluralkit' ? user.pk_imported
    : user.plural_app === 'plural' ? user.plural_imported
    : false;

  const systemId = user.plural_app === 'pluralkit' ? user.pk_system_id
    : user.plural_user_id;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div className="section-title">Plural Connection</div>
        <div className="section-sub">Choose your plural app and link your account to import members.</div>
        <div className="section-sub">Note: We do not, and will never support Octocon. More can be found <a href="/unsupported">here</a>.</div>
      </div>

      {msg && <div className={`notice ${msg.ok ? 'notice-ok' : 'notice-err'}`}>{msg.text}</div>}

      {/* App selector */}
      <div className="card">
        <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
          Plural App
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
          Choose which app to use. Switching will delete all imported members.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {PLURAL_APPS.map(app => {
            const selected = user.plural_app === app.id;
            return (
              <div
                key={app.id}
                className="card"
                onClick={() => !appSwitching && selectApp(app.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  cursor: appSwitching ? 'wait' : 'pointer',
                  borderColor: selected ? 'var(--accent)' : 'var(--border)',
                  boxShadow: selected ? '0 0 0 1px var(--accent)' : 'none',
                  padding: '14px 18px',
                  transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
                  background: selected ? 'var(--accent)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>
                  {selected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {app.label}
                    {'recommended' in app && app.recommended && (
                      <span className="badge badge-ok" style={{ fontSize: 10, padding: '1px 7px' }}>recommended</span>
                    )}
                    {app.bidirectional
                      ? <span className="badge badge-ok" style={{ fontSize: 10, padding: '1px 7px' }}>↕ bidirectional sync</span>
                      : <span className="badge badge-muted" style={{ fontSize: 10, padding: '1px 7px' }}>↓ pull only</span>
                    }
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{app.desc}</div>
                </div>
                {selected && <span className="badge badge-ok">active</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Token / link / import / sync — only shown once an app is selected */}
      {activeApp && (
        <TokenSection
          app={activeApp}
          linked={linked}
          imported={imported}
          systemId={systemId}
          onRefresh={refresh}
          onMsg={showMsg}
        />
      )}
    </div>
  );
}

// ── Token section ─────────────────────────────────────────────

function TokenSection({ app, linked, imported, systemId, onRefresh, onMsg }: {
  app: typeof PLURAL_APPS[number];
  linked: boolean;
  imported: boolean;
  systemId: string | null;
  onRefresh: () => Promise<void>;
  onMsg: (text: string, ok: boolean) => void;
}) {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  const doLink = async () => {
    setLoading(true);
    try {
      const r = await api.post(app.linkRoute, { token });
      setToken('');
      await onRefresh();
      const note = r.data.note ? ` ${r.data.note}` : '';
      onMsg(`${app.label} linked!${note}`, true);
    } catch (e: any) {
      onMsg(e?.response?.data?.error ?? 'Failed to link', false);
    } finally { setLoading(false); }
  };

  const doUnlink = async () => {
    if (!confirm(`Unlink ${app.label}? This will also reset the import lock.`)) return;
    setLoading(true);
    try {
      await api.delete(app.linkRoute);
      await onRefresh();
      onMsg(`${app.label} unlinked.`, true);
    } catch {
      onMsg('Failed to unlink.', false);
    } finally { setLoading(false); }
  };

  const doImport = async () => {
    setLoading(true);
    try {
      const r = await api.post(app.importRoute);
      await onRefresh();
      onMsg(`Imported ${r.data.imported} members!`, true);
    } catch (e: any) {
      onMsg(e?.response?.data?.error ?? 'Import failed', false);
    } finally { setLoading(false); }
  };

  const doSync = async () => {
    setLoading(true);
    try {
      const r = await api.post(app.syncRoute);
      const pushed = r.data.front_pushed != null ? `, ${r.data.front_pushed} fronting pushed` : '';
      onMsg(`Synced! ${r.data.members_updated} updated${pushed}`, true);
    } catch (e: any) {
      onMsg(e?.response?.data?.error ?? 'Sync failed', false);
    } finally { setLoading(false); }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
          {app.label} Token
        </div>
        <span className={`badge ${linked ? 'badge-ok' : 'badge-muted'}`}>
          {linked ? 'linked' : 'not linked'}
        </span>
      </div>

      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
        {imported
          ? `Members imported. Use sync to pull updates${app.bidirectional ? ' and push your current front' : ''}.`
          : linked
            ? 'Token linked. Import your members to get started.'
            : `Get your token via: ${app.desc}`}
      </div>

      {!linked ? (
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder={app.placeholder}
            onKeyDown={e => e.key === 'Enter' && doLink()}
          />
          <button
            className="btn-primary"
            onClick={doLink}
            disabled={loading || !token.trim()}
            style={{ whiteSpace: 'nowrap' }}
          >
            {loading ? '…' : 'Link'}
          </button>
        </div>
      ) : (
        <div>
          {systemId && (
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
              {app.systemLabel}:{' '}
              <code style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>{systemId}</code>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="btn-primary btn-sm"
              onClick={doImport}
              disabled={loading || imported}
              title={imported ? 'Already imported — use Sync to update' : undefined}
            >
              {imported ? 'Imported ✓' : 'Import members'}
            </button>
            {imported && (
              <button className="btn-ghost btn-sm" onClick={doSync} disabled={loading}>
                {loading ? 'Syncing…' : '↻ Sync'}
              </button>
            )}
            <button className="btn-danger btn-sm" onClick={doUnlink} disabled={loading}>
              Unlink
            </button>
          </div>
          {imported && (
            <p style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)' }}>
              {'note' in app && app.note
                ? app.note
                : `Sync pulls updated member data from ${app.label}${app.bidirectional ? ' and pushes your current in-game front back' : ''}.`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}