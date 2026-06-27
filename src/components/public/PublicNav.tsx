'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function PublicNav({ active }: { active?: string }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const links = [
    { label: 'Home', href: '/' },
    { label: 'Website Templates', href: '/templates' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Blog', href: '/blog' },
    { label: 'About', href: '/about' },
    { label: 'Support', href: '/support' },
    { label: 'Contact', href: '/contact' },
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // close on route change / resize
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <style>{`
        .pn-wrap{position:fixed;top:0;left:0;right:0;z-index:200;background:rgba(247,243,236,.92);backdrop-filter:blur(20px);border-bottom:1px solid rgba(180,143,58,.16);transition:background .3s,border-color .3s,box-shadow .3s;}
        .pn-wrap.scrolled{background:rgba(247,243,236,.96);border-bottom:1px solid rgba(180,143,58,.22);box-shadow:0 12px 36px rgba(20,14,6,.08);}
        .pn-bar{display:flex;align-items:center;justify-content:space-between;height:62px;padding:0 32px;gap:20px;}
        .pn-brand{display:flex;align-items:center;gap:10px;text-decoration:none;flex-shrink:0;}
        .pn-mark{width:32px;height:32px;background:linear-gradient(135deg,#E9C97A,#D4AF54 60%,#A8842F);border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:'Instrument Serif',serif;color:#0A0A0E;font-size:13px;font-weight:700;}
        .pn-word{font-family:'Manrope','DM Sans',system-ui,sans-serif;font-size:17px;color:#1A1510;font-weight:850;letter-spacing:-.045em;text-transform:none;}
        .pn-word em{color:#1A1510;font-style:normal;}
        .pn-links{display:flex;align-items:center;gap:20px;min-width:0;}
        .pn-links a{font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:rgba(26,21,16,.62);text-decoration:none;font-family:'DM Mono',monospace;transition:color .2s;position:relative;padding-bottom:2px;}
        .pn-links a::after{content:'';position:absolute;bottom:0;left:0;width:100%;height:1px;background:var(--gold,#D4AF54);transform:scaleX(0);transform-origin:left;transition:transform .25s;}
        .pn-links a:hover,.pn-links a.active{color:#1A1510;}
        .pn-links a:hover::after,.pn-links a.active::after{transform:scaleX(1);}
        .pn-cta{flex-shrink:0;padding:10px 20px;background:linear-gradient(135deg,#E9C97A,#D4AF54 55%,#A8842F);border:1px solid rgba(160,120,48,.4);color:#0A0A0E;font-size:10px;letter-spacing:.18em;text-transform:uppercase;font-family:'DM Mono',monospace;text-decoration:none;border-radius:8px;transition:all .2s;white-space:nowrap;box-shadow:0 10px 24px rgba(160,120,48,.18);}
        .pn-cta:hover{transform:translateY(-1px);box-shadow:0 14px 28px rgba(160,120,48,.25);}
        .pn-burger{display:none;flex-direction:column;justify-content:center;gap:5px;width:36px;height:36px;background:none;border:none;cursor:pointer;padding:4px;flex-shrink:0;}
        .pn-burger span{display:block;height:1.5px;background:#1A1510;transition:transform .3s,opacity .3s;}
        .pn-burger.open span:nth-child(1){transform:translateY(6.5px) rotate(45deg);}
        .pn-burger.open span:nth-child(2){opacity:0;}
        .pn-burger.open span:nth-child(3){transform:translateY(-6.5px) rotate(-45deg);}
        .pn-drawer{position:fixed;inset:62px 0 0 0;background:rgba(247,243,236,.98);backdrop-filter:blur(24px);z-index:199;display:flex;flex-direction:column;padding:32px 28px;gap:6px;transform:translateX(100%);transition:transform .35s cubic-bezier(.4,0,.2,1);}
        .pn-drawer.open{transform:translateX(0);}
        .pn-drawer a{font-size:17px;letter-spacing:-.025em;color:rgba(26,21,16,.74);text-decoration:none;padding:14px 0;border-bottom:1px solid rgba(180,143,58,.14);font-family:'Manrope','DM Sans',system-ui,sans-serif;font-weight:800;transition:color .2s;}
        .pn-drawer a:hover,.pn-drawer a.active{color:var(--gold,#D4AF54);}
        .pn-drawer .pn-drawer-cta{margin-top:24px;padding:16px;background:linear-gradient(135deg,#E9C97A,#D4AF54 55%,#A8842F);color:#0A0A0E;text-align:center;font-size:11px;letter-spacing:.16em;text-transform:uppercase;font-weight:900;font-family:'DM Sans',sans-serif;border-radius:10px;border:none;}
        @media(max-width:1180px){
          .pn-links{gap:14px;}
          .pn-links a{font-size:9.5px;letter-spacing:.12em;}
          .pn-cta{padding:9px 14px;font-size:9px;}
        }
        @media(max-width:768px){
          .pn-links{display:none;}
          .pn-burger{display:flex;}
          .pn-bar{padding:0 20px;}
        }
      `}</style>

      <div className={`pn-wrap${scrolled ? ' scrolled' : ''}`}>
        <div className="pn-bar">
          <Link href="/" className="pn-brand" aria-label="Brand Syndicate home" onClick={() => setOpen(false)}>
            <span className="pn-word">Brand <em>Syndicate</em></span>
          </Link>

          <nav className="pn-links" aria-label="Main navigation">
            {links.map(l => (
              <Link key={l.href} href={l.href} className={active === l.href ? 'active' : undefined}>{l.label}</Link>
            ))}
          </nav>

          <Link href="/generate" className="pn-cta" style={{ display: 'block' }}>Generate Now</Link>

          <button
            className={`pn-burger${open ? ' open' : ''}`}
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={`pn-drawer${open ? ' open' : ''}`} aria-hidden={!open}>
        {links.map(l => (
          <Link key={l.href} href={l.href} className={active === l.href ? 'active' : undefined} onClick={() => setOpen(false)}>{l.label}</Link>
        ))}
        <Link href="/generate" className="pn-drawer-cta" onClick={() => setOpen(false)}>Generate Now →</Link>
      </div>

      {/* Spacer */}
      <div style={{ height: 62 }} aria-hidden />
    </>
  )
}
