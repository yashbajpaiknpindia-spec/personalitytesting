import TemplatesModeFilter from './TemplatesModeFilter'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth/config'
import Link from 'next/link'

const CAT_META: Record<string, { color: string; desc: string }> = {
  portfolio:    { color: '#C9A84C', desc: 'Showcase your work & projects' },
  resume:       { color: '#8B7EC8', desc: 'ATS-optimised professional CVs' },
  card:         { color: '#5BA8C9', desc: 'Digital business cards' },
  presentation: { color: '#C84B4B', desc: 'Pitch decks & slide presentations' },
}

function LockSVG({ size = 20, color = '#C9A84C' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', flexShrink: 0 }}>
      <rect x="2" y="10" width="16" height="11" rx="2" stroke={color} strokeWidth="1.4" fill={`${color}15`}/>
      <path d="M5.5 10V6.5a4.5 4.5 0 0 1 9 0V10" stroke={color} strokeWidth="1.4" strokeLinecap="round" fill="none"/>
      <circle cx="10" cy="16" r="1.5" fill={color}/>
      <rect x="9.3" y="16" width="1.4" height="2.5" rx="0.7" fill={color}/>
    </svg>
  )
}

function CatIcon({ cat, color }: { cat: string; color: string }) {
  if (cat === 'portfolio') return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1" y="4" width="16" height="12" rx="1.5" stroke={color} strokeWidth="1.2"/>
      <path d="M6 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" stroke={color} strokeWidth="1.2"/>
      <line x1="1" y1="8" x2="17" y2="8" stroke={color} strokeWidth="1"/>
      <rect x="6.5" y="6" width="5" height="3.5" rx="0.5" fill={color} opacity="0.4"/>
    </svg>
  )
  if (cat === 'resume') return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="3" y="1" width="12" height="16" rx="1.5" stroke={color} strokeWidth="1.2"/>
      <circle cx="9" cy="6" r="2" stroke={color} strokeWidth="1" fill={`${color}20`}/>
      <line x1="5" y1="11" x2="13" y2="11" stroke={color} strokeWidth="1" strokeLinecap="round"/>
      <line x1="5" y1="13.5" x2="10.5" y2="13.5" stroke={color} strokeWidth="1" strokeLinecap="round"/>
    </svg>
  )
  if (cat === 'card') return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1" y="4" width="16" height="10" rx="1.5" stroke={color} strokeWidth="1.2"/>
      <line x1="1" y1="7.5" x2="17" y2="7.5" stroke={color} strokeWidth="1.5" strokeOpacity="0.5"/>
      <line x1="4" y1="11" x2="8" y2="11" stroke={color} strokeWidth="1" strokeLinecap="round"/>
      <rect x="11" y="10" width="4" height="2.5" rx="0.5" fill={color} opacity="0.45"/>
    </svg>
  )
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1" y="1" width="16" height="11" rx="1.5" stroke={color} strokeWidth="1.2"/>
      <rect x="3" y="3" width="12" height="7" rx="0.5" fill={color} opacity="0.1"/>
      <line x1="5" y1="15" x2="13" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="9" y1="12" x2="9" y2="15" stroke={color} strokeWidth="1.2"/>
    </svg>
  )
}

