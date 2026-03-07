import LegalLayout, { LegalTitle, LegalMeta, LegalSection, LegalP, LegalUl } from './LegalLayout';

export default function PrivacyPage() {
  return (
    <LegalLayout>
      <LegalTitle>Privacy Policy</LegalTitle>
      <LegalMeta>Plural Cloud · Last updated: March 7, 2026</LegalMeta>

      <LegalSection title="1. Overview">
        <LegalP>Plural Cloud ("the Service") is a self-hosted web application that allows plural systems to link their accounts and proxy system member data in supported games. This policy explains what data we collect, why, and how it is handled.</LegalP>
      </LegalSection>

      <LegalSection title="2. Data We Collect">
        <LegalP><strong style={{ color: 'var(--text)' }}>Discord</strong></LegalP>
        <LegalUl>
          <li>Discord user ID</li>
          <li>Discord username and discriminator</li>
          <li>Discord avatar URL</li>
        </LegalUl>
        <LegalP>Collected when you sign in via Discord OAuth2 and used solely to identify your account.</LegalP>

        <LegalP><strong style={{ color: 'var(--text)' }}>GitHub</strong></LegalP>
        <LegalUl>
          <li>GitHub user ID</li>
          <li>GitHub username (login)</li>
          <li>GitHub avatar URL</li>
        </LegalUl>
        <LegalP>Collected when you optionally link a GitHub account. Used as an alternative sign-in method and for account identification.</LegalP>

        <LegalP><strong style={{ color: 'var(--text)' }}>Minecraft / Microsoft</strong></LegalP>
        <LegalUl>
          <li>Minecraft UUID</li>
          <li>Minecraft username</li>
        </LegalUl>
        <LegalP>Collected when you voluntarily link a Minecraft account. Used to look up your system data when you join a Minecraft server running the Plural Cloud plugin.</LegalP>

        <LegalP><strong style={{ color: 'var(--text)' }}>Hytale / HyAuth</strong></LegalP>
        <LegalUl>
          <li>Hytale UUID</li>
          <li>Hytale username</li>
        </LegalUl>
        <LegalP>Collected when you voluntarily link a Hytale account via HyAuth. Used to look up your system data in supported Hytale servers.</LegalP>

        <LegalP><strong style={{ color: 'var(--text)' }}>Plural Apps (PluralKit, Simply Plural, /plu/ral)</strong></LegalP>
        <LegalUl>
          <li>API token for the chosen plural app (stored encrypted, never returned to the client)</li>
          <li>System ID or user ID</li>
          <li>Member names, display names, pronouns, colours, avatar URLs, and descriptions</li>
        </LegalUl>
        <LegalP>Imported from your chosen plural app at your request. Used to proxy your system members in supported games. Your token is write-only — it is never returned via the API after being saved.</LegalP>
      </LegalSection>

      <LegalSection title="3. Data We Do Not Collect">
        <LegalUl>
          <li>Microsoft account credentials or personal information beyond Minecraft UUID/username</li>
          <li>Xbox Live data beyond what is required to obtain the Minecraft profile</li>
          <li>Payment information of any kind</li>
          <li>IP addresses beyond standard server access logs</li>
          <li>Any data from players who have not registered with the Service</li>
          <li>Browsing behaviour, analytics, or tracking data</li>
        </LegalUl>
      </LegalSection>

      <LegalSection title="4. How We Use Your Data">
        <LegalUl>
          <li>To authenticate you via Discord or GitHub</li>
          <li>To look up your system when you join a supported game server</li>
          <li>To sync member data with your plural app at your request</li>
          <li>To display your linked accounts and members on the dashboard</li>
        </LegalUl>
        <LegalP>We do not sell, share, or use your data for advertising, analytics, or any purpose beyond operating the Service.</LegalP>
      </LegalSection>

      <LegalSection title="5. Data Retention">
        <LegalP>Your data is stored for as long as your account exists. You may delete your account and all associated data at any time via the dashboard. Unlinking a game account or plural app token removes that specific data immediately.</LegalP>
      </LegalSection>

      <LegalSection title="6. Third-Party Services">
        <LegalP>The Service communicates with the following third-party services to function. Each has its own privacy policy which governs how they handle data on their end.</LegalP>
        <LegalUl>
          <li><strong style={{ color: 'var(--text)' }}>Discord</strong> — authentication and account linking (<a href="https://discord.com/privacy" target="_blank" rel="noopener noreferrer">discord.com/privacy</a>)</li>
          <li><strong style={{ color: 'var(--text)' }}>GitHub</strong> — optional authentication (<a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer">GitHub Privacy Statement</a>)</li>
          <li><strong style={{ color: 'var(--text)' }}>Microsoft / Xbox Live</strong> — Minecraft account verification (<a href="https://privacy.microsoft.com" target="_blank" rel="noopener noreferrer">privacy.microsoft.com</a>)</li>
          <li><strong style={{ color: 'var(--text)' }}>HyAuth</strong> — Hytale account verification (<a href="https://www.hyauth.com" target="_blank" rel="noopener noreferrer">hyauth.com</a>)</li>
          <li><strong style={{ color: 'var(--text)' }}>PluralKit</strong> — member data sync (<a href="https://pluralkit.me/privacy" target="_blank" rel="noopener noreferrer">pluralkit.me/privacy</a>)</li>
          <li><strong style={{ color: 'var(--text)' }}>Simply Plural</strong> — member data sync (<a href="https://apparyllis.com/privacy" target="_blank" rel="noopener noreferrer">apparyllis.com/privacy</a>)</li>
          <li><strong style={{ color: 'var(--text)' }}>/plu/ral</strong> — member data sync (<a href="https://plural.gg" target="_blank" rel="noopener noreferrer">plural.gg</a>)</li>
          <li><strong style={{ color: 'var(--text)' }}>mc-heads.net</strong> — Minecraft avatar rendering (no account data sent, UUID only)</li>
          <li><strong style={{ color: 'var(--text)' }}>hyvatar.io</strong> — Hytale avatar rendering (no account data sent, username only)</li>
        </LegalUl>
      </LegalSection>

      <LegalSection title="7. Security">
        <LegalP>Data is stored in a PostgreSQL database on a self-hosted VPS. Sensitive tokens are encrypted at rest and never exposed via the API. We use HTTPS in production and JWT-based session authentication.</LegalP>
      </LegalSection>

      <LegalSection title="8. Your Rights">
        <LegalP>You have the right to:</LegalP>
        <LegalUl>
          <li>Access the data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your account and all associated data</li>
          <li>Unlink any connected account at any time via the dashboard</li>
          <li>Export your data via the dashboard</li>
        </LegalUl>
        <LegalP>To exercise any of these rights, use the dashboard or contact us at <a href="mailto:admin@doughmination.win">admin@doughmination.win</a>.</LegalP>
      </LegalSection>

      <LegalSection title="9. Changes to This Policy">
        <LegalP>We may update this policy at any time. The date at the top of this page reflects the most recent revision. Continued use of the Service after changes constitutes acceptance of the updated policy.</LegalP>
      </LegalSection>

      <LegalSection title="10. Contact">
        <LegalP>For privacy-related questions or data requests, contact us at <a href="mailto:admin@doughmination.win">admin@doughmination.win</a> or via our <a href="/contact">contact page</a>.</LegalP>
      </LegalSection>
    </LegalLayout>
  );
}