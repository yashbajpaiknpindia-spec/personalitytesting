'use client'
import { useState, useCallback, useEffect } from 'react'

// ─── Types ─────────────────────────────────────────────────────────────────

interface Project {
  id: string
  title: string
  description: string | null
  url: string | null
  imageUrl: string | null
  tags: string[]
  featured: boolean
  order: number
  publishedAt: string | Date | null
}

interface SeoSettings {
  id?: string
  pageTitle: string | null
  metaDescription: string | null
  ogImageUrl: string | null
  twitterHandle: string | null
  canonicalUrl: string | null
  noIndex: boolean
}

interface BlogPostSummary {
  id: string
  title: string
  slug: string
  published: boolean
  publishedAt: string | Date | null
  readingMinutes: number | null
  viewCount: number
  tags: string[]
  excerpt: string | null
  createdAt: string | Date
}

interface PortfolioSection {
  title: string
  body: string
  highlight: string
}

interface ProfileData {
  name: string
  headline: string
  tagline: string
  bio: string
  skills: string[]
  cta: string
  cardTitle: string
  portfolioSections: PortfolioSection[]
}

interface Props {
  initialProjects: Project[]
  initialSeo: SeoSettings | null
  initialPosts: BlogPostSummary[]
  username: string | null
  accentColor: string
}

// ─── Sub-components ────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{
      fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase',
      color: 'var(--gold)', fontFamily: "'DM Mono', monospace",
      marginBottom: 6,
    }}>
      {label}
    </div>
  )
}

function Field({
  label, value, onChange, placeholder, multiline, type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  multiline?: boolean
  type?: string
}) {
  const base: React.CSSProperties = {
    width: '100%', background: 'var(--surface)',
    border: '1px solid var(--border)', color: 'var(--cream)',
    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
    padding: '9px 12px', outline: 'none',
    borderRadius: 'var(--radius)', resize: 'vertical' as const,
  }
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 5 }}>{label}</div>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={base}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={base}
        />
      )}
    </div>
  )
}

function ActionBtn({
  onClick, loading, children, variant = 'primary',
}: {
  onClick: () => void
  loading?: boolean
  children: React.ReactNode
  variant?: 'primary' | 'ghost' | 'danger'
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        padding: '8px 16px', fontSize: 11, cursor: loading ? 'default' : 'pointer',
        letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500,
        borderRadius: 'var(--radius)',
        background: variant === 'primary' ? 'var(--gold)'
          : 'transparent',
        color: variant === 'primary' ? '#000'
          : variant === 'danger' ? '#c0392b' : 'var(--muted)',
        border: variant === 'primary' ? 'none'
          : variant === 'danger' ? '1px solid #8b2020' : '1px solid var(--border2)',
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? '…' : children}
    </button>
  )
}

// ─── Projects Panel ────────────────────────────────────────────────────────

