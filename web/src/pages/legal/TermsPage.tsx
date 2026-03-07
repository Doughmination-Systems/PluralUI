import LegalLayout, { LegalTitle, LegalMeta, LegalSection, LegalP, LegalUl } from './LegalLayout';

export default function TermsPage() {
  return (
    <LegalLayout>
      <LegalTitle>Terms of Service</LegalTitle>
      <LegalMeta>Plural Cloud · Last updated: March 7, 2026</LegalMeta>

      <LegalSection title="1. Acceptance of Terms">
        <LegalP>By accessing or using Plural Cloud ("the Service"), you agree to be bound by these Terms of Service and our <a href="/legal/privacy">Privacy Policy</a>. If you do not agree, do not use the Service.</LegalP>
      </LegalSection>

      <LegalSection title="2. Description of Service">
        <LegalP>Plural Cloud is a self-hosted web service that allows plural systems to link their accounts and proxy system member data in supported games. It integrates with Discord, GitHub, Minecraft, Hytale, and plural tracking apps including PluralKit, Simply Plural, and /plu/ral.</LegalP>
      </LegalSection>

      <LegalSection title="3. Eligibility">
        <LegalP>To use the Service you must have at least one of: a valid Discord account or a valid GitHub account. Some features additionally require a Minecraft (Microsoft) or Hytale account. By using the Service you confirm that your use complies with the Terms of Service of any third-party platforms you connect.</LegalP>
      </LegalSection>

      <LegalSection title="4. User Accounts">
        <LegalUl>
          <li>You are responsible for the security of all accounts you link to the Service.</li>
          <li>You must not share your account or allow others to access your linked data without your consent.</li>
          <li>You must only link accounts that belong to you.</li>
          <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
        </LegalUl>
      </LegalSection>

      <LegalSection title="5. Acceptable Use">
        <LegalP>You agree not to:</LegalP>
        <LegalUl>
          <li>Use the Service to harass, impersonate, or harm others</li>
          <li>Attempt to reverse engineer, exploit, or attack the Service or its infrastructure</li>
          <li>Use the Service for any unlawful purpose</li>
          <li>Link accounts that do not belong to you</li>
          <li>Attempt to access other users' data</li>
          <li>Use automated tools to abuse or overload the Service</li>
        </LegalUl>
      </LegalSection>

      <LegalSection title="6. Third-Party Services">
        <LegalP>The Service integrates with a number of third-party platforms. Your use of those platforms is governed entirely by their own Terms of Service. Plural Cloud is not affiliated with, endorsed by, or sponsored by any of them.</LegalP>
        <LegalUl>
          <li>Discord — <a href="https://discord.com/terms" target="_blank" rel="noopener noreferrer">discord.com/terms</a></li>
          <li>GitHub — <a href="https://docs.github.com/en/site-policy/github-terms/github-terms-of-service" target="_blank" rel="noopener noreferrer">GitHub Terms of Service</a></li>
          <li>Microsoft / Minecraft — <a href="https://www.minecraft.net/en-us/eula" target="_blank" rel="noopener noreferrer">Minecraft EULA</a></li>
          <li>HyAuth / Hytale — <a href="https://www.hyauth.com" target="_blank" rel="noopener noreferrer">hyauth.com</a></li>
          <li>PluralKit — <a href="https://pluralkit.me/tos" target="_blank" rel="noopener noreferrer">pluralkit.me/tos</a></li>
          <li>Simply Plural — <a href="https://apparyllis.com/tos" target="_blank" rel="noopener noreferrer">apparyllis.com/tos</a></li>
          <li>/plu/ral — <a href="https://plural.gg" target="_blank" rel="noopener noreferrer">plural.gg</a></li>
        </LegalUl>
      </LegalSection>

      <LegalSection title="7. Data and Privacy">
        <LegalP>Your use of the Service is governed by our <a href="/legal/privacy">Privacy Policy</a>, incorporated into these Terms by reference. We do not sell your data or use it for advertising.</LegalP>
      </LegalSection>

      <LegalSection title="8. Licence">
        <LegalP>The source code of this Service is made available under the <a href="/legal/licence">Estrogen Source-Available Licence (ESAL-1.3)</a>. Use of the Service does not grant you any rights to the underlying software beyond those provided by that licence.</LegalP>
      </LegalSection>

      <LegalSection title="9. Service Availability">
        <LegalP>The Service is provided as-is and on an as-available basis. As a self-hosted project, we make no guarantees of uptime, availability, data durability, or continuity of service. We reserve the right to modify, suspend, or discontinue the Service at any time without notice.</LegalP>
      </LegalSection>

      <LegalSection title="10. Limitation of Liability">
        <LegalP>To the fullest extent permitted by applicable law, Plural Cloud and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Service, including but not limited to loss of data or account access.</LegalP>
      </LegalSection>

      <LegalSection title="11. Changes to Terms">
        <LegalP>We may update these Terms at any time. The date at the top of this page reflects the most recent revision. Continued use of the Service after changes constitutes acceptance of the updated Terms.</LegalP>
      </LegalSection>

      <LegalSection title="12. Governing Law">
        <LegalP>These Terms shall be governed by and construed in accordance with the laws of England and Wales, without regard to conflict-of-law principles.</LegalP>
      </LegalSection>

      <LegalSection title="13. Contact">
        <LegalP>For questions about these Terms, contact us at <a href="mailto:admin@doughmination.win">admin@doughmination.win</a> or via our <a href="/contact">contact page</a>.</LegalP>
      </LegalSection>
    </LegalLayout>
  );
}