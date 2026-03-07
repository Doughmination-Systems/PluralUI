import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '60px 24px 100px', textAlign: 'center' }}>
      <div style={{ marginBottom: 40 }}>
        <Link
          to="/"
          style={{
            fontSize: 13,
            color: 'var(--muted)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            textDecoration: 'none'
          }}
        >
          ← Back
        </Link>
      </div>

      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 48, marginBottom: 8, color: 'var(--muted)' }}>
        404
      </h1>
      <h2 style={{ fontFamily: 'var(--serif)', fontSize: 28, marginBottom: 16 }}>
        Page Not Found
      </h2>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 48, lineHeight: 1.7 }}>
        Oops! The page you're looking for doesn't exist or has been moved.
      </p>

      <div style={{ marginBottom: 40 }}>
        <img
          src="/lostSkin.png"
          alt="lostSkin"
          style={{
            width: 120,
            height: 120,
            animation: 'float 2s ease-in-out infinite',
            borderRadius: 12
          }}
        />
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
          This player also seems lost too!
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
        <Link to="/">
          <button className="btn-ghost btn-sm" style={{ minWidth: 80 }}>
            Go Home
          </button>
        </Link>
        <Link to="/contact">
          <button className="btn-ghost btn-sm" style={{ minWidth: 80 }}>
            Contact Us
          </button>
        </Link>
      </div>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', gap: 16, fontSize: 13, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/legal/privacy" style={{ color: 'var(--muted)' }}>Privacy Policy</Link>
        <Link to="/legal/terms" style={{ color: 'var(--muted)' }}>Terms of Service</Link>
        <Link to="/legal/licence" style={{ color: 'var(--muted)' }}>Licence</Link>
      </div>

      {/* Float animation keyframes */}
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
        `}
      </style>
    </div>
  );
}