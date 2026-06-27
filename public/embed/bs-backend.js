/**
 * bs-backend.js — Brand Syndicate embed script
 * Injected at serve-time into every /w/[slug] website output.
 *
 * Capabilities:
 *   1. Contact form capture  → POST /api/website/:id/contact
 *   2. Booking form capture  → POST /api/website/:id/book
 *   3. Blog section render   → GET  /api/website/:id/blog
 *
 * Zero dependencies. Runs after DOMContentLoaded.
 * Does NOT touch anything outside form/blog containers —
 * intentionally silent on pages without those elements.
 */
(function () {
  'use strict';

  // ── Read site-id from the script tag itself ──────────────────────────────
  var scriptEl = document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();

  var SITE_ID = scriptEl && scriptEl.getAttribute('data-site-id');
  if (!SITE_ID) return; // Guard: no id = do nothing

  var BASE = '/api/website/' + SITE_ID;

  // ── Utilities ─────────────────────────────────────────────────────────────

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }
  function qsa(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  // Classify a <form> element
  // Returns 'contact' | 'book' | null
  function classifyForm(form) {
    var attr = form.getAttribute('data-bs-form');
    if (attr === 'contact') return 'contact';
    if (attr === 'book')    return 'book';

    // Heuristic: date/time inputs or booking keywords → booking
    var hasDateOrTime = !!qs('input[type="date"], input[type="time"], input[type="datetime-local"]', form);
    var text = (form.id + ' ' + form.className + ' ' + (form.getAttribute('name') || '')).toLowerCase();
    var bookingKeywords = ['book', 'appointment', 'reserve', 'schedule', 'slot'];
    var isBooking = hasDateOrTime || bookingKeywords.some(function (k) { return text.indexOf(k) !== -1; });
    if (isBooking) return 'book';

    // Heuristic: any email input → contact
    if (qs('input[type="email"], input[name="email"], input[placeholder*="mail" i]', form)) return 'contact';

    return null;
  }

  // Serialize form fields into a plain object
  function serializeForm(form) {
    var data = {};
    qsa('input, textarea, select', form).forEach(function (el) {
      var key = el.name || el.id || el.getAttribute('placeholder') || '';
      var val = el.value ? el.value.trim() : '';
      if (!key || !val) return;
      var k = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (k === 'name' || k === 'fullname' || k === 'yourname')      data.name    = val;
      else if (k === 'email' || k === 'emailaddress')                data.email   = val;
      else if (k === 'phone' || k === 'mobile' || k === 'tel')       data.phone   = val;
      else if (k === 'company' || k === 'business' || k === 'org')   data.company = val;
      else if (k === 'message' || k === 'msg' || k === 'notes')      data.message = val;
      else if (k === 'date' || k === 'appointmentdate')              data.date    = val;
      else if (k === 'time' || k === 'appointmenttime')              data.time    = val;
      else if (k === 'service' || k === 'services' || k === 'type')  data.service = val;
      else if (k === 'subject')                                       data.subject = val;
      // Fall through: store under original key (won't break anything)
      else data[k] = val;
    });
    return data;
  }

  // Show inline feedback on the form
  function showFormFeedback(form, success, msg) {
    var existing = form.querySelector('.bs-feedback');
    if (existing) existing.remove();
    var el = document.createElement('div');
    el.className = 'bs-feedback';
    el.style.cssText = [
      'margin-top:12px',
      'padding:10px 16px',
      'border-radius:6px',
      'font-size:13px',
      'font-family:inherit',
      'line-height:1.5',
      success
        ? 'background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.35);color:#34d399'
        : 'background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#f87171',
    ].join(';');
    el.textContent = msg;
    form.appendChild(el);
    // Auto-clear success message after 8 s
    if (success) setTimeout(function () { el.remove(); }, 8000);
  }

  // Disable / enable a submit button
  function setSubmitting(form, isSubmitting) {
    var btn = qs('[type="submit"], button:not([type])', form);
    if (!btn) return;
    btn.disabled = isSubmitting;
    if (isSubmitting) {
      btn._bsOrigText = btn.textContent;
      btn.textContent = 'Sending…';
    } else {
      if (btn._bsOrigText) btn.textContent = btn._bsOrigText;
    }
  }

  // Generic API POST
  function apiPost(path, payload, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', path);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
      try {
        var json = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) cb(null, json);
        else cb(json.error || 'Error ' + xhr.status, null);
      } catch (e) {
        cb('Unexpected server response', null);
      }
    };
    xhr.onerror = function () { cb('Network error', null); };
    xhr.send(JSON.stringify(payload));
  }

  // ── 1. Form interception ─────────────────────────────────────────────────

  function bindForms() {
    qsa('form').forEach(function (form) {
      var type = classifyForm(form);
      if (!type) return;

      // Mark so we don't double-bind
      if (form.getAttribute('data-bs-bound')) return;
      form.setAttribute('data-bs-bound', '1');

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var fields = serializeForm(form);

        // Basic validation
        if (!fields.email) {
          showFormFeedback(form, false, 'Please enter a valid email address.');
          return;
        }
        if (!fields.name) {
          showFormFeedback(form, false, 'Please enter your name.');
          return;
        }

        setSubmitting(form, true);

        var endpoint = BASE + '/' + type; // /api/website/:id/contact or /book
        var payload = type === 'book'
          ? {
              name:    fields.name,
              email:   fields.email,
              phone:   fields.phone  || '',
              date:    fields.date   || '',
              time:    fields.time   || '',
              service: fields.service || fields.subject || '',
              message: fields.message || '',
            }
          : {
              name:    fields.name,
              email:   fields.email,
              phone:   fields.phone  || '',
              company: fields.company || '',
              message: fields.message || fields.subject || '',
            };

        apiPost(endpoint, payload, function (err) {
          setSubmitting(form, false);
          if (err) {
            showFormFeedback(form, false, 'Something went wrong. Please try again or email us directly.');
          } else {
            showFormFeedback(form, true, type === 'book'
              ? '✓ Booking request received! We\'ll confirm your appointment shortly.'
              : '✓ Message received! We\'ll get back to you soon.');
            form.reset();
          }
        });
      });
    });
  }

  // ── 2. Blog section rendering ────────────────────────────────────────────

  function renderBlog() {
    var containers = qsa('[data-bs-blog], .bs-blog-section, #bs-blog');
    if (!containers.length) return;

    var xhr = new XMLHttpRequest();
    xhr.open('GET', BASE + '/blog');
    xhr.onload = function () {
      if (xhr.status !== 200) return;
      try {
        var data = JSON.parse(xhr.responseText);
        var posts = (data.posts || []).slice(0, 6);
        if (!posts.length) return;

        containers.forEach(function (container) {
          container.innerHTML = buildBlogHtml(posts);
        });
      } catch (e) {}
    };
    xhr.send();
  }

  function buildBlogHtml(posts) {
    var gridStyle = [
      'display:grid',
      'grid-template-columns:repeat(auto-fill,minmax(280px,1fr))',
      'gap:24px',
      'padding:0',
      'list-style:none',
    ].join(';');

    var cardStyle = [
      'background:rgba(255,255,255,0.03)',
      'border:1px solid rgba(255,255,255,0.08)',
      'border-radius:10px',
      'overflow:hidden',
      'transition:border-color 0.2s',
      'cursor:pointer',
    ].join(';');

    var items = posts.map(function (p) {
      var cover = p.coverImageUrl
        ? '<img src="' + p.coverImageUrl + '" alt="' + escHtml(p.title) + '" style="width:100%;height:180px;object-fit:cover;display:block;">'
        : '';
      var date = p.publishedAt
        ? new Date(p.publishedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
        : '';
      var excerpt = p.excerpt ? escHtml(p.excerpt.slice(0, 100)) + '…' : '';
      return [
        '<li style="' + cardStyle + '">',
        cover,
        '<div style="padding:20px 24px">',
        '<p style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.45;margin:0 0 8px">' + date + '</p>',
        '<h3 style="font-size:16px;font-weight:600;margin:0 0 8px;line-height:1.4">' + escHtml(p.title) + '</h3>',
        excerpt ? '<p style="font-size:13px;opacity:0.6;margin:0;line-height:1.6">' + excerpt + '</p>' : '',
        '</div>',
        '</li>',
      ].join('');
    }).join('');

    return '<ul style="' + gridStyle + '">' + items + '</ul>';
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Bootstrap on DOM ready ───────────────────────────────────────────────

  function init() {
    bindForms();
    renderBlog();
    // Re-bind forms if dynamic content is injected later (e.g. modal tabs)
    var observer = new MutationObserver(function () { bindForms(); });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
