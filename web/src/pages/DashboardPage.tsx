import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth, MinecraftAccount, HytaleAccount } from '../hooks/useAuth';
import api from '../api';
import { useWebSocket } from '../hooks/useWebSocket';

interface Member {
  id: string;
  name: string;
  display_name: string | null;
  pronouns: string | null;
  color: string | null;
  avatar_url: string | null;
}
interface FrontData {
  members: Member[];
  started_at: string | null;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [front, setFront] = useState<FrontData | null>(null);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [frontLoading, setFrontLoading] = useState(false);

  const notice   = params.get('success');
  const errParam = params.get('error');
  const clearParams = () => navigate('/dashboard', { replace: true });

  const loadFront = useCallback(async () => {
    const r = await api.get('/api/me/front').catch(() => ({ data: null }));
    setFront(r.data);
  }, []);

  const loadMembers = useCallback(async () => {
    const r = await api.get('/api/me/members').catch(() => ({ data: [] }));
    setAllMembers(r.data);
  }, []);

  useEffect(() => {
    loadFront();
    loadMembers();
  }, []);

  // Live updates via WebSocket
  useWebSocket({
    front_changed: loadFront,
    members_changed: loadMembers,
  });

  if (!user) return null;

  const frontingIds = new Set(front?.members.map(m => m.id) ?? []);

  const addToFront = async (memberId: string) => {
    setFrontLoading(true);
    await api.post('/api/me/front/add', { member_id: memberId }).catch(() => {});
    await loadFront();
    setFrontLoading(false);
  };

  const removeFromFront = async (memberId: string) => {
    setFrontLoading(true);
    await api.post('/api/me/front/remove', { member_id: memberId }).catch(() => {});
    await loadFront();
    setFrontLoading(false);
  };

  const notFronting = allMembers.filter(m => !frontingIds.has(m.id));

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 20px 80px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {(user.discord_avatar || user.github_avatar) && (
            <img src={user.discord_avatar ?? user.github_avatar ?? ''} alt=""
              style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid var(--border)' }} />
          )}
          <div>
            <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Dashboard</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>{user.system_name ?? user.discord_tag ?? user.github_login}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-ghost btn-sm" onClick={() => navigate('/settings')}>⚙ Settings</button>
          <button className="btn-ghost btn-sm" onClick={logout}>Sign out</button>
        </div>
      </div>

      {/* Notices */}
      {notice === 'mc_linked' && (
        <div className="notice notice-ok" onClick={clearParams} style={{ cursor: 'pointer' }}>✓ Minecraft account linked!</div>
      )}
      {notice === 'hytale_linked' && (
        <div className="notice notice-ok" onClick={clearParams} style={{ cursor: 'pointer' }}>✓ Hytale account linked!</div>
      )}
      {errParam && (
        <div className="notice notice-err" onClick={clearParams} style={{ cursor: 'pointer' }}>
          ✗ {errParam === 'mc_failed' ? 'Failed to link Minecraft account.'
            : errParam === 'mc_already_registered' ? 'This Minecraft account is already registered to another plural account. If this is an error, please contact the administrator for assistance.'
            : errParam === 'hytale_already_registered' ? 'This Hytale account is already registered to another plural account. If this is an error, please contact the administrator for assistance.'
            : errParam}
        </div>
      )}

      {/* ── Currently Fronting ── */}
      <Section
        title="Currently Fronting"
        sub={front?.started_at ? `Since ${new Date(front.started_at).toLocaleString()}` : 'No one is fronting right now'}
        action={
          <button
            className="btn-ghost btn-sm"
            onClick={() => setPickerOpen(true)}
            disabled={notFronting.length === 0}
          >
            + Add
          </button>
        }
      >
        {front && front.members.length > 0 ? (
          <div className="card-grid">
            {front.members.map(m => (
              <MemberCard
                key={m.id}
                member={m}
                fronting
                onRemove={() => removeFromFront(m.id)}
                loading={frontLoading}
              />
            ))}
          </div>
        ) : (
          <EmptyState text="No one is currently fronting." />
        )}
      </Section>



      {!user.plural_app && (
        <Section title="Plural App" sub="No plural app connected yet.">
          <button className="btn-primary btn-sm" onClick={() => navigate('/settings/plural-connection')}>
            Connect plural app →
          </button>
        </Section>
      )}

      {/* ── Minecraft ── */}
      {user.minecraft_accounts?.length > 0 && (
        <Section title="Minecraft" sub="Verified accounts share your system data in-game.">
          <div className="card-grid">
            {user.minecraft_accounts.map((mc: MinecraftAccount) => (
              <GameAccountCard
                key={mc.minecraft_uuid}
                name={mc.minecraft_name}
                uuid={mc.minecraft_uuid}
                enabled={(mc as any).enabled ?? true}
                avatar={
                  <img src={`https://mc-heads.net/combo/${mc.minecraft_uuid}`} alt=""
                    style={{ width: '100%', height: '100%', borderRadius: 4 }} />
                }
              />
            ))}
          </div>
        </Section>
      )}

