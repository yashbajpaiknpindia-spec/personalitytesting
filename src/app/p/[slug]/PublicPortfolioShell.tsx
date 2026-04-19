'use client'

// src/app/p/[slug]/PublicPortfolioShell.tsx — ENHANCED with real background images

import { useState, useEffect } from 'react'
import type { BrandOutput } from '@/lib/ai/generate'

interface PublicProject {
  id: string; title: string; description: string | null; url: string | null
  imageUrl: string | null; tags: string[]; featured: boolean
}

interface PublicBlogPost {
  title: string; slug: string; excerpt: string | null
  publishedAt: string | Date | null; readingMinutes: number | null; tags: string[]
}

interface PublicUser {
  id: string; name: string | null; username: string | null; jobTitle: string | null
  company: string | null; location: string | null; website: string | null
  linkedin: string | null; bio: string | null; accentColor: string | null; image: string | null
}

interface Props {
  user: PublicUser; out: BrandOutput | null; slug: string; ownerId: string
  projects?: PublicProject[]; blogPosts?: PublicBlogPost[]; username?: string | null
}

async function fetchImage(query: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/image?query=${encodeURIComponent(query)}`)
    if (!res.ok) return null
    const data = await res.json() as { url: string | null }
    return data.url
  } catch { return null }
}

export default function PublicPortfolioShell({ user, out, slug, ownerId, projects = [], blogPosts = [], username }: Props) {
  const accent = user.accentColor || '#C9A84C'
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '', company: '' })
  const [leadLoading, setLeadLoading] = useState(false)
  const [leadDone, setLeadDone] = useState(false)
  const [leadError, setLeadError] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('about')

  // Image state
  const [heroImg, setHeroImg] = useState<string | null>(null)
  const [workImgs, setWorkImgs] = useState<(string | null)[]>([null, null, null])
  const [heroLoaded, setHeroLoaded] = useState(false)

  const hexToRgb = (hex: string) => {
    const c = hex.replace('#', '')
    if (c.length !== 6) return '201, 168, 76'
    return `${parseInt(c.slice(0,2),16)}, ${parseInt(c.slice(2,4),16)}, ${parseInt(c.slice(4,6),16)}`
  }
  const aRgb = hexToRgb(accent)

  // Fetch Pexels images on mount
  useEffect(() => {
    const load = async () => {
      const heroQuery = out?.heroImageQuery || `${out?.cardTitle || user.jobTitle || 'professional'} ${user.company || ''} workspace environment`
      const hImg = await fetchImage(heroQuery)
      if (hImg) setHeroImg(hImg)

      if (out?.workImageQueries && out.workImageQueries.length > 0) {
        const imgs = await Promise.all(out.workImageQueries.map(q => fetchImage(q)))
        setWorkImgs(imgs)
      } else if (out?.portfolioSections) {
        const fallbacks = out.portfolioSections.map(s => `${s.title} ${user.jobTitle || ''} professional`)
        const imgs = await Promise.all(fallbacks.map(q => fetchImage(q)))
        setWorkImgs(imgs)
      }
    }
    load()
  }, [out, user.jobTitle, user.company])

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60)
      const ids = ['about', 'work', 'projects', 'writing', 'contact']
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 120 && rect.bottom > 120) { setActiveSection(id); break }
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLeadLoading(true); setLeadError('')
    try {
      const res = await fetch('/api/card/capture-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...leadForm, ownerId, sourceSlug: slug }),
      })
      if (!res.ok) throw new Error('Failed')
      setLeadDone(true)
    } catch { setLeadError('Something went wrong. Please try again.') }
    finally { setLeadLoading(false) }
  }

  const initials = (user.name || 'U').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=DM+Mono:wght@400;500&display=swap');
    *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
    :root{--a:${accent};--ar:${aRgb};--bg:#09090A;--s:#111113;--s2:#18181B;--bd:rgba(255,255,255,0.06);--bd2:rgba(255,255,255,0.10);--cr:#F8F4EE;--mu:#A09890;--mu2:#706860}
    html{scroll-behavior:smooth}
    body{background:var(--bg);color:var(--cr);font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}
    body::after{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");pointer-events:none;z-index:9998;opacity:.4}
    ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#50483e;border-radius:2px}

    @keyframes fadeUp{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    @keyframes pulseRing{0%{box-shadow:0 0 0 0 rgba(${aRgb},.4)}70%{box-shadow:0 0 0 10px rgba(${aRgb},0)}100%{box-shadow:0 0 0 0 rgba(${aRgb},0)}}
    @keyframes imgFadeIn{from{opacity:0;transform:scale(1.03)}to{opacity:1;transform:scale(1)}}

    .fu{animation:fadeUp .75s cubic-bezier(.22,1,.36,1) both}
    .fu1{animation-delay:.1s}.fu2{animation-delay:.2s}.fu3{animation-delay:.32s}.fu4{animation-delay:.44s}.fu5{animation-delay:.56s}

    /* NAV */
    .pnav{display:flex;align-items:center;justify-content:space-between;padding:0 52px;height:64px;position:fixed;top:0;left:0;right:0;z-index:200;transition:background .35s,border-color .35s}
    .pnav.sc{background:rgba(9,9,10,.9);backdrop-filter:blur(28px) saturate(180%);border-bottom:1px solid var(--bd)}
    .nlogo{font-family:'Playfair Display',serif;font-size:13px;letter-spacing:.22em;color:var(--cr);text-transform:uppercase;display:flex;align-items:center;gap:8px}
    .ndot{color:var(--a)}
    .nlinks{display:flex;gap:28px;align-items:center}
    .nlink{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--mu);text-decoration:none;transition:color .2s;position:relative;padding-bottom:2px}
    .nlink::after{content:'';position:absolute;bottom:-2px;left:0;width:0;height:1px;background:var(--a);transition:width .28s}
    .nlink:hover,.nlink.act{color:var(--cr)}
    .nlink.act::after,.nlink:hover::after{width:100%}
    .ncta{background:var(--a);color:#000;border:none;padding:8px 20px;font-size:10px;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;font-weight:500;font-family:'DM Mono',monospace;transition:opacity .2s,transform .15s;border-radius:1px}
    .ncta:hover{opacity:.85;transform:translateY(-1px)}

    /* HERO */
    .hero{min-height:100vh;display:flex;flex-direction:column;justify-content:flex-end;position:relative;overflow:hidden;padding:0}
    .hero-img-wrap{position:absolute;inset:0;z-index:0}
    .hero-img{width:100%;height:100%;object-fit:cover;object-position:center;animation:imgFadeIn 1.2s ease both}
    .hero-img-placeholder{width:100%;height:100%;background:linear-gradient(135deg,#0d0d10 0%,#14120e 50%,#09090a 100%)}
    .hero-overlay{position:absolute;inset:0;background:linear-gradient(to top, rgba(9,9,10,1) 0%, rgba(9,9,10,.75) 40%, rgba(9,9,10,.35) 70%, rgba(9,9,10,.2) 100%),linear-gradient(to right, rgba(9,9,10,.6) 0%, transparent 60%)}
    .hero-overlay-accent{position:absolute;inset:0;background:radial-gradient(ellipse 60% 80% at 0% 100%, rgba(${aRgb},.07) 0%, transparent 60%)}
    .hero-content{position:relative;z-index:1;padding:80px 52px 72px;max-width:760px}
    .hbrow{display:flex;align-items:center;gap:10px;font-size:9px;letter-spacing:.25em;text-transform:uppercase;color:var(--a);margin-bottom:24px;font-family:'DM Mono',monospace}
    .hbl{width:28px;height:1px;background:var(--a)}
    .htitle{font-family:'Playfair Display',serif;font-size:clamp(40px,5.5vw,76px);color:#fff;line-height:1.04;margin-bottom:22px;font-weight:400;letter-spacing:-.015em;text-shadow:0 2px 40px rgba(0,0,0,.4)}
    .htitle em{font-style:italic;color:var(--a)}
    .hbio{font-size:15px;color:rgba(248,244,238,.75);line-height:1.85;max-width:500px;font-weight:300;margin-bottom:40px;text-shadow:0 1px 12px rgba(0,0,0,.5)}
    .hact{display:flex;gap:14px;flex-wrap:wrap;align-items:center}
    .hmeta{display:flex;gap:32px;margin-top:52px;padding-top:28px;border-top:1px solid rgba(255,255,255,.1)}
    .hmitem{display:flex;flex-direction:column;gap:4px}
    .hmlbl{font-size:9px;letter-spacing:.15em;color:rgba(255,255,255,.35);text-transform:uppercase;font-family:'DM Mono',monospace}
    .hmval{font-size:13px;color:rgba(255,255,255,.8)}

    /* Avatar float top-right on hero */
    .havatarwrap{position:absolute;top:50%;right:52px;transform:translateY(-50%);z-index:2;display:flex;flex-direction:column;align-items:center;gap:16px}
    .havaatar{width:180px;height:180px;border-radius:50%;overflow:hidden;border:2px solid rgba(${aRgb},.35);box-shadow:0 0 0 8px rgba(${aRgb},.06),0 24px 64px rgba(0,0,0,.5)}
    .havaatar img{width:100%;height:100%;object-fit:cover}
    .hinit{width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1e1a14,#0d0d0e);font-family:'Playfair Display',serif;font-size:52px;color:rgba(${aRgb},.45);letter-spacing:.05em}
    .hring1{position:absolute;top:50%;right:52px;transform:translate(91px,-50%);width:260px;height:260px;border-radius:50%;border:1px solid rgba(${aRgb},.1);pointer-events:none;z-index:1}
    .hring2{position:absolute;top:50%;right:52px;transform:translate(51px,-50%);width:360px;height:360px;border-radius:50%;border:1px solid rgba(${aRgb},.05);pointer-events:none;z-index:1}

    /* BUTTONS */
    .bprim{background:var(--a);color:#000;border:none;padding:13px 30px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;cursor:pointer;font-weight:500;font-family:'DM Sans',sans-serif;transition:transform .2s,box-shadow .2s,opacity .2s;border-radius:1px;text-decoration:none;display:inline-block}
    .bprim:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(${aRgb},.28)}
    .bghost{background:rgba(255,255,255,.05);color:rgba(248,244,238,.7);border:1px solid rgba(255,255,255,.14);padding:12px 24px;font-size:11px;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;transition:border-color .2s,background .2s,color .2s;border-radius:1px;text-decoration:none;display:inline-block;backdrop-filter:blur(8px)}
    .bghost:hover{border-color:rgba(${aRgb},.45);color:#fff;background:rgba(255,255,255,.08)}

    /* SKILLS TICKER */
    .sbar{overflow:hidden;border-top:1px solid var(--bd);border-bottom:1px solid var(--bd);padding:15px 0;position:relative;background:rgba(0,0,0,.2)}
    .sbar::before,.sbar::after{content:'';position:absolute;top:0;bottom:0;width:100px;z-index:2;pointer-events:none}
    .sbar::before{left:0;background:linear-gradient(to right,var(--bg),transparent)}
    .sbar::after{right:0;background:linear-gradient(to left,var(--bg),transparent)}
    .strack{display:flex;gap:0;width:max-content;animation:ticker 26s linear infinite}
    .strack:hover{animation-play-state:paused}
    .spill{display:flex;align-items:center;gap:12px;padding:0 28px;white-space:nowrap;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--mu);font-family:'DM Mono',monospace}
    .sdot{width:4px;height:4px;border-radius:50%;background:rgba(${aRgb},.5);flex-shrink:0}

    /* SECTIONS */
    .sec{padding:96px 52px;max-width:1140px;margin:0 auto}
    .slbl{display:flex;align-items:center;gap:12px;font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:var(--a);margin-bottom:52px;font-family:'DM Mono',monospace}
    .slline{width:28px;height:1px;background:var(--a)}

    /* WORK CARDS */
    .wgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:3px}
    .wcard{position:relative;overflow:hidden;min-height:280px;cursor:default;background:var(--s)}
    .wcard-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .6s cubic-bezier(.22,1,.36,1);filter:brightness(.45) saturate(.8)}
    .wcard:hover .wcard-img{transform:scale(1.05);filter:brightness(.35) saturate(.7)}
    .wcard-bg-fallback{position:absolute;inset:0;background:linear-gradient(135deg,var(--s) 0%,var(--s2) 100%)}
    .wcard-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(9,9,10,.95) 0%,rgba(9,9,10,.5) 55%,rgba(9,9,10,.1) 100%)}
    .wcard-accent-line{position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--a),transparent);opacity:0;transition:opacity .3s}
    .wcard:hover .wcard-accent-line{opacity:1}
    .wcard-body{position:relative;z-index:1;padding:32px 28px;display:flex;flex-direction:column;justify-content:flex-end;height:100%;min-height:280px}
    .wcard-top{flex:1}
    .wcnum{font-family:'Playfair Display',serif;font-size:52px;color:rgba(255,255,255,.06);line-height:1;font-weight:700;margin-bottom:auto}
    .whl{font-size:9px;color:var(--a);font-family:'DM Mono',monospace;letter-spacing:.12em;text-transform:uppercase;margin-bottom:10px;padding:3px 10px;border:1px solid rgba(${aRgb},.25);display:inline-block;border-radius:1px;background:rgba(${aRgb},.06)}
    .wtitle{font-family:'Playfair Display',serif;font-size:22px;color:#fff;margin-bottom:12px;font-weight:400;line-height:1.22;text-shadow:0 2px 12px rgba(0,0,0,.4)}
    .wbody{font-size:13px;color:rgba(248,244,238,.65);line-height:1.8;font-weight:300}
    .wgrid.hf .wcard:first-child{grid-column:1/-1}
    .wgrid.hf .wcard:first-child .wcard-body{justify-content:flex-end;padding:48px}
    .wgrid.hf .wcard:first-child .wtitle{font-size:clamp(22px,3vw,32px)}

    /* STATS BAND */
    .stband{background:var(--s);border-top:1px solid var(--bd);border-bottom:1px solid var(--bd);padding:60px 52px;position:relative;overflow:hidden}
    .stband::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 100% at 50% 50%,rgba(${aRgb},.04) 0%,transparent 70%);pointer-events:none}
    .stinner{max-width:900px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:40px;text-align:center;position:relative;z-index:1}
    .stval{font-family:'Playfair Display',serif;font-size:48px;color:var(--cr);font-weight:400;line-height:1;margin-bottom:10px}
    .stval span{color:var(--a)}
    .stlbl{font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:var(--mu);font-family:'DM Mono',monospace}

    /* PROJECTS */
    .pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px}
    .pcard{background:var(--s);border:1px solid var(--bd);border-radius:4px;overflow:hidden;transition:border-color .3s,transform .3s}
    .pcard:hover{border-color:rgba(${aRgb},.3);transform:translateY(-4px)}
    .pcard.feat{border-top:2px solid var(--a)}
    .piwrap{position:relative;height:180px;overflow:hidden;background:var(--s2)}
    .piwrap img{width:100%;height:100%;object-fit:cover;transition:transform .5s}
    .pcard:hover .piwrap img{transform:scale(1.05)}
    .piphold{width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--s) 0%,var(--s2) 100%)}
    .piphold span{font-family:'Playfair Display',serif;font-size:32px;color:rgba(${aRgb},.15)}
    .pbody{padding:20px 22px}
    .ptags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
    .ptag{font-size:9px;letter-spacing:.1em;color:var(--a);background:rgba(${aRgb},.1);padding:2px 8px;border-radius:2px;text-transform:uppercase;font-family:'DM Mono',monospace}
    .ptitle{font-family:'Playfair Display',serif;font-size:17px;color:var(--cr);margin-bottom:8px;font-weight:400}
    .pdesc{font-size:12px;color:var(--mu);line-height:1.7;margin-bottom:14px}
    .plink{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--a);text-decoration:none;font-family:'DM Mono',monospace;display:inline-flex;align-items:center;gap:6px;transition:gap .2s}
    .plink:hover{gap:10px}

    /* BLOG */
    .blist{display:flex;flex-direction:column}
    .bitem{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;padding:28px 0;border-bottom:1px solid var(--bd);text-decoration:none;transition:padding-left .28s}
    .bitem:hover{padding-left:12px}
    .bitem:first-child{border-top:1px solid var(--bd)}
    .btags{display:flex;gap:6px;margin-bottom:8px}
    .btag{font-size:9px;letter-spacing:.1em;color:var(--a);background:rgba(${aRgb},.1);padding:2px 7px;border-radius:2px;text-transform:uppercase;font-family:'DM Mono',monospace}
    .btitle{font-family:'Playfair Display',serif;font-size:18px;color:var(--cr);font-weight:400;margin-bottom:6px;transition:color .2s}
    .bitem:hover .btitle{color:var(--a)}
    .bex{font-size:13px;color:var(--mu);line-height:1.65}
    .bmeta{font-size:10px;color:var(--mu2);letter-spacing:.1em;font-family:'DM Mono',monospace;white-space:nowrap;flex-shrink:0;padding-top:4px}

    /* CONTACT */
    .csec{padding:120px 52px;text-align:center;position:relative;overflow:hidden}
    .cbg{position:absolute;inset:0;background:radial-gradient(ellipse 70% 70% at 50% 50%,rgba(${aRgb},.05) 0%,transparent 70%);pointer-events:none}
    .ctitle{font-family:'Playfair Display',serif;font-size:clamp(28px,4vw,52px);color:var(--cr);font-weight:400;margin-bottom:16px}
    .csub{font-size:14px;color:var(--mu);margin-bottom:36px;font-weight:300}
    .clinks{display:flex;justify-content:center;gap:20px;margin-top:40px;flex-wrap:wrap;align-items:center}
    .clink{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--mu);text-decoration:none;font-family:'DM Mono',monospace;transition:color .2s}
    .clink:hover{color:var(--a)}
    .cdot{width:3px;height:3px;border-radius:50%;background:var(--bd2)}

    /* FOOTER */
    .pftr{padding:24px 52px;border-top:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between}
    .fbrand{font-size:10px;color:var(--mu2);letter-spacing:.1em}
    .fbrand span{color:var(--a)}
    .ftop{width:36px;height:36px;border:1px solid var(--bd2);background:transparent;color:var(--mu);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;transition:border-color .2s,color .2s;border-radius:1px}
    .ftop:hover{border-color:rgba(${aRgb},.4);color:var(--a)}

    /* MODAL */
    .movl{position:fixed;inset:0;background:rgba(0,0,0,.85);backdrop-filter:blur(12px) saturate(120%);z-index:1000;display:flex;align-items:center;justify-content:center;padding:24px;animation:fadeIn .2s ease both}
    .mbox{background:#0D0D0E;border:1px solid rgba(255,255,255,.1);border-top:2px solid var(--a);max-width:400px;width:100%;padding:36px;position:relative;animation:fadeUp .3s cubic-bezier(.22,1,.36,1) both}
    .mclose{position:absolute;top:14px;right:14px;background:transparent;border:1px solid var(--bd2);color:var(--mu);width:30px;height:30px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;transition:border-color .2s,color .2s;border-radius:1px}
    .mclose:hover{border-color:rgba(${aRgb},.4);color:var(--cr)}
    .mtitle{font-family:'Playfair Display',serif;font-size:22px;color:var(--cr);margin-bottom:6px;font-weight:400}
    .msub{font-size:12px;color:var(--mu);margin-bottom:28px}
    .mform{display:flex;flex-direction:column;gap:12px}
    .minput{width:100%;background:rgba(255,255,255,.03);border:1px solid var(--bd2);color:var(--cr);padding:11px 14px;font-size:13px;border-radius:1px;outline:none;font-family:'DM Sans',sans-serif;transition:border-color .2s}
    .minput:focus{border-color:rgba(${aRgb},.5)}
    .minput::placeholder{color:var(--mu2)}
    .msucc{text-align:center;padding:24px 0}
    .micon{width:56px;height:56px;border-radius:50%;border:1px solid rgba(${aRgb},.3);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:24px;animation:pulseRing 2s infinite;color:var(--a)}

    @media(max-width:768px){
      .pnav{padding:0 20px}
      .nlinks{display:none}
      .hero-content{padding:80px 20px 52px}
      .havatarwrap,.hring1,.hring2{display:none}
      .sec{padding:60px 20px}
      .stband{padding:40px 20px}
      .csec{padding:80px 20px}
      .pftr{padding:20px}
      .sbar,.hmeta{display:none}
      .wgrid.hf .wcard:first-child{grid-column:auto}
    }
  `

  return (
    <>
      <style>{CSS}</style>

      {/* NAV */}
      <nav className={`pnav${scrolled ? ' sc' : ''}`}>
        <div className="nlogo">{user.name} <span className="ndot">·</span></div>
        <div className="nlinks">
          {[['Work','work'],['About','about'],['Contact','contact']].map(([l,id]) => (
            <a key={id} href={`#${id}`} className={`nlink${activeSection===id?' act':''}`}>{l}</a>
          ))}
          {projects.length > 0 && <a href="#projects" className={`nlink${activeSection==='projects'?' act':''}`}>Projects</a>}
          {blogPosts.length > 0 && <a href="#writing" className={`nlink${activeSection==='writing'?' act':''}`}>Writing</a>}
          <button className="ncta" onClick={() => setShowLeadForm(true)}>Save Contact</button>
        </div>
      </nav>

      {/* HERO */}
      <section id="about">
        <div className="hero">
          <div className="hero-img-wrap">
            {heroImg
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={heroImg} alt="" className="hero-img" onLoad={() => setHeroLoaded(true)} />
              : <div className="hero-img-placeholder" />
            }
          </div>
          <div className="hero-overlay" />
          <div className="hero-overlay-accent" />
          <div className="hring1" />
          <div className="hring2" />
          <div className="havatarwrap">
            <div className="havaatar">
              {user.image
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={user.image} alt={user.name || ''} />
                : <div className="hinit">{initials}</div>
              }
            </div>
          </div>
          <div className="hero-content">
            <div className="hbrow fu fu1">
              <div className="hbl" />
              {out?.cardTitle || user.jobTitle || 'Professional'}
              {user.location && <span style={{color:'rgba(255,255,255,.35)'}}>— {user.location}</span>}
            </div>
            <h1 className="htitle fu fu2">
              {out?.headline
                ? out.headline.split('|').map((p: string, i: number) =>
                    i % 2 === 1 ? <em key={i}>{p.trim()}</em> : <span key={i}>{p}</span>)
                : user.name
              }
            </h1>
            <p className="hbio fu fu3">{out?.bio || user.bio || 'Welcome to my portfolio.'}</p>
            <div className="hact fu fu4">
              <button className="bprim" onClick={() => setShowLeadForm(true)}>{out?.cta || 'Get in Touch'}</button>
              {user.website && <a href={user.website} target="_blank" rel="noopener noreferrer" className="bghost">Website ↗</a>}
              {user.linkedin && <a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="bghost">LinkedIn ↗</a>}
            </div>
            <div className="hmeta fu fu5">
              {user.company && <div className="hmitem"><span className="hmlbl">Company</span><span className="hmval">{user.company}</span></div>}
              {user.location && <div className="hmitem"><span className="hmlbl">Location</span><span className="hmval">{user.location}</span></div>}
              {out?.skills && out.skills.length > 0 && <div className="hmitem"><span className="hmlbl">Expertise</span><span className="hmval">{out.skills.slice(0,2).join(' · ')}</span></div>}
            </div>
          </div>
        </div>
      </section>

      {/* SKILLS TICKER */}
      {out?.skills && out.skills.length > 0 && (
        <div className="sbar">
          <div className="strack">
            {[...out.skills,...out.skills,...out.skills,...out.skills].map((s: string, i: number) => (
              <div key={i} className="spill"><div className="sdot" />{s}</div>
            ))}
          </div>
        </div>
      )}

      {/* WORK SECTIONS */}
      {out?.portfolioSections && out.portfolioSections.length > 0 && (
        <section id="work" style={{borderTop:'1px solid var(--bd)'}}>
          <div className="sec">
            <div className="slbl"><div className="slline" />Selected Work</div>
            <div className={`wgrid${out.portfolioSections.length > 2 ? ' hf' : ''}`}>
              {out.portfolioSections.map((sec: {title:string;body:string;highlight:string}, i: number) => (
                <div key={i} className="wcard">
                  {workImgs[i]
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={workImgs[i]!} alt="" className="wcard-img" />
                    : <div className="wcard-bg-fallback" />
                  }
                  <div className="wcard-overlay" />
                  <div className="wcard-accent-line" />
                  <div className="wcard-body">
                    <div className="wcard-top">
                      <div className="wcnum">{String(i+1).padStart(2,'0')}</div>
                    </div>
                    {sec.highlight && <div className="whl">{sec.highlight}</div>}
                    <h3 className="wtitle">{sec.title}</h3>
                    <p className="wbody">{sec.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* STATS BAND */}
      {out?.portfolioSections && out.portfolioSections.some((s:{highlight:string}) => /\d+[%+x]/.test(s.highlight)) && (
        <div className="stband">
          <div className="stinner">
            {out.portfolioSections
              .filter((s:{highlight:string}) => /\d+[%+x]/.test(s.highlight))
              .slice(0,3)
              .map((sec:{title:string;highlight:string}, i: number) => {
                const m = sec.highlight.match(/(\d+[%+x]?\w*)/)
                const num = m ? m[1] : '—'
                const lbl = sec.highlight.replace(m?.[0]||'','').trim()
                return (
                  <div key={i}>
                    <div className="stval"><span>{num}</span></div>
                    <div className="stlbl">{lbl || sec.title}</div>
                  </div>
                )
              })
            }
          </div>
        </div>
      )}

      {/* PROJECTS */}
      {projects.length > 0 && (
        <section id="projects" style={{borderTop:'1px solid var(--bd)'}}>
          <div className="sec">
            <div className="slbl"><div className="slline" />Projects</div>
            <div className="pgrid">
              {projects.map((p: PublicProject) => (
                <div key={p.id} className={`pcard${p.featured?' feat':''}`}>
                  <div className="piwrap">
                    {p.imageUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={p.imageUrl} alt={p.title} />
                      : <div className="piphold"><span>{p.title.charAt(0)}</span></div>}
                  </div>
                  <div className="pbody">
                    {p.tags.length > 0 && <div className="ptags">{p.tags.slice(0,3).map((t:string) => <span key={t} className="ptag">{t}</span>)}</div>}
                    <div className="ptitle">{p.title}</div>
                    {p.description && <p className="pdesc">{p.description}</p>}
                    {p.url && <a href={p.url} target="_blank" rel="noopener noreferrer" className="plink">View Project ↗</a>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* BLOG */}
      {blogPosts.length > 0 && (
        <section id="writing" style={{borderTop:'1px solid var(--bd)'}}>
          <div className="sec">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:52}}>
              <div className="slbl" style={{margin:0}}><div className="slline" />Writing</div>
              {username && <a href={`/blog/${username}`} className="plink">All Posts ↗</a>}
            </div>
            <div className="blist">
              {blogPosts.slice(0,4).map((post: PublicBlogPost) => (
                <a key={post.slug} href={username?`/blog/${username}/${post.slug}`:'#'} className="bitem">
                  <div>
                    {post.tags.length > 0 && <div className="btags">{post.tags.slice(0,2).map((t:string) => <span key={t} className="btag">{t}</span>)}</div>}
                    <div className="btitle">{post.title}</div>
                    {post.excerpt && <p className="bex">{post.excerpt}</p>}
                  </div>
                  <div className="bmeta">{post.readingMinutes?`${post.readingMinutes} min`:''}</div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CONTACT */}
      <section id="contact" className="csec">
        <div className="cbg" />
        <div style={{position:'relative',zIndex:1}}>
          <div className="slbl" style={{justifyContent:'center',marginBottom:32}}>
            <div className="slline" />Get In Touch<div className="slline" />
          </div>
          <h2 className="ctitle">Let&apos;s Work Together</h2>
          <p className="csub">Save my contact or reach out directly — I&apos;d love to connect.</p>
          <button className="bprim" onClick={() => setShowLeadForm(true)}>{out?.cta || 'Save Contact'}</button>
          <div className="clinks">
            {user.website && <><a href={user.website} target="_blank" rel="noopener noreferrer" className="clink">Website ↗</a><div className="cdot" /></>}
            {user.linkedin && <><a href={user.linkedin} target="_blank" rel="noopener noreferrer" className="clink">LinkedIn ↗</a><div className="cdot" /></>}
            {user.location && <span className="clink" style={{cursor:'default'}}>📍 {user.location}</span>}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="pftr">
        <div className="fbrand">Powered by <span>Brand Syndicate</span></div>
        <button className="ftop" onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>↑</button>
      </footer>

      {/* LEAD MODAL */}
      {showLeadForm && (
        <div className="movl" onClick={() => setShowLeadForm(false)}>
          <div className="mbox" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            <button className="mclose" onClick={() => setShowLeadForm(false)}>×</button>
            {leadDone ? (
              <div className="msucc">
                <div className="micon">✓</div>
                <div className="mtitle">Contact Saved</div>
                <p className="msub" style={{marginBottom:0}}>{user.name} will be in touch.</p>
              </div>
            ) : (
              <>
                <div className="mtitle">Save Contact</div>
                <div className="msub">Share your details with {user.name}</div>
                <form onSubmit={handleLeadSubmit} className="mform">
                  <input className="minput" required placeholder="Your Name" value={leadForm.name} onChange={e => setLeadForm(f => ({...f,name:e.target.value}))} />
                  <input className="minput" required type="email" placeholder="Your Email" value={leadForm.email} onChange={e => setLeadForm(f => ({...f,email:e.target.value}))} />
                  <input className="minput" placeholder="Phone (optional)" value={leadForm.phone} onChange={e => setLeadForm(f => ({...f,phone:e.target.value}))} />
                  <input className="minput" placeholder="Company (optional)" value={leadForm.company} onChange={e => setLeadForm(f => ({...f,company:e.target.value}))} />
                  {leadError && <div style={{fontSize:12,color:'#E05252'}}>{leadError}</div>}
                  <button type="submit" disabled={leadLoading} className="bprim" style={{marginTop:4,opacity:leadLoading?.6:1,width:'100%',textAlign:'center'}}>
                    {leadLoading?'Saving…':'Save Contact'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
