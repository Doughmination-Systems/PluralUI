import { useState, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────

type ThemeMode = 'dark' | 'light';
type ColorblindMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
type FontMode = 'default' | 'dyslexia' | 'mono';

interface DisplayPrefs {
  theme: ThemeMode;
  colorblind: ColorblindMode;
  font: FontMode;
}

const DEFAULT_PREFS: DisplayPrefs = { theme: 'dark', colorblind: 'none', font: 'default' };

const STORAGE_KEY = 'plural_display_prefs';

export function loadDisplayPrefs(): DisplayPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_PREFS;
}

export function applyDisplayPrefs(prefs: DisplayPrefs) {
  const root = document.documentElement;

  // Theme — border, text, muted only (bg/surface/lift are set per colorblind mode below)
  if (prefs.theme === 'light') {
    root.style.setProperty('--border', 'rgba(0,0,0,0.08)');
    root.style.setProperty('--text',   '#1a1830');
    root.style.setProperty('--muted',  '#8888aa');
  } else {
    root.style.setProperty('--border', 'rgba(255,255,255,0.06)');
    root.style.setProperty('--text',   '#ddddf0');
    root.style.setProperty('--muted',  '#6b6b8a');
  }

  // Colorblind palettes — both light & dark variants
  // Each mode also shifts bg/surface/lift with a subtle tint to reinforce the palette
  const isLight = prefs.theme === 'light';
  if (prefs.colorblind === 'none') {
    root.style.setProperty('--accent',  isLight ? '#6c50d8' : '#b49cff');
    root.style.setProperty('--accent2', isLight ? '#0ea8bf' : '#6ee7f7');
    root.style.setProperty('--ok',      isLight ? '#1a9e6e' : '#6debb8');
    root.style.setProperty('--warn',    isLight ? '#c4762a' : '#f5a86e');
    root.style.setProperty('--err',     isLight ? '#c43a3a' : '#f47070');
    // Default neutral backgrounds (reset from any previous colorblind mode)
    root.style.setProperty('--bg',      isLight ? '#f4f3f8' : '#0a0a12');
    root.style.setProperty('--surface', isLight ? '#ffffff' : '#11111c');
    root.style.setProperty('--lift',    isLight ? '#ebebf5' : '#181826');
  } else if (prefs.colorblind === 'protanopia') {
    // Can't distinguish red/green — blue/yellow palette, warm-tinted backgrounds
    root.style.setProperty('--accent',  isLight ? '#0066cc' : '#60b0ff');
    root.style.setProperty('--accent2', isLight ? '#cc8800' : '#ffcc44');
    root.style.setProperty('--ok',      isLight ? '#0055bb' : '#55aaff');
    root.style.setProperty('--warn',    isLight ? '#aa6600' : '#ffbb33');
    root.style.setProperty('--err',     isLight ? '#cc6600' : '#ff9933');
    root.style.setProperty('--bg',      isLight ? '#f3f3f0' : '#0a0a0e');
    root.style.setProperty('--surface', isLight ? '#fafaf6' : '#111118');
    root.style.setProperty('--lift',    isLight ? '#eaeae4' : '#181820');
  } else if (prefs.colorblind === 'deuteranopia') {
    // Similar to protanopia — blue/orange palette, cool-warm tinted backgrounds
    root.style.setProperty('--accent',  isLight ? '#1155cc' : '#6ab0ff');
    root.style.setProperty('--accent2', isLight ? '#bb7700' : '#ffc533');
    root.style.setProperty('--ok',      isLight ? '#0044cc' : '#4499ff');
    root.style.setProperty('--warn',    isLight ? '#996600' : '#ffaa22');
    root.style.setProperty('--err',     isLight ? '#bb5500' : '#ff8822');
    root.style.setProperty('--bg',      isLight ? '#f2f3f5' : '#09090f');
    root.style.setProperty('--surface', isLight ? '#f9fafc' : '#101019');
    root.style.setProperty('--lift',    isLight ? '#e8eaf0' : '#16161f');
  } else if (prefs.colorblind === 'tritanopia') {
    // Can't distinguish blue/yellow — red/green palette, slight warm tint
    root.style.setProperty('--accent',  isLight ? '#cc2255' : '#ff6688');
    root.style.setProperty('--accent2', isLight ? '#117744' : '#44cc88');
    root.style.setProperty('--ok',      isLight ? '#117733' : '#33bb77');
    root.style.setProperty('--warn',    isLight ? '#cc4400' : '#ff7733');
    root.style.setProperty('--err',     isLight ? '#cc1100' : '#ff4433');
    root.style.setProperty('--bg',      isLight ? '#f5f2f2' : '#110a0a');
    root.style.setProperty('--surface', isLight ? '#fdf8f8' : '#1c1111');
    root.style.setProperty('--lift',    isLight ? '#ede6e6' : '#221818');
  }

  // Font
  if (prefs.font === 'dyslexia') {
    // OpenDyslexic via CDN
    if (!document.querySelector('#font-dyslexic')) {
      const link = document.createElement('link');
      link.id = 'font-dyslexic';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.cdnfonts.com/css/opendyslexic';
      document.head.appendChild(link);
    }
    root.style.setProperty('--sans', "'OpenDyslexic', sans-serif");
  } else if (prefs.font === 'mono') {
    root.style.setProperty('--sans', "'JetBrains Mono', 'Fira Code', 'Courier New', monospace");
  } else {
    root.style.setProperty('--sans', "'Instrument Sans', system-ui, sans-serif");
  }
}

// ── Component ────────────────────────────────────────────────

