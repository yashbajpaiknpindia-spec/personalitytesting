#!/usr/bin/env python3
"""
Fixes two confirmed bugs across BrandSyndicate's public/samples/*.html templates:

1. .hero-bg image divs with no native CSS -> can blow out hero layout
   Fix: add a real, self-contained .hero-bg rule (absolute, full-bleed, cover)
   that works at ALL widths, not just inside a mobile media query.

2. Nav links hidden below a breakpoint with no native toggle button.
   Fix: inject a self-contained hamburger button + drawer (CSS + inline JS)
   that works without any runtime/server-side script. CTA stays visible,
   only the link list moves into the drawer.

Skips files that already have a working native toggle (`mob-burger` class).
"""
import glob
import re
import sys

SAMPLES_DIR = "public/samples"

# ── 1. hero-bg fix ──────────────────────────────────────────────────────────
HERO_BG_CSS = (
    ".hero-bg{position:absolute;inset:0;width:100%;height:100%;overflow:hidden;z-index:0;}"
    ".hero-bg img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;"
    "object-position:center;}"
    ".hero{position:relative;overflow:hidden;}"
    ".hero>.wrap,.hero>.hero-grid,.hero>div:not(.hero-bg){position:relative;z-index:1;}"
)

# ── 2. native hamburger fix ─────────────────────────────────────────────────
HAMBURGER_CSS_TEMPLATE = """
<style id="bs-native-mobile-nav">
.bs-nm-toggle{display:none;align-items:center;justify-content:center;flex-direction:column;
  gap:4px;width:40px;height:40px;border:1px solid rgba(255,255,255,.18);border-radius:999px;
  background:rgba(255,255,255,.08);cursor:pointer;flex-shrink:0;z-index:1001;margin-left:auto;}
.bs-nm-toggle span{display:block;width:16px;height:2px;background:currentColor;border-radius:2px;
  transition:transform .2s,opacity .2s;}
.bs-nm-toggle.bs-nm-open span:nth-child(1){transform:translateY(6px) rotate(45deg);}
.bs-nm-toggle.bs-nm-open span:nth-child(2){opacity:0;}
.bs-nm-toggle.bs-nm-open span:nth-child(3){transform:translateY(-6px) rotate(-45deg);}
.bs-nm-drawer{display:none;position:fixed;left:12px;right:12px;top:var(--bs-nm-top,70px);
  z-index:1000;padding:14px;border:1px solid rgba(255,255,255,.16);border-radius:18px;
  background:rgba(10,10,10,.97);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
  box-shadow:0 24px 60px rgba(0,0,0,.5);}
.bs-nm-drawer.bs-nm-open{display:grid;gap:8px;}
.bs-nm-drawer a{display:flex!important;align-items:center;justify-content:center;width:100%;
  min-height:44px;padding:11px 14px;border-radius:12px;text-decoration:none;color:#fff!important;
  background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.08);font-size:13px;}
@media(max-width:__BP__px){
  .bs-nm-toggle{display:flex!important;}
}
</style>
"""

DEFAULT_COLLAPSE_BREAKPOINT = 860


def detect_collapse_breakpoint(html, links_class):
    """Find the max-width breakpoint at which this file's own CSS hides the
    nav links container, so the hamburger toggle appears at the same point
    (never leaving a gap where links are hidden but no button is visible)."""
    pattern = re.compile(
        r"@media\s*\(max-width:\s*(\d+)px\)\s*\{([^@]*?)\}(?=\s*(?:@media|</style>|\Z))",
        re.DOTALL,
    )
    found = []
    for m in pattern.finditer(html):
        bp, body = int(m.group(1)), m.group(2)
        if re.search(
            r"(?:^|[^\w-])\.?%s\s*\{[^}]*display:\s*none" % re.escape(links_class),
            body,
        ):
            found.append(bp)
    if found:
        return max(found)  # use the widest breakpoint that hides links, so toggle is never missing
    return DEFAULT_COLLAPSE_BREAKPOINT

HAMBURGER_JS = """
<script id="bs-native-mobile-nav-script">
(function(){
  try{
    function ready(fn){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn(); }
    ready(function(){
      document.querySelectorAll('.bs-nm-toggle').forEach(function(btn){
        var navEl = btn.closest('nav') || btn.parentElement;
        var drawer = document.getElementById(btn.getAttribute('data-drawer'));
        if(!navEl || !drawer) return;
        function positionDrawer(){
          var r = navEl.getBoundingClientRect();
          drawer.style.setProperty('--bs-nm-top', (r.bottom + 6) + 'px');
          drawer.style.top = (r.bottom + 6) + 'px';
        }
        btn.addEventListener('click', function(e){
          e.preventDefault();
          positionDrawer();
          var open = btn.classList.toggle('bs-nm-open');
          drawer.classList.toggle('bs-nm-open', open);
        });
        drawer.querySelectorAll('a').forEach(function(a){
          a.addEventListener('click', function(){
            btn.classList.remove('bs-nm-open');
            drawer.classList.remove('bs-nm-open');
          });
        });
        document.addEventListener('click', function(e){
          if(!navEl.contains(e.target) && !drawer.contains(e.target)){
            btn.classList.remove('bs-nm-open');
            drawer.classList.remove('bs-nm-open');
          }
        });
        window.addEventListener('resize', function(){
          if(drawer.classList.contains('bs-nm-open')) positionDrawer();
        });
      });
    });
  }catch(e){}
})();
</script>
"""

