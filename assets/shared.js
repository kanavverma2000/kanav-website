/* ═══════════════════════════════════════════════════════════
   ARIA — shared chrome: theme, cursor, glass pill nav, footer
   Runs before main.js (motion). No dependencies.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var THEME_KEY = 'aria-theme';
  var root = document.documentElement;
  var touch = !window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ── Theme (applied before paint via the inline head snippet; this re-syncs) ── */
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    var btn = document.getElementById('themeToggle');
    if (btn) {
      btn.textContent = t === 'dark' ? '☀' : '☽';
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

  /* ── Nav ── */
  var PAGES = [
    ['index.html', 'Home'],
    ['research.html', 'Research'],
    ['positioning.html', 'Positioning'],
    ['platform.html', 'Platform'],
    ['about.html', 'About']
  ];
  var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  var nav = document.createElement('nav');
  nav.className = 'nav';
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main navigation');
  nav.innerHTML =
    '<a class="nav-logo" href="index.html"><span class="mark"></span><span>ARIA</span></a>' +
    '<ul class="nav-links" id="navLinks" role="list">' +
      PAGES.map(function (p) {
        var active = p[0].toLowerCase() === here ? ' class="active"' : '';
        return '<li><a href="' + p[0] + '"' + active + '>' + p[1] + '</a></li>';
      }).join('') +
    '</ul>' +
    '<button class="theme-toggle" id="themeToggle" type="button" aria-label="Toggle theme">☽</button>' +
    '<a class="nav-cta" id="navCta" href="contact.html">Get in touch</a>' +
    '<button class="nav-burger" id="navBurger" type="button" aria-label="Toggle navigation" aria-expanded="false">' +
      '<svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">' +
      '<rect y="3" width="20" height="2" rx="1"/><rect y="9" width="20" height="2" rx="1"/><rect y="15" width="20" height="2" rx="1"/>' +
      '</svg></button>';

  var main = document.querySelector('.main') || document.body.firstElementChild;
  document.body.insertBefore(nav, main);

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
        '<div class="footer-brand"><span class="mark"></span><span>ARIA</span></div>' +
        '<div class="footer-copy" style="margin-top:6px;">Counterfactual analytics for the National Electricity Market</div>' +
      '</div>' +
      '<div class="footer-links">' +
        '<a href="research.html">Research</a>' +
        '<a href="positioning.html">Positioning</a>' +
        '<a href="platform.html">Platform</a>' +
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
