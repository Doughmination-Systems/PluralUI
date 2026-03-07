import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const NAV_ITEMS = [
  { to: '/settings/general',       label: 'General',       icon: '◈' },
  { to: '/settings/game-accounts',     label: 'Game Accounts',     icon: '◫' },
  { to: '/settings/display',          label: 'Display',          icon: '◐' },
  { to: '/settings/plural-connection', label: 'Plural Connection', icon: '⬡' },
] as const;

export default function SettingsLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px 80px', minHeight: '100vh' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {user.discord_avatar && (
            <img src={user.discord_avatar} alt=""
              style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid var(--border)' }} />
          )}
          <div>
            <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em' }}>Settings</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>{user.discord_tag ?? user.github_login}</div>
          </div>
        </div>
        <button className="btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>← Dashboard</button>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
        {/* Sidebar */}
        <nav style={{ width: 200, flexShrink: 0, position: 'sticky', top: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 14px',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                  background: isActive ? 'var(--lift)' : 'transparent',
                  color: isActive ? 'var(--text)' : 'var(--muted)',
                  border: isActive ? '1px solid var(--border)' : '1px solid transparent',
                })}
              >
                <span style={{ fontSize: 16, lineHeight: 1 }}>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', marginTop: 20, paddingTop: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8, paddingLeft: 14 }}>
              Account
            </div>
            <div style={{ padding: '8px 14px', fontSize: 13, color: 'var(--muted)' }}>
              {user.discord_tag && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ flexShrink: 0, display: 'flex' }}><DiscordIcon size={13} /></span> {user.discord_tag}
                </div>
              )}
              {user.github_login && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ flexShrink: 0, display: 'flex' }}><GitHubIcon size={13} /></span> {user.github_login}
                </div>
              )}
            </div>
          </div>
          <ContactLegalDropdown />
        </nav>

        {/* Content area */}
        <main style={{ flex: 1, minWidth: 0 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function ContactLegalDropdown() {
  const [open, setOpen] = useState(false);

  const items = [
    { label: 'Contact Us',       href: '/contact',       external: false },
    { label: 'Privacy Policy',   href: '/legal/privacy', external: false },
    { label: 'Terms of Service', href: '/legal/terms',   external: false },
  ];

  return (
    <div style={{ marginTop: 8 }}>
      <button
        className="btn-ghost btn-sm"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', textAlign: 'left', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 14px', borderRadius: 8, fontSize: 14,
          fontWeight: 500, color: 'var(--muted)',
          border: '1px solid transparent',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>⚖</span>
          Contact & Legal
        </span>
        <span style={{ fontSize: 10 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2, paddingLeft: 8 }}>
          {items.map(item => (
            <a
              key={item.label}
              href={item.href}
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noopener noreferrer' : undefined}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '7px 14px', borderRadius: 8, fontSize: 13,
                color: 'var(--muted)', textDecoration: 'none',
                transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--lift)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'transparent'; }}
            >
              {item.label}
              <span style={{ fontSize: 11, opacity: 0.5 }}>{item.external ? '↗' : '→'}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function DiscordIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
      <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612"/>
    </svg>
  );
}

export function GitHubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8"/>
    </svg>
  );
}