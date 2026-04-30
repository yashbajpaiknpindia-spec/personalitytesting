'use client'
import { useState, useCallback, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import PublishButton from '@/components/PublishButton'

// ─── Website portfolio themes ─────────────────────────────────────────────
const WEBSITE_THEMES = [
  { slug: 'the-manifesto',   name: 'Manifesto',   color: '#C9A84C', bg: '#0A0A0B', desc: 'Dark luxury' },
  { slug: 'editorial-dark',  name: 'Editorial',   color: '#C9A84C', bg: '#0D0D0D', desc: 'Editorial noir' },
  { slug: 'signal',          name: 'Signal',      color: '#4CA8C9', bg: '#0A1520', desc: 'Teal corporate' },
  { slug: 'founders-page',   name: 'Founder',     color: '#C9A84C', bg: '#111',    desc: 'Founder narrative' },
  { slug: 'zero-noise',      name: 'Zero',        color: '#F0EAE0', bg: '#FAFAFA', desc: 'Minimal clean' },
  { slug: 'luminary',        name: 'Luminary',    color: '#E2C57A', bg: '#0C0C0A', desc: 'Gold premium' },
  { slug: 'the-architect',   name: 'Architect',   color: '#9CA3AF', bg: '#111827', desc: 'Brutalist grid' },
  { slug: 'studio-brief',    name: 'Studio',      color: '#C0392B', bg: '#0A0000', desc: 'Red accent' },
  { slug: 'the-operator',    name: 'Operator',    color: '#2E7D52', bg: '#0A1410', desc: 'Forest green' },
  { slug: 'case-study-pro',  name: 'Case Study',  color: '#7B68EE', bg: '#0E0B1E', desc: 'Purple tech' },
  { slug: 'minimal-canon',   name: 'Canon',       color: '#C9A84C', bg: '#F8F6F2', desc: 'Parchment warm' },
  { slug: 'deep-work',       name: 'Deep Work',   color: '#A09890', bg: '#0A0A0A', desc: 'Monochrome' },
]

// ─── Types ──────────────────────────────────────────────────────────────────
interface Project { id:string; title:string; description:string|null; url:string|null; imageUrl:string|null; tags:string[]; featured:boolean; order:number; publishedAt:string|Date|null }
interface BlogPostSummary { id:string; title:string; slug:string; published:boolean; publishedAt:string|Date|null; readingMinutes:number|null; viewCount:number; tags:string[]; excerpt:string|null; createdAt:string|Date }
interface PortfolioSection { title:string; body:string; highlight:string }
interface ProfileData { name:string; headline:string; tagline:string; bio:string; skills:string[]; cta:string; cardTitle:string; portfolioSections:PortfolioSection[] }
interface GeneratedSection { title:string; body:string; highlight:string }
interface GeneratedOutput { cardName?:string; cardTitle?:string; headline?:string; tagline?:string; bio?:string; skills?:string[]; cta?:string; portfolioSections?:GeneratedSection[]; heroImageQuery?:string; workImageQueries?:string[] }
interface GenSummary { id:string; createdAt:string; template:{ name:string; category:string }; inputData?:{ name?:string; jobTitle?:string } }
interface Props { initialProjects:Project[]; initialPosts:BlogPostSummary[]; username:string|null; accentColor:string }

// ─── Shared sub-components ───────────────────────────────────────────────────
function SL({ label }:{ label:string }) {
  return <div style={{ fontSize:9, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--gold)', fontFamily:"'DM Mono',monospace", marginBottom:6 }}>{label}</div>
}
function Fld({ label,value,onChange,placeholder,multiline,type='text' }:{ label:string;value:string;onChange:(v:string)=>void;placeholder?:string;multiline?:boolean;type?:string }) {
  const base:React.CSSProperties = { width:'100%', background:'var(--surface)', border:'1px solid var(--border)', color:'var(--cream)', fontFamily:"'DM Sans',sans-serif", fontSize:13, padding:'9px 12px', outline:'none', borderRadius:'var(--radius)', resize:'vertical' as const }
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:11, color:'var(--muted)', marginBottom:5 }}>{label}</div>
      {multiline ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3} style={base}/> : <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={base}/>}
    </div>
  )
}
function AB({ onClick,loading,children,variant='primary' }:{ onClick:()=>void;loading?:boolean;children:React.ReactNode;variant?:'primary'|'ghost'|'danger' }) {
  return (
    <button onClick={onClick} disabled={loading} style={{ padding:'8px 16px', fontSize:11, cursor:loading?'default':'pointer', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:500, borderRadius:'var(--radius)', background:variant==='primary'?'var(--gold)':'transparent', color:variant==='primary'?'#000':variant==='danger'?'#c0392b':'var(--muted)', border:variant==='primary'?'none':variant==='danger'?'1px solid #8b2020':'1px solid var(--border2)', opacity:loading?0.6:1 }}>
      {loading?'…':children}
    </button>
  )
}

// ─── Generation Picker (like slide deck picker) ──────────────────────────────
function GenPicker({ gens, activeId, onPick, accent }:{ gens:GenSummary[]; activeId:string|null; onPick:(id:string)=>void; accent:string }) {
  if(gens.length === 0) return (
    <div style={{ textAlign:'center', padding:'60px 24px' }}>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:'var(--muted)', marginBottom:12 }}>No portfolios yet</div>
      <p style={{ fontSize:13, color:'var(--muted2)', marginBottom:24, lineHeight:1.7 }}>Generate your brand first to create a portfolio.</p>
      <Link href="/generate" style={{ background:'var(--gold)', color:'#000', padding:'10px 24px', fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:500, textDecoration:'none', borderRadius:'var(--radius)' }}>Generate Now →</Link>
    </div>
  )
  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <div style={{ fontSize:10, letterSpacing:'0.16em', color:accent, fontFamily:"'DM Mono',monospace", textTransform:'uppercase', marginBottom:6 }}>Select Portfolio to Edit</div>
        <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.6 }}>Choose which generated portfolio you want to edit and preview. Each generation creates a unique portfolio website.</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
        {gens.map((g, idx) => {
          const active = g.id === activeId
          const name = g.inputData?.name || g.template?.name || 'Portfolio'
          const role = g.inputData?.jobTitle || g.template?.category || ''
          const date = new Date(g.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
          return (
            <button key={g.id} onClick={()=>onPick(g.id)} style={{ textAlign:'left', background:active?`${accent}10`:'var(--surface)', border:`2px solid ${active?accent:'var(--border)'}`, borderRadius:8, padding:'20px 20px 16px', cursor:'pointer', transition:'all 0.2s', position:'relative', overflow:'hidden' }}>
              {/* Top accent bar */}
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:active?accent:'var(--border2)', transition:'background 0.2s' }}/>
              {/* Number badge */}
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:active?accent:'var(--muted2)', letterSpacing:'0.14em', marginBottom:10 }}>
                PORTFOLIO {String(idx+1).padStart(2,'0')} {active && '· ACTIVE'}
              </div>
              {/* Name */}
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, color:'var(--cream)', marginBottom:4, lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
              {/* Role */}
              {role && <div style={{ fontSize:11, color:active?accent:'var(--muted)', fontFamily:"'DM Mono',monospace", letterSpacing:'0.06em', marginBottom:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{role}</div>}
              {/* Template + date */}
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'auto' }}>
                <span style={{ fontSize:9, background:active?`${accent}20`:'var(--surface2)', color:active?accent:'var(--muted2)', padding:'2px 8px', borderRadius:20, fontFamily:"'DM Mono',monospace", letterSpacing:'0.08em' }}>{g.template?.name||'Template'}</span>
                <span style={{ fontSize:9, color:'var(--muted2)', fontFamily:"'DM Mono',monospace" }}>{date}</span>
              </div>
              {active && (
                <div style={{ position:'absolute', top:12, right:12, width:8, height:8, borderRadius:'50%', background:accent, boxShadow:`0 0 6px ${accent}` }}/>
              )}
            </button>
          )
        })}
      </div>
      {gens.length > 0 && (
        <div style={{ marginTop:20, textAlign:'center' }}>
          <Link href="/generate" style={{ fontSize:11, color:'var(--muted)', textDecoration:'none', fontFamily:"'DM Mono',monospace", letterSpacing:'0.08em', borderBottom:'1px solid var(--border2)', paddingBottom:1 }}>+ Generate Another Portfolio</Link>
        </div>
      )}
    </div>
  )
}

