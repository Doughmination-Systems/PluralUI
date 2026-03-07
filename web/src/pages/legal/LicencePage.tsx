import LegalLayout, { LegalTitle, LegalMeta, LegalSection, LegalP, LegalUl, LegalHr } from './LegalLayout';

export default function LicencePage() {
  return (
    <LegalLayout>
      <LegalTitle>The Estrogen Source-Available Licence</LegalTitle>
      <LegalMeta>
        Version 1.3 · ESAL-1.3
        <br />
        Copyright © 2026 Clove Nytrix Doughmination Twilight.
      </LegalMeta>

      <LegalSection title="Permission Grant (Non-Commercial Use)">
        <LegalP>Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to use, copy, modify, merge, publish, and distribute the Software <strong style={{ color: 'var(--text)' }}>for non-commercial purposes only</strong>, subject to the conditions set out below.</LegalP>
        <LegalP>Non-commercial use includes, but is not limited to, personal use, academic use, research, experimentation, and use within non-profit or hobbyist projects, provided that no direct or indirect commercial advantage, monetary compensation, or revenue generation results from use of the Software.</LegalP>
      </LegalSection>

      <LegalHr />

      <LegalSection title="1. Attribution">
        <LegalP>All copies or substantial portions of the Software must include the above copyright notice and this Licence.</LegalP>
        <LegalP>Attribution to <strong style={{ color: 'var(--text)' }}>"Clove Nytrix Doughmination Twilight"</strong> must be maintained in a reasonable and visible manner in source code distributions and in accompanying documentation.</LegalP>
      </LegalSection>

      <LegalSection title="2. No Misrepresentation">
        <LegalP>You may not misrepresent the origin of the Software.</LegalP>
        <LegalP>Modified versions must be clearly identified as modified and must not be presented as being authored, endorsed, or distributed by Clove Nytrix Doughmination Twilight without prior written permission.</LegalP>
      </LegalSection>

      <LegalSection title="3. Commercial Use Restriction">
        <LegalP>The Software may not be used, in whole or in part, for any commercial purpose without a separate, written commercial licence granted by Clove Nytrix Doughmination Twilight.</LegalP>
        <LegalP>For the purposes of this Licence, <em>commercial use</em> includes, but is not limited to:</LegalP>
        <LegalUl>
          <li>selling, licensing, sublicensing, or otherwise monetising the Software or derivative works;</li>
          <li>using the Software as part of any product, service, or platform that generates revenue;</li>
          <li>use by a for-profit entity where the Software contributes to business operations, service delivery, or profit generation;</li>
          <li>providing paid services, hosting, consultancy, or support that relies upon or incorporates the Software.</li>
        </LegalUl>
        <LegalP>Commercial licensing terms (including fees and/or revenue-sharing arrangements) shall be determined on a case-by-case basis.</LegalP>
      </LegalSection>

      <LegalSection title="4. Commercial Licensing">
        <LegalP><strong style={{ color: 'var(--text)' }}>4.1 Obtaining a Commercial Licence</strong></LegalP>
        <LegalP>Any individual or organisation wishing to use the Software for a commercial purpose must obtain a separate, written commercial licence. Requests must be made via email to: <a href="mailto:admin@doughmination.win">admin@doughmination.win</a></LegalP>
        <LegalP>Commercial licence terms may include fees, revenue-sharing arrangements, usage limitations, or other conditions, and are granted solely at the discretion of Clove Nytrix Doughmination Twilight.</LegalP>

        <LegalP><strong style={{ color: 'var(--text)' }}>4.2 Pre-Authorised Commercial Licensees</strong></LegalP>
        <LegalP>Clove Nytrix Doughmination Twilight may maintain a file named <code style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>allowed_people.md</code> listing individuals or organisations that have been granted permission to use the Software commercially.</LegalP>
        <LegalP>If <code style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>allowed_people.md</code> is present and lists a party, that listing constitutes evidence of an active commercial licence, subject to any terms specified therein. If it does not exist, or if a party is not listed within it, no commercial licence is granted.</LegalP>
      </LegalSection>

      <LegalSection title="5. Trademarked Components">
        <LegalP><strong style={{ color: 'var(--text)' }}>5.1 Definition</strong></LegalP>
        <LegalP>"Trademarked Components" means any names, systems, frameworks, identifiers, branding, terminology, logos, marks, or distinctive elements that are protected by trademark or otherwise designated as trademarked by Clove Nytrix Doughmination Twilight, whether registered or unregistered, now existing or created in the future.</LegalP>

        <LegalP><strong style={{ color: 'var(--text)' }}>5.2 Ownership and Listed Trademarks</strong></LegalP>
        <LegalP>This Licence does not grant permission to use any trademarks, trade names, service marks, or logos associated with Clove Nytrix Doughmination Twilight. The following trademarks are currently claimed or owned:</LegalP>
        <LegalUl>
          <li><strong style={{ color: 'var(--text)' }}>Doughmination System®</strong> (United Kingdom, UK00004263144)</li>
        </LegalUl>
        <LegalP>This list is non-exhaustive. Any future trademarks designated by Clove Nytrix Doughmination Twilight are automatically considered Trademarked Components.</LegalP>

        <LegalP><strong style={{ color: 'var(--text)' }}>5.3 Restriction on Modification and Reuse</strong></LegalP>
        <LegalP>Any Trademarked Components, and any Software components connected to, relying upon, or designed to operate in conjunction with such Trademarked Components, may not be modified, adapted, reworked, extracted, repurposed, or redistributed without prior written permission.</LegalP>

        <LegalP><strong style={{ color: 'var(--text)' }}>5.4 Separation from Non-Trademarked Use</strong></LegalP>
        <LegalP>Projects or derivative works that do not reference, include, or associate with any Trademarked Components remain fully subject to the permissions and restrictions set out elsewhere in this Licence.</LegalP>
      </LegalSection>

      <LegalSection title="6. Warranty Disclaimer and Limitation of Liability">
        <p style={{ margin: 0, textTransform: 'uppercase', fontSize: 13, letterSpacing: '.02em' }}>
          The Software is provided "as is", without warranty of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, and non-infringement. In no event shall the authors or copyright holders be liable for any claim, damages, or other liability, whether in an action of contract, tort, or otherwise, arising from, out of, or in connection with the Software or the use of or other dealings in the Software.
        </p>
      </LegalSection>

      <LegalSection title="7. No Endorsement or Affiliation">
        <LegalP>Use of the Software does not imply endorsement, sponsorship, affiliation, or approval by Clove Nytrix Doughmination Twilight.</LegalP>
      </LegalSection>

      <LegalSection title="8. No Compatibility or Certification Claims">
        <LegalP>You may not claim or imply that the Software, or any modified or derivative version thereof, is compatible with, certified by, or officially associated with any trademarked system or offering of Clove Nytrix Doughmination Twilight without express written authorisation.</LegalP>
      </LegalSection>

      <LegalSection title="9. No Implied Rights">
        <LegalP>No rights or permissions are granted under this Licence except those expressly stated. Any use beyond the scope of this Licence requires prior written permission.</LegalP>
      </LegalSection>

      <LegalSection title="10. Source-Available, Not Open Source">
        <LegalP>This Licence makes the source code available for inspection, modification, and non-commercial use under defined conditions. It is <strong style={{ color: 'var(--text)' }}>not</strong> an open-source licence as defined by the Open Source Initiative, and no rights should be inferred or assumed beyond those explicitly granted herein.</LegalP>
      </LegalSection>

      <LegalSection title="11. Revocation of Commercial Licences">
        <LegalP>Clove Nytrix Doughmination Twilight reserves the right to revoke any granted commercial licence at any time, with or without cause, subject to any written terms agreed with the commercial licensee. Upon revocation, all commercial use must cease immediately.</LegalP>
      </LegalSection>

      <LegalSection title="12. Governing Law (Trademark Matters)">
        <LegalP>All matters relating to trademarks and trademark enforcement under this Licence shall be governed by and construed in accordance with the laws of <strong style={{ color: 'var(--text)' }}>England and Wales</strong>, without regard to conflict-of-law principles.</LegalP>
      </LegalSection>
    </LegalLayout>
  );
}