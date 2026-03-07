import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

const LEGAL_LINKS = [
  { to: '/legal/privacy',  label: 'Privacy Policy' },
  { to: '/legal/terms',    label: 'Terms of Service' },
  { to: '/legal/licence',  label: 'ESAL-1.3 Licence' },
];

export default function LegalLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 100px' }}>
      {/* Back */}
      <div style={{ marginBottom: 40 }}>
        <Link to="/" style={{ fontSize: 13, color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
          ← Back
        </Link>
      </div>

      {/* Tab nav */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 40, flexWrap: 'wrap' }}>
        {LEGAL_LINKS.map(l => {
          const active = pathname === l.to;
          return (
            <Link key={l.to} to={l.to} style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              textDecoration: 'none', transition: 'all 0.15s',
              background: active ? 'var(--lift)' : 'transparent',
              color: active ? 'var(--text)' : 'var(--muted)',
              border: active ? '1px solid var(--border)' : '1px solid transparent',
            }}>
              {l.label}
            </Link>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ lineHeight: 1.75 }}>
        {children}
      </div>
    </div>
  );
}

// Shared prose components
export function LegalTitle({ children }: { children: ReactNode }) {
  return <h1 style={{ fontFamily: 'var(--serif)', fontSize: 34, marginBottom: 6 }}>{children}</h1>;
}
export function LegalMeta({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 40 }}>{children}</div>;
}
export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{ fontFamily: 'var(--serif)', fontSize: 20, marginBottom: 10, color: 'var(--text)' }}>{title}</h2>
      <div style={{ fontSize: 14, color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {children}
      </div>
    </section>
  );
}
export function LegalP({ children }: { children: ReactNode }) {
  return <p style={{ margin: 0 }}>{children}</p>;
}
export function LegalUl({ children }: { children: ReactNode }) {
  return <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</ul>;
}
export function LegalHr() {
  return <hr style={{ margin: '32px 0' }} />;
}