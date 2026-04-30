import Link from 'next/link'
import type { Metadata } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'

export const metadata: Metadata = {
  title: 'Terms of Service — Brand Syndicate User Agreement',
  description:
    'Read the Brand Syndicate Terms of Service. These terms govern your use of our AI-powered personal branding platform, including portfolio generation, resume tools, and business card creation.',
  keywords: ['brand syndicate terms of service', 'user agreement', 'terms and conditions', 'acceptable use policy'],
  alternates: { canonical: `${APP_URL}/terms` },
  openGraph: {
    title: 'Terms of Service — Brand Syndicate',
    description: 'Terms and conditions governing your use of Brand Syndicate.',
    url: `${APP_URL}/terms`,
    type: 'website',
  },
  robots: { index: true, follow: true },
}

const termsJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  url: `${APP_URL}/terms`,
  name: 'Terms of Service — Brand Syndicate',
  description: 'Terms of service governing use of the Brand Syndicate platform.',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: APP_URL },
      { '@type': 'ListItem', position: 2, name: 'Terms of Service', item: `${APP_URL}/terms` },
    ],
  },
}

const LAST_UPDATED = 'April 21, 2026'

export default function TermsPage() {
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
          <Link href="/privacy" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none', letterSpacing: '0.08em' }}>Privacy</Link>
          <Link href="/contact" style={{ fontSize: 12, color: 'var(--muted)', textDecoration: 'none', letterSpacing: '0.08em' }}>Contact</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '64px 32px 120px' }}>
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>
            Legal
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 400, color: 'var(--cream)', marginBottom: 16, lineHeight: 1.2 }}>
            Terms of Service
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted2)', letterSpacing: '0.06em' }}>
            Last updated: {LAST_UPDATED}
          </p>
        </div>

        <p style={paraStyle}>
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of Brand Syndicate (&quot;we,&quot; &quot;our,&quot; or &quot;the Service&quot;). By accessing or using our services, you agree to be bound by these Terms. If you do not agree, do not use the Service.
        </p>

        <h2 style={headingStyle}>1. Eligibility</h2>
        <p style={paraStyle}>
          You must be at least 13 years of age to use Brand Syndicate. If you are under 18, you represent that you have your parent or guardian&apos;s permission. By using the Service, you represent and warrant that you meet these eligibility requirements.
        </p>

        <h2 style={headingStyle}>2. Account Registration</h2>
        <p style={paraStyle}>
          To access certain features, you must create an account. You agree to:
        </p>
        <ul style={listStyle}>
          <li>Provide accurate, complete, and current registration information</li>
          <li>Maintain the security of your password and not share it with others</li>
          <li>Promptly notify us of any unauthorized use of your account</li>
          <li>Accept responsibility for all activity that occurs under your account</li>
        </ul>
        <p style={paraStyle}>
          We reserve the right to suspend or terminate accounts that violate these Terms or that we determine, in our sole discretion, pose a risk to the Service or other users.
        </p>

        <h2 style={headingStyle}>3. Use of the Service</h2>
        <p style={paraStyle}>
          Brand Syndicate provides AI-powered tools to generate personal branding content, including portfolios, resumes, business cards, and presentation slides. You are granted a limited, non-exclusive, non-transferable license to access and use the Service for your personal or professional branding purposes.
        </p>
        <p style={paraStyle}>You agree not to:</p>
        <ul style={listStyle}>
          <li>Use the Service for any unlawful purpose or in violation of any regulations</li>
          <li>Attempt to reverse-engineer, decompile, or extract source code from the Service</li>
          <li>Use automated tools (bots, scrapers) to access the Service without our written permission</li>
          <li>Upload content that is defamatory, obscene, fraudulent, or infringes third-party rights</li>
          <li>Attempt to gain unauthorized access to any portion or feature of the Service</li>
          <li>Impersonate any person or entity or misrepresent your affiliation</li>
          <li>Interfere with or disrupt the integrity or performance of the Service</li>
          <li>Resell or sublicense access to the Service without our prior written consent</li>
        </ul>

        <h2 style={headingStyle}>4. AI-Generated Content</h2>
        <p style={paraStyle}>
          Our Service uses artificial intelligence to generate content based on information you provide. You acknowledge that:
        </p>
        <ul style={listStyle}>
          <li>AI-generated content may contain inaccuracies or errors and should be reviewed before use</li>
          <li>We do not guarantee the accuracy, completeness, or fitness of generated content for any particular purpose</li>
          <li>You are solely responsible for reviewing, editing, and verifying any AI-generated content before publishing or distributing it</li>
          <li>Content you generate using our tools may be similar to content generated for other users</li>
        </ul>

        <h2 style={headingStyle}>5. Intellectual Property</h2>
        <p style={paraStyle}>
          <strong style={{ color: 'var(--cream)' }}>Your Content:</strong> You retain ownership of the personal information and inputs you provide to generate content. By using the Service, you grant us a limited, worldwide license to process your inputs solely to deliver the Service to you.
        </p>
        <p style={paraStyle}>
          <strong style={{ color: 'var(--cream)' }}>Generated Content:</strong> Subject to your compliance with these Terms and payment of applicable fees, you own the output content generated for you. You may use it for personal and commercial branding purposes.
        </p>
        <p style={paraStyle}>
          <strong style={{ color: 'var(--cream)' }}>Our Platform:</strong> The Service, including its design, software, trademarks, and underlying technology, is and remains the exclusive property of Brand Syndicate. Nothing in these Terms grants you rights in our intellectual property beyond the limited license above.
        </p>

        <h2 style={headingStyle}>6. Subscription and Billing</h2>
        <p style={paraStyle}>
          Certain features require a paid subscription. By subscribing, you authorize us to charge your payment method on a recurring basis according to the plan you select. Subscription fees are non-refundable except where required by law or as expressly stated at the time of purchase.
        </p>
        <p style={paraStyle}>
          We reserve the right to change our pricing with 30 days&apos; notice. Continued use of the Service after a price change constitutes acceptance of the new pricing.
        </p>
        <p style={paraStyle}>
          You may cancel your subscription at any time from your account settings. Cancellation takes effect at the end of the current billing period.
        </p>

        <h2 style={headingStyle}>7. Disclaimer of Warranties</h2>
        <p style={paraStyle}>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
        </p>

        <h2 style={headingStyle}>8. Limitation of Liability</h2>
        <p style={paraStyle}>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, BRAND SYNDICATE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE.
        </p>
        <p style={paraStyle}>
          IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM OR (B) $100 USD.
        </p>

        <h2 style={headingStyle}>9. Indemnification</h2>
        <p style={paraStyle}>
          You agree to indemnify, defend, and hold harmless Brand Syndicate and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the Service, your violation of these Terms, or your infringement of any third-party rights.
        </p>

        <h2 style={headingStyle}>10. Termination</h2>
        <p style={paraStyle}>
          We may suspend or terminate your access to the Service at any time, with or without cause or notice, including if we reasonably believe you have violated these Terms. You may terminate your account at any time by contacting us or through account settings. Upon termination, your right to use the Service ceases immediately.
        </p>

        <h2 style={headingStyle}>11. Governing Law and Dispute Resolution</h2>
        <p style={paraStyle}>
          These Terms are governed by and construed in accordance with applicable law, without regard to conflict of law principles. Any disputes arising under these Terms shall first be addressed through good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to binding arbitration, except that either party may seek injunctive relief in a court of competent jurisdiction for intellectual property violations.
        </p>

        <h2 style={headingStyle}>12. Changes to These Terms</h2>
        <p style={paraStyle}>
          We reserve the right to modify these Terms at any time. We will provide notice of material changes by updating the &quot;Last updated&quot; date and, where appropriate, by emailing you or displaying a notice in the Service. Your continued use of the Service after the effective date constitutes acceptance of the revised Terms.
        </p>

        <h2 style={headingStyle}>13. Contact</h2>
        <p style={paraStyle}>
          Questions about these Terms? Please reach out:
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
          <strong style={{ color: 'var(--cream)', display: 'block', marginBottom: 8 }}>Brand Syndicate — Legal</strong>
          Kidwai Nagar, Kanpur<br />
          Uttar Pradesh — 208011, India<br />
          Email: <a href="mailto:hello@brandsyndicate.in" style={{ color: 'var(--gold)', textDecoration: 'none' }}>hello@brandsyndicate.in</a><br />
          Phone: <a href="tel:+917897671348" style={{ color: 'var(--gold)', textDecoration: 'none' }}>+91 78976 71348</a><br />
          <Link href="/contact" style={{ color: 'var(--gold)', textDecoration: 'none' }}>Contact Form →</Link>
        </div>

        {/* Footer links */}
        <div style={{ marginTop: 64, paddingTop: 32, borderTop: '1px solid var(--border)', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <Link href="/" style={{ fontSize: 12, color: 'var(--muted2)', textDecoration: 'none' }}>← Home</Link>
          <Link href="/privacy" style={{ fontSize: 12, color: 'var(--muted2)', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link href="/contact" style={{ fontSize: 12, color: 'var(--muted2)', textDecoration: 'none' }}>Contact</Link>
        </div>
      </div>
    </div>
  )
}