export default function DisplaySettingsPage() {
  const [prefs, setPrefs] = useState<DisplayPrefs>(loadDisplayPrefs);

  const update = (patch: Partial<DisplayPrefs>) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    applyDisplayPrefs(next);
  };

  // Apply on mount
  useEffect(() => { applyDisplayPrefs(prefs); }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div className="section-title">Display</div>
        <div className="section-sub">Appearance preferences saved to this device.</div>
      </div>

      {/* Theme */}
      <div className="card">
        <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 16 }}>
          Theme
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <ThemeCard
            label="Dark"
            selected={prefs.theme === 'dark'}
            onClick={() => update({ theme: 'dark' })}
            preview={<DarkPreview />}
          />
          <ThemeCard
            label="Light"
            selected={prefs.theme === 'light'}
            onClick={() => update({ theme: 'light' })}
            preview={<LightPreview />}
          />
        </div>
      </div>

      {/* Colorblind mode */}
      <div className="card">
        <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
          Color Vision
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
          Adapts accent and status colors for different types of color vision. Applies to both light and dark themes.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {([
            { id: 'none',        label: 'Default',              desc: 'Purple, teal, and green accents' },
            { id: 'protanopia',  label: 'Protanopia',           desc: 'Red-blind — blue and yellow palette' },
            { id: 'deuteranopia',label: 'Deuteranopia',         desc: 'Green-blind — blue and amber palette' },
            { id: 'tritanopia',  label: 'Tritanopia',           desc: 'Blue-blind — red and green palette' },
          ] as { id: ColorblindMode; label: string; desc: string }[]).map(opt => (
            <OptionRow
              key={opt.id}
              label={opt.label}
              desc={opt.desc}
              selected={prefs.colorblind === opt.id}
              onClick={() => update({ colorblind: opt.id })}
            />
          ))}
        </div>
      </div>

      {/* Font */}
      <div className="card">
        <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
          Font
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>
          Choose a font that works best for you.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {([
            { id: 'default',  label: 'Default',        desc: 'Instrument Sans — clean and modern', sample: 'The quick brown fox jumps' },
            { id: 'dyslexia', label: 'OpenDyslexic',   desc: 'Designed to improve readability for dyslexic readers', sample: 'The quick brown fox jumps' },
            { id: 'mono',     label: 'Monospace',      desc: 'Fixed-width — great for technical users', sample: 'The quick brown fox jumps' },
          ] as { id: FontMode; label: string; desc: string; sample: string }[]).map(opt => (
            <OptionRow
              key={opt.id}
              label={opt.label}
              desc={opt.desc}
              selected={prefs.font === opt.id}
              onClick={() => update({ font: opt.id })}
              extra={
                <div style={{
                  fontSize: 13, color: 'var(--muted)', marginTop: 4,
                  fontFamily: opt.id === 'mono' ? 'monospace' : opt.id === 'dyslexia' ? 'OpenDyslexic, sans-serif' : 'inherit',
                }}>
                  {opt.sample}
                </div>
              }
            />
          ))}
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
        Preferences are saved locally on this device only.
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────

function OptionRow({ label, desc, selected, onClick, extra }: {
  label: string; desc: string; selected: boolean;
  onClick: () => void; extra?: React.ReactNode;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'pointer',
        padding: '12px 16px', borderRadius: 8,
        background: selected ? 'var(--lift)' : 'transparent',
        border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        boxShadow: selected ? '0 0 0 1px var(--accent)' : 'none',
        transition: 'all 0.15s',
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 2,
        border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        background: selected ? 'var(--accent)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}>
        {selected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>{desc}</div>
        {extra}
      </div>
    </div>
  );
}

function ThemeCard({ label, selected, onClick, preview }: {
  label: string; selected: boolean; onClick: () => void; preview: React.ReactNode;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: 1, cursor: 'pointer', borderRadius: 10, overflow: 'hidden',
        border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
        boxShadow: selected ? '0 0 0 2px var(--accent)30' : 'none',
        transition: 'all 0.15s',
      }}
    >
      <div style={{ height: 80, overflow: 'hidden' }}>{preview}</div>
      <div style={{
        padding: '8px 12px', background: 'var(--lift)',
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 13, fontWeight: selected ? 600 : 400,
        color: selected ? 'var(--text)' : 'var(--muted)',
      }}>
        <div style={{
          width: 14, height: 14, borderRadius: '50%',
          border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
          background: selected ? 'var(--accent)' : 'transparent',
          flexShrink: 0,
        }} />
        {label}
      </div>
    </div>
  );
}

function DarkPreview() {
  return (
    <div style={{ background: '#0a0a12', height: '100%', padding: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ background: '#11111c', borderRadius: 4, height: 16, border: '1px solid rgba(255,255,255,0.06)' }} />
      <div style={{ background: '#181826', borderRadius: 4, height: 10, width: '70%', border: '1px solid rgba(255,255,255,0.06)' }} />
      <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
        <div style={{ background: '#b49cff22', border: '1px solid #b49cff44', borderRadius: 3, height: 8, flex: 1 }} />
        <div style={{ background: '#6debb822', border: '1px solid #6debb844', borderRadius: 3, height: 8, flex: 1 }} />
      </div>
    </div>
  );
}

function LightPreview() {
  return (
    <div style={{ background: '#f4f3f8', height: '100%', padding: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ background: '#fff', borderRadius: 4, height: 16, border: '1px solid rgba(0,0,0,0.08)' }} />
      <div style={{ background: '#ebebf5', borderRadius: 4, height: 10, width: '70%', border: '1px solid rgba(0,0,0,0.06)' }} />
      <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
        <div style={{ background: '#b49cff33', border: '1px solid #b49cff55', borderRadius: 3, height: 8, flex: 1 }} />
        <div style={{ background: '#6debb833', border: '1px solid #6debb855', borderRadius: 3, height: 8, flex: 1 }} />
      </div>
    </div>
  );
}