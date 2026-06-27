'use client'

import React from 'react'
import Link from 'next/link'
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import ThemeToggle from '@/components/ThemeToggle'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.brandsyndicate.in'

const homeJsonLd = {
  '@context': 'https://schema.org', '@type': 'WebPage',
  '@id': `${APP_URL}/#webpage`, url: APP_URL,
  name: 'Brand Syndicate, AI Brand Generator',
  description: 'Your business AI workspace for websites, brand assets, content, strategy, and growth workflows in one place.',
}

// ── Chip sample data ──────────────────────────────────────────────────────
const CHIP_DATA = [
  // ── Mobile priority order: first 4 are shown on small screens ──
  {
    label: 'Chat',
    icon: '✧',
    sample: 'I run a premium salon in Kanpur. Tell me what website, graphics and WhatsApp follow-up I should create first.',
    outputs: [
      'AI trained specifically for business growth and branding',
      'Ask about strategy, website, graphics, or your next move',
      'Full chat history saved across sessions',
      'Contextual answers based on your industry and goals',
    ],
    hint: 'Ask anything about your brand, website, content, strategy, offers, or next steps.',
  },
  {
    label: 'Website',
    icon: '◆',
    sample: 'Luxury restaurant in Mumbai, modern Indian cuisine, fine dining, private events',
    outputs: [
      'Full homepage with hero, about, menu & booking sections',
      'Mobile-responsive layout with your brand colours',
      'SEO meta title, description & Open Graph tags',
      'Contact form + Google Maps embed',
    ],
    hint: 'AI drafts the structure instantly. Our team can refine it further into a publish-ready website.',
  },
  {
    label: 'Logo Design',
    icon: '✦',
    sample: 'Premium fitness coaching brand for urban professionals, bold, cinematic, high-contrast',
    outputs: [
      '2 distinct logo directions with rationale',
      'Primary wordmark + standalone icon mark',
      'Colour palette with hex codes',
      'Typography pairing: heading & body fonts',
    ],
    hint: 'Logo generated as a ChatGPT image with PNG/JPG download options.',
  },
  {
    label: 'Brand Images',
    icon: '◉',
    sample: 'Artisan coffee shop in Bangalore, third wave, warm tones, community driven',
    outputs: [
      'Brand image directed and styled for you',
      'Styled to your brand colours & tone',
      'High-quality 1080×1080 format',
      'Download-ready PNG',
    ],
    hint: 'Real AI image, not stock, unique to your brand.',
  },
  // ── Desktop-only chips (hidden on mobile) ──
  {
    label: 'Business Strategy',
    icon: '◈',
    sample: 'SaaS startup for restaurant management, targeting mid-size restaurant chains in India',
    outputs: [
      'Positioning statement & brand voice',
      'Target audience personas (2–3 segments)',
      'Go-to-market approach & key channels',
      'Competitive differentiation summary',
    ],
    hint: 'Strategy shaped by AI, reviewed and refined by our team, delivered fast.',
  },
  {
    label: 'Content Calendar',
    icon: '▤',
    sample: 'Personal finance coach helping millennials in India save, invest & build wealth',
    outputs: [
      '30-day content calendar with daily post ideas',
      'Platform-specific content (Instagram, LinkedIn)',
      '15 ready-to-use caption hooks & CTAs',
      'Content pillars mapped to your brand goals',
    ],
    hint: 'Never run out of content ideas again.',
  },
] as const

// ── ChipsWithPreview: desktop single row, mobile 4 + More ───────────────
function ChipsWithPreview({
  isLoggedIn,
  onChipChange,
}: {
  isLoggedIn: boolean
  onChipChange?: (chip: string) => void
}) {
  const [active, setActive] = React.useState<string>('Chat')
  const [mobileExpanded, setMobileExpanded] = React.useState(false)

  function selectChip(label: string) {
    const found = CHIP_DATA.find(c => c.label === label)

    if (found) {
      requestAnimationFrame(() => {
        const inp = document.getElementById('heroInput') as HTMLTextAreaElement | null
        if (inp) {
          const placeholder = "Describe your business, e.g. 'luxury restaurant in Mumbai'…"
          if (inp.placeholder !== placeholder) inp.placeholder = placeholder
          if (inp.value !== found.sample) {
            inp.value = found.sample
            inp.dispatchEvent(new Event('input', { bubbles: true }))
          }
        }
      })
    }

    setActive(label)
    onChipChange?.(label)
  }

  const visibleMobileChips = mobileExpanded ? CHIP_DATA : CHIP_DATA.slice(0, 4)

  return (
    <div
      className="bs-home-chip-control"
      data-mobile-expanded={mobileExpanded ? 'true' : 'false'}
      aria-label="Generation options"
    >
      {/* Desktop / tablet: one clean line with every chip visible. */}
      <div className="bs-home-chips-desktop" aria-label="Generation options desktop">
        {CHIP_DATA.map(({ label, icon }) => (
          <button
            key={`desktop-${label}`}
            type="button"
            className={`bs-home-chip${active === label ? ' active' : ''}`}
            onClick={() => selectChip(label)}
            aria-label={`Try ${label} generation`}
          >
            <span aria-hidden="true">{icon}</span>
            <strong>{label}</strong>
          </button>
        ))}
      </div>

      {/* Mobile: 4 chips first. More opens all chips and then disappears. */}
      <div className="bs-home-chips-mobile" aria-label="Generation options mobile">
        {visibleMobileChips.map(({ label, icon }) => (
          <button
            key={`mobile-${label}`}
            type="button"
            className={`bs-home-chip${active === label ? ' active' : ''}`}
            onClick={() => selectChip(label)}
            aria-label={`Try ${label} generation`}
          >
            <span aria-hidden="true">{icon}</span>
            <strong>{label}</strong>
          </button>
        ))}
      </div>

      {!mobileExpanded && (
        <button
          type="button"
          className="bs-home-chip-more"
          onClick={() => setMobileExpanded(true)}
          aria-expanded={mobileExpanded}
          aria-label="Show all generation options"
        >
          <span aria-hidden="true">＋</span>
          <strong>More</strong>
        </button>
      )}
    </div>
  )
}

