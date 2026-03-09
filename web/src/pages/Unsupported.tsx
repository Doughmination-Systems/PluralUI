import { Link } from 'react-router-dom';

export default function Unsupported() {
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '60px 24px 100px', textAlign: 'center' }}>
      {/* Back */}
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
          ← Homepage
        </Link>
      </div>

      {/* Title */}
      <h1 style={{ fontFamily: 'var(--serif)', fontSize: 28, marginBottom: 16 }}>
        Things I Will Not Support
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 48, lineHeight: 1.7 }}>
        If you have ideas or suggestions for features, feel free to <Link to="/contact">contact me</Link>!  
        I support most things unless it's something I cannot ethically or safely endorse.
      </p>

      {/* Unsupported sections */}
      <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)', textAlign: 'left', fontSize: 14, color: 'var(--muted)' }}>
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: 20, marginBottom: 8 }}>Octocon</h3>
        <p>
          I refuse to support people who create an app and gatekeep its use.
          Octocon hold anti-endo views, and as someone who supports everyone for who they are, it does NOT sit right with me to support this company.
          There is also proof of them harbouring a pedophille, which is something which personally disgusts me.
        </p>

        <h3 style={{ fontFamily: 'var(--serif)', fontSize: 20, marginBottom: 8, marginTop: 24 }}>Deprecated or insecure features</h3>
        <p>
          Any old or insecure features will not be supported. This is to protect account safety, security, and overall reliability.
        </p>

        <p style={{ marginTop: 24 }}>
          Everything else is fair game, I'm open to supporting any feature or idea unless it conflicts with my values or safety concerns.
        </p>
      </div>

      {/* Footer / legal links */}
      <div style={{ marginTop: 40, display: 'flex', gap: 16, fontSize: 13, justifyContent: 'center', flexWrap: 'wrap' }}>
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