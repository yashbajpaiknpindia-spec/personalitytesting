// src/app/api/user-websites/[id]/route.ts
// GET    /api/user-websites/[id] , fetch full website (including htmlContent)
// PATCH  /api/user-websites/[id] , update name / html / publish / domain / adminNote
// DELETE /api/user-websites/[id] , delete

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


async function getWebsite(id: string, userId: string) {
  return db.userWebsite.findFirst({ where: { id, userId } })
}

// ── GET ───────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Admin can fetch any website
  const isAdmin = session.user.email === 'yashbajpaiknpindia@gmail.com'

  const website = isAdmin
    ? await db.userWebsite.findUnique({
        where: { id: params.id },
        include: { user: { select: { id: true, name: true, email: true } } },
      })
    : await getWebsite(params.id, session.user.id)

  if (!website) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ website })
}

// ── PATCH ─────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isAdmin = session.user.email === 'yashbajpaiknpindia@gmail.com'
  const existing = isAdmin
    ? await db.userWebsite.findUnique({ where: { id: params.id } })
    : await getWebsite(params.id, session.user.id)

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { name, htmlContent, isPublished, customDomain, domainVerified, adminNote, prompt } = body

  const updated = await db.userWebsite.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined        && { name }),
      ...(htmlContent !== undefined && { htmlContent: injectLeadCapture(htmlContent, existing.userId, existing.slug || existing.id) }),
      ...(isPublished !== undefined && { isPublished }),
      ...(customDomain !== undefined && { customDomain: customDomain || null }),
      ...(domainVerified !== undefined && isAdmin && { domainVerified }),
      ...(adminNote !== undefined && isAdmin && { adminNote }),
      ...(prompt !== undefined && isAdmin && { prompt: prompt || null }),
    },
  })

  return NextResponse.json({ website: updated })
}

// ── DELETE ────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isAdmin = session.user.email === 'yashbajpaiknpindia@gmail.com'
  const existing = isAdmin
    ? await db.userWebsite.findUnique({ where: { id: params.id } })
    : await getWebsite(params.id, session.user.id)

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.userWebsite.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