// ── 42 template definitions ──────────────────────────────────────────────────
const HOME_TEMPLATES = [
  { id: 'app-development',    label: 'App Dev Studio',       category: 'Tech',        bg: '#060812', accent: '#7C5CFC', thumb: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&auto=format&fit=crop&q=75' },
  { id: 'architect',          label: 'Architecture Firm',    category: 'Design',      bg: '#0A0A08', accent: '#C4A882', thumb: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=600&auto=format&fit=crop&q=75' },
  { id: 'arka-automobile',    label: 'Automobile Showroom',  category: 'Auto',        bg: '#050507', accent: '#E8341A', thumb: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=600&auto=format&fit=crop&q=75' },
  { id: 'bakery',             label: 'Artisan Bakery',       category: 'Food',        bg: '#FDF6EE', accent: '#C4863A', thumb: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=75' },
  { id: 'blackapex',          label: 'Black Apex Corp.',     category: 'Agency',      bg: '#09090A', accent: '#C9A84C', thumb: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=75' },
  { id: 'car-detailing',      label: 'Car Detailing',        category: 'Auto',        bg: '#08080A', accent: '#3A8FE8', thumb: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&auto=format&fit=crop&q=75' },
  { id: 'cloud-kitchen',      label: 'Cloud Kitchen',        category: 'Food',        bg: '#0A0805', accent: '#E85C1A', thumb: 'https://images.unsplash.com/photo-1567521464027-f127ff144326?w=600&auto=format&fit=crop&q=75' },
  { id: 'coffee-brand',       label: 'Coffee Brand',         category: 'Food',        bg: '#100A06', accent: '#B8834A', thumb: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop&q=75' },
  { id: 'construction',       label: 'Construction Co.',     category: 'Industry',    bg: '#080808', accent: '#E8A81A', thumb: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=75' },
  { id: 'cosmetics',          label: 'Cosmetics Brand',      category: 'Beauty',      bg: '#FDF8F6', accent: '#D4826C', thumb: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&auto=format&fit=crop&q=75' },
  { id: 'cybersecurity',      label: 'Cybersecurity Firm',   category: 'Tech',        bg: '#050A08', accent: '#1AE878', thumb: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=75' },
  { id: 'dental-clinic',      label: 'Dental Clinic',        category: 'Health',      bg: '#F8FCFF', accent: '#2A8FCF', thumb: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&auto=format&fit=crop&q=75' },
  { id: 'education-academy',  label: 'Education Academy',    category: 'Edu',         bg: '#06080F', accent: '#4A6CF7', thumb: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&auto=format&fit=crop&q=75' },
  { id: 'event-planner',      label: 'Event Planner',        category: 'Events',      bg: '#0C0812', accent: '#C44BE0', thumb: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&auto=format&fit=crop&q=75' },
  { id: 'fashion-brand',      label: 'Fashion Brand',        category: 'Fashion',     bg: '#FAF8F5', accent: '#1A1A18', thumb: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=75' },
  { id: 'financial-advisor',  label: 'Financial Advisor',    category: 'Finance',     bg: '#050D0A', accent: '#1AC87C', thumb: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=75' },
  { id: 'fitness-coach',      label: 'Fitness Coach',        category: 'Health',      bg: '#080808', accent: '#E83A1A', thumb: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&auto=format&fit=crop&q=75' },
  { id: 'flux-mobile',        label: 'Mobile App Brand',     category: 'Tech',        bg: '#030308', accent: '#7C5CFC', thumb: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=75' },
  { id: 'furniture',          label: 'Furniture Studio',     category: 'Design',      bg: '#F8F5F0', accent: '#8C6A3A', thumb: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&auto=format&fit=crop&q=75' },
  { id: 'gaming-studio',      label: 'Gaming Studio',        category: 'Tech',        bg: '#050310', accent: '#00D4FF', thumb: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&auto=format&fit=crop&q=75' },
  { id: 'hotel-resort',       label: 'Hotel & Resort',       category: 'Hospitality', bg: '#0A0806', accent: '#C4A84A', thumb: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&auto=format&fit=crop&q=75' },
  { id: 'interior-design',    label: 'Interior Design',      category: 'Design',      bg: '#F5F2ED', accent: '#8C7A5A', thumb: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&auto=format&fit=crop&q=75' },
  { id: 'jewellery',          label: 'Fine Jewellery',       category: 'Luxury',      bg: '#080606', accent: '#C9A84C', thumb: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop&q=75' },
  { id: 'law-firm',           label: 'Law Firm',             category: 'Legal',       bg: '#06060A', accent: '#C4A84C', thumb: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=75' },
  { id: 'logistics',          label: 'Logistics Co.',        category: 'Industry',    bg: '#080A08', accent: '#3AE81A', thumb: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=75' },
  { id: 'lumiere-cosmetics',  label: 'Lumière Cosmetics',    category: 'Beauty',      bg: '#FDF8F4', accent: '#C9826C', thumb: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&auto=format&fit=crop&q=75' },
  { id: 'luxury-restaurant',  label: 'Luxury Restaurant',    category: 'Food',        bg: '#060402', accent: '#C4943A', thumb: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&auto=format&fit=crop&q=75' },
  { id: 'marketing-agency',   label: 'Marketing Agency',     category: 'Agency',      bg: '#060612', accent: '#4A6CF7', thumb: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&auto=format&fit=crop&q=75' },
  { id: 'medical-spa',        label: 'Medical Spa',          category: 'Health',      bg: '#F8FCFA', accent: '#5AB88C', thumb: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&auto=format&fit=crop&q=75' },
  { id: 'meridian-hospital',  label: 'Hospital & Clinic',    category: 'Health',      bg: '#F8FBFF', accent: '#2A6CF7', thumb: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=600&auto=format&fit=crop&q=75' },
  { id: 'music-artist',       label: 'Music Artist',         category: 'Creative',    bg: '#080410', accent: '#C44BE0', thumb: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=75' },
  { id: 'ngo',                label: 'NGO / Nonprofit',      category: 'Social',      bg: '#060A10', accent: '#3A8FE8', thumb: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&auto=format&fit=crop&q=75' },
  { id: 'noir-clothing',      label: 'Noir Clothing',        category: 'Fashion',     bg: '#0E0E0C', accent: '#F0EDE8', thumb: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=75' },
  { id: 'pet-care',           label: 'Pet Care Clinic',      category: 'Health',      bg: '#F8FDF8', accent: '#5AB85A', thumb: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&auto=format&fit=crop&q=75' },
  { id: 'photographer',       label: 'Photographer',         category: 'Creative',    bg: '#060606', accent: '#E8E8E0', thumb: 'https://images.unsplash.com/photo-1537884944318-390069bb8665?w=600&auto=format&fit=crop&q=75' },
  { id: 'real-estate',        label: 'Real Estate',          category: 'Property',    bg: '#08080A', accent: '#C4A84C', thumb: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&auto=format&fit=crop&q=75' },
  { id: 'saas-startup',       label: 'SaaS Startup',         category: 'Tech',        bg: '#050510', accent: '#4A6CF7', thumb: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&auto=format&fit=crop&q=75' },
  { id: 'salon',              label: 'Beauty Salon',         category: 'Beauty',      bg: '#100810', accent: '#E84BE0', thumb: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&auto=format&fit=crop&q=75' },
  { id: 'solar-company',      label: 'Solar Company',        category: 'Industry',    bg: '#060A06', accent: '#7CC47C', thumb: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&auto=format&fit=crop&q=75' },
  { id: 'travel-agency',      label: 'Travel Agency',        category: 'Travel',      bg: '#050A14', accent: '#3AAAE8', thumb: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&auto=format&fit=crop&q=75' },
  { id: 'wedding-photography', label: 'Wedding Photography', category: 'Creative',   bg: '#FAF8F5', accent: '#C4A882', thumb: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop&q=75' },
  { id: 'yoga-studio',        label: 'Yoga Studio',          category: 'Health',      bg: '#F8F5F2', accent: '#8C6A5A', thumb: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&auto=format&fit=crop&q=75' },
] as const

type HomeTpl = typeof HOME_TEMPLATES[number]

function homeTemplateFallbackThumb(t: Pick<HomeTpl, 'id' | 'label' | 'category' | 'accent' | 'bg'>): string {
  const params = new URLSearchParams({ id: t.id, label: t.label, category: t.category, color: t.accent, bg: t.bg })
  return `/api/template-thumbnail?${params.toString()}`
}

const ALL_HOME_CATS = ['All', 'Tech', 'Food', 'Health', 'Design', 'Beauty', 'Finance', 'Creative', 'Industry', 'Legal', 'Luxury', 'Hospitality', 'Fashion', 'Events', 'Social', 'Travel', 'Agency', 'Edu', 'Property', 'Auto'] as const

// INITIAL_VISIBLE replaced by SLIDER_INITIAL / SLIDER_CHUNK inside TemplatesSection

// ── Template card ─────────────────────────────────────────────────────────────
function HomeTemplateCard({ t, isLoggedIn, eager, priority }: { t: HomeTpl; isLoggedIn: boolean; eager: boolean; priority?: boolean }) {
  const [hovered, setHovered] = useState(false)
  const [imgErr, setImgErr] = useState(false)
  const fallbackThumb = homeTemplateFallbackThumb(t)
  const [imgSrc, setImgSrc] = useState(t.thumb.replace('w=600', 'w=480'))

  useEffect(() => {
    setImgErr(false)
    setImgSrc(t.thumb.replace('w=600', 'w=480'))
  }, [t.id, t.thumb])

  return (
    <div
      className="ht-card"
      style={{
        display: 'flex',
        borderColor: hovered ? `${t.accent}55` : undefined,
        boxShadow: hovered ? `0 24px 56px ${t.accent}14, 0 0 0 1px ${t.accent}22` : undefined,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Browser chrome bar — Professional minimalist version */}
      <div className="ht-chrome">
        <div className="ht-urlbar">samples.brandsyndicate.in/{t.id}</div>
        <div className="ht-live-badge"><span className="ht-live-dot" /></div>
      </div>

      {/* Static image thumbnail — replaces iframe */}
      <div className="ht-screen" style={{ background: t.bg, position: 'relative' }}>
        {/* Solid bg colour always behind */}
        <div style={{ position: 'absolute', inset: 0, background: t.bg }} />

        {!imgErr ? (
          <img
            src={imgSrc}
            alt={t.label}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            // @ts-ignore - fetchPriority is valid HTML attr, React types may lag
            fetchPriority={priority ? 'high' : undefined}
            referrerPolicy="no-referrer"
            onError={(e) => {
              if (imgSrc !== fallbackThumb) {
                setImgSrc(fallbackThumb)
                e.currentTarget.src = fallbackThumb
              } else {
                setImgErr(true)
              }
            }}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', display: 'block',
              transition: 'transform 0.4s ease',
              transform: hovered ? 'scale(1.05)' : 'scale(1)',
            }}
          />
        ) : (
          /* Gradient fallback */
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(ellipse at 30% 40%, ${t.accent}28 0%, transparent 65%), ${t.bg}`, backgroundImage: `url(${fallbackThumb})`, backgroundSize: 'cover', backgroundPosition: 'center',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase',
              fontFamily: "'DM Mono',monospace", color: t.accent, opacity: 0.6,
            }}>{t.label}</span>
          </div>
        )}

        {/* Dark gradient bottom overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.45) 100%)',
        }} />

        {/* Accent colour top bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: hovered ? 3 : 2,
          background: `linear-gradient(90deg, ${t.accent}, ${t.accent}55, transparent)`,
          transition: 'height 0.2s',
        }} />

        {/* Category badge */}
        <div className="ht-cat-badge" style={{ border: `1px solid ${t.accent}35`, color: t.accent }}>
          {t.category}
        </div>

        {/* View Site hover button */}
        <a
          href={`/samples/${t.id}.html`}
          target="_blank"
          rel="noreferrer"
          onClick={e => e.stopPropagation()}
          className="ht-view-site-btn"
          style={{ border: `1px solid ${t.accent}55`, color: t.accent }}
        >
          <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
            <path d="M1 9L9 1M9 1H4M9 1V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          View Site
        </a>
      </div>

      {/* Info row */}
      <div className="ht-info">
        <div className="ht-info-top">
          <div className="ht-info-label">{t.label}</div>
          <div className="ht-info-cat">{t.category}</div>
        </div>
        <div className="ht-info-footer">
          <a
            className="ht-use-btn"
            href={isLoggedIn ? `/generate?chip=website&sample=${t.id}` : `/login?tab=signup&template=${t.id}`}
            onClick={e => e.stopPropagation()}
          >Use Template →</a>
          <span className="ht-free-badge">Free</span>
        </div>
      </div>
    </div>
  )
}

// ── Templates section — Slider + Load More ──────────────────
const SLIDER_INITIAL = 8   // cards rendered on first paint
const SLIDER_CHUNK  = 6   // cards added each time user scrolls near end

function TemplatesSection({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [activeCat, setActiveCat]     = useState<string>('All')
  const [rendered,  setRendered]      = useState(SLIDER_INITIAL)
  const sliderRef = useRef<HTMLDivElement | null>(null)

  const filtered = useMemo(() =>
    activeCat === 'All' ? HOME_TEMPLATES : HOME_TEMPLATES.filter(t => t.category === activeCat),
    [activeCat]
  )

  // Only render `rendered` cards — add more as user scrolls the slider
  const visible = useMemo(() => filtered.slice(0, rendered), [filtered, rendered])
  const canLoadMore = rendered < filtered.length

  const handleCat = useCallback((cat: string) => {
    setActiveCat(cat)
    setRendered(SLIDER_INITIAL) // reset when switching category
    if (sliderRef.current) sliderRef.current.scrollLeft = 0
  }, [])

  // Lazy-load: when user scrolls near the end of the slider, render more cards
  useEffect(() => {
    const el = sliderRef.current
    if (!el || !canLoadMore) return
    function onScroll() {
      if (!el) return
      const estimatedCardWidth = window.innerWidth <= 700 ? 280 : 320
      const nearEnd = el.scrollLeft >= Math.max(0, (rendered - 4) * estimatedCardWidth)
      if (nearEnd) setRendered(prev => Math.min(prev + SLIDER_CHUNK, filtered.length))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [canLoadMore, filtered.length])

  // Slide helpers
  const slideBy = useCallback((dir: 1 | -1) => {
    const el = sliderRef.current
    if (!el) return
    const cardW = window.innerWidth <= 700 ? 280 : 320
    el.scrollBy({ left: dir * (cardW + 20) * 3, behavior: 'smooth' })
  }, [])

  return (
    <section className="bs-section bs-all-templates" id="templates" style={{ background: 'var(--bg)', borderTop: '1px solid var(--border)', overflow: 'hidden' }}>
      <div data-reveal>
        <div className="bs-eye">1,550+ Industry Samples</div>
        <h2 className="bs-h2">Real brands,<br /><em>real results.</em></h2>
        <p className="bs-sub" style={{ marginTop: 14 }}>
          Pick any industry, instantly preview, then our team crafts your custom version.
        </p>
      </div>

      {/* Category filter bar */}
      <div className="ht-cat-bar-wrap">
        <div id="tmplCatBar" className="ht-cat-bar">
          {ALL_HOME_CATS.map((cat, ci) => (
            <button
              key={cat}
              type="button"
              data-cat={cat}
              className={`ht-cat-btn${(activeCat === cat || (cat === 'All' && activeCat === 'All' && ci === 0)) ? ' active' : ''}`}
              onClick={() => handleCat(cat)}
              aria-label={`Show ${cat} website templates`}
            >{cat}</button>
          ))}
        </div>
      </div>

      {/* Slider — horizontal scroll, cards 300px wide, no grid wrap */}
      <div className="ht-slider-outer">
        {/* Prev arrow */}
        <button
          className="ht-slide-arrow ht-slide-arrow-prev"
          onClick={() => slideBy(-1)}
          aria-label="Scroll left"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div
          ref={sliderRef}
          className="ht-slider-rail"
        >
          {visible.map((t, i) => (
            <div key={t.id} className="ht-slider-item">
              <HomeTemplateCard
                t={t}
                isLoggedIn={isLoggedIn}
                eager={i < 4}
                priority={i === 0}
              />
            </div>
          ))}
          {/* Ghost placeholder to signal more is coming while lazy-loading */}
          {canLoadMore && (
            <div className="ht-slider-item ht-slider-ghost" aria-hidden>
              <div className="ht-card" style={{ opacity: 0.35, pointerEvents: 'none' }}>
                <div className="ht-chrome" />
                <div className="ht-screen" style={{ background: 'var(--surface2)' }} />
                <div className="ht-info">
                  <div style={{ height: 14, width: '60%', background: 'var(--border)', borderRadius: 4 }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Next arrow */}
        <button
          className="ht-slide-arrow ht-slide-arrow-next"
          onClick={() => slideBy(1)}
          aria-label="Scroll right"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Count + View All */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Mono',monospace", letterSpacing: '0.06em' }}>
          {filtered.length} templates{activeCat !== 'All' ? ` · ${activeCat}` : ''}
        </span>
        <a
          href="/templates"
          style={{ fontSize: 11, color: 'var(--gold)', fontFamily: "'DM Mono',monospace", letterSpacing: '0.08em', textDecoration: 'none', textTransform: 'uppercase' }}
        >Browse All →</a>
      </div>

      <div data-reveal style={{ textAlign: 'center', marginTop: 48 }}>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>
          Explore 1,550+ industry samples. Our team builds your custom version, designed and refined for your brand.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="/templates"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', background: 'transparent', color: 'var(--gold)',
              border: '1px solid var(--gold)', borderRadius: 4, textDecoration: 'none',
              fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase',
              fontFamily: "'DM Mono', monospace", fontWeight: 500,
            }}
          >Browse All 1,550+ Templates</a>
          <a
            href={isLoggedIn ? '/generate' : '/login?tab=signup'}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', background: 'var(--gold)', color: '#0A0A0E',
              borderRadius: 4, textDecoration: 'none', fontWeight: 700,
              fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase',
              fontFamily: "'DM Mono', monospace",
            }}
          >Generate Free Now</a>
        </div>
      </div>
    </section>
  )
}

export default function HomeClient({
  isLoggedIn = false,
  userName = '',
}: {
  isLoggedIn?: boolean
  userName?: string
}) {
  const heroRef      = useRef<HTMLElement | null>(null)
  const promptCardRef = useRef<HTMLDivElement | null>(null)
  // Use ref instead of state — chip/duration changes never trigger parent re-render
  const heroChipRef  = useRef('Chat')

  // ── Mobile menu ──────────────────────────────────────────────────────────
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const closeMobileMenu = React.useCallback(() => setMobileMenuOpen(false), [])

  // Escape key closes drawer
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMobileMenu() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeMobileMenu])

  // Body scroll-lock while drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  // ── Intersection-observer for scroll-reveal (below-fold only) ─────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    const els = document.querySelectorAll<HTMLElement>('[data-reveal]')
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  // ── Hero parallax + prompt-card mouse tilt (eager, RAF-guarded) ───────
  useEffect(() => {
    if (typeof window === 'undefined') return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    const hero = heroRef.current
    const card = promptCardRef.current
    if (!hero) return

    let rafId = 0
    const orbs = hero.querySelectorAll<HTMLElement>('[data-parallax]')

    function handleMove(e: MouseEvent) {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        const cx = e.clientX / Math.max(window.innerWidth, 1) - 0.5
        const cy = e.clientY / Math.max(window.innerHeight, 1) - 0.5
        orbs.forEach(orb => {
          const depth = parseFloat(orb.dataset.depth || '20')
          orb.style.transform = `translate3d(${cx * depth}px, ${cy * depth}px, 0)`
        })
        if (card) {
          const rotY = cx * 6
          const rotX = -cy * 5
          card.style.transform = `perspective(1100px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(0)`
        }
        rafId = 0
      })
    }
    function reset() {
      orbs.forEach(orb => { orb.style.transform = '' })
      if (card) card.style.transform = ''
    }
    hero.addEventListener('mousemove', handleMove)
    hero.addEventListener('mouseleave', reset)
    return () => {
      hero.removeEventListener('mousemove', handleMove)
      hero.removeEventListener('mouseleave', reset)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  // ── ALL non-critical sliders deferred to idle ─────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return

    const ric = (window as any).requestIdleCallback as
      ((cb: () => void, opts?: { timeout: number }) => number) | undefined

    const scheduleIdle = (fn: () => (() => void) | void, timeout = 300) => {
      if (ric) return ric(fn, { timeout })
      const t = window.setTimeout(fn, timeout)
      return t
    }

    // ── Portfolio Carousel ──────────────────────────────────────────────
    scheduleIdle(() => {
      const track = document.getElementById('bsCTrack') as HTMLElement | null
      const dots  = document.querySelectorAll<HTMLElement>('.bs-c-dot')
      const next  = document.getElementById('slideNext')
      const prev  = document.getElementById('slidePrev')
      if (!track || !next || !prev) return

      const total = 6
      let idx = 0
      let timer = 0

      const GAP = 16
      const cardsPerView = () => (window.innerWidth <= 700 ? 1 : window.innerWidth <= 1100 ? 2 : 3)

      function go(i: number) {
        const perView = cardsPerView()
        const maxIdx = total - perView
        idx = ((i % total) + total) % total
        if (idx > maxIdx) idx = 0
        const step = `calc(((100% - ${GAP * (perView - 1)}px) / ${perView}) + ${GAP}px)`
        track!.style.transform = `translateX(calc(-${idx} * ${step}))`
        dots.forEach((d, j) => d.classList.toggle('on', j === idx))
      }

      const onNext = () => go(idx + 1)
      const onPrev = () => go(idx - 1)
      next.addEventListener('click', onNext)
      prev.addEventListener('click', onPrev)
      dots.forEach((d, i) => d.addEventListener('click', () => go(i)))

      let touchStartX = 0
      const viewport = track.parentElement!
      viewport.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX }, { passive: true })
      viewport.addEventListener('touchend', (e) => {
        const dx = touchStartX - e.changedTouches[0].clientX
        if (Math.abs(dx) > 40) go(dx > 0 ? idx + 1 : idx - 1)
      }, { passive: true })

      timer = window.setInterval(() => go(idx + 1), 4800)
      const onResize = () => go(idx)
      window.addEventListener('resize', onResize)
    })

    // ── Branded Graphics slider ─────────────────────────────────────────
    scheduleIdle(() => {
      const track   = document.getElementById('bsPgTrack') as HTMLElement | null
      const prevBtn = document.getElementById('bsPgPrev') as HTMLElement | null
      const nextBtn = document.getElementById('bsPgNext') as HTMLElement | null
      if (!track) return

      const total = track.children.length
      let idx = 0
      let timer = 0
      const dots = document.querySelectorAll<HTMLElement>('.bs-pg-dot')

      const CATEGORIES: Record<string, number[]> = {
        'All':     Array.from({ length: total }, (_, i) => i),
        'Social':  [0,1,3].filter(i => i < total),
        'Stories': [0,1,4].filter(i => i < total),
        'Brand':   [2,3,4].filter(i => i < total),
      }

      function go(i: number) {
        idx = ((i % total) + total) % total
        track!.style.transform = `translateX(-${idx * 100}%)`
        dots.forEach((d, j) => d.classList.toggle('on', j === idx))
      }

      if (prevBtn) prevBtn.addEventListener('click', () => go(idx - 1))
      if (nextBtn) nextBtn.addEventListener('click', () => go(idx + 1))
      dots.forEach((d, i) => d.addEventListener('click', () => go(i)))
      timer = window.setInterval(() => go(idx + 1), 3400)

      const tabs = document.querySelectorAll<HTMLElement>('.bs-pg-tab')
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'))
          tab.classList.add('active')
          const cat = tab.dataset.cat || 'All'
          const firstInCat = CATEGORIES[cat]?.[0] ?? 0
          window.clearInterval(timer)
          go(firstInCat)
          timer = window.setInterval(() => {
            const cat2 = document.querySelector<HTMLElement>('.bs-pg-tab.active')?.dataset.cat || 'All'
            const catSlides = CATEGORIES[cat2] ?? CATEGORIES['All']
            const currentPos = catSlides.indexOf(idx)
            go(catSlides[(currentPos + 1) % catSlides.length])
          }, 3400)
        })
      })
    })

    // ── Brand Images Card 2 slider ──────────────────────────────────────
    scheduleIdle(() => {
      const track = document.getElementById('brandImgTrack') as HTMLElement | null
      if (!track) return

      const total = track.children.length
      let idx = 0
      let timer = 0

      function go(i: number) {
        idx = ((i % total) + total) % total
        track!.style.transform = `translateX(-${idx * (100 / Math.max(total, 1))}%)`
        for (let j = 0; j < total; j++) {
          const dot = document.getElementById(`bid-${j}`)
          if (dot) dot.style.background = j === idx ? 'var(--gold)' : 'rgba(255,255,255,0.35)'
        }
      }

      for (let j = 0; j < total; j++) {
        const dot = document.getElementById(`bid-${j}`)
        if (dot) {
          const jj = j
          dot.addEventListener('click', () => {
            window.clearTimeout(timer)
            go(jj)
          })
        }
      }

      function scheduleNext() {
        const delay = idx === 1 ? 4000 : 3000
        timer = window.setTimeout(() => { go(idx + 1); scheduleNext() }, delay)
      }
      scheduleNext()
    })

    // ── Website Demos mobile slider ─────────────────────────────────────
    scheduleIdle(() => {
      const track   = document.getElementById('bsDemoTrack') as HTMLElement | null
      const prevBtn = document.getElementById('bsDemoPrev') as HTMLElement | null
      const nextBtn = document.getElementById('bsDemoNext') as HTMLElement | null
      const dots    = document.querySelectorAll<HTMLElement>('.bs-demo-mdot')
      if (!track) return

      const total = track.children.length
      let idx = 0

      function go(i: number) {
        idx = ((i % total) + total) % total
        if (window.innerWidth <= 700) {
          track!.style.transform = `translateX(-${idx * 100}%)`
        } else {
          track!.style.transform = ''
        }
        dots.forEach((d, j) => d.classList.toggle('on', j === idx))
      }

      if (prevBtn) prevBtn.addEventListener('click', () => go(idx - 1))
      if (nextBtn) nextBtn.addEventListener('click', () => go(idx + 1))
      dots.forEach((d, i) => d.addEventListener('click', () => go(i)))

      let startX = 0
      track.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX }, { passive: true })
      track.addEventListener('touchend', (e) => {
        const dx = startX - e.changedTouches[0].clientX
        if (Math.abs(dx) > 40) go(dx > 0 ? idx + 1 : idx - 1)
      }, { passive: true })

      const onResize = () => go(idx)
      window.addEventListener('resize', onResize)
    })

    scheduleIdle(() => {
      // Testimonials scroll-dot sync
      const testiGrid = document.getElementById('testiGrid')
      const testiDots = document.querySelectorAll<HTMLElement>('#testiDots .bs-testi-dot')
      if (testiGrid && testiDots.length) {
        const updateDots = () => {
          const cardW = window.innerWidth <= 700 ? 292 : 356
          const i = Math.round(testiGrid.scrollLeft / cardW)
          testiDots.forEach((d, j) => d.classList.toggle('active', j === i))
        }
        testiGrid.addEventListener('scroll', updateDots, { passive: true })
        testiDots.forEach((dot, i) => {
          dot.addEventListener('click', () => {
            const cardW = window.innerWidth <= 700 ? 292 : 356
            testiGrid.scrollTo({ left: cardW * i, behavior: 'smooth' })
          })
        })
      }
    }, 500)

  }, []) // single consolidated useEffect for all sliders

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      {/* Set bs-home before hydration — prevents FOUC */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{document.body.classList.add('bs-home');}catch(e){}})();`,
        }}
      />

      {/* ═══════════ NAV ═══════════ */}
      <nav className="bs-nav">
        <button
          className={`bs-hamburger${mobileMenuOpen ? ' bs-hamburger--open' : ''}`}
          onClick={() => setMobileMenuOpen(v => !v)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="bs-mobile-drawer"
        >
          <span className="bs-hamburger-bar" />
          <span className="bs-hamburger-bar" />
          <span className="bs-hamburger-bar" />
        </button>
        <Link href="/" className="bs-nav-logo" aria-label="Brand Syndicate home">
          <span className="bs-nav-wordmark">Brand <span>·</span> Syndicate</span>
        </Link>
        <div className="bs-nav-links">
          <a href="#output">Preview</a>
          <Link href="/templates">Website Templates</Link>
          <a href="#demos">Campaigns</a>
          <Link href="/pricing">Pricing</Link>
          <a href="#faq">FAQ</a>
        </div>
        <div className="bs-nav-right">
          <ThemeToggle />
          {isLoggedIn ? (
            <>
              <Link href="/my-work" className="bs-nav-mywork-btn" style={{
                padding: '7px 14px', fontSize: 9, letterSpacing: '0.14em',
                textTransform: 'uppercase', fontFamily: "'DM Mono', monospace",
                border: '1px solid rgba(201,168,76,0.35)',
                color: 'var(--gold)', textDecoration: 'none', borderRadius: 3,
                transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}>My Work</Link>
              <Link href="/generate" className="btn-cinema" style={{ padding: '8px 18px', fontSize: 9 }}>
                Generate →
              </Link>
            </>
          ) : (
            <Link href="/login?tab=signup&callbackUrl=%2Fgenerate" className="btn-cinema bs-nav-cta-btn" style={{ padding: '10px 20px', fontSize: 10 }}>
              Generate Now
            </Link>
          )}
        </div>
      </nav>

      {/* ═══════════ MOBILE DRAWER ═══════════ */}
      {/* Backdrop — click outside to close */}
      <div
        className={`bs-mobile-backdrop${mobileMenuOpen ? ' bs-mobile-backdrop--open' : ''}`}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />
      {/* Drawer panel */}
      <div
        id="bs-mobile-drawer"
        className={`bs-mobile-drawer${mobileMenuOpen ? ' bs-mobile-drawer--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <nav className="bs-mobile-drawer-links" onClick={closeMobileMenu}>
          <a href="#output">Preview</a>
          <Link href="/templates">Website Templates</Link>
          <a href="#demos">Campaigns</a>
          <Link href="/pricing">Pricing</Link>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="bs-mobile-drawer-footer">
          {isLoggedIn ? (
            <div className="bs-mobile-drawer-logged">
              <Link href="/my-work" className="bs-mobile-drawer-secondary" onClick={closeMobileMenu}>
                My Work
              </Link>
              <Link href="/generate" className="btn-cinema" onClick={closeMobileMenu} style={{ justifyContent: 'center' }}>
                Generate →
              </Link>
            </div>
          ) : (
            <div className="bs-mobile-drawer-auth">
              <Link href="/login" className="bs-mobile-drawer-secondary" onClick={closeMobileMenu}>
                Sign In
              </Link>
              <Link href="/login?tab=signup&callbackUrl=%2Fgenerate" className="btn-cinema" onClick={closeMobileMenu} style={{ justifyContent: 'center', display: 'flex' }}>
                Generate Now →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ HERO ═══════════ */}
      {/* City SVG removed — was 100+ DOM nodes blocking first paint */}
      <section ref={heroRef} className="bs-hero" id="hero">
        <div className="bs-hero-bg" />
        <div className="bs-hero-grid" />
        <div className="bs-hero-orb o1" data-parallax data-depth="22" />
        <div className="bs-hero-orb o2" data-parallax data-depth="34" />
        <div className="bs-hero-orb o3" data-parallax data-depth="18" />

        {/* No data-reveal on hero elements — visible immediately on first paint */}
        <div className="bs-hero-eyebrow">
          <span className="dot" />
          AI Meets Human Creativity · No Design Skills Needed · Free to Start
        </div>

        <h1 className="bs-hero-h1">
          Where AI meets<br />
          human creativity <br />
          your brand, <em>built right.</em>
        </h1>

        <p className="bs-hero-sub">
          Describe your business and start building websites, visuals, content, and strategy from one smooth AI workspace.
        </p>

        <div className="bs-prompt-wrap" ref={promptCardRef}>
          <div className="bs-prompt-glow" />
          <div className="bs-prompt-card">
            <div className="bs-prompt-top">
              <textarea
                className="bs-prompt-input"
                id="heroInput"
                placeholder="Describe your business — e.g. 'luxury restaurant in Mumbai' or 'fitness coach in Delhi'…"
                rows={3}
              />
              <button
                className="bs-prompt-btn"
                type="button"
                aria-label="Generate your brand workspace"
                onClick={() => {
                  const el = document.getElementById('heroInput') as HTMLTextAreaElement | null
                  const prompt = el?.value?.trim() || ''
                  const chip = heroChipRef.current
                  const chipParam = chip !== 'Chat' ? `&chip=${encodeURIComponent(chip)}` : ''
                  const dest = `/generate?prompt=${encodeURIComponent(prompt)}${chipParam}`
                  if (isLoggedIn) {
                    window.location.href = dest
                  } else {
                    window.location.href = `/login?tab=signup&callbackUrl=${encodeURIComponent(dest)}`
                  }
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                </svg>
                <span>Generate</span>
              </button>
            </div>
            <div className="bs-prompt-divider" />
            {/* onChipChange writes to ref — zero parent re-renders */}
            <ChipsWithPreview
              isLoggedIn={isLoggedIn}
              onChipChange={(chip) => { heroChipRef.current = chip }}
            />
          </div>
          <div className="bs-prompt-trust" aria-label="Trust notes">
            <span className="bs-trust-item">No payment required</span>
            <span className="bs-trust-item">Free instant preview</span>
            <span className="bs-trust-item">Human refined delivery</span>
          </div>
        </div>

        <div className="scroll-cue" aria-hidden="true">
          Scroll
          <div className="scroll-cue-line" />
        </div>
      </section>

      {/* ═══════════ STATS MARQUEE ═══════════ */}
      <div className="bs-stats">
        <div className="bs-stats-track">
          {[
            ['Instant', 'Preview'],
            ['Human',  'Refinement'],
            ['100%', 'Brand Focus'],
            ['Fast',  'Generation'],
            ['India',  'Ready Campaigns'],
            ['Instant', 'Preview'],
            ['Human',  'Refinement'],
            ['100%', 'Brand Focus'],
            ['Fast',  'Generation'],
            ['India',  'Ready Campaigns'],
          ].map(([n, l], i) => (
            <div className="bs-stats-item" key={i}>
              <span className="bs-stats-num">{n}</span> {l}
              <span className="bs-stats-sep" />
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════ OUTPUT PREVIEW ═══════════ */}
      <section className="bs-output bs-section" id="output">
        <div data-reveal>
          <div className="bs-eye">Live Output Sample</div>
          <h2 className="bs-h2">This is what you get: <em>AI drafted,<br />human perfected.</em></h2>
          <p className="bs-sub" style={{ marginTop: 14 }}>
            A real business workspace generated from one prompt: websites, graphics, strategy, and content organized for your next launch.
          </p>
        </div>

        <div className="bs-out-grid">
          {/* Card 1: Brand Identity */}
          <div className="bs-out-card" data-reveal data-reveal-delay="1">
            <div className="bs-out-type">Brand Identity</div>
            <div className="bs-out-title">NEXGEN FITNESS</div>
            <div className="bs-out-body">Premium fitness coaching for urban professionals. Bold, cinematic and conversion-ready.</div>
            <div className="bs-palette-row" style={{ marginBottom: 12 }}>
              {['#09090a','#D4AF54','#E63946','#F4EFE5','#6EA8FE'].map(c => (
                <div key={c} className="bs-swatch" style={{ background: c }} title={c} />
              ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
              {['Wordmark', 'Icon Mark', 'Dark Ver.'].map(l => (
                <span key={l} style={{ fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', background: 'var(--gold-dim)', border: '1px solid rgba(212,175,84,0.2)', borderRadius: 100, padding: '3px 9px', fontFamily: 'DM Mono, monospace' }}>{l}</span>
              ))}
            </div>
            <div style={{ padding: '10px 12px', background: 'var(--surface-glass-soft)', borderLeft: '2px solid var(--gold)', borderRadius: '0 6px 6px 0' }}>
              <div style={{ fontSize: 9, letterSpacing: '0.18em', color: 'var(--gold)', textTransform: 'uppercase', fontFamily: 'DM Mono, monospace', marginBottom: 3 }}>Brand Voice</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, fontStyle: 'italic' }}>&ldquo;Bold. Cinematic. Relentless.&rdquo;</div>
            </div>
          </div>

          {/* Card 2: Brand Images slider */}
          <div className="bs-out-card bs-out-card--images" data-reveal data-reveal-delay="2" style={{ overflow: 'hidden' }}>
            <div className="bs-out-type">Brand Images</div>
            <div className="bs-out-title">AI-GENERATED VISUALS</div>
            <div className="bs-out-body bs-out-body--trim" style={{ marginBottom: 10 }}>Unique, on-brand images, styled to your colours and industry.</div>
            <div style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden', borderRadius: 6 }}>
              <div
                id="brandImgTrack"
                style={{
                  display: 'flex',
                  width: '300%',
                  height: '100%',
                  transition: 'transform 0.55s cubic-bezier(.4,0,.2,1)',
                }}
              >
                {[
                  { src: '/portfolio/campaign-legacy-cream.webp',  label: 'Legacy Editorial' },
                  { src: '/portfolio/campaign-firozabad.webp',     label: 'Craft Campaign' },
                  { src: '/portfolio/campaign-adore-jewellery.webp', label: 'Jewellery Case Study' },
                ].map(({ src, label }, i) => (
                  <div key={i} style={{ width: '33.3333%', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={label}
                      loading={i < 1 ? 'eager' : 'lazy'}
                      decoding="async"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '3px 6px', background: 'rgba(0,0,0,0.55)', fontSize: 8, color: 'rgba(255,255,255,0.7)', fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4 }}>
                {[0,1,2].map(i => (
                  <div key={i} id={`bid-${i}`} style={{ width: 5, height: 5, borderRadius: '50%', background: i === 0 ? 'var(--gold)' : 'rgba(255,255,255,0.35)', transition: 'background 0.3s', cursor: 'pointer' }} />
                ))}
              </div>
            </div>
          </div>

          {/* Card 3: Content Calendar, locked */}
          <div className="bs-out-card bs-locked" data-reveal data-reveal-delay="3">
            <div className="bs-out-type">Content Calendar</div>
            <div className="bs-out-title">30-DAY PLAN</div>
            <div className="bs-cal-rows">
              {[
                ['MON', 'Reel: Push the limits, transformation hook.'],
                ['TUE', 'Carousel: 5 mistakes beginners make.'],
                ['WED', 'Story: Behind the scenes, your journey.'],
                ['THU', 'Quote post: Discipline beats motivation.'],
                ['FRI', 'Client result: 12kg down in 8 weeks.'],
                ['SAT', "Poll: What's your #1 fitness goal?"],
                ['SUN', 'Motivation reel + soft CTA to DM.'],
              ].map(([d, c]) => (
                <div key={d} className="bs-cal-r">
                  <span className="bs-cal-d">{d}</span>
                  <span className="bs-cal-c">{c}</span>
                </div>
              ))}
            </div>
            <div className="bs-lock-layer">
              <div className="bs-lock-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div className="bs-lock-lbl">Unlock Full Calendar</div>
              <div className="bs-lock-sub">Generate your free preview to see 30 days of personalised content.</div>
            </div>
          </div>

          {/* Card 4: Website Copy */}
          <div className="bs-out-card" data-reveal data-reveal-delay="1">
            <div className="bs-out-type">Website Hero Copy</div>
            <div className="bs-out-title">HEADLINE + CTA</div>
            <div className="bs-out-body">
              <em style={{ color: 'var(--cream)', fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontSize: 17 }}>
                &quot;Stop surviving. Start dominating.&quot;
              </em><br /><br />
              Sub: Premium 1-on-1 fitness coaching for ambitious professionals in Delhi NCR. 90-day transformation guaranteed.
            </div>
          </div>

          {/* Card 5: Logo Direction */}
          <div className="bs-out-card" data-reveal data-reveal-delay="2">
            <div className="bs-out-type">Logo Direction</div>
            <div className="bs-out-title">3 CONCEPTS</div>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {([
                {
                  n: 'Wordmark Bold', s: 'Editorial · High Impact',
                  preview: <svg width="100%" height="36" viewBox="0 0 160 36" fill="none" style={{ display: 'block' }}>
                    <rect x="0" y="6" width="3" height="24" fill="#D4AF54" />
                    <text x="10" y="14" fontFamily="serif" fontSize="7" fill="rgba(244,239,229,0.45)" letterSpacing="2">NEXGEN</text>
                    <text x="9" y="30" fontFamily="serif" fontSize="18" fill="#F4EFE5" letterSpacing="1">FITNESS</text>
                  </svg>
                },
                {
                  n: 'Icon + Lockup', s: 'Premium · Corporate',
                  preview: <svg width="100%" height="36" viewBox="0 0 160 36" fill="none" style={{ display: 'block' }}>
                    <rect x="4" y="4" width="28" height="28" rx="4" fill="none" stroke="#D4AF54" strokeWidth="1.2" />
                    <text x="10" y="25" fontFamily="serif" fontSize="16" fill="#F4EFE5">NG</text>
                    <rect x="5" y="5" width="3" height="3" fill="#E63946" />
                    <text x="40" y="17" fontFamily="serif" fontSize="8" fill="rgba(244,239,229,0.45)" letterSpacing="2">NEXGEN</text>
                    <text x="40" y="30" fontFamily="serif" fontSize="13" fill="#F4EFE5" letterSpacing="1">FITNESS</text>
                  </svg>
                },
                {
                  n: 'Cinematic Stack', s: 'Luxury · Minimal',
                  preview: <svg width="100%" height="36" viewBox="0 0 160 36" fill="none" style={{ display: 'block' }}>
                    <text x="80" y="12" fontFamily="monospace" fontSize="6" fill="rgba(212,175,84,0.6)" letterSpacing="4" textAnchor="middle">PREMIUM COACHING</text>
                    <text x="80" y="30" fontFamily="serif" fontSize="18" fill="#F4EFE5" letterSpacing="3" textAnchor="middle">NEXGEN</text>
                    <rect x="55" y="33" width="50" height="1" fill="#D4AF54" />
                  </svg>
                },
              ] as Array<{ n: string; s: string; preview: React.ReactNode }>).map(({ n, s, preview }) => (
                <div key={n} style={{ padding: '8px 12px', background: 'var(--surface-glass-soft)', borderLeft: '2px solid var(--gold)', borderRadius: '0 6px 6px 0' }}>
                  {preview}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--cream)' }}>{n}</span>
                    <span style={{ fontSize: 8, color: 'var(--muted)', letterSpacing: '0.12em', fontFamily: 'DM Mono, monospace' }}>{s}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 6: Strategy, locked */}
          <div className="bs-out-card bs-locked" data-reveal data-reveal-delay="3">
            <div className="bs-out-type">Business Strategy</div>
            <div className="bs-out-title">LAUNCH PLAN</div>
            <div className="bs-out-body">Positioning, target audience breakdown, competitor gap analysis and a 90-day go-to-market roadmap.</div>
            <div className="bs-lock-layer">
              <div className="bs-lock-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div className="bs-lock-lbl">Included in Full Kit</div>
              <div className="bs-lock-sub">Sign up free to unlock your personalised strategy brief.</div>
            </div>
          </div>
        </div>

        <div className="bs-out-cta" data-reveal>
          <div>
            <h3>Want this for<br />your business?</h3>
            <p>Generate your free brand sample now, no payment, no card required.</p>
          </div>
          <div className="bs-cta-btns">
            <a href="https://wa.me/917897671348?text=Hi%20Brand%20Syndicate%2C%20I%20want%20to%20discuss%20my%20brand%20kit." className="bs-btn-wa" target="_blank" rel="noopener noreferrer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
              WhatsApp Us
            </a>
            <Link href="/login?tab=signup" className="btn-glass" style={{ padding: '14px 26px' }}>Generate Free Sample →</Link>
          </div>
        </div>
      </section>

      {/* ═══════════ PORTFOLIO CAROUSEL ═══════════ */}
      <div className="bs-carousel" id="demos">
        <div className="bs-carousel-head" data-reveal>
          <div>
            <div className="bs-eye">Our Creative Marketing Campaigns</div>
            <h2 className="bs-h2">Campaigns that feel<br />like <em>legacy.</em></h2>
            <p className="bs-sub" style={{ marginTop: 14 }}>Premium editorial campaigns, Indian-market storytelling, brand positioning and social visuals designed to stop the scroll.</p>
          </div>
          <div className="bs-ctrls">
            <button className="bs-ctrl" id="slidePrev" aria-label="Previous slide">&#8592;</button>
            <button className="bs-ctrl" id="slideNext" aria-label="Next slide">&#8594;</button>
          </div>
        </div>
        <div className="bs-c-viewport">
          <div className="bs-c-track" id="bsCTrack">
            {[
              { title: 'Creator Brand',      cat: 'Content · Influencer',        img: '/portfolio/creator.webp' },
              { title: 'Legacy Positioning', cat: 'Brand Story · Premium',       img: '/portfolio/campaign-legacy-cream.webp' },
              { title: 'Firozabad Campaign', cat: 'Craftsmanship · India',       img: '/portfolio/campaign-firozabad.webp' },
              { title: 'Jewellery Case Study', cat: 'Revenue · ROAS · Growth',   img: '/portfolio/campaign-adore-jewellery.webp' },
              { title: 'Amul Legacy Series', cat: 'India Brand · Hoarding Story', img: '/portfolio/campaign-amul-legacy.webp' },
              { title: 'Brand System',       cat: 'Identity · Strategy · Growth', img: '/portfolio/campaign-brand-system.webp' },
            ].map(({ title, cat, img }, i) => (
              <div key={i} className="bs-c-card" style={{ textDecoration: 'none', display: 'block' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={title} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }} />
                <div className="bs-c-overlay" />
                <div className="bs-c-label">
                  <div className="cat">Brand Syndicate</div>
                  <div className="ttl">{title}</div>
                  <div style={{ fontSize: 10, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontFamily: 'DM Mono, monospace', marginTop: 4 }}>{cat}</div>
                  <div style={{ marginTop: 10, display: 'inline-block', padding: '5px 14px', border: '1px solid rgba(201,168,76,0.6)', borderRadius: 2, fontSize: 9, color: '#C9A84C', letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: 'DM Mono, monospace' }}>Campaign Visual</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bs-c-dots" id="bsCDots">
          {[0,1,2,3,4,5].map(i => (
            <button key={i} className={`bs-c-dot${i === 0 ? ' on' : ''}`} id={`dot-${i}`} aria-label={`Go to slide ${i + 1}`} />
          ))}
        </div>
      </div>

      {/* ═══════════ BRANDED GRAPHICS SLIDER ═══════════ */}
      <section className="bs-section bs-hide-desktop" id="graphics" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <div data-reveal>
          <div className="bs-eye">Our Creative Marketing Campaigns</div>
          <h2 className="bs-h2">Editorial visuals,<br /><em>instantly generated.</em></h2>
          <p className="bs-sub" style={{ marginTop: 14 }}>
            Premium social posts, campaign concepts, legacy storytelling and Indian-market brand visuals built around your identity.
          </p>
        </div>
        <div className="bs-pg-tabs" style={{ marginTop: 32 }}>
          {(['All', 'Social', 'Stories', 'Brand'] as const).map((cat, i) => (
            <button key={cat} type="button" aria-label={`Show ${cat} brand graphics`} className={`bs-pg-tab${i === 0 ? ' active' : ''}`} data-cat={cat}>{cat}</button>
          ))}
        </div>
        <div className="bs-pg-slider">
          <div className="bs-pg-track" id="bsPgTrack">
            {([
              { src: '/portfolio/campaign-legacy-cream.webp',    type: 'Legacy Editorial' },
              { src: '/portfolio/campaign-firozabad.webp',       type: 'Craft Campaign' },
              { src: '/portfolio/campaign-brand-system.webp',    type: 'Brand System' },
              { src: '/portfolio/campaign-adore-jewellery.webp', type: 'Client Diaries' },
              { src: '/portfolio/campaign-amul-legacy.webp',     type: 'India Legacy Series' },
            ] as Array<{ src: string; type: string }>).map((slide, i) => (
              <div key={i} className="bs-pg-slide">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.src}
                  alt={slide.type}
                  loading={i < 2 ? 'eager' : 'lazy'}
                  decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0' }}
                />
                <div className="bs-pg-slide-label">
                  <span className="bs-pg-slide-type">{slide.type}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="bs-pg-btn bs-pg-prev" id="bsPgPrev" aria-label="Previous graphic">‹</button>
          <button className="bs-pg-btn bs-pg-next" id="bsPgNext" aria-label="Next graphic">›</button>
        </div>
        <div className="bs-pg-dots">
          {[0,1,2,3,4].map(i => (
            <button key={i} className={`bs-pg-dot${i === 0 ? ' on' : ''}`} aria-label={`Go to graphic ${i + 1}`} />
          ))}
        </div>
      </section>

      {/* ═══════════ BRAND IDENTITY SHOWCASE ═══════════ */}
      <section className="bs-logos bs-section" id="logos">
        <div data-reveal>
          <div className="bs-eye">Brand Identity</div>
          <h2 className="bs-h2">One clean identity,<br />built for your <em>business workspace.</em></h2>
          <p className="bs-sub" style={{ marginTop: 14 }}>A focused Brand Syndicate identity system that supports the current app goal: websites, branded visuals, business content, strategy, and growth tools in one place.</p>
        </div>
        <div className="bs-single-logo-card" data-reveal data-reveal-delay="2">
          <div className="bs-lc-shimmer" />
          <svg width="100%" height="120" viewBox="0 0 420 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Brand Syndicate logo preview">
            <defs>
              <linearGradient id="bsSingleGold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#E9C97A" />
                <stop offset="58%" stopColor="#D4AF54" />
                <stop offset="100%" stopColor="#A8842F" />
              </linearGradient>
            </defs>
            <rect x="1" y="1" width="418" height="118" rx="24" fill="rgba(255,255,255,0.035)" stroke="rgba(212,175,84,0.24)" />
            <circle cx="62" cy="60" r="28" fill="url(#bsSingleGold)" />
            <text x="62" y="69" textAnchor="middle" fontFamily="serif" fontSize="23" fontWeight="700" fill="#0A0A0E">BS</text>
            <text x="112" y="54" fontFamily="serif" fontSize="29" fill="var(--cream)" letterSpacing="1.5">Brand Syndicate</text>
            <text x="113" y="77" fontFamily="monospace" fontSize="10" fill="rgba(201,168,76,0.86)" letterSpacing="3">BUSINESS AI WORKSPACE</text>
            <rect x="112" y="86" width="118" height="1.5" fill="url(#bsSingleGold)" opacity="0.85" />
          </svg>
          <div className="bs-single-logo-copy">
            <span>Websites</span>
            <span>Brand Assets</span>
            <span>Content</span>
            <span>Strategy</span>
          </div>
        </div>
      </section>

      {/* ═══════════ ALL 42 WEBSITE TEMPLATES ═══════════ */}
      <TemplatesSection isLoggedIn={isLoggedIn} />


      {/* ═══════════ PROCESS ═══════════ */}
      <section className="bs-process bs-section">
        <div data-reveal>
          <div className="bs-eye">How It Works</div>
          <h2 className="bs-h2">From idea to<br /><em>full brand kit.</em></h2>
        </div>
        <div className="bs-proc-steps">
          {[
            { num: '01', title: 'Describe your business',    body: 'Tell us about your business, audience, and goals. The more context you give, the sharper the output.' },
            { num: '02', title: 'AI drafts your brand',      body: 'Our AI generates an instant preview: website copy, logo directions, social graphics, and a content strategy tailored to you.' },
            { num: '03', title: 'Our team refines it',       body: 'Human creatives review every output, polish the details, and ensure it meets premium brand standards before delivery.' },
            { num: '04', title: 'You launch, built to impress', body: 'Your complete brand kit is generated instantly, then refined further into a production-ready launch system built to grow your business.' },
          ].map((s, i) => (
            <div key={s.num} className="bs-proc-step" data-reveal data-reveal-delay={String(i + 1)}>
              <div className="bs-proc-num">{s.num}</div>
              <div className="bs-proc-title">{s.title}</div>
              <div className="bs-proc-body">{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section className="bs-testi bs-section" id="testimonials">
        <div data-reveal>
          <div className="bs-eye">Client Results</div>
          <h2 className="bs-h2">What our<br /><em>clients say.</em></h2>
        </div>
        <div className="bs-testi-grid" id="testiGrid">
          {[
            { stars: '★★★★★', q: 'The instant preview helped me decide fast. Logo direction, website structure, graphics and content plan all looked premium for the price.', author: 'Riya Sharma, Fitness Coach, Delhi' },
            { stars: '★★★★★', q: 'The free preview sold it for me. I could see exactly what my brand would look like before paying.', author: 'Karan Mehta, Co-Founder, NexGen SaaS' },
            { stars: '★★★★★', q: 'We needed a rebrand for our restaurant launch. They nailed the luxury aesthetic and social look.', author: 'Aisha Patel, Owner, Mumbai' },
            { stars: '★★★★★', q: 'As a solo creator, I could never afford a proper agency. This gave me agency-level branding at startup prices.', author: 'Arjun Tiwari, Creator, Lucknow' },
            { stars: '★★★★☆', q: 'The first website preview was strong. We asked for small copy changes and the final version felt much clearer.', author: 'Nikhil Rao, Manufacturer, Pune' },
            { stars: '★★★★☆', q: 'Graphics quality was excellent. The first output already looked premium, and the refinement made it sharper for our boutique.', author: 'Megha Jain, Boutique Owner, Jaipur' },
            { stars: '★★★★★', q: 'Our service pages finally looked professional. The lead form structure helped us explain the offer quickly.', author: 'Sameer Khan, Consultant, Hyderabad' },
            { stars: '★★★☆☆', q: 'Good value and fast preview. I wanted more revisions in the starter package, but the base design was solid.', author: 'Prateek S., Local Business Owner' },
            { stars: '★★★★☆', q: 'The website felt mobile-ready and campaign-friendly. We only had to refine our actual product photos later.', author: 'Ananya Bose, Food Brand, Kolkata' },
            { stars: '★★★★★', q: 'The combination of website, content direction and visual system made our launch look bigger than it was.', author: 'Dev Malhotra, SaaS Founder, Bengaluru' },
          ].map((t, i) => (
            <div key={i} className="bs-testi-card" data-reveal data-reveal-delay={String((i % 4) + 1)}>
              <div className="bs-testi-stars">{t.stars}</div>
              <div className="bs-testi-q">&quot;{t.q}&quot;</div>
              <div className="bs-testi-author">{t.author}</div>
            </div>
          ))}
        </div>
        <div className="bs-testi-dots" id="testiDots">
          {[0,1,2,3,4,5,6,7,8,9].map(i => (
            <div key={i} className={`bs-testi-dot${i === 0 ? ' active' : ''}`} data-idx={i} />
          ))}
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section className="bs-faq bs-section" id="faq">
        <div data-reveal>
          <div className="bs-eye">FAQ</div>
          <h2 className="bs-h2">Common<br /><em>questions.</em></h2>
        </div>
        <div className="bs-faq-list" id="bsFaqList">
          {[
            ['Is the sample really free?',                        'Yes, completely free, no credit card required. You get an instant brand preview including website copy, logo directions, colour palette, 4 branded graphics, and a business strategy brief. You only pay when you decide to go ahead with the full kit.'],
            ['How long does delivery take?',                      'Your brand preview is instant. Delivery depends on the selected plan: fast starter launches, business websites, full brand kits, app + website packages, or monthly growth retainers. Rush delivery is available on request.'],
            ['What is included for free?',                 'Free Starter gives 5 generations that can be used for logo, strategy, website or brand images. Paid plans unlock more generation volume and support.'],
            ['Is it all AI or do humans work on it?',             "Both, and that's what makes us different. AI generates a sharp initial direction at speed; our trained creative team then reviews, refines, and polishes every output to premium brand standards. You get AI intelligence with human craft."],
            ['Which paid plan should I choose?',              'Creator is ₹1,000 for 50 edits/generations, Business Pro is ₹5,000 for 100 generations plus domain support, and Growth Suite is ₹10,000 under fair-use unlimited terms.'],
            ['Can I request changes after delivery?',             "Absolutely. Revision depth depends on the selected plan, from starter edits to full brand-kit refinement and monthly growth support. We work until the scope is delivered properly."],
            ['What types of businesses do you work with?',        'We work with startups, coaches, restaurants, salons, gyms, e-commerce brands, real estate agents, creators, and businesses of all sizes across all industries. If you have a business, we\'ll build your brand.'],
            ['Do you work with clients outside India?',           "Yes. While we're based in India, we work with clients globally. All communication happens via WhatsApp and email. Prices are in INR but we accept international payments."],
            ['What makes Brand Syndicate different?',             'Most agencies charge ₹50,000+ for similar work, or sell cheap templates with zero strategy. We combine the speed of AI with real human creative execution, delivering instant AI previews with human refinement, Indian-market relevance, and startup-friendly execution.'],
            ['How do I get started?',                             'Use the prompt above to generate your free brand preview, just describe your business. Once you love what you see, connect with our team on WhatsApp and we\'ll take it from there.'],
          ].map(([q, a], i) => (
            <div key={i} className="bs-faq-item" data-reveal>
              <button type="button" className="bs-faq-q" aria-controls={`faq-a-${i}`} aria-expanded="false" onClick={(event) => {
                const el  = document.getElementById(`faq-a-${i}`)
                const tog = document.getElementById(`faq-t-${i}`)
                if (el && tog) {
                  const open = el.classList.toggle('open')
                  event.currentTarget.setAttribute('aria-expanded', open ? 'true' : 'false')
                  tog.textContent = open ? '−' : '+'
                  tog.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)'
                }
              }}>
                <span>{q}</span>
                <span className="bs-faq-tog" id={`faq-t-${i}`}>+</span>
              </button>
              <div className="bs-faq-a" id={`faq-a-${i}`}>{a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="bs-fcta">
        <div className="bs-fcta-aurora" />
        <div data-reveal>
          <h2>Your brand.<br /><em>Crafted by AI.</em><br />Perfected by humans.</h2>
          <p>Describe your business, then create websites, visuals, content, and strategy from one connected workspace.</p>
        </div>
        <div className="bs-fcta-btns" data-reveal data-reveal-delay="2">
          <Link href="/login?tab=signup" className="btn-cinema" style={{ padding: '16px 36px', fontSize: 12 }}>Generate Free Sample →</Link>
          <a href="https://wa.me/917897671348?text=Hi%20Brand%20Syndicate%2C%20I%20want%20to%20discuss%20my%20brand." className="bs-btn-wa" target="_blank" rel="noopener noreferrer" style={{ padding: '16px 32px', fontSize: 12, letterSpacing: '0.16em' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" /></svg>
            WhatsApp Us
          </a>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="bs-footer">
        <div className="bs-footer-grid">
          <div className="bs-footer-brand-block">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--crimson)', boxShadow: '0 0 10px var(--crimson-glow)', flexShrink: 0 }} />
              <div className="bs-footer-brand">Brand <span>·</span> Syndicate</div>
            </div>
            <div className="bs-footer-tag">
              Brand Syndicate brings websites, brand assets, business content, and strategy into one smooth AI workspace for founders, creators, and growing businesses.
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 12, color: 'var(--muted)' }}>
              <span style={{ width: 6, height: 6, borderRadius: 50, background: 'var(--green)', boxShadow: '0 0 8px var(--green)' }} />
              All systems operational
            </div>
          </div>
          <div>
            <div className="bs-footer-col-title">Product</div>
            <div className="bs-footer-col-links">
              <a href="#output">Preview</a>
                  <a href="#demos">Demos</a>
              <Link href="/pricing">Pricing</Link>
              <a href="#faq">FAQ</a>
            </div>
          </div>
          <div>
            <div className="bs-footer-col-title">Company</div>
            <div className="bs-footer-col-links">
              <Link href="/about">About</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
            </div>
          </div>
          <div>
            <div className="bs-footer-col-title">Account</div>
            <div className="bs-footer-col-links">
              <Link href="/login">Sign In</Link>
              <Link href="/login?tab=signup&callbackUrl=%2Fgenerate">Generate Now</Link>
              <a href="mailto:brandsyndicateindia@gmail.com">brandsyndicateindia@gmail.com</a>
              <a href="tel:+917897671348">+91 78976 71348</a>
            </div>
          </div>
        </div>
        <div className="bs-footer-bottom">
          <div>© {new Date().getFullYear()} BRAND SYNDICATE · MADE IN INDIA</div>
          <div className="bs-footer-social">
            <a href="https://www.instagram.com/brandsyndicateindia" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700 }}>IG</span></a>
            <a href="https://www.facebook.com/share/1BeC1oRjnQ/" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 700 }}>f</span></a>
            <a href="https://wa.me/917897671348" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" /></svg>
            </a>
          </div>
        </div>
      </footer>
    </>
  )
}
