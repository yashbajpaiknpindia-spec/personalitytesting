import Link from 'next/link'
import type { Metadata } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'

export const metadata: Metadata = {
  title: 'Privacy Policy — How Brand Syndicate Protects Your Data',
  description:
    'Read the Brand Syndicate Privacy Policy. Learn exactly how we collect, use, store, and protect your personal information when you use our AI branding tools.',
  keywords: ['brand syndicate privacy policy', 'data protection', 'personal data', 'GDPR', 'privacy rights'],
  alternates: { canonical: `${APP_URL}/privacy` },
  openGraph: {
    title: 'Privacy Policy — Brand Syndicate',
    description: 'Learn how Brand Syndicate collects, uses, and protects your personal information.',
    url: `${APP_URL}/privacy`,
    type: 'website',
  },
  robots: { index: true, follow: true },
}

const privacyJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  url: `${APP_URL}/privacy`,
  name: 'Privacy Policy — Brand Syndicate',
  description: 'Privacy policy governing how Brand Syndicate collects and uses your data.',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: APP_URL },
      { '@type': 'ListItem', position: 2, name: 'Privacy Policy', item: `${APP_URL}/privacy` },
    ],
  },
}

const LAST_UPDATED = 'April 21, 2026'

export default function PrivacyPolicyPage() {
  const headingStyle: React.CSSProperties = {
    fontFamily: "'Playfair Display', serif",
    fontSize: 20,
    fontWeight: 400,
    color: 'var(--cream)',
    marginTop: 48,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottom: '1px solid var(--border)',
  }

  const subHeadingStyle: React.CSSProperties = {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: 'var(--gold)',
    marginTop: 28,
    marginBottom: 10,
  }

  const paraStyle: React.CSSProperties = {
    fontSize: 14,
    color: 'var(--muted)',
    lineHeight: 1.85,
    marginBottom: 16,
  }

  const listStyle: React.CSSProperties = {
    fontSize: 14,
    color: 'var(--muted)',
    lineHeight: 1.85,
    paddingLeft: 20,
    marginBottom: 16,
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      fontFamily: "'DM Sans', sans-serif",
      color: 'var(--cream)',
    }}>
      {/* Nav */}
      <nav style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 32px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 32, height: 32, border: '1px solid var(--gold)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Playfair Display', serif", fontSize: 10, color: 'var(--gold)',
          }}>BS</div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--cream)' }}>
            Brand <span style={{ color: 'var(--gold)' }}>·</span> Syndicate
          </span>
        </Link>
        <div style={{ display: 'flex', gap: 24 }}>
          <Link href="/terms" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none', letterSpacing: '0.08em' }}>Terms</Link>
          <Link href="/contact" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none', letterSpacing: '0.08em' }}>Contact</Link>
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '64px 32px 120px' }}>
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>
            Legal
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 400, color: 'var(--cream)', marginBottom: 16, lineHeight: 1.2 }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted2)', letterSpacing: '0.06em' }}>
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        {/* Intro */}
        <p style={paraStyle}>
          Brand Syndicate (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our AI-powered personal branding services.
        </p>
        <p style={paraStyle}>
          Please read this policy carefully. If you disagree with its terms, please discontinue use of the site.
        </p>

        {/* Section 1 */}
        <h2 style={headingStyle}>1. Information We Collect</h2>

        <p style={subHeadingStyle}>Information You Provide Directly</p>
        <p style={paraStyle}>When you create an account or use our services, we may collect:</p>
        <ul style={listStyle}>
          <li>Name and email address (for account registration)</li>
          <li>Password (stored in encrypted, hashed form — never in plain text)</li>
          <li>Profile data you enter to generate branding content (job title, skills, work history, etc.)</li>
          <li>Payment information (processed securely by our third-party payment provider; we do not store full card numbers)</li>
          <li>Communications you send us (e.g., support requests)</li>
        </ul>

        <p style={subHeadingStyle}>Information Collected Automatically</p>
        <p style={paraStyle}>When you visit our site, we automatically collect certain technical data:</p>
        <ul style={listStyle}>
          <li>IP address and approximate geographic location</li>
          <li>Browser type, version, and operating system</li>
          <li>Pages visited, time spent, and referring URLs</li>
          <li>Device identifiers and cookie data</li>
          <li>Crash reports and performance data</li>
        </ul>

        <p style={subHeadingStyle}>Cookies and Tracking Technologies</p>
        <p style={paraStyle}>
          We use cookies, web beacons, and similar technologies to operate our services, remember your preferences, and analyze traffic. You can control cookies through your browser settings; note that disabling cookies may affect functionality.
        </p>
        <p style={paraStyle}>
          We may use third-party analytics services (such as Google Analytics) that collect usage data under their own privacy policies.
        </p>
        <p style={subHeadingStyle}>Google AdSense &amp; Advertising Cookies</p>
        <p style={paraStyle}>
          We use Google AdSense to display advertisements on our website. Google and its advertising partners may use cookies, web beacons, and similar technologies to show you personalised ads based on your browsing activity on this and other websites. Google&apos;s use of advertising cookies enables it and its partners to serve ads based on your prior visits to our site or other sites on the Internet.
        </p>
        <p style={paraStyle}>
          You may opt out of personalised advertising by visiting{' '}
          <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}>Google Ads Settings</a>
          {' '}or{' '}
          <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}>www.aboutads.info</a>.
          Opting out does not remove ads — you will still see non-personalised advertisements.
        </p>
        <p style={paraStyle}>
          For more information on how Google collects and uses data in connection with its advertising products, please visit{' '}
          <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)' }}>Google&apos;s Privacy &amp; Terms</a>.
        </p>

        {/* Section 2 */}
        <h2 style={headingStyle}>2. How We Use Your Information</h2>
        <p style={paraStyle}>We use the information we collect to:</p>
        <ul style={listStyle}>
          <li>Provide, operate, and improve our AI branding services</li>
          <li>Create and manage your account</li>
          <li>Process payments and send transaction confirmations</li>
          <li>Respond to your questions and support requests</li>
          <li>Send product updates and marketing communications (you may opt out at any time)</li>
          <li>Monitor and analyze usage patterns to improve user experience</li>
          <li>Detect, prevent, and address fraud or security issues</li>
          <li>Comply with legal obligations</li>
        </ul>
        <p style={paraStyle}>
          We do not sell your personal information to third parties.
        </p>

        {/* Section 3 */}
        <h2 style={headingStyle}>3. Sharing of Information</h2>
        <p style={paraStyle}>We may share your information only in the following circumstances:</p>
        <ul style={listStyle}>
          <li><strong style={{ color: 'var(--cream)' }}>Service Providers:</strong> Trusted vendors who help us operate the platform (hosting, analytics, payment processing) under strict confidentiality obligations.</li>
          <li><strong style={{ color: 'var(--cream)' }}>AI Model Providers:</strong> Your branding prompts may be processed by third-party AI APIs to generate content. These providers are bound by data processing agreements.</li>
          <li><strong style={{ color: 'var(--cream)' }}>Legal Requirements:</strong> When required by law, court order, or to protect the rights, property, or safety of Brand Syndicate or others.</li>
          <li><strong style={{ color: 'var(--cream)' }}>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, your data may be transferred with prior notice.</li>
        </ul>

        {/* Section 4 */}
        <h2 style={headingStyle}>4. Data Retention</h2>
        <p style={paraStyle}>
          We retain your personal information for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time by contacting us. We will fulfill such requests within 30 days, subject to legal retention obligations.
        </p>

        {/* Section 5 */}
        <h2 style={headingStyle}>5. Your Rights and Choices</h2>
        <p style={paraStyle}>Depending on your location, you may have the right to:</p>
        <ul style={listStyle}>
          <li>Access the personal data we hold about you</li>
          <li>Correct inaccurate or incomplete data</li>
          <li>Request deletion of your data ("right to be forgotten")</li>
          <li>Object to or restrict certain processing of your data</li>
          <li>Receive a portable copy of your data</li>
          <li>Opt out of marketing communications</li>
        </ul>
        <p style={paraStyle}>
          To exercise any of these rights, please contact us at the address below. We will respond within 30 days.
        </p>

        {/* Section 6 */}
        <h2 style={headingStyle}>6. Security</h2>
        <p style={paraStyle}>
          We implement industry-standard technical and organizational measures to protect your information against unauthorized access, alteration, disclosure, or destruction. These include encryption in transit (TLS), hashed password storage, and access controls.
        </p>
        <p style={paraStyle}>
          However, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security, and you use our services at your own risk.
        </p>

        {/* Section 7 */}
        <h2 style={headingStyle}>7. Children&apos;s Privacy</h2>
        <p style={paraStyle}>
          Our services are not directed to individuals under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us immediately so we can delete it.
        </p>

        {/* Section 8 */}
        <h2 style={headingStyle}>8. Third-Party Links</h2>
        <p style={paraStyle}>
          Our website may contain links to third-party websites. We are not responsible for the privacy practices of those sites and encourage you to review their privacy policies independently.
        </p>

        {/* Section 9 */}
        <h2 style={headingStyle}>9. International Data Transfers</h2>
        <p style={paraStyle}>
          Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for international transfers, consistent with applicable data protection laws.
        </p>

        {/* Section 10 */}
        <h2 style={headingStyle}>10. Changes to This Policy</h2>
        <p style={paraStyle}>
          We may update this Privacy Policy from time to time. When we do, we will revise the &quot;Last updated&quot; date at the top of this page and, where appropriate, notify you by email or a prominent notice on our website. Your continued use of the service after changes take effect constitutes acceptance of the revised policy.
        </p>

        {/* Section 11 */}
        <h2 style={headingStyle}>11. Contact Us</h2>
        <p style={paraStyle}>
          If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
        </p>
        <div style={{
          padding: '24px 28px',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          fontSize: 13,
          color: 'var(--muted)',
          lineHeight: 2,
        }}>
          <strong style={{ color: 'var(--cream)', display: 'block', marginBottom: 8 }}>Brand Syndicate</strong>
          Kidwai Nagar, Kanpur<br />
          Uttar Pradesh — 208011, India<br />
          Email: <a href="mailto:hello@brandsyndicate.in" style={{ color: 'var(--gold)', textDecoration: 'none' }}>hello@brandsyndicate.in</a><br />
          Phone: <a href="tel:+917897671348" style={{ color: 'var(--gold)', textDecoration: 'none' }}>+91 78976 71348</a><br />
          <Link href="/contact" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Contact Form →</Link>
        </div>

        {/* Footer links */}
        <div style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid var(--border)', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Link href="/" style={{ fontSize: 12, color: 'var(--muted2)', textDecoration: 'none' }}>← Home</Link>
          <Link href="/terms" style={{ fontSize: 12, color: 'var(--muted2)', textDecoration: 'none' }}>Terms of Service</Link>
          <Link href="/contact" style={{ fontSize: 12, color: 'var(--muted2)', textDecoration: 'none' }}>Contact</Link>
        </div>
      </div>
    </div>
  )
}
