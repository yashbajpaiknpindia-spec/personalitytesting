import Link from 'next/link'
import MotionReveal from './MotionReveal'

const SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://www.instagram.com/brandsyndicateindia', icon: 'IG' },
  { label: 'Facebook', href: 'https://www.facebook.com/share/1BeC1oRjnQ/', icon: 'f' },
  { label: 'WhatsApp', href: 'https://wa.me/917897671348', icon: 'WA' },
]

export default function PublicFooter() {
  const product = [
    { label: 'Generate Now', href: '/generate' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Free Starter', href: '/plans/free-starter' },
    { label: 'Creator', href: '/plans/ai-creator' },
    { label: 'Business Pro', href: '/plans/business-pro' },
    { label: 'Growth Suite', href: '/plans/unlimited-growth' },
  ]
  const content_links = [
    { label: 'Blog', href: '/blog' },
    { label: 'Resources', href: '/resources' },
    { label: 'Guides', href: '/guides' },
    { label: 'FAQ', href: '/faq' },
  ]
  const company = [
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
  ]

  return (
    <>
      <footer className="public-footer">
        <div className="public-footer-glow" aria-hidden="true" />
        <MotionReveal className="public-footer-inner">
          <div className="public-footer-brand">
            <Link href="/" className="public-brand" aria-label="Brand Syndicate home">
              <span className="public-brand-text">Brand <em>Syndicate</em></span>
            </Link>
            <p>
              Where AI meets human creativity. Premium websites, cinematic graphics, logos, and brand strategy, drafted fast and crafted right.
            </p>
            <Link href="/generate" className="btn-cinema">Start a launch brief</Link>

            <div className="public-footer-socials" aria-label="Brand Syndicate social links">
              {SOCIAL_LINKS.map(link => (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" aria-label={link.label} title={link.label}>
                  <span>{link.icon}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="public-footer-links">
            <div>
              <h3>Plans</h3>
              {product.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}
            </div>
            <div>
              <h3>Content</h3>
              {content_links.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}
            </div>
            <div>
              <h3>Company</h3>
              {company.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}
            </div>
          </div>
        </MotionReveal>
        <div className="public-footer-bottom">
          <div>© {new Date().getFullYear()} BRAND SYNDICATE · MADE IN INDIA</div>
          <div>Instagram · Facebook · WhatsApp only. Built for founders, creators, and local businesses.</div>
        </div>
      </footer>

      {/* Sticky mobile bar — back to home + generate CTA */}
      <div className="public-mobile-home-bar">
        <Link href="/" className="pmhb-home">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Home
        </Link>
        <Link href="/login?tab=signup" className="pmhb-cta">
          Get Started Free →
        </Link>
      </div>
    </>
  )
}