function Thumb({ c, cat }: { c: string; cat: string }) {
  const u = c.replace('#','')
  if (cat === 'card') return (
    <svg viewBox="0 0 220 138" xmlns="http://www.w3.org/2000/svg" style={{ width:'100%', height:'100%' }}>
      <rect width="220" height="138" fill="#0a0a0c"/>
      <rect x="16" y="20" width="188" height="98" rx="6" fill={`${c}12`} stroke={c} strokeWidth="0.7" strokeOpacity="0.4"/>
      <rect x="16" y="20" width="188" height="3" rx="2" fill={c} opacity="0.9"/>
      <circle cx="46" cy="62" r="16" fill={`${c}11`} stroke={c} strokeWidth="0.8" strokeOpacity="0.4"/>
      <circle cx="46" cy="57" r="6" fill={c} opacity="0.45"/>
      <path d="M30 78 Q30 70 46 70 Q62 70 62 78" fill={c} opacity="0.2"/>
      <rect x="70" y="47" width="84" height="7" rx="2.5" fill="#F0EAE0" opacity="0.72"/>
      <rect x="70" y="59" width="58" height="4" rx="2" fill={c} opacity="0.62"/>
      <rect x="70" y="67" width="70" height="3" rx="1.5" fill="#F0EAE0" opacity="0.18"/>
      <line x1="28" y1="88" x2="192" y2="88" stroke={c} strokeWidth="0.4" opacity="0.28"/>
      <rect x="28" y="95" width="10" height="3" rx="1" fill={c} opacity="0.55"/>
      <rect x="44" y="95" width="62" height="3" rx="1" fill="#F0EAE0" opacity="0.28"/>
      <rect x="28" y="103" width="10" height="3" rx="1" fill={c} opacity="0.45"/>
      <rect x="44" y="103" width="48" height="3" rx="1" fill="#F0EAE0" opacity="0.2"/>
      <rect x="160" y="88" width="30" height="26" rx="3" fill={`${c}07`} stroke={c} strokeWidth="0.5" strokeOpacity="0.28"/>
      <rect x="163" y="91" width="8" height="8" rx="0.8" fill={c} opacity="0.32"/>
      <rect x="173" y="91" width="8" height="8" rx="0.8" fill={c} opacity="0.32"/>
      <rect x="163" y="101" width="8" height="8" rx="0.8" fill={c} opacity="0.32"/>
      <rect x="173" y="101" width="4" height="4" rx="0.5" fill={c} opacity="0.25"/>
    </svg>
  )
  if (cat === 'portfolio') return (
    <svg viewBox="0 0 220 138" xmlns="http://www.w3.org/2000/svg" style={{ width:'100%', height:'100%' }}>
      <defs><linearGradient id={`pg${u}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c} stopOpacity="0.16"/><stop offset="100%" stopColor={c} stopOpacity="0.02"/></linearGradient></defs>
      <rect width="220" height="138" fill="#0a0a0c"/>
      <rect x="0" y="0" width="3" height="138" fill={c} opacity="0.7"/>
      <rect x="0" y="0" width="220" height="46" fill={`url(#pg${u})`}/>
      <circle cx="16" cy="10" r="2.5" fill={c} opacity="0.6"/>
      <circle cx="25" cy="10" r="2.5" fill="#F0EAE0" opacity="0.18"/>
      <circle cx="34" cy="10" r="2.5" fill="#F0EAE0" opacity="0.18"/>
      <rect x="98" y="7.5" width="28" height="5" rx="2" fill="#F0EAE0" opacity="0.12"/>
      <rect x="194" y="6" width="20" height="8" rx="2" fill={c} opacity="0.5"/>
      <rect x="14" y="20" width="100" height="8" rx="3" fill="#F0EAE0" opacity="0.68"/>
      <rect x="14" y="33" width="68" height="5" rx="2" fill={c} opacity="0.62"/>
      <rect x="14" y="52" width="58" height="38" rx="3" fill="#141416" stroke={c} strokeWidth="0.6" strokeOpacity="0.32"/>
      <rect x="14" y="52" width="58" height="20" rx="3" fill={c} opacity="0.1"/>
      <rect x="17" y="77" width="38" height="3.5" rx="1.5" fill="#F0EAE0" opacity="0.5"/>
      <rect x="80" y="52" width="58" height="38" rx="3" fill="#141416" stroke={c} strokeWidth="0.6" strokeOpacity="0.22"/>
      <rect x="80" y="52" width="58" height="20" rx="3" fill={c} opacity="0.07"/>
      <rect x="148" y="52" width="58" height="38" rx="3" fill="#141416" stroke={c} strokeWidth="0.6" strokeOpacity="0.14"/>
      <rect x="14" y="96" width="26" height="7" rx="3.5" fill={c} opacity="0.2" stroke={c} strokeWidth="0.5" strokeOpacity="0.4"/>
      <rect x="44" y="96" width="26" height="7" rx="3.5" fill={c} opacity="0.1" stroke={c} strokeWidth="0.5" strokeOpacity="0.28"/>
      <rect x="74" y="96" width="26" height="7" rx="3.5" fill={c} opacity="0.08" stroke={c} strokeWidth="0.5" strokeOpacity="0.18"/>
      <line x1="0" y1="118" x2="220" y2="118" stroke={c} strokeWidth="0.35" opacity="0.18"/>
      <rect x="180" y="121" width="26" height="9" rx="2" fill={c} opacity="0.22"/>
    </svg>
  )
  if (cat === 'resume') return (
    <svg viewBox="0 0 220 138" xmlns="http://www.w3.org/2000/svg" style={{ width:'100%', height:'100%' }}>
      <defs><linearGradient id={`rg${u}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={c} stopOpacity="0.12"/><stop offset="100%" stopColor={c} stopOpacity="0.01"/></linearGradient></defs>
      <rect width="220" height="138" fill="#0a0a0c"/>
      <rect x="0" y="0" width="62" height="138" fill={`url(#rg${u})`}/>
      <line x1="62" y1="0" x2="62" y2="138" stroke={c} strokeWidth="0.4" opacity="0.28"/>
      <circle cx="31" cy="26" r="14" fill={`${c}10`} stroke={c} strokeWidth="0.8" strokeOpacity="0.45"/>
      <circle cx="31" cy="21" r="7" fill={c} opacity="0.28"/>
      <path d="M12 40 Q12 32 31 32 Q50 32 50 40" fill={c} opacity="0.15"/>
      <rect x="10" y="50" width="34" height="3.5" rx="1.5" fill={c} opacity="0.7"/>
      <rect x="10" y="57" width="26" height="2.5" rx="1" fill="#F0EAE0" opacity="0.2"/>
      <rect x="10" y="63" width="30" height="2.5" rx="1" fill="#F0EAE0" opacity="0.16"/>
      <line x1="10" y1="72" x2="52" y2="72" stroke={c} strokeWidth="0.5" opacity="0.28"/>
      <rect x="10" y="76" width="22" height="7" rx="3.5" fill={c} opacity="0.28"/>
      <rect x="35" y="76" width="18" height="7" rx="3.5" fill={c} opacity="0.16"/>
      <rect x="10" y="87" width="30" height="7" rx="3.5" fill={c} opacity="0.14"/>
      <rect x="76" y="12" width="118" height="8" rx="3" fill="#F0EAE0" opacity="0.78"/>
      <rect x="76" y="24" width="78" height="4" rx="2" fill={c} opacity="0.58"/>
      <line x1="76" y1="34" x2="206" y2="34" stroke={c} strokeWidth="0.45" opacity="0.28"/>
      <rect x="76" y="40" width="64" height="4" rx="2" fill="#F0EAE0" opacity="0.48"/>
      <rect x="76" y="48" width="40" height="3" rx="1" fill={c} opacity="0.42"/>
      <rect x="76" y="55" width="106" height="2.5" rx="1" fill="#F0EAE0" opacity="0.14"/>
      <rect x="76" y="60" width="96" height="2.5" rx="1" fill="#F0EAE0" opacity="0.11"/>
      <rect x="76" y="76" width="56" height="4" rx="2" fill="#F0EAE0" opacity="0.48"/>
      <rect x="76" y="84" width="38" height="3" rx="1" fill={c} opacity="0.38"/>
      <rect x="76" y="112" width="56" height="10" rx="3" fill={c} opacity="0.48"/>
      <rect x="140" y="112" width="40" height="10" rx="3" fill={`${c}14`} stroke={c} strokeWidth="0.5" strokeOpacity="0.38"/>
    </svg>
  )
  return (
    <svg viewBox="0 0 220 138" xmlns="http://www.w3.org/2000/svg" style={{ width:'100%', height:'100%' }}>
      <defs><linearGradient id={`prg${u}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor={c} stopOpacity="0.18"/><stop offset="100%" stopColor={c} stopOpacity="0"/></linearGradient></defs>
      <rect width="220" height="138" fill="#0a0a0c"/>
      <rect x="10" y="10" width="140" height="90" rx="4" fill="#111114" stroke={c} strokeWidth="0.7" strokeOpacity="0.4"/>
      <rect x="10" y="10" width="140" height="3" rx="2" fill={c} opacity="0.7"/>
      <rect x="10" y="10" width="140" height="48" fill={`url(#prg${u})`}/>
      <rect x="22" y="24" width="78" height="8" rx="3" fill="#F0EAE0" opacity="0.72"/>
      <rect x="22" y="36" width="50" height="4" rx="2" fill={c} opacity="0.58"/>
      <rect x="22" y="44" width="98" height="2.5" rx="1" fill="#F0EAE0" opacity="0.14"/>
      <line x1="22" y1="66" x2="138" y2="66" stroke={c} strokeWidth="0.45" opacity="0.22"/>
      <rect x="22" y="72" width="50" height="3" rx="1" fill="#F0EAE0" opacity="0.32"/>
      <rect x="22" y="79" width="28" height="8" rx="2" fill={c} opacity="0.2"/>
      <rect x="54" y="79" width="22" height="8" rx="2" fill={c} opacity="0.1"/>
      <rect x="158" y="10" width="52" height="90" rx="3" fill="#0e0e10"/>
      <line x1="158" y1="10" x2="158" y2="100" stroke={c} strokeWidth="0.45" opacity="0.22"/>
      {[0,1,2,3].map(i => (
        <g key={i}>
          <rect x="162" y={14+i*22} width="44" height="18" rx="2" fill="#141416" stroke={i===0?c:'#1e1e22'} strokeWidth={i===0?0.8:0.4}/>
          {i===0 && <rect x="162" y={14} width="44" height="2.5" rx="1" fill={c} opacity="0.7"/>}
          <rect x="165" y={18+i*22} width={i===0?28:20} height="2.5" rx="1" fill="#F0EAE0" opacity={i===0?0.42:0.18}/>
          <rect x="165" y={23+i*22} width={i===0?18:12} height="1.5" rx="0.5" fill={c} opacity={i===0?0.48:0.18}/>
        </g>
      ))}
      <line x1="10" y1="104" x2="56" y2="104" stroke={c} strokeWidth="1.4" opacity="0.65" strokeLinecap="round"/>
      <line x1="56" y1="104" x2="150" y2="104" stroke={c} strokeWidth="0.4" opacity="0.18"/>
      <rect x="10" y="110" width="200" height="20" rx="3" fill="#0e0e10"/>
      <rect x="14" y="114" width="32" height="8" rx="2" fill={`${c}18`}/>
      <rect x="178" y="114" width="28" height="8" rx="2" fill={c} opacity="0.48"/>
    </svg>
  )
}

export default async function TemplatesPage() {
  const session = await auth()
  const templates = await db.template.findMany({ orderBy: { sortOrder: 'asc' } })
  const isPro = session?.user.plan !== 'FREE'

  // Determine default mode from URL context
  const defaultMode = 'all'
  
  return (
    <div className="page-pad">
      <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:10, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--gold)', fontFamily:"'DM Mono',monospace", marginBottom:20 }}>
        <div style={{ width:22, height:1, background:'linear-gradient(90deg,var(--gold),transparent)' }}/> Template Gallery
      </div>
      <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(24px,5vw,36px)', fontWeight:400, color:'var(--cream)', marginBottom:6, lineHeight:1.15 }}>
        {templates.length} <em style={{ color:'var(--gold)', fontStyle:'italic' }}>Templates</em>
      </h1>
      <p style={{ fontSize:13, color:'var(--muted)', marginBottom:36, lineHeight:1.6 }}>Choose your aesthetic. Every template is precision-tuned for AI generation.</p>

      <TemplatesModeFilter
        templates={templates.map((t: { id:string; name:string; description:string|null; accentColor:string; tier:string; slug:string; category:string }) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          accentColor: t.accentColor,
          tier: t.tier,
          slug: t.slug,
          category: t.category,
        }))}
        isPro={isPro}
        defaultMode="all"
      />
    </div>
  )
}