// ─── Live Preview (iframe) ──────────────────────────────────────────────────
function LivePreview({ slug, accent }:{ slug:string|null; accent:string }) {
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => { setLoading(true); setRefreshKey(k=>k+1) }, [slug])

  if(!slug) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:16, padding:32 }}>
      <div style={{ width:48, height:48, border:`1px solid ${accent}40`, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🌐</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, color:'var(--muted)', textAlign:'center' }}>Publish to preview</div>
      <div style={{ fontSize:12, color:'var(--muted2)', textAlign:'center', lineHeight:1.6, maxWidth:200 }}>Click Publish to generate your live portfolio URL, then preview it here.</div>
    </div>
  )

  return (
    <div style={{ position:'relative', height:'100%', display:'flex', flexDirection:'column' }}>
      {/* Preview toolbar */}
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'var(--surface2)', borderBottom:'1px solid var(--border)', flexShrink:0 }}>
        <div style={{ display:'flex', gap:5, marginRight:4 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#c0392b', opacity:0.7 }}/>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#f39c12', opacity:0.7 }}/>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#27ae60', opacity:0.7 }}/>
        </div>
        <div style={{ flex:1, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:4, padding:'3px 10px', fontSize:10, color:'var(--muted)', fontFamily:"'DM Mono',monospace", overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          /p/{slug}
        </div>
        <button onClick={()=>{setLoading(true);setRefreshKey(k=>k+1)}} style={{ background:'transparent', border:'1px solid var(--border2)', color:'var(--muted)', padding:'3px 8px', fontSize:10, cursor:'pointer', borderRadius:3, fontFamily:"'DM Mono',monospace", flexShrink:0 }} title="Refresh preview">↺</button>
        <a href={`/p/${slug}`} target="_blank" rel="noopener noreferrer" style={{ background:'transparent', border:`1px solid ${accent}50`, color:accent, padding:'3px 8px', fontSize:10, cursor:'pointer', borderRadius:3, fontFamily:"'DM Mono',monospace", textDecoration:'none', flexShrink:0 }}>↗ Open</a>
      </div>
      {/* iframe */}
      <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
        {loading && (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--surface)', zIndex:2 }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ width:24, height:24, border:`2px solid var(--border2)`, borderTopColor:accent, borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 12px' }}/>
              <div style={{ fontSize:11, color:'var(--muted)', fontFamily:"'DM Mono',monospace" }}>Loading preview…</div>
            </div>
          </div>
        )}
        <iframe
          key={refreshKey}
          ref={iframeRef}
          src={`/p/${slug}`}
          style={{ width:'100%', height:'100%', border:'none', display:'block' }}
          onLoad={()=>setLoading(false)}
          title="Portfolio preview"
        />
      </div>
    </div>
  )
}

