/* ═══════════════════════════════════════════════════════════
   ARIA — motion layer
   GSAP + SplitText + Lenis, with a full no-JS/no-CDN fallback.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var touch = !window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  /* ── Fallback: make everything visible if GSAP never arrives ── */
  function showAll() {
    document.querySelectorAll('.js-fade, .js-lines').forEach(function (el) {
      el.style.opacity = '1'; el.style.transform = 'none';
    });
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var v = parseFloat(el.dataset.count), dp = parseInt(el.dataset.dp || '0', 10);
      el.textContent = el.dataset.countText ||
        ((el.dataset.pre || '') +
         v.toLocaleString('en-AU', { minimumFractionDigits: dp, maximumFractionDigits: dp }) +
         (el.dataset.post || ''));
    });
    document.querySelectorAll('.bar-fill').forEach(function (el) { el.style.transform = 'scaleX(1)'; });
    var sc = document.getElementById('heroScrollCue'); if (sc) sc.style.opacity = '1';
    var fg = document.getElementById('heroFg'); if (fg) fg.style.opacity = '1';
    document.querySelectorAll('[data-in]').forEach(function (el) {
      el.style.opacity = '1'; el.style.transform = 'none';
    });
    if (window.__ariaOpenNav) window.__ariaOpenNav();
  }

  function waitAndBoot(n) {
    if (window.gsap) { boot(); return; }
    if (n > 70) { showAll(); return; }
    setTimeout(function () { waitAndBoot(n + 1); }, 70);
  }

  function boot() {
    if (window.SplitText) { try { gsap.registerPlugin(SplitText); } catch (e) {} }

    /* ── Lenis smooth scroll, desktop only ── */
    var lenis = null;
    if (!touch && !reduced && window.Lenis) {
      lenis = new Lenis({ duration: 1.15, lerp: .085, smoothWheel: true, autoRaf: false });
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      lenis.on('scroll', function () { if (window.__ariaNavScroll) window.__ariaNavScroll(); });
      /* in-page anchors must go through Lenis or they jump */
      document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
          var t = document.querySelector(a.getAttribute('href'));
          if (!t) return;
          e.preventDefault();
          lenis.scrollTo(t, { offset: -90 });
        });
      });
    }

    /* ── Custom cursor ── */
    if (!touch) {
      var dot = document.getElementById('curDot'), ring = document.getElementById('curRing');
      if (dot && ring) {
        var dx = gsap.quickTo(dot, 'x', { duration: .07, ease: 'none' });
        var dy = gsap.quickTo(dot, 'y', { duration: .07, ease: 'none' });
        var rx = gsap.quickTo(ring, 'x', { duration: .4, ease: 'power3.out' });
        var ry = gsap.quickTo(ring, 'y', { duration: .4, ease: 'power3.out' });
        window.addEventListener('mousemove', function (e) {
          dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
        });
        document.querySelectorAll('a, button, [data-hover]').forEach(function (el) {
          el.addEventListener('mouseenter', function () {
            ring.style.width = '58px'; ring.style.height = '58px';
            ring.style.marginLeft = '-29px'; ring.style.marginTop = '-29px';
            ring.style.background = 'rgba(44,74,115,.09)';
          });
          el.addEventListener('mouseleave', function () {
            ring.style.width = '38px'; ring.style.height = '38px';
            ring.style.marginLeft = '-19px'; ring.style.marginTop = '-19px';
            ring.style.background = 'transparent';
          });
        });
      }
    }

    /* ── Magnetic buttons ── */
    if (!touch && !reduced) {
      document.querySelectorAll('[data-magnetic], .btn-primary, .btn-signal, .nav-cta').forEach(function (el) {
        var xQ = gsap.quickTo(el, 'x', { duration: .4, ease: 'power3.out' });
        var yQ = gsap.quickTo(el, 'y', { duration: .4, ease: 'power3.out' });
        el.addEventListener('mousemove', function (e) {
          var r = el.getBoundingClientRect();
          xQ((e.clientX - r.left - r.width / 2) * .28);
          yQ((e.clientY - r.top - r.height / 2) * .28);
        });
        el.addEventListener('mouseleave', function () { xQ(0); yQ(0); });
      });
    }

    /* ── Link underline sweep ── */
    document.querySelectorAll('.nav-links a, .footer-links a, [data-underline]').forEach(function (el) {
      el.style.position = 'relative';
      var u = document.createElement('span');
      u.style.cssText = 'position:absolute;left:0;right:0;bottom:-3px;height:1px;background:currentColor;transform:scaleX(0);transform-origin:left center;pointer-events:none';
      el.appendChild(u);
      el.addEventListener('mouseenter', function () {
        u.style.transformOrigin = 'left center';
        gsap.to(u, { scaleX: 1, duration: .34, ease: 'power2.out' });
      });
      el.addEventListener('mouseleave', function () {
        u.style.transformOrigin = 'right center';
        gsap.to(u, { scaleX: 0, duration: .34, ease: 'power2.out' });
      });
    });

    /* ── SplitText line masks on big headings ── */
    if (!reduced && window.SplitText) {
      document.querySelectorAll('.js-lines').forEach(function (el) {
        try {
          var sp = new SplitText(el, { type: 'lines', mask: 'lines' });
          el._lines = sp.lines;
          gsap.set(sp.lines, { yPercent: 110 });
        } catch (e) {}
      });
    }

    /* ── Reveal on scroll ── */
    function reveal(el) {
      if (el._lines) {
        gsap.fromTo(el._lines, { yPercent: 110 }, { yPercent: 0, duration: .9, ease: 'power4.out', stagger: .1 });
        el.style.opacity = '1';
        return;
      }
      var kids = el.dataset.stagger
        ? Array.prototype.slice.call(el.querySelectorAll(el.dataset.stagger))
        : null;
      if (kids && kids.length) {
        gsap.fromTo(kids, { opacity: 0, y: 28 }, { opacity: 1, y: 0, stagger: .09, duration: .7, ease: 'power2.out' });
        el.style.opacity = '1';
        return;
      }
      gsap.fromTo(el, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: .75, ease: 'power2.out' });
    }

    if (!reduced) {
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          if (!en.isIntersecting) return;
          io.unobserve(en.target);
          reveal(en.target);
        });
      }, { rootMargin: '0px 0px -7% 0px', threshold: .06 });
      document.querySelectorAll('.js-fade, .js-lines').forEach(function (el) { io.observe(el); });

      /* Count-up */
      var cio = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          if (!en.isIntersecting) return;
          cio.unobserve(en.target);
          var el = en.target;
          var target = parseFloat(el.dataset.count);
          var dp = parseInt(el.dataset.dp || '0', 10);
          var pre = el.dataset.pre || '', post = el.dataset.post || '';
          var o = { v: 0 };
          function fmt(v) {
            return pre + v.toLocaleString('en-AU', { minimumFractionDigits: dp, maximumFractionDigits: dp }) + post;
          }
          gsap.to(o, {
            v: target, duration: 1.7, ease: 'power2.out',
            onUpdate: function () { el.textContent = fmt(o.v); },
            onComplete: function () { el.textContent = el.dataset.countText || fmt(target); }
          });
        });
      }, { rootMargin: '0px 0px -7% 0px', threshold: .1 });
      document.querySelectorAll('[data-count]').forEach(function (el) { cio.observe(el); });

      /* Bars grow */
      var bio = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          if (!en.isIntersecting) return;
          bio.unobserve(en.target);
          var bars = en.target.querySelectorAll('.bar-fill, .bar-fill-abs');
          gsap.fromTo(bars, { scaleX: 0 }, { scaleX: 1, duration: .95, ease: 'power3.out', stagger: .06 });
        });
      }, { rootMargin: '0px 0px -7% 0px', threshold: .12 });
      document.querySelectorAll('[data-bars]').forEach(function (el) { bio.observe(el); });
    } else {
      showAll();
    }

    /* ── Hero entrance ──
       No intro sequence: the content simply staggers in and the nav pill opens.
       A 1.6s cinematic on a page people revisit is a cost, not a delight. */
    (function heroIn() {
      var fg = document.getElementById('heroFg');
      var cue = document.getElementById('heroScrollCue');
      var inEls = fg ? Array.prototype.slice.call(fg.querySelectorAll('[data-in]')) : [];

      function settle() {
        if (fg) fg.style.opacity = '1';
        inEls.forEach(function (el) { el.style.opacity = '1'; el.style.transform = 'none'; });
        if (cue) cue.style.opacity = '1';
        if (window.__ariaOpenNav) window.__ariaOpenNav();
      }
      if (!fg) { if (window.__ariaOpenNav) setTimeout(window.__ariaOpenNav, 180); return; }
      if (reduced) { settle(); return; }

      fg.style.opacity = '1';
      inEls.forEach(function (el) { el.style.opacity = '0'; el.style.transform = 'translateY(20px)'; });
      requestAnimationFrame(function () {
        inEls.forEach(function (el, i) {
          el.style.transition = 'opacity .55s var(--ease-out), transform .55s var(--ease-out)';
          el.style.transitionDelay = (i * 0.06) + 's';
          el.style.opacity = '1';
          el.style.transform = 'none';
        });
        if (cue) { cue.style.transitionDelay = '.5s'; cue.style.opacity = '1'; }
        setTimeout(function () { if (window.__ariaOpenNav) window.__ariaOpenNav(); }, 420);
      });
    })();
  }

  waitAndBoot(0);
})();

/* ═══════════════════════════════════════════════════════════
   ARIA — chart helpers (no dependency on GSAP)
   ═══════════════════════════════════════════════════════════ */
window.ariaBars = function (elId, rows, opts) {
  var el = document.getElementById(elId);
  if (!el) return;
  opts = opts || {};
  var max = opts.max || Math.max.apply(null, rows.map(function (r) { return Math.abs(r[1]); }));
  el.setAttribute('data-bars', '');
  el.innerHTML = rows.map(function (r) {
    var pct = max ? (Math.abs(r[1]) / max * 100) : 0;
    var col = typeof opts.colour === 'function' ? opts.colour(r) : (opts.colour || 'var(--accent)');
    return '<div class="bar-row">' +
        '<div class="bar-lab">' + r[0] + '</div>' +
        '<div class="bar-track"><div class="bar-fill" style="width:' + pct.toFixed(1) + '%;background:' + col + ';"></div></div>' +
        '<div class="bar-val">' + r[2] + '</div>' +
      '</div>';
  }).join('');
};
