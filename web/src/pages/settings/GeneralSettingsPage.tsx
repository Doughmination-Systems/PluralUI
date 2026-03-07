import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api';
import { DiscordIcon, GitHubIcon } from './SettingsLayout';

const API = import.meta.env.VITE_API_URL ?? '';

export default function GeneralSettingsPage() {
  const { user, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm'>('idle');
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [systemName, setSystemName] = useState('');
  const [systemNameLoading, setSystemNameLoading] = useState(false);

  useEffect(() => {
    if (user?.system_name) setSystemName(user.system_name);
  }, [user?.system_name]);

  // Handle redirect messages from OAuth
  useEffect(() => {
    const success = searchParams.get('success');
    const error   = searchParams.get('error');
    const prompt  = searchParams.get('prompt');
    if (success === 'discord_linked') showMsg('Discord account connected!', true);
    else if (success === 'github_linked') showMsg('GitHub account connected!', true);
    else if (error === 'discord_already_linked') showMsg('That Discord account is already linked to another user.', false);
    else if (error === 'github_already_linked') showMsg('That GitHub account is already linked to another user.', false);
    else if (prompt === 'system_name') showMsg('Welcome! Set a system name to get started.', true);
    if (success || error || prompt) {
      setSearchParams({}, { replace: true });
      refresh();
    }
  }, []);

  if (!user) return null;

  const showMsg = (text: string, ok: boolean) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 6000);
  };

  const saveSystemName = async () => {
    if (!systemName.trim()) return;
    setSystemNameLoading(true);
    try {
      await api.patch('/api/me/system-name', { system_name: systemName.trim() });
      await refresh();
      showMsg('System name updated!', true);
    } catch {
      showMsg('Failed to update system name.', false);
    } finally {
      setSystemNameLoading(false);
    }
  };

  // Build link URL carrying current JWT so the callback can attach to this account
  const linkUrl = (provider: 'discord' | 'github') => {
    const token = localStorage.getItem('plural_token') ?? '';
    return `${API}/auth/${provider}?link=${encodeURIComponent(token)}`;
  };

  const disconnectProvider = async (provider: 'discord' | 'github') => {
    const name = provider === 'discord' ? 'Discord' : 'GitHub';
    if (!confirm(`Disconnect ${name}? You'll still be able to log in with the other method.`)) return;
    try {
      await api.delete(`/auth/${provider}`);
      await refresh();
      showMsg(`${name} disconnected.`, true);
    } catch (e: any) {
      showMsg(e?.response?.data?.error ?? `Failed to disconnect ${name}.`, false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm.toLowerCase() !== 'delete my account') return;
    setDeleteLoading(true);
    try {
      await api.delete('/api/me');
      logout();
      navigate('/');
    } catch {
      showMsg('Failed to delete account. Please try again.', false);
      setDeleteLoading(false);
    }
  };

  const pluralApp = user.plural_app;
  const pluralLinked = pluralApp === 'pluralkit' ? user.pk_linked
    : pluralApp === 'simplyplural' ? user.sp_linked
    : pluralApp === 'plural' ? user.plural_linked
    : false;
  const pluralSystemId = pluralApp === 'pluralkit' ? user.pk_system_id
    : pluralApp === 'simplyplural' ? user.sp_system_id
    : pluralApp === 'plural' ? user.plural_user_id
    : null;

  const hasDiscord = !!user.discord_tag;
  const hasGitHub  = !!(user as any).github_login;
  const canDisconnect = hasDiscord && hasGitHub; // need both to allow removing one

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div className="section-title">General</div>
        <div className="section-sub">Your account details and connected services.</div>
      </div>

      {msg && <div className={`notice ${msg.ok ? 'notice-ok' : 'notice-err'}`}>{msg.text}</div>}

      {/* System name */}
      <div className="card">
        <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 16 }}>
          System Name
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.6 }}>
          This name is shown in game chat and on your dashboard. Choose something that represents your system.
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="e.g. doughmination.system"
            value={systemName}
            onChange={e => setSystemName(e.target.value)}
            maxLength={100}
            style={{ flex: 1 }}
            onKeyDown={e => e.key === 'Enter' && saveSystemName()}
          />
          <button
            className="btn-primary btn-sm"
            onClick={saveSystemName}
            disabled={systemNameLoading || !systemName.trim() || systemName.trim() === user.system_name}
          >
            {systemNameLoading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Connected accounts */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 16 }}>
          Connected Accounts
        </div>

        <AccountRow
          icon={<DiscordIcon size={18} />}
          label="Discord"
          name={user.discord_tag}
          avatar={user.discord_avatar ?? undefined}
          connected={hasDiscord}
          connectHref={linkUrl('discord')}
          connectLabel="Connect Discord"
          accentColor="#5865F2"
          canDisconnect={canDisconnect}
          onDisconnect={() => disconnectProvider('discord')}
        />

        <div style={{ borderTop: '1px solid var(--border)', margin: '12px 0' }} />

        <AccountRow
          icon={<GitHubIcon size={18} />}
          label="GitHub"
          name={(user as any).github_login}
          avatar={(user as any).github_avatar}
          connected={hasGitHub}
          connectHref={linkUrl('github')}
          connectLabel="Connect GitHub"
          accentColor="#f0f6fc"
          canDisconnect={canDisconnect}
          onDisconnect={() => disconnectProvider('github')}
        />

        <div style={{ borderTop: '1px solid var(--border)', margin: '12px 0' }} />

        {/* Plural app status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
            background: 'var(--lift)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color: 'var(--accent)',
          }}>⬡</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, fontSize: 14 }}>
              {pluralApp ? ({ pluralkit: 'PluralKit', simplyplural: 'Simply Plural', plural: '/plu/ral' } as any)[pluralApp] : 'Plural App'}
            </div>
            {pluralSystemId && (
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                System ID: <code style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>{pluralSystemId}</code>
              </div>
            )}
            {!pluralApp && <div style={{ fontSize: 12, color: 'var(--muted)' }}>No plural app selected</div>}
          </div>
          {pluralLinked ? <span className="badge badge-ok">linked</span>
            : pluralApp   ? <span className="badge badge-warn">not linked</span>
            : <span className="badge badge-muted">not set</span>}
        </div>
        {pluralApp && (
          <div style={{ marginTop: 12, paddingLeft: 48 }}>
            <button className="btn-ghost btn-sm" onClick={() => navigate('/settings/game-accounts')}>
              Change plural app →
            </button>
          </div>
        )}
      </div>

      {/* GDPR / data export */}
      <div className="card">
        <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 16 }}>
          Your Data
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.6 }}>
          Export all data associated with your account, including linked accounts, imported members, and session data.
        </div>
        <button className="btn-ghost btn-sm" onClick={async () => {
          try {
            const r = await api.get('/api/me/export');
            const blob = new Blob([JSON.stringify(r.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `plural-data-${Date.now()}.json`; a.click();
            URL.revokeObjectURL(url);
          } catch { showMsg('Failed to export data.', false); }
        }}>
          ↓ Export my data (JSON)
        </button>
      </div>

      {/* Danger zone */}
      {/* Account info */}
      <div className="card">
        <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 12 }}>
          Account
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 2 }}>Account number</div>
            <code style={{ fontSize: 13, color: 'var(--accent)', fontFamily: 'monospace', letterSpacing: '.04em' }}>
              #{user.id.slice(0, 8).toUpperCase()}
            </code>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>
              Use this when contacting support.
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ borderColor: 'rgba(244,112,112,0.25)' }}>
        <div style={{ fontSize: 12, color: 'var(--err)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 16 }}>
          Danger Zone
        </div>

        {deleteStep === 'idle' ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 2 }}>Delete account</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                Permanently removes your account, all linked game accounts, and imported system members.
              </div>
            </div>
            <button className="btn-danger btn-sm" onClick={() => setDeleteStep('confirm')}>
              Delete account
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 4, color: 'var(--err)' }}>Are you absolutely sure?</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
              This cannot be undone. Your account, all linked Minecraft and Hytale accounts, and all imported system members will be permanently deleted.
              <br /><br />
              Type <strong style={{ color: 'var(--text)' }}>delete my account</strong> to confirm.
            </div>
            <input
              type="text"
              placeholder="delete my account"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              style={{ marginBottom: 12, borderColor: 'rgba(244,112,112,0.4)' }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn-danger"
                disabled={deleteConfirm.toLowerCase() !== 'delete my account' || deleteLoading}
                onClick={handleDeleteAccount}
              >
                {deleteLoading ? 'Deleting…' : 'Yes, delete everything'}
              </button>
              <button className="btn-ghost btn-sm" onClick={() => { setDeleteStep('idle'); setDeleteConfirm(''); }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AccountRow({ icon, label, name, avatar, connected, connectHref, connectLabel, accentColor, canDisconnect, onDisconnect }: {
  icon: React.ReactNode;
  label: string;
  name?: string | null;
  avatar?: string;
  connected: boolean;
  connectHref: string;
  connectLabel: string;
  accentColor: string;
  canDisconnect: boolean;
  onDisconnect: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: connected ? `${accentColor}18` : 'var(--lift)',
        border: `1px solid ${connected ? `${accentColor}40` : 'var(--border)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: connected ? accentColor : 'var(--muted)',
        overflow: 'hidden',
      }}>
        {avatar ? (
          <img src={avatar} alt="" style={{ width: 36, height: 36, objectFit: 'cover' }} />
        ) : icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, fontSize: 14 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{name ?? 'Not connected'}</div>
      </div>
      {connected ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge badge-ok">connected</span>
          {canDisconnect && (
            <button className="btn-ghost btn-sm" onClick={onDisconnect} style={{ fontSize: 12 }}>
              Disconnect
            </button>
          )}
        </div>
      ) : (
        <a href={connectHref} style={{ textDecoration: 'none' }}>
          <button className="btn-ghost btn-sm">{connectLabel}</button>
        </a>
      )}
    </div>
  );
}