// ─── Projects Panel ─────────────────────────────────────────────────────────
function ProjectsPanel({ projects, setProjects, accent }:{ projects:Project[]; setProjects:React.Dispatch<React.SetStateAction<Project[]>>; accent:string }) {
  const [form, setForm] = useState({ title:'', description:'', url:'', imageUrl:'', tags:'', featured:false })
  const [loading, setLoading] = useState(false)
  const [editId, setEditId] = useState<string|null>(null)
  const [toast, setToast] = useState('')
  function showToast(m:string) { setToast(m); setTimeout(()=>setToast(''),3000) }
  function reset() { setForm({ title:'', description:'', url:'', imageUrl:'', tags:'', featured:false }); setEditId(null) }
  function startEdit(p:Project) { setEditId(p.id); setForm({ title:p.title, description:p.description??'', url:p.url??'', imageUrl:p.imageUrl??'', tags:p.tags.join(', '), featured:p.featured }) }
  async function save() {
    if(!form.title.trim()) return
    setLoading(true)
    try {
      const payload = { title:form.title, description:form.description||undefined, url:form.url||undefined, imageUrl:form.imageUrl||undefined, tags:form.tags?form.tags.split(',').map(t=>t.trim()).filter(Boolean):[], featured:form.featured }
      if(editId) {
        const res = await fetch(`/api/projects/${editId}`,{ method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) })
        if(res.ok) { const { project } = await res.json(); setProjects(p=>p.map(x=>x.id===editId?project:x)); showToast('Project updated'); reset() }
      } else {
        const res = await fetch('/api/projects',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) })
        if(res.ok) { const { project } = await res.json(); setProjects(p=>[...p,project]); showToast('Project added'); reset() }
      }
    } finally { setLoading(false) }
  }
  async function del(id:string) {
    if(!confirm('Delete this project?')) return
    const res = await fetch(`/api/projects/${id}`,{ method:'DELETE' })
    if(res.ok) { setProjects(p=>p.filter(x=>x.id!==id)); showToast('Deleted') }
  }
  return (
    <div>
      {toast && <div style={{ background:`${accent}20`, border:`1px solid ${accent}40`, color:accent, padding:'8px 14px', borderRadius:'var(--radius)', marginBottom:20, fontSize:12 }}>{toast}</div>}

      {/* Add / Edit Form */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:24, marginBottom:28 }}>
        <SL label={editId ? 'Edit Project' : 'Add Project'}/>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, color:'var(--cream)', marginBottom:20 }}>{editId ? 'Update Project' : 'New Project'}</div>
        <div className="form-grid-2">
          <Fld label="Title *" value={form.title} onChange={v=>setForm(f=>({...f,title:v}))} placeholder="My Project"/>
          <Fld label="Live URL" value={form.url} onChange={v=>setForm(f=>({...f,url:v}))} type="url" placeholder="https://…"/>
        </div>
        <Fld label="Description" value={form.description} onChange={v=>setForm(f=>({...f,description:v}))} multiline/>
        <Fld label="Image URL (used in portfolio preview)" value={form.imageUrl} onChange={v=>setForm(f=>({...f,imageUrl:v}))} type="url" placeholder="https://…"/>
        {form.imageUrl && form.imageUrl.startsWith('http') && (
          <div style={{ marginBottom:14, borderRadius:6, overflow:'hidden', height:100 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={form.imageUrl} alt="preview" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          </div>
        )}
        <Fld label="Tags (comma-separated)" value={form.tags} onChange={v=>setForm(f=>({...f,tags:v}))} placeholder="design, react"/>
        <label style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20, cursor:'pointer', fontSize:13, color:'var(--cream)' }}>
          <input type="checkbox" checked={form.featured} onChange={e=>setForm(f=>({...f,featured:e.target.checked}))}/>Feature this project (shown prominently)
        </label>
        <div style={{ display:'flex', gap:8 }}>
          <AB onClick={save} loading={loading}>{editId ? 'Update' : 'Add Project'}</AB>
          {editId && <AB onClick={reset} variant="ghost">Cancel</AB>}
        </div>
      </div>

      {/* Project list */}
      {projects.length===0 ? (
        <div style={{ textAlign:'center', padding:'40px 0', color:'var(--muted2)', fontSize:13 }}>No projects yet. Add one above — they'll appear in your portfolio.</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {projects.map(p=>(
            <div key={p.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderLeft:p.featured?`3px solid ${accent}`:'3px solid transparent', borderRadius:'var(--radius)', padding:'16px 18px', display:'flex', alignItems:'flex-start', gap:16 }}>
              {p.imageUrl && (
                <div style={{ width:56, height:56, borderRadius:4, overflow:'hidden', flexShrink:0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.imageUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/>
                </div>
              )}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, color:'var(--cream)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.title}</div>
                  {p.featured && <span style={{ fontSize:9, background:`${accent}20`, color:accent, padding:'1px 6px', borderRadius:2, letterSpacing:'0.1em', fontFamily:"'DM Mono',monospace", flexShrink:0 }}>FEATURED</span>}
                </div>
                {p.description && <div style={{ fontSize:12, color:'var(--muted)', marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.description}</div>}
                {p.tags.length>0 && <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>{p.tags.map(t=><span key={t} style={{ fontSize:9, color:'var(--muted2)', background:'var(--surface2)', padding:'1px 6px', borderRadius:2 }}>{t}</span>)}</div>}
              </div>
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                <AB onClick={()=>startEdit(p)} variant="ghost">Edit</AB>
                <AB onClick={()=>del(p.id)} variant="danger">✕</AB>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── SEO Panel ──────────────────────────────────────────────────────────────
function SeoPanel() {
  const [form, setForm] = useState({ seoTitle:'', seoDescription:'', ogImageUrl:'' })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [saved, setSaved] = useState(false)
  const [noPortfolio, setNoPortfolio] = useState(false)

  useEffect(()=>{
    fetch('/api/portfolio/seo').then(r=>r.ok?r.json():null).then(d=>{
      if(d?.seo) {
        setForm({ seoTitle:d.seo.seoTitle??'', seoDescription:d.seo.seoDescription??'', ogImageUrl:d.seo.ogImageUrl??'' })
      } else {
        setNoPortfolio(true)
      }
    }).catch(()=>setNoPortfolio(true)).finally(()=>setFetching(false))
  },[])

  async function save() {
    setLoading(true)
    try {
      const res = await fetch('/api/portfolio/seo',{ method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
      if(res.ok) { setSaved(true); setTimeout(()=>setSaved(false),2500) }
    } finally { setLoading(false) }
  }
  const fs:React.CSSProperties = { width:'100%', background:'var(--surface)', border:'1px solid var(--border)', color:'var(--cream)', fontFamily:"'DM Sans',sans-serif", fontSize:13, padding:'9px 12px', outline:'none', borderRadius:'var(--radius)' }
  const ls:React.CSSProperties = { fontSize:11, color:'var(--muted)', marginBottom:5 }

  if(fetching) return <div style={{ padding:40, textAlign:'center', color:'var(--muted)', fontSize:12 }}>Loading SEO settings…</div>

  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:24 }}>
      <SL label="SEO & Meta"/><div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:'var(--cream)', marginBottom:6 }}>Portfolio SEO</div>
      <p style={{ fontSize:12, color:'var(--muted)', marginBottom:24, lineHeight:1.7 }}>
        Each published portfolio has its own SEO metadata. These override your generation&apos;s defaults in search results and social previews.
        {noPortfolio && <><br/><span style={{ color:'#e07040' }}>⚠ Publish your portfolio first, then set SEO.</span></>}
      </p>
      <div style={{ marginBottom:14 }}><div style={ls}>Page Title</div><input value={form.seoTitle} onChange={e=>setForm(f=>({...f,seoTitle:e.target.value}))} style={fs} placeholder="My Portfolio | Your Name"/></div>
      <div style={{ marginBottom:14 }}><div style={ls}>Meta Description</div><textarea value={form.seoDescription} onChange={e=>setForm(f=>({...f,seoDescription:e.target.value}))} rows={3} style={{ ...fs, resize:'vertical' as const }} placeholder="A compelling description of your portfolio…"/></div>
      <div style={{ marginBottom:24 }}><div style={ls}>OG Image URL</div><input value={form.ogImageUrl} onChange={e=>setForm(f=>({...f,ogImageUrl:e.target.value}))} style={fs} placeholder="https://…"/></div>
      <button onClick={save} disabled={loading||noPortfolio} style={{ background:'var(--gold)', color:'#000', border:'none', padding:'10px 28px', fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:"'DM Mono',monospace", fontWeight:500, cursor:(loading||noPortfolio)?'default':'pointer', borderRadius:'var(--radius)', opacity:(loading||noPortfolio)?0.5:1 }}>
        {loading?'Saving…':saved?'✓ Saved':'Save SEO'}
      </button>
    </div>
  )
}

// ─── Blog Panel ─────────────────────────────────────────────────────────────
function BlogPanel({ posts, setPosts, username, accent }:{ posts:BlogPostSummary[]; setPosts:React.Dispatch<React.SetStateAction<BlogPostSummary[]>>; username:string|null; accent:string }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title:'', excerpt:'', coverImageUrl:'', tags:'', content:'', seoTitle:'', seoDescription:'', published:false })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')
  function showToast(m:string) { setToast(m); setTimeout(()=>setToast(''),3000) }
  async function create() {
    if(!form.title.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/blog',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ title:form.title, excerpt:form.excerpt||undefined, coverImageUrl:form.coverImageUrl||undefined, tags:form.tags?form.tags.split(',').map(t=>t.trim()).filter(Boolean):[], content:form.content, seoTitle:form.seoTitle||undefined, seoDescription:form.seoDescription||undefined, published:form.published }) })
      if(res.ok) { const { post } = await res.json(); setPosts(p=>[post,...p]); setShowForm(false); setForm({ title:'', excerpt:'', coverImageUrl:'', tags:'', content:'', seoTitle:'', seoDescription:'', published:false }); showToast('Post created') }
    } finally { setLoading(false) }
  }
  async function togglePublish(slug:string, cur:boolean) {
    const res = await fetch(`/api/blog/${slug}`,{ method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ published:!cur }) })
    if(res.ok) setPosts(p=>p.map(x=>x.slug===slug?{...x,published:!cur,publishedAt:!cur?new Date().toISOString():null}:x))
  }
  async function del(slug:string) {
    if(!confirm('Delete this post?')) return
    const res = await fetch(`/api/blog/${slug}`,{ method:'DELETE' })
    if(res.ok) { setPosts(p=>p.filter(x=>x.slug!==slug)); showToast('Post deleted') }
  }
  const fs:React.CSSProperties = { width:'100%', background:'var(--surface)', border:'1px solid var(--border)', color:'var(--cream)', fontFamily:"'DM Sans',sans-serif", fontSize:13, padding:'9px 12px', outline:'none', borderRadius:'var(--radius)' }
  return (
    <div>
      {toast && <div style={{ background:`${accent}20`, border:`1px solid ${accent}40`, color:accent, padding:'8px 14px', borderRadius:'var(--radius)', marginBottom:20, fontSize:12 }}>{toast}</div>}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>{username && <a href={`/blog/${username}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:11, color:accent, letterSpacing:'0.1em', fontFamily:"'DM Mono',monospace", textDecoration:'none', textTransform:'uppercase' }}>View Public Blog ↗</a>}</div>
        <AB onClick={()=>setShowForm(f=>!f)}>{showForm?'Cancel':'+ New Post'}</AB>
      </div>
      {showForm && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:24, marginBottom:28 }}>
          <SL label="New Post"/><div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:'var(--cream)', marginBottom:20 }}>Write a Post</div>
          <Fld label="Title *" value={form.title} onChange={v=>setForm(f=>({...f,title:v}))} placeholder="My thoughts on…"/>
          <Fld label="Excerpt" value={form.excerpt} onChange={v=>setForm(f=>({...f,excerpt:v}))} placeholder="One-line summary…"/>
          <Fld label="Cover Image URL" value={form.coverImageUrl} onChange={v=>setForm(f=>({...f,coverImageUrl:v}))} type="url" placeholder="https://…"/>
          <Fld label="Tags (comma-separated)" value={form.tags} onChange={v=>setForm(f=>({...f,tags:v}))} placeholder="design, branding"/>
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, color:'var(--muted)', marginBottom:5 }}>Content (HTML supported)</div>
            <textarea value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} rows={10} placeholder="<p>Start writing…</p>" style={{ ...fs, fontFamily:"'DM Mono',monospace", fontSize:12, resize:'vertical' }}/>
          </div>
          <div style={{ borderTop:'1px solid var(--border)', paddingTop:16, marginBottom:16 }}>
            <div style={{ fontSize:10, letterSpacing:'0.14em', color:'var(--muted2)', fontFamily:"'DM Mono',monospace", marginBottom:14, textTransform:'uppercase' }}>SEO (optional)</div>
            <Fld label="SEO Title" value={form.seoTitle} onChange={v=>setForm(f=>({...f,seoTitle:v}))} placeholder="Overrides post title in search results"/>
            <Fld label="SEO Description" value={form.seoDescription} onChange={v=>setForm(f=>({...f,seoDescription:v}))} multiline placeholder="Custom meta description…"/>
          </div>
          <label style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20, cursor:'pointer', fontSize:13, color:'var(--cream)' }}>
            <input type="checkbox" checked={form.published} onChange={e=>setForm(f=>({...f,published:e.target.checked}))}/>Publish immediately
          </label>
          <AB onClick={create} loading={loading}>Create Post</AB>
        </div>
      )}
      {posts.length===0 ? (
        <div style={{ textAlign:'center', padding:'40px 0', color:'var(--muted2)', fontSize:13 }}>No posts yet.</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {posts.map(post=>(
            <div key={post.id} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderLeft:post.published?`3px solid ${accent}`:'3px solid var(--border2)', borderRadius:'var(--radius)', padding:'16px 18px', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, color:'var(--cream)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{post.title}</div>
                  <span style={{ fontSize:9, padding:'1px 6px', borderRadius:2, letterSpacing:'0.1em', fontFamily:"'DM Mono',monospace", flexShrink:0, background:post.published?`${accent}20`:'var(--surface2)', color:post.published?accent:'var(--muted2)' }}>{post.published?'LIVE':'DRAFT'}</span>
                </div>
                <div style={{ fontSize:10, color:'var(--muted2)', letterSpacing:'0.08em', fontFamily:"'DM Mono',monospace" }}>
                  {post.readingMinutes?`${post.readingMinutes} min`:''}{post.viewCount?` · ${post.viewCount} views`:''}{post.publishedAt?` · ${new Date(post.publishedAt).toLocaleDateString()}`:''}</div>
              </div>
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                <AB onClick={()=>togglePublish(post.slug,post.published)} variant="ghost">{post.published?'Unpublish':'Publish'}</AB>
                {username&&post.published&&<a href={`/blog/${username}/${post.slug}`} target="_blank" rel="noopener noreferrer" style={{ padding:'8px 12px', fontSize:11, color:accent, border:`1px solid ${accent}50`, borderRadius:'var(--radius)', textDecoration:'none' }}>↗</a>}
                <AB onClick={()=>del(post.slug)} variant="danger">✕</AB>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Profile & Sections Panel ────────────────────────────────────────────────
function ProfileSectionsPanel({ accent }:{ accent:string }) {
  const [profile, setProfile] = useState<ProfileData>({ name:'', headline:'', tagline:'', bio:'', skills:[], cta:'', cardTitle:'', portfolioSections:[] })
  const [latestGenId, setLatestGenId] = useState<string|null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [skillInput, setSkillInput] = useState('')
  function showToast(m:string) { setToast(m); setTimeout(()=>setToast(''),3000) }
  useEffect(() => {
    fetch('/api/generate/latest').then(r=>r.ok?r.json():null).then(data=>{
      if(data?.outputData) {
        const o=data.outputData
        setProfile({ name:o.cardName??'', headline:o.headline??'', tagline:o.tagline??'', bio:o.bio??'', skills:o.skills??[], cta:o.cta??'', cardTitle:o.cardTitle??'', portfolioSections:o.portfolioSections??[] })
        if(data.id) setLatestGenId(data.id)
      }
    }).catch(()=>{}).finally(()=>setLoading(false))
  },[])
  async function save() {
    setSaving(true)
    try {
      const pr = await fetch('/api/user/profile',{ method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ name:profile.name||undefined, bio:profile.bio||undefined, jobTitle:profile.cardTitle||undefined }) })
      if(!pr.ok) { showToast('✕ Save failed'); return }
      const genUrl = latestGenId ? `/api/generate/update?id=${latestGenId}` : '/api/generate/latest'
      await fetch(genUrl,{ method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ headline:profile.headline, tagline:profile.tagline, cta:profile.cta, cardTitle:profile.cardTitle, cardName:profile.name, skills:profile.skills, portfolioSections:profile.portfolioSections }) })
      showToast('✓ Profile saved')
    } catch { showToast('✕ Save failed') } finally { setSaving(false) }
  }
  function addSkill() { const s=skillInput.trim(); if(!s) return; setProfile(p=>({...p,skills:[...p.skills,s]})); setSkillInput('') }
  function removeSkill(i:number) { setProfile(p=>({...p,skills:p.skills.filter((_,idx)=>idx!==i)})) }
  function updateSec(i:number,field:keyof PortfolioSection,val:string) { setProfile(p=>{ const s=[...p.portfolioSections]; s[i]={...s[i],[field]:val}; return {...p,portfolioSections:s} }) }
  function addSec() { setProfile(p=>({...p,portfolioSections:[...p.portfolioSections,{title:'New Project',body:'',highlight:''}]})) }
  function removeSec(i:number) { setProfile(p=>({...p,portfolioSections:p.portfolioSections.filter((_,idx)=>idx!==i)})) }
  const fs:React.CSSProperties = { width:'100%', background:'var(--surface)', border:'1px solid var(--border)', color:'var(--cream)', fontFamily:"'DM Sans',sans-serif", fontSize:13, padding:'9px 12px', outline:'none', borderRadius:'var(--radius)', resize:'vertical' as const }
  const lb:React.CSSProperties = { fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--muted)', fontFamily:"'DM Mono',monospace", marginBottom:6, display:'block' }
  const sec:React.CSSProperties = { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:24, marginBottom:20 }
  const sh:React.CSSProperties = { fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:accent, fontFamily:"'DM Mono',monospace", marginBottom:16 }
  if(loading) return <div style={{ padding:32, textAlign:'center', color:'var(--muted)', fontSize:12 }}>Loading profile…</div>
  return (
    <div>
      {toast && <div style={{ position:'fixed', bottom:24, right:24, background:'#1a1a1a', border:`1px solid ${accent}60`, borderRadius:6, padding:'10px 18px', fontSize:12, color:'#F0EAE0', zIndex:9999 }}>{toast}</div>}
      <div style={sec}>
        <div style={sh}>Identity</div>
        <div className="form-grid-2">
          <div><label style={lb}>Display Name</label><input value={profile.name} onChange={e=>setProfile(p=>({...p,name:e.target.value}))} style={fs} placeholder="Your Name"/></div>
          <div><label style={lb}>Card Title / Role</label><input value={profile.cardTitle} onChange={e=>setProfile(p=>({...p,cardTitle:e.target.value}))} style={fs} placeholder="e.g. Product Designer"/></div>
        </div>
        <div style={{ marginTop:14 }}><label style={lb}>Hero Headline</label><input value={profile.headline} onChange={e=>setProfile(p=>({...p,headline:e.target.value}))} style={fs} placeholder="Compelling one-liner"/></div>
        <div style={{ marginTop:14 }}><label style={lb}>Tagline</label><input value={profile.tagline} onChange={e=>setProfile(p=>({...p,tagline:e.target.value}))} style={fs} placeholder="Short tagline"/></div>
      </div>
      <div style={sec}>
        <div style={sh}>About</div>
        <label style={lb}>Bio</label><textarea value={profile.bio} onChange={e=>setProfile(p=>({...p,bio:e.target.value}))} rows={4} style={fs} placeholder="A paragraph about you"/>
        <div style={{ marginTop:14 }}><label style={lb}>CTA Button Label</label><input value={profile.cta} onChange={e=>setProfile(p=>({...p,cta:e.target.value}))} style={fs} placeholder="e.g. Get in Touch"/></div>
      </div>
      <div style={sec}>
        <div style={sh}>Skills</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
          {profile.skills.map((s,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', background:`${accent}18`, border:`1px solid ${accent}40`, borderRadius:20, fontSize:11, color:accent }}>
              {s}<button onClick={()=>removeSkill(i)} style={{ background:'none', border:'none', color:accent, cursor:'pointer', fontSize:12, lineHeight:1, padding:0 }}>×</button>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <input value={skillInput} onChange={e=>setSkillInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addSkill()} style={{ ...fs, flex:1 }} placeholder="Add a skill and press Enter"/>
          <button onClick={addSkill} style={{ background:accent, color:'#000', border:'none', padding:'9px 16px', fontSize:11, fontWeight:500, cursor:'pointer', borderRadius:'var(--radius)' }}>Add</button>
        </div>
      </div>
      <div style={sec}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div style={sh}>Work / Portfolio Sections</div>
          <button onClick={addSec} style={{ background:'transparent', border:`1px solid ${accent}50`, color:accent, padding:'5px 12px', fontSize:10, letterSpacing:'0.08em', cursor:'pointer', borderRadius:'var(--radius)' }}>+ Add Section</button>
        </div>
        {profile.portfolioSections.length===0 && <div style={{ fontSize:12, color:'var(--muted)', textAlign:'center', padding:'20px 0' }}>No sections yet.</div>}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {profile.portfolioSections.map((s,i)=>(
            <div key={i} style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderLeft:`3px solid ${accent}60`, borderRadius:'var(--radius)', padding:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <span style={{ fontSize:9, letterSpacing:'0.14em', color:accent, fontFamily:"'DM Mono',monospace" }}>SECTION {String(i+1).padStart(2,'0')}</span>
                <button onClick={()=>removeSec(i)} style={{ background:'none', border:'1px solid rgba(192,57,43,0.4)', color:'#E05252', fontSize:9, letterSpacing:'0.08em', padding:'2px 8px', cursor:'pointer', borderRadius:3 }}>Remove</button>
              </div>
              <div className="form-grid-2" style={{ marginBottom:10 }}>
                <div><label style={lb}>Title</label><input value={s.title} onChange={e=>updateSec(i,'title',e.target.value)} style={fs} placeholder="Project title"/></div>
                <div><label style={lb}>Highlight</label><input value={s.highlight} onChange={e=>updateSec(i,'highlight',e.target.value)} style={fs} placeholder="+40% conversion"/></div>
              </div>
              <label style={lb}>Body</label><textarea value={s.body} onChange={e=>updateSec(i,'body',e.target.value)} rows={2} style={fs} placeholder="Short description"/>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end' }}>
        <button onClick={save} disabled={saving} style={{ background:accent, color:'#000', border:'none', padding:'10px 28px', fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600, cursor:saving?'default':'pointer', borderRadius:'var(--radius)', opacity:saving?0.7:1 }}>{saving?'…Saving':'Save Changes'}</button>
      </div>
    </div>
  )
}

// ─── Export Button ───────────────────────────────────────────────────────────
function ExportBtn({ genId, format, accent, label, large }:{ genId:string|null; format:'pdf'|'pptx'; accent:string; label:string; large?:boolean }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string|null>(null)
  async function doExport() {
    if(!genId) { setErr('Generate content first'); setTimeout(()=>setErr(null),3000); return }
    setBusy(true); setErr(null)
    try {
      const endpoint = format==='pdf' ? '/api/export/pdf' : '/api/export/pptx'
      const res = await fetch(endpoint,{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ generationId:genId }) })
      if(!res.ok) { const d=await res.json().catch(()=>({})); throw new Error(d.error||`Export failed (${res.status})`) }
      const ct = res.headers.get('Content-Type')||''
      // Binary stream fallback (when Cloudinary is unavailable)
      if(ct.includes('application/pdf') || ct.includes('application/vnd') || ct.includes('octet-stream')) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `brand-export.${format}`
        document.body.appendChild(a); a.click(); document.body.removeChild(a)
        setTimeout(()=>URL.revokeObjectURL(url),2000)
      } else {
        // JSON response with Cloudinary signed URL
        const data = await res.json()
        if(data.error) throw new Error(data.error)
        if(data.url) {
          // Fetch the signed URL as a blob so the browser always triggers download
          try {
            const dlRes = await fetch(data.url)
            if(dlRes.ok) {
              const blob = await dlRes.blob()
              const blobUrl = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = blobUrl
              a.download = `brand-export.${format}`
              document.body.appendChild(a); a.click(); document.body.removeChild(a)
              setTimeout(()=>URL.revokeObjectURL(blobUrl),2000)
              return
            }
          } catch {}
          // Fallback: open the URL directly
          window.open(data.url, '_blank')
        } else {
          throw new Error('No download URL returned')
        }
      }
    } catch(e) { setErr(e instanceof Error?e.message:'Export failed'); setTimeout(()=>setErr(null),4000) }
    finally { setBusy(false) }
  }
  const pad = large ? '12px 20px' : '9px 14px'
  const fs = large ? 11 : 10
  return (
    <div style={{ position:'relative' }}>
      <button onClick={doExport} disabled={busy} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:pad, fontSize:fs, letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:"'DM Mono',monospace", color:busy?'var(--muted)':accent, cursor:busy?'not-allowed':'pointer', border:`1px solid ${accent}50`, background:`${accent}08`, borderRadius:'var(--radius)', width:'100%', opacity:busy?0.7:1, whiteSpace:'nowrap' }}>
        {busy?'Preparing…':label}
      </button>
      {err && <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'#1a0808', border:'1px solid #c0392b', color:'#e74c3c', padding:'4px 8px', fontSize:9, borderRadius:3, zIndex:10, textAlign:'center', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{err}</div>}
    </div>
  )
}

// ─── Portfolio Edit + Live Preview Panel (the main editor) ──────────────────
function PortfolioEditPanelInner({ accent, allGens, initialGenId }:{ accent:string; allGens:GenSummary[]; initialGenId:string|null }) {
  const searchParams = useSearchParams()
  const [genId, setGenId] = useState<string|null>(null)
  const [output, setOutput] = useState<GeneratedOutput|null>(null)
  const [loading, setLoading] = useState(true)
  const [sections, setSections] = useState<GeneratedSection[]>([])
  const [heroImage, setHeroImage] = useState<string|null>(null)
  const [customImages, setCustomImages] = useState<Record<number,string>>({})
  const [editingSection, setEditingSection] = useState<number|null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [publishedSlug, setPublishedSlug] = useState<string|null>(null)
  const [previewPanel, setPreviewPanel] = useState<'edit'|'preview'>('edit')
  const [selectedTheme, setSelectedTheme] = useState('the-manifesto')

  function showToast(m:string) { setToast(m); setTimeout(()=>setToast(''),3000) }

  // Load specific or latest gen
  const loadGen = useCallback(async(id?:string|null)=>{
    setLoading(true); setOutput(null); setSections([]); setHeroImage(null); setCustomImages({}); setEditingSection(null)
    const url = id ? `/api/generate/load?id=${id}` : '/api/generate/latest'
    try {
      const data = await fetch(url).then(r=>r.ok?r.json():null)
      const out = data?.outputData as GeneratedOutput|null
      if(out) { setOutput(out); setSections(out.portfolioSections??[]); setGenId(data?.id??null) }
    } catch {}
    finally { setLoading(false) }
  },[])

  useEffect(()=>{
    const fromUrl = searchParams.get('gen')
    // Priority: initialGenId (from picker) > URL param > latest
    loadGen(initialGenId ?? fromUrl ?? null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[initialGenId, loadGen])

  // Check if already published + load saved theme
  useEffect(()=>{
    if(!genId) return
    fetch('/api/portfolio/publish').then(r=>r.ok?r.json():null).then(d=>{
      if(d?.slug) setPublishedSlug(d.slug)
      if(d?.websiteTheme) setSelectedTheme(d.websiteTheme)
    }).catch(()=>{})
  },[genId])

  async function save() {
    setSaving(true)
    try {
      const url = genId
        ? `/api/generate/update?id=${genId}`
        : '/api/generate/latest'
      await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolioSections: sections,
          ...(heroImage ? { heroImageOverride: heroImage } : {}),
          ...(Object.keys(customImages).length ? { workImageOverrides: customImages } : {}),
        }),
      })
      // Also save the selected theme to the portfolio row (if one exists)
      await fetch('/api/portfolio/seo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteTheme: selectedTheme }),
      }).catch(() => {/* no portfolio row yet — will be saved on publish */})
      showToast('✓ Portfolio saved')
    } catch { showToast('✕ Save failed') } finally { setSaving(false) }
  }

  function updateSec(i:number, field:keyof GeneratedSection, val:string) {
    setSections(prev=>{ const n=[...prev]; n[i]={...n[i],[field]:val}; return n })
  }

  const fs:React.CSSProperties = { width:'100%', background:'var(--surface)', border:'1px solid var(--border)', color:'var(--cream)', fontFamily:"'DM Sans',sans-serif", fontSize:13, padding:'8px 12px', outline:'none', borderRadius:'var(--radius)', resize:'vertical' as const }
  const lb:React.CSSProperties = { fontSize:10, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--muted)', fontFamily:"'DM Mono',monospace", marginBottom:5, display:'block' }

  if(loading) return <div style={{ padding:40, textAlign:'center', color:'var(--muted)', fontSize:12 }}>Loading portfolio…</div>
  if(!output) return (
    <div style={{ textAlign:'center', padding:'80px 40px' }}>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:'var(--muted)', marginBottom:12 }}>No generation found</div>
      <p style={{ fontSize:13, color:'var(--muted2)', marginBottom:24 }}>Generate your brand first.</p>
      <Link href="/generate" style={{ background:'var(--gold)', color:'#000', padding:'10px 24px', fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:500, textDecoration:'none', borderRadius:'var(--radius)' }}>Generate Now</Link>
    </div>
  )

  return (
    <div>
      {toast && <div style={{ position:'fixed', bottom:24, right:24, background:'#1a1a1a', border:`1px solid ${accent}60`, borderRadius:6, padding:'10px 18px', fontSize:12, color:'#F0EAE0', zIndex:9999 }}>{toast}</div>}

      {/* Generation selector — always visible, shows all portfolios */}
      {allGens.length > 0 && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'14px 16px', marginBottom:20 }}>
          <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--muted)', fontFamily:"'DM Mono',monospace", marginBottom:10 }}>Editing Portfolio</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {allGens.map((g, idx) => {
              const active = g.id === genId
              const name = g.inputData?.name || g.template?.name || `Portfolio ${idx+1}`
              const date = new Date(g.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short'})
              return (
                <button key={g.id} onClick={()=>loadGen(g.id)} style={{ padding:'6px 14px', fontSize:11, cursor:'pointer', fontFamily:"'DM Mono',monospace", letterSpacing:'0.06em', borderRadius:20, border:`1px solid ${active?accent:'var(--border2)'}`, background:active?`${accent}18`:'transparent', color:active?accent:'var(--muted)', transition:'all 0.15s', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:6 }}>
                  {active && <span style={{ width:5, height:5, borderRadius:'50%', background:accent, display:'inline-block' }}/>}
                  {name} · {date}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Top action bar: publish + mobile panel switch */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* Mobile tab switch */}
          <div className="pv-tab-switcher" style={{ display:'flex', gap:0, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', overflow:'hidden' }}>
            {(['edit','preview'] as const).map(p=>(
              <button key={p} onClick={()=>setPreviewPanel(p)} style={{ padding:'7px 16px', fontSize:10, cursor:'pointer', fontFamily:"'DM Mono',monospace", letterSpacing:'0.08em', textTransform:'uppercase', background:previewPanel===p?accent:'transparent', color:previewPanel===p?'#000':'var(--muted)', border:'none', transition:'all 0.15s' }}>{p==='edit'?'✏ Edit':'🌐 Preview'}</button>
            ))}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <ExportBtn genId={genId} format="pdf" accent={accent} label="↓ PDF" large/>
          <PublishButton
            generationId={genId}
            accent={accent}
            websiteTheme={selectedTheme}
            onPublished={(slug) => setPublishedSlug(slug)}
          />
        </div>
      </div>

      {/* Two-column layout: edit form LEFT, live preview RIGHT */}
      <div className="portfolio-edit-grid" style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) minmax(0,480px)', gap:24, alignItems:'start' }}>

        {/* LEFT: Edit form */}
        <div style={{ display: previewPanel==='preview' ? 'none' : 'block', minWidth:0 }} className="portfolio-edit-left">

          {/* Hero Identity */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:24, marginBottom:20 }}>
            <div style={{ fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:accent, fontFamily:"'DM Mono',monospace", marginBottom:16 }}>Hero Identity</div>
            <div className="form-grid-2" style={{ marginBottom:14 }}>
              <div><label style={lb}>Name</label><div style={{ ...fs, color:'var(--muted)', background:'var(--surface2)', fontSize:13, padding:'9px 12px' }}>{output.cardName||'—'}</div></div>
              <div><label style={lb}>Title</label><div style={{ ...fs, color:'var(--muted)', background:'var(--surface2)', fontSize:13, padding:'9px 12px' }}>{output.cardTitle||'—'}</div></div>
            </div>
            <div style={{ marginBottom:14 }}><label style={lb}>Headline</label><div style={{ ...fs, color:'var(--muted)', background:'var(--surface2)', fontSize:13, padding:'9px 12px' }}>{output.headline||'—'}</div></div>
            <div style={{ fontSize:11, color:'var(--muted2)', marginTop:4 }}>
              Edit name and title in the generate form by remixing this generation.
            </div>
            {/* Hero image */}
            <div style={{ marginTop:20 }}>
              <label style={lb}>Hero Background Image URL</label>
              <div style={{ display:'flex', gap:8 }}>
                <input value={heroImage??(output.heroImageQuery?`Auto: "${output.heroImageQuery}"`:'Auto-generated')} onChange={e=>setHeroImage(e.target.value)} placeholder="Paste custom image URL (leave blank for auto)" style={{ ...fs, flex:1 }}/>
                {heroImage && <button onClick={()=>setHeroImage(null)} style={{ background:'transparent', border:'1px solid var(--border2)', color:'var(--muted)', padding:'8px 12px', cursor:'pointer', borderRadius:'var(--radius)', fontSize:11, flexShrink:0 }}>Clear</button>}
              </div>
              {heroImage&&heroImage.startsWith('http') && (
                <div style={{ marginTop:10, borderRadius:6, overflow:'hidden', height:120 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={heroImage} alt="Hero preview" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                </div>
              )}
            </div>
          </div>

          {/* Portfolio Sections */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:24, marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div style={{ fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:accent, fontFamily:"'DM Mono',monospace" }}>Portfolio Sections ({sections.length})</div>
              <button onClick={()=>setSections(s=>[...s,{title:'New Project',body:'',highlight:''}])} style={{ background:'transparent', border:`1px solid ${accent}`, color:accent, padding:'5px 12px', fontSize:10, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer', borderRadius:'var(--radius)', fontFamily:"'DM Mono',monospace" }}>+ Add Section</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {sections.map((sec,i)=>(
                <div key={i} style={{ border:'1px solid var(--border2)', borderRadius:'var(--radius)', overflow:'hidden' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'var(--surface2)', cursor:'pointer' }} onClick={()=>setEditingSection(editingSection===i?null:i)}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                      <span style={{ fontSize:9, color:accent, fontFamily:"'DM Mono',monospace", flexShrink:0 }}>{String(i+1).padStart(2,'0')}</span>
                      <span style={{ fontSize:13, color:'var(--cream)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{sec.title||'Untitled Section'}</span>
                    </div>
                    <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                      <span style={{ fontSize:10, color:'var(--muted)', fontFamily:"'DM Mono',monospace" }}>{editingSection===i?'▲':'▼'}</span>
                      <button onClick={e=>{e.stopPropagation();setSections(s=>s.filter((_,idx)=>idx!==i))}} style={{ background:'none', border:'none', color:'#c0392b', cursor:'pointer', fontSize:12, padding:'0 4px' }}>×</button>
                    </div>
                  </div>
                  {editingSection===i && (
                    <div style={{ padding:16, display:'flex', flexDirection:'column', gap:12 }}>
                      <div><label style={lb}>Section Title</label><input value={sec.title} onChange={e=>updateSec(i,'title',e.target.value)} style={fs} placeholder="e.g. Brand Strategy for Acme Corp"/></div>
                      <div><label style={lb}>Description</label><textarea value={sec.body} onChange={e=>updateSec(i,'body',e.target.value)} rows={3} style={fs} placeholder="Brief description…"/></div>
                      <div><label style={lb}>Highlight / Result</label><input value={sec.highlight} onChange={e=>updateSec(i,'highlight',e.target.value)} style={fs} placeholder="e.g. +40% conversion"/></div>
                      {/* Section image */}
                      <div>
                        <label style={lb}>Custom Section Image URL (optional)</label>
                        <div style={{ display:'flex', gap:8 }}>
                          <input value={customImages[i]??''} onChange={e=>setCustomImages(p=>({...p,[i]:e.target.value}))} placeholder={`Auto: "${(output.workImageQueries??[])[i]??sec.title+' workspace'}"`} style={{ ...fs, flex:1 }}/>
                          {customImages[i] && <button onClick={()=>setCustomImages(p=>{const n={...p};delete n[i];return n})} style={{ background:'transparent', border:'1px solid var(--border2)', color:'var(--muted)', padding:'8px 10px', cursor:'pointer', borderRadius:'var(--radius)', fontSize:11, flexShrink:0 }}>Clear</button>}
                        </div>
                        {customImages[i]&&customImages[i].startsWith('http') && (
                          <div style={{ marginTop:8, borderRadius:4, overflow:'hidden', height:80 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={customImages[i]} alt="section preview" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {sections.length===0 && <div style={{ textAlign:'center', padding:'32px 20px', color:'var(--muted)', fontSize:12 }}>No sections yet. Click + Add Section or generate your brand first.</div>}
          </div>

          {/* Skills */}
          {(output.skills??[]).length>0 && (
            <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:24, marginBottom:20 }}>
              <div style={{ fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:accent, fontFamily:"'DM Mono',monospace", marginBottom:12 }}>Skills (from generation)</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {(output.skills??[]).map(s=><span key={s} style={{ padding:'4px 10px', border:`1px solid ${accent}40`, background:`${accent}10`, borderRadius:20, fontSize:11, color:accent }}>{s}</span>)}
              </div>
              <div style={{ fontSize:11, color:'var(--muted2)', marginTop:8 }}>Skills are generated from your brand inputs.</div>
            </div>
          )}

          {/* Website Theme */}
          <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:24, marginBottom:20 }}>
            <div style={{ fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:accent, fontFamily:"'DM Mono',monospace", marginBottom:6 }}>Website Theme</div>
            <p style={{ fontSize:12, color:'var(--muted)', marginBottom:14, lineHeight:1.6 }}>
              Choose the visual style for your portfolio website. Re-publish after changing.
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))', gap:10 }}>
              {WEBSITE_THEMES.map(t => (
                <div
                  key={t.slug}
                  onClick={() => setSelectedTheme(t.slug)}
                  style={{
                    cursor:'pointer', borderRadius:6, overflow:'hidden',
                    border:`2px solid ${selectedTheme === t.slug ? t.color : 'var(--border)'}`,
                    boxShadow: selectedTheme === t.slug ? `0 0 10px ${t.color}44` : 'none',
                    transition:'all 0.15s',
                  }}
                >
                  {/* Theme preview swatch */}
                  <div style={{ height:52, background:t.bg, padding:'10px 10px 6px', display:'flex', flexDirection:'column', gap:4 }}>
                    <div style={{ height:3, borderRadius:2, background:t.color, width:'60%' }} />
                    <div style={{ height:2, borderRadius:1, background:t.color+'60', width:'80%' }} />
                    <div style={{ height:2, borderRadius:1, background:t.color+'30', width:'45%' }} />
                  </div>
                  <div style={{ padding:'6px 8px', background:'var(--surface2)' }}>
                    <div style={{ fontSize:10, color: selectedTheme === t.slug ? t.color : 'var(--text)', fontFamily:"'DM Mono',monospace", letterSpacing:'0.04em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight: selectedTheme === t.slug ? 600 : 400 }}>{t.name}</div>
                    <div style={{ fontSize:9, color:'var(--muted2)', marginTop:1 }}>{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            {selectedTheme && (
              <div style={{ marginTop:12, fontSize:11, color:'var(--muted)', fontFamily:"'DM Mono',monospace" }}>
                Selected: <span style={{ color: WEBSITE_THEMES.find(t=>t.slug===selectedTheme)?.color ?? accent }}>{WEBSITE_THEMES.find(t=>t.slug===selectedTheme)?.name}</span>
                {' — '}
                <Link href={`/generate?template=${selectedTheme}`} style={{ color:accent, textDecoration:'none', borderBottom:`1px solid ${accent}40` }}>
                  Regenerate with this theme ↗
                </Link>
              </div>
            )}
          </div>

          {/* Save row */}
          <div className="portfolio-save-row" style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <button onClick={save} disabled={saving} style={{ background:accent, color:'#000', border:'none', padding:'12px 28px', fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:"'DM Mono',monospace", fontWeight:500, cursor:saving?'not-allowed':'pointer', borderRadius:'var(--radius)', opacity:saving?0.7:1, transition:'all 0.15s' }}>{saving?'Saving…':'Save Portfolio'}</button>
            <ExportBtn genId={genId} format="pptx" accent={accent} label="↓ Export PPTX" large/>
            <Link href="/generate" style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'12px 20px', fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:"'DM Mono',monospace", color:'var(--muted)', textDecoration:'none', border:'1px solid var(--border)', borderRadius:'var(--radius)' }}>Back to Generate</Link>
          </div>
        </div>

        {/* RIGHT: full live preview */}
        <div className={`desktop-preview-panel${previewPanel==='preview' ? ' mobile-show' : ''}`} style={{ position:'sticky', top:24, height:'clamp(500px, calc(100vh - 140px), 900px)', minHeight:480, display:'flex', flexDirection:'column', background:'var(--surface)', border:`1px solid ${accent}30`, borderRadius:8, overflow:'hidden' }}>
          <LivePreview slug={publishedSlug} accent={accent}/>
          {/* Export panel at bottom */}
          <div style={{ flexShrink:0, borderTop:'1px solid var(--border)', padding:'12px 16px', background:'var(--surface)', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <div style={{ fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase', color:'var(--muted)', fontFamily:"'DM Mono',monospace", flexShrink:0 }}>Export:</div>
            <div style={{ display:'flex', gap:6, flex:1 }}>
              <ExportBtn genId={genId} format="pdf" accent={accent} label="PDF"/>
              <ExportBtn genId={genId} format="pptx" accent={accent} label="PPTX"/>
            </div>
            {publishedSlug && (
              <a href={`/p/${publishedSlug}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:10, color:accent, textDecoration:'none', fontFamily:"'DM Mono',monospace", letterSpacing:'0.06em', flexShrink:0, border:`1px solid ${accent}40`, padding:'4px 10px', borderRadius:3 }}>Open Live ↗</a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Domain Panel ────────────────────────────────────────────────────────────
function PortfolioDomainPanel({ accent }:{ accent:string }) {
  const [domainInput, setDomainInput] = useState('')
  const [status, setStatus] = useState<{ domain:string; verified:boolean; cnameTarget:string; verificationToken:string }|null>(null)
  const [loading, setLoading] = useState(false)
  const [verifyMsg, setVerifyMsg] = useState('')
  const [toast, setToast] = useState('')
  function showToast(m:string) { setToast(m); setTimeout(()=>setToast(''),3000) }
  async function loadDomain() {
    try {
      const r = await fetch('/api/domain/verify')
      if(r.ok) { const d = await r.json(); if(d.domain) setStatus(d) }
    } catch {}
  }
  useEffect(()=>{ loadDomain() },[])
  async function handleConnect() {
    if(!domainInput.trim()) return
    setLoading(true)
    try {
      const r = await fetch('/api/domain/connect',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ domain:domainInput.trim() }) })
      const d = await r.json()
      if(r.ok) { setStatus(d); showToast('✓ Domain saved — now add the CNAME record') }
      else showToast('✗ '+(d.error||'Failed'))
    } finally { setLoading(false) }
  }
  async function handleVerify() {
    setLoading(true)
    try {
      const r = await fetch('/api/domain/verify',{ method:'POST' })
      const d = await r.json()
      if(r.ok && d.verified) { setStatus(s=>s?{...s,verified:true}:s); setVerifyMsg('✓ Domain verified! Your portfolio is live at your custom domain.') }
      else if(!r.ok) setVerifyMsg('✗ '+(d.error||'Verification check failed — please try again.'))
      else setVerifyMsg('✗ TXT record not found yet — DNS can take up to 48h. Make sure both the CNAME and TXT records are saved at your registrar, then try again.')
    } finally { setLoading(false) }
    setTimeout(()=>setVerifyMsg(''),10000)
  }
  async function handleRemove() {
    if(!confirm('Disconnect this domain?')) return
    setLoading(true)
    try {
      const r = await fetch('/api/domain/connect',{ method:'DELETE' })
      if(r.ok) { setStatus(null); setDomainInput(''); showToast('✓ Domain disconnected') }
    } finally { setLoading(false) }
  }
  const fieldStyle:React.CSSProperties = { flex:1, background:'var(--surface)', border:'1px solid var(--border)', color:'var(--cream)', fontFamily:"'DM Sans',sans-serif", fontSize:13, padding:'9px 12px', outline:'none', borderRadius:'var(--radius)' }
  const mono = "'DM Mono',monospace"
  return (
    <div style={{ maxWidth:640 }}>
      {toast && <div style={{ background:`${accent}20`, border:`1px solid ${accent}40`, color:accent, padding:'8px 14px', borderRadius:'var(--radius)', marginBottom:20, fontSize:12 }}>{toast}</div>}
      <div style={{ fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--gold)', fontFamily:mono, marginBottom:4 }}>Custom Domain</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, color:'var(--cream)', marginBottom:8 }}>Connect Your Domain</div>
      <p style={{ fontSize:13, color:'var(--muted)', marginBottom:28, lineHeight:1.7 }}>
        Point your own domain (e.g. <code style={{ color:accent, fontSize:12 }}>portfolio.yourname.com</code>) to your Brand Syndicate portfolio. Requires adding a CNAME DNS record at your domain registrar.
      </p>
      {!status ? (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'24px 28px', marginBottom:24 }}>
          <div style={{ fontSize:11, color:'var(--muted)', fontFamily:mono, marginBottom:16, letterSpacing:'0.06em' }}>Step 1 — Enter your custom domain</div>
          <div style={{ display:'flex', gap:8, marginBottom:8 }}>
            <input value={domainInput} onChange={e=>setDomainInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleConnect()} placeholder="portfolio.yourname.com" style={fieldStyle}/>
            <button onClick={handleConnect} disabled={loading||!domainInput.trim()} style={{ background:accent, border:'none', color:'#000', padding:'9px 20px', fontSize:11, letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:500, cursor:'pointer', borderRadius:'var(--radius)', whiteSpace:'nowrap', opacity:loading?0.7:1 }}>
              {loading?'…':'Connect'}
            </button>
          </div>
          <div style={{ fontSize:11, color:'var(--muted)', fontFamily:mono }}>Don't include http:// or www — just the hostname</div>
        </div>
      ) : (
        <div style={{ background:'var(--surface)', border:`1px solid ${status.verified?'#2E7D52':'var(--border)'}`, borderRadius:'var(--radius)', padding:'24px 28px', marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
            <span style={{ width:10, height:10, borderRadius:'50%', background:status.verified?'#2E7D52':'#C9A84C', display:'inline-block', flexShrink:0 }}/>
            <div style={{ fontFamily:mono, fontSize:12, color:status.verified?'#6FCF97':'#C9A84C', letterSpacing:'0.08em' }}>{status.verified?'Domain Verified ✓':'Pending Verification'}</div>
            <div style={{ marginLeft:'auto', fontFamily:mono, fontSize:13, color:'var(--cream)' }}>{status.domain}</div>
          </div>
          {!status.verified && (
            <>
              <div style={{ fontSize:11, color:'var(--muted)', fontFamily:mono, marginBottom:12, letterSpacing:'0.06em' }}>Step 2 — Add these DNS records at your registrar / DNS provider:</div>
              <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:accent, fontFamily:mono, marginBottom:8 }}>Record 1 — CNAME (routes traffic)</div>
              <div style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:4, padding:'14px 16px', marginBottom:12, fontFamily:mono }}>
                <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:'8px 24px', fontSize:12 }}>
                  <span style={{ color:'var(--muted)' }}>Type</span><span style={{ color:'var(--cream)' }}>CNAME</span>
                  <span style={{ color:'var(--muted)' }}>Name / Host</span><span style={{ color:accent }}>{status.domain.split('.').slice(0,-2).join('.') || status.domain.split('.')[0]}</span>
                  <span style={{ color:'var(--muted)' }}>Value / Points to</span><span style={{ color:accent, wordBreak:'break-all' }}>{status.cnameTarget}</span>
                  <span style={{ color:'var(--muted)' }}>TTL</span><span style={{ color:'var(--cream)' }}>3600 (or Auto)</span>
                </div>
              </div>
              <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:accent, fontFamily:mono, marginBottom:8 }}>Record 2 — TXT (required for verification)</div>
              <div style={{ background:'var(--bg)', border:'1px solid var(--border)', borderRadius:4, padding:'14px 16px', marginBottom:16, fontFamily:mono }}>
                <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:'8px 24px', fontSize:12 }}>
                  <span style={{ color:'var(--muted)' }}>Type</span><span style={{ color:'var(--cream)' }}>TXT</span>
                  <span style={{ color:'var(--muted)' }}>Name / Host</span><span style={{ color:accent }}>_brandsyndicate.{status.domain}</span>
                  <span style={{ color:'var(--muted)' }}>Value</span><span style={{ color:accent, wordBreak:'break-all', fontSize:11 }}>{status.verificationToken}</span>
                  <span style={{ color:'var(--muted)' }}>TTL</span><span style={{ color:'var(--cream)' }}>3600 (or Auto)</span>
                </div>
              </div>
              <div style={{ fontSize:11, color:'var(--muted)', fontFamily:mono, marginBottom:16, lineHeight:1.7 }}>
                Both records are required — CNAME routes traffic to your portfolio, TXT proves domain ownership. DNS propagation can take <strong style={{ color:'var(--cream)' }}>5 minutes to 48 hours</strong>. Once both records are saved, click Verify below.
              </div>
            </>
          )}
          {verifyMsg && (
            <div style={{ padding:'10px 14px', background:verifyMsg.startsWith('✓')?'rgba(46,125,82,0.12)':'rgba(192,57,43,0.1)', border:`1px solid ${verifyMsg.startsWith('✓')?'rgba(46,125,82,0.4)':'rgba(192,57,43,0.3)'}`, borderRadius:'var(--radius)', fontSize:12, color:verifyMsg.startsWith('✓')?'#6FCF97':'#E57373', fontFamily:mono, marginBottom:14 }}>{verifyMsg}</div>
          )}
          {status.verified && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:12, color:'var(--muted)', marginBottom:6 }}>Your portfolio is accessible at:</div>
              <a href={`https://${status.domain}`} target="_blank" rel="noopener noreferrer" style={{ color:accent, fontSize:14, fontFamily:mono, textDecoration:'none' }}>https://{status.domain} ↗</a>
            </div>
          )}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {!status.verified && (
              <button onClick={handleVerify} disabled={loading} style={{ padding:'9px 20px', background:accent, border:'none', color:'#000', fontSize:11, letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:500, cursor:'pointer', borderRadius:'var(--radius)', opacity:loading?0.7:1 }}>{loading?'Checking…':'Verify DNS'}</button>
            )}
            <button onClick={handleRemove} disabled={loading} style={{ padding:'9px 16px', background:'transparent', border:'1px solid var(--border2)', color:'var(--muted)', fontSize:11, letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer', borderRadius:'var(--radius)' }}>Disconnect Domain</button>
          </div>
        </div>
      )}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'20px 24px' }}>
        <div style={{ fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase', color:accent, fontFamily:mono, marginBottom:12 }}>How It Works</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[['1','Enter your subdomain (e.g. portfolio.yourname.com)'],['2','Add a CNAME record (routes traffic) AND a TXT record (proves ownership) at your DNS provider — both are shown after connecting'],['3','Click Verify — once DNS propagates, your portfolio is live at your custom URL']].map(([n,t])=>(
            <div key={n} style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
              <div style={{ width:20, height:20, borderRadius:'50%', background:`${accent}20`, border:`1px solid ${accent}40`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, color:accent, fontFamily:mono, flexShrink:0 }}>{n}</div>
              <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.6, paddingTop:1 }}>{t}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PortfolioEditPanel({ accent, allGens, initialGenId }:{ accent:string; allGens:GenSummary[]; initialGenId:string|null }) {
  return (
    <Suspense fallback={<div style={{ padding:40, textAlign:'center', color:'var(--muted)', fontSize:12 }}>Loading…</div>}>
      <PortfolioEditPanelInner accent={accent} allGens={allGens} initialGenId={initialGenId}/>
    </Suspense>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────
function MainClientInner({ initialProjects, initialPosts, username, accentColor }:Props) {
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('gen') ? 'portfolio-edit' : 'select'
  const [tab, setTab] = useState<'select'|'projects'|'portfolio-edit'|'seo'|'blog'|'domain'>(defaultTab as 'select')
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [posts, setPosts] = useState<BlogPostSummary[]>(initialPosts)
  const [allGens, setAllGens] = useState<GenSummary[]>([])
  const [gensLoading, setGensLoading] = useState(true)
  const [selectedGenId, setSelectedGenId] = useState<string|null>(null)
  const accent = accentColor

  // Load all gens once
  useEffect(()=>{
    fetch('/api/my-generations').then(r=>r.ok?r.json():{generations:[]}).then(d=>{
      setAllGens(d.generations??[])
    }).catch(()=>{}).finally(()=>setGensLoading(false))
  },[])

  const tabs = [
    { key:'select' as const,        label:'My Portfolios',    icon:'⬡' },
    { key:'projects' as const,       label:'Projects',         icon:'◈' },
    { key:'portfolio-edit' as const, label:'Edit Portfolio',   icon:'✎' },
    { key:'seo' as const,            label:'SEO',              icon:'◉' },
    { key:'blog' as const,           label:'Blog',             icon:'◳' },
    { key:'domain' as const,         label:'Domain',           icon:'⊕' },
  ]

  return (
    <div className="page-pad">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28, gap:16, flexWrap:'wrap' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:10, letterSpacing:'0.16em', textTransform:'uppercase', color:'var(--gold)', fontFamily:"'DM Mono',monospace", marginBottom:12 }}>
            <div style={{ width:20, height:1, background:'var(--gold)' }}/> Portfolio Manager
          </div>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(24px,4vw,32px)', fontWeight:400, color:'var(--cream)', marginBottom:4 }}>Living Portfolio</h1>
          <p style={{ fontSize:13, color:'var(--muted)', lineHeight:1.65 }}>
            {allGens.length>0 ? `${allGens.length} portfolio${allGens.length>1?'s':''} generated · ` : ''}
            Manage, edit, and publish your AI-generated portfolio websites.
          </p>
        </div>
        {/* Quick actions */}
        <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
          <button onClick={()=>setTab('domain')} style={{ background:'transparent', border:'1px solid var(--border2)', color:'var(--muted)', padding:'8px 14px', fontSize:11, cursor:'pointer', letterSpacing:'0.1em', textTransform:'uppercase', borderRadius:'var(--radius)', fontFamily:"'DM Mono',monospace", whiteSpace:'nowrap' }}>⊕ Domain</button>
          <Link href="/generate" style={{ background:'var(--gold)', color:'#000', padding:'8px 16px', fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:500, textDecoration:'none', borderRadius:'var(--radius)', whiteSpace:'nowrap' }}>+ New</Link>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--border)', marginBottom:32, overflowX:'auto', scrollbarWidth:'none' as const }}>
        {tabs.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)} style={{ background:'transparent', border:'none', cursor:'pointer', padding:'10px 16px', fontSize:11, color:tab===t.key?accent:'var(--muted)', borderBottom:tab===t.key?`2px solid ${accent}`:'2px solid transparent', fontFamily:"'DM Sans',sans-serif", letterSpacing:'0.04em', marginBottom:-1, transition:'color 0.15s', whiteSpace:'nowrap', flexShrink:0, display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:12, opacity:0.7 }}>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab==='select' && (
        gensLoading
          ? <div style={{ textAlign:'center', padding:60, color:'var(--muted)', fontSize:12 }}>Loading portfolios…</div>
          : <GenPicker gens={allGens} activeId={selectedGenId} onPick={id=>{ setSelectedGenId(id); setTab('portfolio-edit') }} accent={accent}/>
      )}
      {tab==='projects'      && <ProjectsPanel projects={projects} setProjects={setProjects} accent={accent}/>}
      {tab==='portfolio-edit' && <PortfolioEditPanel accent={accent} allGens={allGens} initialGenId={selectedGenId}/>}
      {tab==='seo'            && <SeoPanel/>}
      {tab==='blog'           && <BlogPanel posts={posts} setPosts={setPosts} username={username} accent={accent}/>}
      {tab==='domain'         && <PortfolioDomainPanel accent={accent}/>}
    </div>
  )
}

export default function PortfolioManagerClient(props:Props) {
  return (
    <Suspense fallback={<div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:300 }}><div style={{ width:28, height:28, border:'1px solid var(--border2)', borderTopColor:'var(--gold)', borderRadius:'50%', animation:'spin 1s linear infinite' }}/></div>}>
      <MainClientInner {...props}/>
    </Suspense>
  )
}
