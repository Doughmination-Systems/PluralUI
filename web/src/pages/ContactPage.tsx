import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ContactPage() {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText('admin@doughmination.win');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '60px 24px 100px' }}>
      <div style={{ marginBottom: 40 }}>
        <Link to="/" style={{ fontSize: 13, color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
          ← Back
        </Link>
      </div>

      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 34, marginBottom: 8 }}>Contact Us</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 48, lineHeight: 1.7 }}>
        Plural Cloud is a small self-hosted project. If you need help, have a question, or want to report an issue, reach out below.
      </p>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Email</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <a href="mailto:admin@doughmination.win" style={{ fontSize: 15, fontWeight: 500 }}>
            admin@doughmination.win
          </a>
          <button className="btn-ghost btn-sm" onClick={copy} style={{ minWidth: 70 }}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
          For general enquiries, support, data requests, and commercial licensing.
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Discord</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500 }}>Join our server</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Get support, report bugs, and follow development.</div>
          </div>
          <a href="https://discord.gg/RQDRzK3VBe" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
            <button className="btn-discord btn-sm">Join</button>
          </a>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Response Times</div>
        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
          This is a personal project maintained in spare time. We aim to respond within a few days, but cannot guarantee specific response times.
        </p>
      </div>

      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', gap: 16, fontSize: 13 }}>
        <Link to="/legal/privacy" style={{ color: 'var(--muted)' }}>Privacy Policy</Link>
        <Link to="/legal/terms"   style={{ color: 'var(--muted)' }}>Terms of Service</Link>
        <Link to="/legal/licence" style={{ color: 'var(--muted)' }}>Licence</Link>
      </div>
    </div>
  );
}