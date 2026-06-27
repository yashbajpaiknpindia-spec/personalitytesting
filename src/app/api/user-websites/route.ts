// src/app/api/user-websites/route.ts
// GET  /api/user-websites       , list current user's websites
// POST /api/user-websites       , save a new website (sample or AI-generated)

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { db } from '@/lib/db'


function ensureEmailFieldInForms(html: string): string {
  const emailInput = '<input type="email" name="email" aria-label="Email" placeholder="Email" autocomplete="email" data-bs-injected-email="true" />'
  return html.replace(/<form\b([^>]*)>([\s\S]*?)<\/form>/gi, (match, attrs, inner) => {
    if (/type=["']email["']|name=["']email["']|aria-label=["']email["']|placeholder=["']email["']/i.test(inner)) return match
    let nextInner = inner
    if (/<textarea\b/i.test(nextInner)) {
      nextInner = nextInner.replace(/<textarea\b/i, `${emailInput}<textarea`)
    } else if (/<button\b/i.test(nextInner)) {
      nextInner = nextInner.replace(/<button\b/i, `${emailInput}<button`)
    } else if (/<input\b/i.test(nextInner)) {
      nextInner = `${nextInner}${emailInput}`
    } else {
      nextInner = `${emailInput}${nextInner}`
    }
    return `<form${attrs}>${nextInner}</form>`
  })
}

function removeDeadFormHandlers(html: string): string {
  return ensureEmailFieldInForms(html)
    .replace(/\s+onsubmit=["']return\s+false;?["']/gi, '')
    .replace(/\s+onsubmit=["']event\.preventDefault\(\);?["']/gi, '')
}

function injectLeadCapture(html: string, ownerId: string, slug: string): string {
  let clean = removeDeadFormHandlers(html)
  if (!/<form\b/i.test(clean)) return clean

  clean = clean.replace(/<script\b[^>]*id=["']bs-lead-capture-script["'][\s\S]*?<\/script>/gi, '')
  clean = clean.replace(/<form\b(?![^>]*data-bs-lead-form)/gi, '<form data-bs-lead-form="true"')

  const script = `
<script id="bs-lead-capture-script">
(function(){
  var OWNER_ID = ${JSON.stringify(ownerId)};
  var SOURCE_SLUG = ${JSON.stringify(`website:${slug}`)};

  function clean(v){ return (v == null ? '' : String(v)).trim(); }
  function formFields(form){ return Array.prototype.slice.call(form.querySelectorAll('input, textarea, select')); }
  function findValue(form, hints){
    var fields = formFields(form);
    for (var i=0;i<fields.length;i++){
      var el = fields[i];
      var hay = [
        el.getAttribute('name'), el.getAttribute('id'), el.getAttribute('placeholder'),
        el.getAttribute('aria-label'), el.getAttribute('type')
      ].map(clean).join(' ').toLowerCase();
      for (var j=0;j<hints.length;j++){
        if (hay.indexOf(hints[j]) !== -1) return clean(el.value);
      }
    }
    return '';
  }
  function setStatus(form, text, ok){
    var box = form.querySelector('[data-bs-lead-status]');
    if(!box){
      box = document.createElement('div');
      box.setAttribute('data-bs-lead-status','true');
      box.style.marginTop = '10px';
      box.style.fontSize = '13px';
      box.style.lineHeight = '1.45';
      box.style.color = ok ? '#16a34a' : '#dc2626';
      form.appendChild(box);
    }
    box.style.color = ok ? '#16a34a' : '#dc2626';
    box.textContent = text;
  }

  document.addEventListener('submit', function(event){
    var form = event.target;
    if(!form || !form.matches || !form.matches('form')) return;
    if(form.getAttribute('data-bs-native-submit') === 'true') return;
    event.preventDefault();

    var name = findValue(form, ['name', 'full name', 'your name']) || 'Website Visitor';
    var email = findValue(form, ['email', 'mail']);
    var phone = findValue(form, ['phone', 'mobile', 'whatsapp', 'contact', 'number']);
    var company = findValue(form, ['company', 'business', 'organisation', 'organization', 'brand']);
    var message = findValue(form, ['message', 'requirement', 'details', 'project', 'tell us']);
    if(message && !company) company = message.slice(0, 120);

    if(!email && !phone){
      setStatus(form, 'Please enter email or phone so we can contact you.', false);
      return;
    }

    var submitBtn = form.querySelector('button[type="submit"], button:not([type]), input[type="submit"]');
    var oldText = submitBtn ? (submitBtn.value || submitBtn.textContent || '') : '';
    if(submitBtn){
      submitBtn.disabled = true;
      if(submitBtn.tagName === 'INPUT') submitBtn.value = 'Sending...';
      else submitBtn.textContent = 'Sending...';
    }

    fetch('/api/card/capture-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerId: OWNER_ID,
        sourceSlug: SOURCE_SLUG,
        name: name,
        email: email || '',
        phone: phone || '',
        company: company || ''
      })
    }).then(function(res){
      if(!res.ok) throw new Error('Lead capture failed');
      setStatus(form, 'Thanks — your enquiry has been sent.', true);
      try { form.reset(); } catch(e){}
    }).catch(function(){
      setStatus(form, 'Could not send right now. Please try again.', false);
    }).finally(function(){
      if(submitBtn){
        submitBtn.disabled = false;
        if(submitBtn.tagName === 'INPUT') submitBtn.value = oldText || 'Submit';
        else submitBtn.textContent = oldText || 'Submit';
      }
    });
  }, true);
})();
</script>`

  if (/<\/body>/i.test(clean)) return clean.replace(/<\/body>/i, script + '\n</body>')
  return clean + script
}


// ── GET: list all websites for the current user ───────────────────────────
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const websites = await db.userWebsite.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, templateId: true, templateLabel: true,
      isGenerated: true, isPublished: true, slug: true, customDomain: true,
      domainVerified: true, prompt: true, createdAt: true, updatedAt: true,
      // Omit htmlContent in list to keep response small
    },
  })

  return NextResponse.json({ websites })
}

// ── POST: save a new website ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, templateId, templateLabel, htmlContent, isGenerated, isPublished: isPublishedInput, prompt } = await req.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }
  if (!htmlContent?.trim()) {
    return NextResponse.json({ error: 'htmlContent is required' }, { status: 400 })
  }

  // Dedup: if this exact templateId already saved for user, return existing record
  if (templateId) {
    const existing = await db.userWebsite.findFirst({
      where: { userId: session.user.id, templateId },
    })
    if (existing) {
      return NextResponse.json({ website: existing }, { status: 200 })
    }
  }

  // Generate a unique slug from the company name
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  let slug = base
  let suffix = 0
  while (await db.userWebsite.findUnique({ where: { slug } })) {
    suffix++
    slug = `${base}-${suffix}`
  }

  // Auto-publish: all new websites (template or AI-generated) are live by default
  const autoPublish = isPublishedInput !== false  // explicit false = draft, otherwise publish

  const website = await db.userWebsite.create({
    data: {
      userId:        session.user.id,
      name:          name.trim(),
      templateId:    templateId ?? null,
      templateLabel: templateLabel ?? null,
      htmlContent:    injectLeadCapture(htmlContent, session.user.id, slug),
      isGenerated:   isGenerated ?? false,
      isPublished:   autoPublish,
      prompt:        typeof prompt === 'string' && prompt.trim() ? prompt.trim().slice(0, 2000) : null,
      slug,
    },
  })

  return NextResponse.json({ website }, { status: 201 })
}