      {/* ── Hytale ── */}
      {user.hytale_accounts?.length > 0 && (
        <Section title="Hytale" sub="Verified accounts share your system data in-game.">
          <div className="card-grid">
            {user.hytale_accounts.map((hy: HytaleAccount) => (
              <GameAccountCard
                key={hy.hytale_uuid}
                name={hy.hytale_name}
                uuid={hy.hytale_uuid}
                enabled={hy.enabled ?? true}
                avatar={
                  <img
                    src={`https://hyvatar.io/render/${hy.hytale_name}?size=64&rotate=45`}
                    alt=""
                    style={{ width: '100%', height: '100%' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                }
              />
            ))}
          </div>
        </Section>
      )}

      {/* No game accounts — point to settings */}
      {!user.minecraft_accounts?.length && !user.hytale_accounts?.length && (
        <Section title="Game Accounts" sub="No accounts linked yet.">
          <button className="btn-ghost btn-sm" onClick={() => navigate('/settings/game-accounts')}>
            Link accounts in Settings →
          </button>
        </Section>
      )}

      {/* ── Front picker modal ── */}
      {pickerOpen && (
        <Modal title="Add to front" onClose={() => setPickerOpen(false)}>
          {notFronting.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>Everyone is already fronting.</p>
          ) : (
            <div className="card-grid" style={{ maxHeight: 420, overflowY: 'auto' }}>
              {notFronting.map(m => (
                <MemberCard
                  key={m.id}
                  member={m}
                  fronting={false}
                  loading={frontLoading}
                  onAdd={async () => {
                    await addToFront(m.id);
                    if (notFronting.length === 1) setPickerOpen(false);
                  }}
                />
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────

function Section({ title, sub, action, children }: {
  title: string; sub?: string; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
        <div className="section-title">{title}</div>
        {action}
      </div>
      {sub && <div className="section-sub">{sub}</div>}
      {children}
    </div>
  );
}

// ── Member card ───────────────────────────────────────────────

function MemberCard({ member, fronting, onRemove, onAdd, loading }: {
  member: Member; fronting: boolean; loading: boolean;
  onRemove?: () => void; onAdd?: () => void;
}) {
  const color = member.color ? `#${member.color}` : 'var(--accent)';
  const displayName = member.display_name ?? member.name;

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${fronting ? color : 'var(--border)'}`,
      boxShadow: fronting ? `0 0 0 1px ${color}40, 0 4px 16px ${color}18` : 'none',
      borderRadius: 'var(--r)',
      padding: '16px 14px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 8, textAlign: 'center',
      position: 'relative', transition: 'all 0.2s',
    }}>
      {fronting && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          width: 8, height: 8, borderRadius: '50%',
          background: color, boxShadow: `0 0 6px ${color}`,
        }} />
      )}
      <div style={{
        width: 64, height: 64, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
        border: `2px solid ${color}`, background: `${color}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, color,
      }}>
        {member.avatar_url
          ? <img src={member.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : displayName[0].toUpperCase()}
      </div>
      <div>
        <div style={{ fontWeight: 500, fontSize: 14, color: fronting ? color : 'var(--text)' }}>{displayName}</div>
        {member.pronouns && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{member.pronouns}</div>}
      </div>
      {onRemove && (
        <button className="btn-danger btn-sm" onClick={onRemove} disabled={loading}
          style={{ fontSize: 11, padding: '3px 10px', marginTop: 2 }}>
          Remove
        </button>
      )}
      {onAdd && (
        <button className="btn-ghost btn-sm" onClick={onAdd} disabled={loading}
          style={{ fontSize: 11, padding: '3px 10px', marginTop: 2 }}>
          Add to front
        </button>
      )}
    </div>
  );
}

// ── Game account card ─────────────────────────────────────────

function GameAccountCard({ name, uuid, enabled, avatar }: {
  name: string; uuid: string; enabled: boolean; avatar: React.ReactNode;
}) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--r)', padding: '16px 14px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 8, textAlign: 'center',
      opacity: enabled ? 1 : 0.5, transition: 'opacity 0.2s',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 10, overflow: 'hidden',
        background: 'var(--lift)', border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        filter: enabled ? 'none' : 'grayscale(1)',
        transition: 'filter 0.2s',
      }}>
        {avatar}
      </div>
      <div>
        <div style={{ fontWeight: 500, fontSize: 14 }}>{name}</div>
        <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace', marginTop: 2, wordBreak: 'break-all' }}>
          {uuid}
        </div>
      </div>
      <span className={`badge ${enabled ? 'badge-ok' : 'badge-muted'}`} style={{ fontSize: 11 }}>
        {enabled ? 'Verified' : 'Disabled'}
      </span>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────

function EmptyState({ text }: { text: string }) {
  return (
    <div style={{
      padding: '24px', borderRadius: 'var(--r)',
      border: '1px dashed var(--border)',
      color: 'var(--muted)', fontSize: 13, textAlign: 'center',
    }}>
      {text}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────

function Modal({ title, onClose, children }: {
  title: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r)', padding: 24, width: '100%', maxWidth: 560,
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 20 }}>{title}</div>
          <button className="btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}