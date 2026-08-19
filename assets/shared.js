/* ═══════════════════════════════════════════════════════════
   ARIA — shared chrome: theme, cursor, glass pill nav, footer
   Runs before main.js (motion). No dependencies.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var THEME_KEY = 'aria-theme';
  /* Inter ships neither U+2600 nor U+263D, so the old text glyphs rendered as tofu. */
  var SUN_SVG  = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var MOON_SVG = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  var root = document.documentElement;
  var touch = !window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ── Theme (applied before paint via the inline head snippet; this re-syncs) ── */
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    var btn = document.getElementById('themeToggle');
    if (btn) {

      btn.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  }

  /* ── Custom cursor ── */
  if (!touch) {
    document.body.classList.add('has-cursor');
    var dot = document.createElement('div'); dot.className = 'cur-dot'; dot.id = 'curDot';
    var ring = document.createElement('div'); ring.className = 'cur-ring'; ring.id = 'curRing';
    document.body.appendChild(dot); document.body.appendChild(ring);
  }

  /* ── Nav ──
     Three sections. Each owns its subpages, and the sub-nav only appears when
     you are inside one, so the top bar never grows past five items. */
  var SECTIONS = [
    { href: 'aria.html',     label: 'ARIA',
      sub: [['aria.html','Platform'], ['positioning.html','Where it fits'], ['research.html','Research']] },
    { href: 'insights.html', label: 'Insights',
      sub: [] },
    { href: 'about.html',    label: 'About',
      sub: [['about.html','Profile'], ['gses.html','GSES work']] }
  ];
  var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  function sectionOf(page) {
    for (var i = 0; i < SECTIONS.length; i++) {
      var sec = SECTIONS[i];
      if (sec.href === page) return sec;
      for (var j = 0; j < sec.sub.length; j++) {
        if (sec.sub[j][0].split('#')[0] === page) return sec;
      }
    }
    return null;
  }
  var current = sectionOf(here);

  var nav = document.createElement('nav');
  nav.className = 'nav';
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main navigation');
  nav.innerHTML =
    '<a class="nav-logo" href="index.html"><span class="mark"></span><span>ARIA<em>Energy</em></span></a>' +
    '<ul class="nav-links" id="navLinks" role="list">' +
      '<li><a href="index.html"' + (here === 'index.html' ? ' class="active"' : '') + '>Home</a></li>' +
      SECTIONS.map(function (sec) {
        var active = (current === sec) ? ' class="active"' : '';
        return '<li><a href="' + sec.href + '"' + active + '>' + sec.label + '</a></li>';
      }).join('') +
    '</ul>' +
    '<button class="theme-toggle" id="themeToggle" type="button" aria-label="Toggle theme">' + MOON_SVG + '</button>' +
    '<a class="nav-cta" id="navCta" href="contact.html">Get in touch</a>' +
    '<button class="nav-burger" id="navBurger" type="button" aria-label="Toggle navigation" aria-expanded="false">' +
      '<svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">' +
      '<rect y="3" width="20" height="2" rx="1"/><rect y="9" width="20" height="2" rx="1"/><rect y="15" width="20" height="2" rx="1"/>' +
      '</svg></button>';

  var main = document.querySelector('.main') || document.body.firstElementChild;
  document.body.insertBefore(nav, main);

  /* Section sub-nav — only inside a section, and only if it has more than one page. */
  if (current && current.sub.length > 1) {
    var sub = document.createElement('div');
    sub.className = 'subnav';
    sub.innerHTML =
      '<div class="subnav-inner">' +
        '<span class="subnav-label">' + current.label + '</span>' +
        current.sub.map(function (s) {
          var page = s[0].split('#')[0];
          var on = (page === here && s[0].indexOf('#') === -1) ? ' aria-current="page"' : '';
          return '<a href="' + s[0] + '"' + on + '>' + s[1] + '</a>';
        }).join('') +
      '</div>';
    main.insertBefore(sub, main.firstChild);
    document.body.classList.add('has-subnav');
  }

  applyTheme(localStorage.getItem(THEME_KEY) || 'light');

  document.getElementById('themeToggle').addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  });

  /* Mobile menu */
  var burger = document.getElementById('navBurger');
  var links = document.getElementById('navLinks');
  burger.addEventListener('click', function () {
    var open = links.classList.toggle('mobile-open');
    burger.setAttribute('aria-expanded', String(open));
  });
  links.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      links.classList.remove('mobile-open');
      burger.setAttribute('aria-expanded', 'false');
    }
  });

  /* Nav background on scroll — motion.js drives this via Lenis when available */
  function onScroll() {
    var y = window.scrollY || root.scrollTop || 0;
    nav.classList.toggle('scrolled', y > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  window.__ariaNavScroll = onScroll;

  /* ── Footer ── */
  var footer = document.createElement('footer');
  footer.className = 'footer';
  footer.innerHTML =
    '<div class="footer-inner">' +
      '<div>' +
        '<div class="footer-brand"><span class="mark"></span><span>ARIA<em>Energy</em></span></div>' +
        '<div class="footer-copy" style="margin-top:6px;">Advanced Renewable Intelligent Analytics Energy</div>' +
      '</div>' +
      '<div class="footer-links">' +
        '<a href="aria.html">ARIA</a>' +
        '<a href="research.html">Research</a>' +
        '<a href="insights.html">Insights</a>' +
        '<a href="about.html">About</a>' +
        '<a href="contact.html">Contact</a>' +
        '<a href="https://linkedin.com/in/kanavverma" target="_blank" rel="noopener">LinkedIn</a>' +
      '</div>' +
      '<div class="footer-copy">&copy; ' + new Date().getFullYear() + ' Kanav Verma &middot; Data sourced from AEMO</div>' +
    '</div>';
  document.body.appendChild(footer);

  /* ── Nav pill: open the links after first paint (motion.js re-times this on the hero) ── */
  window.__ariaOpenNav = function () { links.classList.add('open'); };
  if (!document.querySelector('.hero')) {
    requestAnimationFrame(function () { setTimeout(window.__ariaOpenNav, 120); });
  }
})();