function ProjectsPanel({ projects, setProjects, accent }: {
  projects: Project[]
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
  accent: string
}) {
  const [form, setForm] = useState({ title: '', description: '', url: '', imageUrl: '', tags: '', featured: false })
  const [loading, setLoading] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function resetForm() {
    setForm({ title: '', description: '', url: '', imageUrl: '', tags: '', featured: false })
    setEditId(null)
  }

  function startEdit(p: Project) {
    setEditId(p.id)
    setForm({
      title: p.title,
      description: p.description ?? '',
      url: p.url ?? '',
      imageUrl: p.imageUrl ?? '',
      tags: p.tags.join(', '),
      featured: p.featured,
    })
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setLoading(true)
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        url: form.url || undefined,
        imageUrl: form.imageUrl || undefined,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        featured: form.featured,
      }

      if (editId) {
        const res = await fetch(`/api/projects/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const { project } = await res.json()
          setProjects(prev => prev.map(p => p.id === editId ? project : p))
          showToast('Project updated')
          resetForm()
        }
      } else {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          const { project } = await res.json()
          setProjects(prev => [...prev, project])
          showToast('Project added')
          resetForm()
        }
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this project?')) return
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setProjects(prev => prev.filter(p => p.id !== id))
      showToast('Deleted')
    }
  }

  return (
    <div>
      {toast && (
        <div style={{ background: `${accent}20`, border: `1px solid ${accent}40`, color: accent, padding: '8px 14px', borderRadius: 'var(--radius)', marginBottom: 20, fontSize: 12 }}>
          {toast}
        </div>
      )}

      {/* Form */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, marginBottom: 28 }}>
        <SectionLabel label={editId ? 'Edit Project' : 'Add Project'} />
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--cream)', marginBottom: 20 }}>
          {editId ? 'Update Project' : 'New Project'}
        </div>

        <Field label="Title *" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="My Awesome Project" />
        <Field label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="What it does, why it matters…" multiline />
        <Field label="Live URL" value={form.url} onChange={v => setForm(f => ({ ...f, url: v }))} placeholder="https://example.com" type="url" />
        <Field label="Image URL" value={form.imageUrl} onChange={v => setForm(f => ({ ...f, imageUrl: v }))} placeholder="https://…" type="url" />
        <Field label="Tags (comma-separated)" value={form.tags} onChange={v => setForm(f => ({ ...f, tags: v }))} placeholder="design, react, branding" />

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer', fontSize: 13, color: 'var(--cream)' }}>
          <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} />
          Feature this project (shows first)
        </label>

        <div style={{ display: 'flex', gap: 8 }}>
          <ActionBtn onClick={handleSave} loading={loading}>{editId ? 'Update' : 'Add Project'}</ActionBtn>
          {editId && <ActionBtn onClick={resetForm} variant="ghost">Cancel</ActionBtn>}
        </div>
      </div>

      {/* Projects list */}
      {projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted2)', fontSize: 13 }}>
          No projects yet. Add your first one above.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {projects.map(p => (
            <div key={p.id} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderLeft: p.featured ? `3px solid ${accent}` : '3px solid transparent',
              borderRadius: 'var(--radius)', padding: '16px 18px',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: 'var(--cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.title}
                  </div>
                  {p.featured && (
                    <span style={{ fontSize: 9, background: `${accent}20`, color: accent, padding: '1px 6px', borderRadius: 2, letterSpacing: '0.1em', fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>
                      FEATURED
                    </span>
                  )}
                </div>
                {p.description && (
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.description}
                  </div>
                )}
                {p.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {p.tags.map(t => (
                      <span key={t} style={{ fontSize: 9, color: 'var(--muted2)', background: 'var(--surface2)', padding: '1px 6px', borderRadius: 2, letterSpacing: '0.08em' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <ActionBtn onClick={() => startEdit(p)} variant="ghost">Edit</ActionBtn>
                <ActionBtn onClick={() => handleDelete(p.id)} variant="danger">✕</ActionBtn>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── SEO Panel ─────────────────────────────────────────────────────────────

function SeoPanel({ seo, setSeo }: {
  seo: SeoSettings | null
  setSeo: React.Dispatch<React.SetStateAction<SeoSettings | null>>
}) {
  const [form, setForm] = useState<SeoSettings>(seo ?? {
    pageTitle: '', metaDescription: '', ogImageUrl: '',
    twitterHandle: '', canonicalUrl: '', noIndex: false,
  })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setLoading(true)
    try {
      const res = await fetch('/api/seo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const { seo: updated } = await res.json()
        setSeo(updated)
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
      <SectionLabel label="SEO & Meta" />
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--cream)', marginBottom: 6 }}>
        SEO Settings
      </div>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.7 }}>
        Control how your portfolio appears in search engines and social media previews.
      </p>

      <Field label="Page Title" value={form.pageTitle ?? ''} onChange={v => setForm(f => ({ ...f, pageTitle: v }))}
        placeholder="Jane Doe — Product Designer" />
      <Field label="Meta Description" value={form.metaDescription ?? ''} onChange={v => setForm(f => ({ ...f, metaDescription: v }))}
        placeholder="Senior product designer specialising in B2B SaaS…" multiline />
      <Field label="OG Image URL" value={form.ogImageUrl ?? ''} onChange={v => setForm(f => ({ ...f, ogImageUrl: v }))}
        placeholder="https://… (1200×630 recommended)" type="url" />
      <Field label="Twitter Handle" value={form.twitterHandle ?? ''} onChange={v => setForm(f => ({ ...f, twitterHandle: v }))}
        placeholder="yourhandle (no @)" />
      <Field label="Canonical URL" value={form.canonicalUrl ?? ''} onChange={v => setForm(f => ({ ...f, canonicalUrl: v }))}
        placeholder="https://yoursite.com (if using custom domain)" type="url" />

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, cursor: 'pointer', fontSize: 13, color: 'var(--cream)' }}>
        <input type="checkbox" checked={form.noIndex} onChange={e => setForm(f => ({ ...f, noIndex: e.target.checked }))} />
        Hide from search engines (noindex)
      </label>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <ActionBtn onClick={handleSave} loading={loading}>Save SEO Settings</ActionBtn>
        {saved && <span style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: '0.1em', fontFamily: "'DM Mono', monospace" }}>✓ Saved</span>}
      </div>
    </div>
  )
}

// ─── Blog Panel ────────────────────────────────────────────────────────────

function BlogPanel({ posts, setPosts, username, accent }: {
  posts: BlogPostSummary[]
  setPosts: React.Dispatch<React.SetStateAction<BlogPostSummary[]>>
  username: string | null
  accent: string
}) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', excerpt: '', content: '', tags: '', coverImageUrl: '', published: false, seoTitle: '', seoDescription: '' })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function handleCreate() {
    if (!form.title.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          excerpt: form.excerpt || undefined,
          content: form.content,
          tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          coverImageUrl: form.coverImageUrl || undefined,
          published: form.published,
          seoTitle: form.seoTitle || undefined,
          seoDescription: form.seoDescription || undefined,
        }),
      })
      if (res.ok) {
        const { post } = await res.json()
        setPosts(prev => [post, ...prev])
        setForm({ title: '', excerpt: '', content: '', tags: '', coverImageUrl: '', published: false, seoTitle: '', seoDescription: '' })
        setShowForm(false)
        showToast('Post created')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleTogglePublish(slug: string, currentPublished: boolean) {
    const res = await fetch(`/api/blog/${slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !currentPublished }),
    })
    if (res.ok) {
      setPosts(prev => prev.map(p => p.slug === slug
        ? { ...p, published: !currentPublished, publishedAt: !currentPublished ? new Date().toISOString() : null }
        : p,
      ))
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm('Delete this post? Cannot be undone.')) return
    const res = await fetch(`/api/blog/${slug}`, { method: 'DELETE' })
    if (res.ok) {
      setPosts(prev => prev.filter(p => p.slug !== slug))
      showToast('Post deleted')
    }
  }

  return (
    <div>
      {toast && (
        <div style={{ background: `${accent}20`, border: `1px solid ${accent}40`, color: accent, padding: '8px 14px', borderRadius: 'var(--radius)', marginBottom: 20, fontSize: 12 }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          {username && (
            <a href={`/blog/${username}`} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: accent, letterSpacing: '0.1em', fontFamily: "'DM Mono', monospace", textDecoration: 'none', textTransform: 'uppercase' }}>
              View Public Blog ↗
            </a>
          )}
        </div>
        <ActionBtn onClick={() => setShowForm(f => !f)}>{showForm ? 'Cancel' : '+ New Post'}</ActionBtn>
      </div>

      {showForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, marginBottom: 28 }}>
          <SectionLabel label="New Post" />
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: 'var(--cream)', marginBottom: 20 }}>
            Write a Post
          </div>

          <Field label="Title *" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="My thoughts on…" />
          <Field label="Excerpt" value={form.excerpt} onChange={v => setForm(f => ({ ...f, excerpt: v }))} placeholder="One-line summary shown in the blog list…" />
          <Field label="Cover Image URL" value={form.coverImageUrl} onChange={v => setForm(f => ({ ...f, coverImageUrl: v }))} placeholder="https://…" type="url" />
          <Field label="Tags (comma-separated)" value={form.tags} onChange={v => setForm(f => ({ ...f, tags: v }))} placeholder="design, branding, ux" />

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 5 }}>Content (HTML supported)</div>
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={10}
              placeholder="<p>Start writing…</p>"
              style={{
                width: '100%', background: 'var(--surface)', border: '1px solid var(--border)',
                color: 'var(--cream)', fontFamily: "'DM Mono', monospace", fontSize: 12,
                padding: '9px 12px', outline: 'none', borderRadius: 'var(--radius)', resize: 'vertical',
              }}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--muted2)', fontFamily: "'DM Mono', monospace", marginBottom: 14, textTransform: 'uppercase' }}>
              SEO (optional)
            </div>
            <Field label="SEO Title" value={form.seoTitle} onChange={v => setForm(f => ({ ...f, seoTitle: v }))} placeholder="Overrides post title in search results" />
            <Field label="SEO Description" value={form.seoDescription} onChange={v => setForm(f => ({ ...f, seoDescription: v }))} placeholder="Custom meta description…" multiline />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer', fontSize: 13, color: 'var(--cream)' }}>
            <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))} />
            Publish immediately
          </label>

          <ActionBtn onClick={handleCreate} loading={loading}>Create Post</ActionBtn>
        </div>
      )}

      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted2)', fontSize: 13 }}>
          No posts yet. Write your first one above.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {posts.map(post => (
            <div key={post.id} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderLeft: post.published ? `3px solid ${accent}` : '3px solid var(--border2)',
              borderRadius: 'var(--radius)', padding: '16px 18px',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: 'var(--cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {post.title}
                  </div>
                  <span style={{
                    fontSize: 9, padding: '1px 6px', borderRadius: 2, letterSpacing: '0.1em',
                    fontFamily: "'DM Mono', monospace", flexShrink: 0,
                    background: post.published ? `${accent}20` : 'var(--surface2)',
                    color: post.published ? accent : 'var(--muted2)',
                  }}>
                    {post.published ? 'LIVE' : 'DRAFT'}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted2)', letterSpacing: '0.08em', fontFamily: "'DM Mono', monospace" }}>
                  {post.readingMinutes ? `${post.readingMinutes} min` : ''}{post.viewCount ? ` · ${post.viewCount} views` : ''}
                  {post.publishedAt ? ` · ${new Date(post.publishedAt).toLocaleDateString()}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <ActionBtn onClick={() => handleTogglePublish(post.slug, post.published)} variant="ghost">
                  {post.published ? 'Unpublish' : 'Publish'}
                </ActionBtn>
                {username && post.published && (
                  <a href={`/blog/${username}/${post.slug}`} target="_blank" rel="noopener noreferrer"
                    style={{ padding: '8px 12px', fontSize: 11, color: accent, border: `1px solid ${accent}50`, borderRadius: 'var(--radius)', textDecoration: 'none', letterSpacing: '0.08em' }}>
                    ↗
                  </a>
                )}
                <ActionBtn onClick={() => handleDelete(post.slug)} variant="danger">✕</ActionBtn>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Profile & Sections Panel ───────────────────────────────────────────────

function ProfileSectionsPanel({ accent }: { accent: string }) {
  const [profile, setProfile] = useState<ProfileData>({
    name: '', headline: '', tagline: '', bio: '',
    skills: [], cta: '', cardTitle: '', portfolioSections: [],
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [skillInput, setSkillInput] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  useEffect(() => {
    // Load latest generation output to pre-populate fields
    fetch('/api/generate/latest')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.outputData) {
          const o = data.outputData
          setProfile({
            name: o.cardName ?? '',
            headline: o.headline ?? '',
            tagline: o.tagline ?? '',
            bio: o.bio ?? '',
            skills: o.skills ?? [],
            cta: o.cta ?? '',
            cardTitle: o.cardTitle ?? '',
            portfolioSections: o.portfolioSections ?? [],
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      // 1. Save user profile fields the schema supports
      const profileRes = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:     profile.name     || undefined,
          bio:      profile.bio      || undefined,
          jobTitle: profile.cardTitle || undefined,
        }),
      })

      if (!profileRes.ok) {
        showToast('✕ Save failed')
        return
      }

      // 2. Persist headline / tagline / sections back into the latest generation outputData
      await fetch('/api/generate/latest', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline:          profile.headline,
          tagline:           profile.tagline,
          cta:               profile.cta,
          cardTitle:         profile.cardTitle,
          cardName:          profile.name,
          skills:            profile.skills,
          portfolioSections: profile.portfolioSections,
        }),
      })

      showToast('✓ Profile saved')
    } catch {
      showToast('✕ Save failed')
    } finally {
      setSaving(false)
    }
  }

  function addSkill() {
    const s = skillInput.trim()
    if (!s) return
    setProfile(p => ({ ...p, skills: [...p.skills, s] }))
    setSkillInput('')
  }

  function removeSkill(i: number) {
    setProfile(p => ({ ...p, skills: p.skills.filter((_, idx) => idx !== i) }))
  }

  function updateSection(i: number, field: keyof PortfolioSection, val: string) {
    setProfile(p => {
      const secs = [...p.portfolioSections]
      secs[i] = { ...secs[i], [field]: val }
      return { ...p, portfolioSections: secs }
    })
  }

  function addSection() {
    setProfile(p => ({
      ...p,
      portfolioSections: [...p.portfolioSections, { title: 'New Project', body: '', highlight: '' }],
    }))
  }

  function removeSection(i: number) {
    setProfile(p => ({ ...p, portfolioSections: p.portfolioSections.filter((_, idx) => idx !== i) }))
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%', background: 'var(--surface)',
    border: '1px solid var(--border)', color: 'var(--cream)',
    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
    padding: '9px 12px', outline: 'none',
    borderRadius: 'var(--radius)', resize: 'vertical',
  }
  const label: React.CSSProperties = {
    fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
    color: 'var(--muted)', fontFamily: "'DM Mono', monospace", marginBottom: 6, display: 'block',
  }

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 12 }}>
        Loading profile…
      </div>
    )
  }

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, background: '#1a1a1a',
          border: `1px solid ${accent}60`, borderRadius: 6, padding: '10px 18px',
          fontSize: 12, color: '#F0EAE0', zIndex: 9999,
        }}>
          {toast}
        </div>
      )}

      {/* Hero / Identity */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>
          Identity
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={label}>Display Name</label>
            <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} style={fieldStyle} placeholder="Your Name" />
          </div>
          <div>
            <label style={label}>Card Title / Role</label>
            <input value={profile.cardTitle} onChange={e => setProfile(p => ({ ...p, cardTitle: e.target.value }))} style={fieldStyle} placeholder="e.g. Product Designer" />
          </div>
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={label}>Hero Headline</label>
          <input value={profile.headline} onChange={e => setProfile(p => ({ ...p, headline: e.target.value }))} style={fieldStyle} placeholder="Compelling one-liner shown on your portfolio hero" />
        </div>
        <div style={{ marginTop: 14 }}>
          <label style={label}>Tagline</label>
          <input value={profile.tagline} onChange={e => setProfile(p => ({ ...p, tagline: e.target.value }))} style={fieldStyle} placeholder="Short tagline for footer / card" />
        </div>
      </div>

      {/* About / Bio */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>
          About
        </div>
        <label style={label}>Bio</label>
        <textarea
          value={profile.bio}
          onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
          rows={4}
          style={{ ...fieldStyle }}
          placeholder="A paragraph about you — shown on the About section"
        />
        <div style={{ marginTop: 14 }}>
          <label style={label}>CTA Button Label</label>
          <input value={profile.cta} onChange={e => setProfile(p => ({ ...p, cta: e.target.value }))} style={fieldStyle} placeholder="e.g. Get in Touch" />
        </div>
      </div>

      {/* Skills */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace", marginBottom: 16 }}>
          Skills
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {profile.skills.map((s, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
              background: accent + '18', border: `1px solid ${accent}40`,
              borderRadius: 20, fontSize: 11, color: accent,
            }}>
              {s}
              <button onClick={() => removeSkill(i)} style={{ background: 'none', border: 'none', color: accent, cursor: 'pointer', fontSize: 12, lineHeight: 1, padding: 0 }}>×</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={skillInput}
            onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addSkill()}
            style={{ ...fieldStyle, flex: 1 }}
            placeholder="Add a skill and press Enter"
          />
          <button onClick={addSkill} style={{
            background: accent, color: '#000', border: 'none', padding: '9px 16px',
            fontSize: 11, letterSpacing: '0.08em', fontWeight: 500, cursor: 'pointer',
            borderRadius: 'var(--radius)',
          }}>
            Add
          </button>
        </div>
      </div>

      {/* Work Sections */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: accent, fontFamily: "'DM Mono', monospace" }}>
            Work / Portfolio Sections
          </div>
          <button onClick={addSection} style={{
            background: 'transparent', border: `1px solid ${accent}50`,
            color: accent, padding: '5px 12px', fontSize: 10,
            letterSpacing: '0.08em', cursor: 'pointer', borderRadius: 'var(--radius)',
          }}>
            + Add Section
          </button>
        </div>

        {profile.portfolioSections.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>
            No sections yet. Click &ldquo;+ Add Section&rdquo; to create one.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {profile.portfolioSections.map((sec, i) => (
            <div key={i} style={{
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderLeft: `3px solid ${accent}60`,
              borderRadius: 'var(--radius)', padding: 16,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 9, letterSpacing: '0.14em', color: accent, fontFamily: "'DM Mono', monospace" }}>
                  SECTION {String(i + 1).padStart(2, '0')}
                </span>
                <button onClick={() => removeSection(i)} style={{
                  background: 'none', border: '1px solid rgba(192,57,43,0.4)',
                  color: '#E05252', fontSize: 9, letterSpacing: '0.08em',
                  padding: '2px 8px', cursor: 'pointer', borderRadius: 3,
                }}>
                  Remove
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={label}>Title</label>
                  <input value={sec.title} onChange={e => updateSection(i, 'title', e.target.value)} style={fieldStyle} placeholder="Project / section title" />
                </div>
                <div>
                  <label style={label}>Highlight (tag)</label>
                  <input value={sec.highlight} onChange={e => updateSection(i, 'highlight', e.target.value)} style={fieldStyle} placeholder="e.g. Increased MRR by 40%" />
                </div>
              </div>
              <label style={label}>Body</label>
              <textarea
                value={sec.body}
                onChange={e => updateSection(i, 'body', e.target.value)}
                rows={2}
                style={fieldStyle}
                placeholder="Short description"
              />
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            background: accent, color: '#000', border: 'none',
            padding: '10px 28px', fontSize: 11, letterSpacing: '0.12em',
            textTransform: 'uppercase', fontWeight: 600, cursor: saving ? 'default' : 'pointer',
            borderRadius: 'var(--radius)', opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? '…Saving' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

// ─── Main client component ──────────────────────────────────────────────────

export default function PortfolioManagerClient({
  initialProjects, initialSeo, initialPosts, username, accentColor,
}: Props) {
  const [tab, setTab] = useState<'projects' | 'profile' | 'seo' | 'blog'>('projects')
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [seo, setSeo] = useState<SeoSettings | null>(initialSeo)
  const [posts, setPosts] = useState<BlogPostSummary[]>(initialPosts)

  const accent = accentColor

  const tabs: Array<{ key: typeof tab; label: string }> = [
    { key: 'projects', label: 'Projects' },
    { key: 'profile',  label: 'Profile & Sections' },
    { key: 'seo',      label: 'SEO' },
    { key: 'blog',     label: 'Blog' },
  ]

  return (
    <div className="page-pad">
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', fontFamily: "'DM Mono', monospace", marginBottom: 20 }}>
        <div style={{ width: 20, height: 1, background: 'var(--gold)' }} /> Portfolio Manager
      </div>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 400, color: 'var(--cream)', marginBottom: 4 }}>
        Living Portfolio
      </h1>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 32 }}>
        Manage your projects, SEO settings, and blog — all feed into your public portfolio.
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 32 }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '10px 20px', fontSize: 12,
              color: tab === t.key ? accent : 'var(--muted)',
              borderBottom: tab === t.key ? `2px solid ${accent}` : '2px solid transparent',
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: '0.06em', marginBottom: -1,
              transition: 'color 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'projects' && (
        <ProjectsPanel projects={projects} setProjects={setProjects} accent={accent} />
      )}
      {tab === 'profile' && (
        <ProfileSectionsPanel accent={accent} />
      )}
      {tab === 'seo' && (
        <SeoPanel seo={seo} setSeo={setSeo} />
      )}
      {tab === 'blog' && (
        <BlogPanel posts={posts} setPosts={setPosts} username={username} accent={accent} />
      )}
    </div>
  )
}