_drawer_counter = [0]


def build_drawer(links_html, file_tag):
    """links_html: list of (href, text) tuples. Returns (toggle_btn_html, drawer_html, drawer_id)."""
    _drawer_counter[0] += 1
    drawer_id = "bsNmDrawer%d" % _drawer_counter[0]
    toggle = (
        '<button type="button" class="bs-nm-toggle" aria-label="Open menu" '
        'data-drawer="%s"><span></span><span></span><span></span></button>' % drawer_id
    )
    links = "".join('<a href="%s">%s</a>' % (href, text) for href, text in links_html)
    drawer = '<div class="bs-nm-drawer" id="%s">%s</div>' % (drawer_id, links)
    return toggle, drawer


def fix_nav(html, fname):
    """Detect nav family (links/brand or nav-links/logo), inject toggle + drawer.
    Returns (new_html, changed_bool, breakpoint)."""
    nav_match = re.search(r"(<nav\b[^>]*>)(.*?)(</nav>)", html, re.DOTALL)
    if not nav_match:
        return html, False, None

    full_nav = nav_match.group(0)

    # Already has a working native toggle -> skip entirely
    if "mob-burger" in full_nav or "bs-nm-toggle" in full_nav:
        return html, False, None

    nav_open, nav_inner, nav_close = nav_match.groups()

    # Family A: bsx templates -> <div class="links">...</div>
    links_div_match = re.search(r'<div class="links">(.*?)</div>', nav_inner, re.DOTALL)
    links_class = "links"
    # Family B: legacy templates -> <div class="nav-links">...</div>
    if links_div_match is None:
        links_div_match = re.search(r'<div class="nav-links">(.*?)</div>', nav_inner, re.DOTALL)
        links_class = "nav-links"

    if links_div_match is None:
        return html, False, None  # unknown structure, don't risk a broken edit

    links_inner = links_div_match.group(1)
    link_pairs = re.findall(r'<a href="([^"]*)"[^>]*>([^<]*)</a>', links_inner)
    if len(link_pairs) < 2:
        return html, False, None

    breakpoint_px = detect_collapse_breakpoint(html, links_class)
    toggle_html, drawer_html = build_drawer(link_pairs, fname)

    # Insert the toggle button right after the links div, before the CTA,
    # so it sits next to the CTA without being swallowed by the links container.
    new_nav_inner = nav_inner.replace(
        links_div_match.group(0), links_div_match.group(0) + toggle_html, 1
    )
    new_full_nav = nav_open + new_nav_inner + nav_close + drawer_html

    new_html = html[: nav_match.start()] + new_full_nav + html[nav_match.end() :]
    return new_html, True, breakpoint_px


def fix_hero_bg(html):
    """Add native .hero-bg CSS if the class is used but never defined in this file's own <style>."""
    if 'class="hero-bg"' not in html:
        return html, False

    # Only look at native <style> blocks (not our own injected ones, which won't exist yet
    # at this point since this is the first script run on originals).
    style_blocks = re.findall(r"<style[^>]*>(.*?)</style>", html, re.DOTALL)
    own_css = "\n".join(
        s for s in style_blocks if "bs-native-mobile-nav" not in s
    )
    if re.search(r"\.hero-bg\s*\{", own_css):
        return html, False  # already has its own definition

    # Inject right after the LAST </style> in <head>, before </head>, as a new style block.
    addition = "<style id=\"bs-native-hero-bg-fix\">%s</style>" % HERO_BG_CSS
    if "</head>" in html:
        new_html = html.replace("</head>", addition + "\n</head>", 1)
        return new_html, True
    return html, False


def inject_hamburger_assets(html, breakpoint_px):
    """Add the shared CSS+JS for hamburger once, before </head> and before </body>."""
    css = HAMBURGER_CSS_TEMPLATE.replace("__BP__", str(breakpoint_px))
    if "</head>" in html:
        html = html.replace("</head>", css + "\n</head>", 1)
    if "</body>" in html:
        html = html.replace("</body>", HAMBURGER_JS + "\n</body>", 1)
    return html


def process_file(path):
    with open(path, encoding="utf-8", errors="ignore") as f:
        html = f.read()
    original = html
    changes = []

    html, hero_changed = fix_hero_bg(html)
    if hero_changed:
        changes.append("hero-bg")

    html, nav_changed, breakpoint_px = fix_nav(html, path)
    if nav_changed:
        html = inject_hamburger_assets(html, breakpoint_px)
        changes.append("nav-hamburger")

    if html != original:
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
    return changes


def main():
    files = sorted(glob.glob(SAMPLES_DIR + "/*.html"))
    summary = {"hero-bg": 0, "nav-hamburger": 0, "untouched": 0, "files": len(files)}
    skipped_nav = []
    for path in files:
        changes = process_file(path)
        if "hero-bg" in changes:
            summary["hero-bg"] += 1
        if "nav-hamburger" in changes:
            summary["nav-hamburger"] += 1
        if not changes:
            summary["untouched"] += 1

    print(summary)


if __name__ == "__main__":
    main()
