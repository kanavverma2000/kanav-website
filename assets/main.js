/* ═══════════════════════════════════════════════════════════
   ARIA — motion layer
   GSAP + SplitText + Lenis, with a full no-JS/no-CDN fallback.
   Adapted from the GSES motion system.
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
      el.textContent = el.dataset.countText || el.dataset.count;
    });
    document.querySelectorAll('.bar-fill').forEach(function (el) { el.style.transform = 'scaleX(1)'; });
    var cv = document.getElementById('heroCanvas'); if (cv) cv.style.opacity = '1';
    var sc = document.getElementById('heroScrollCue'); if (sc) sc.style.opacity = '1';
    var sun = document.getElementById('heroSun'); if (sun) sun.style.opacity = '0';
    var wm = document.getElementById('heroWordmark'); if (wm) wm.style.opacity = '0';
    var fg = document.getElementById('heroFg'); if (fg) fg.style.opacity = '1';
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

    /* ── Hero canvas particle grid ── */
    var cv = document.getElementById('heroCanvas');
    if (cv && !reduced) {
      var ctx = cv.getContext('2d');
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      function fit() {
        cv.width = Math.max(1, cv.clientWidth * dpr);
        cv.height = Math.max(1, cv.clientHeight * dpr);
      }
      fit();
      window.addEventListener('resize', fit);

      function palette() {
        var dark = document.documentElement.getAttribute('data-theme') === 'dark';
        return dark
          ? { line: '127,168,220', node: 'rgba(127,168,220,.6)', hot: 'rgba(228,117,108,.95)' }
          : { line: '44,74,115', node: 'rgba(44,74,115,.55)', hot: 'rgba(172,59,52,.9)' };
      }

      var isNarrow = cv.clientWidth < 600;
      var N = isNarrow
        ? Math.max(12, Math.min(28, Math.floor(cv.clientWidth / 22)))
        : Math.max(28, Math.min(110, Math.floor(cv.clientWidth / 17)));
      var pts = [];
      for (var i = 0; i < N; i++) pts.push({
        x: Math.random() * cv.width, y: Math.random() * cv.height,
        vx: (Math.random() - .5) * .24 * dpr, vy: (Math.random() - .5) * .24 * dpr
      });

      var mouse = { x: -9999, y: -9999 };
      var heroEl = document.querySelector('.hero');
      if (heroEl) {
        heroEl.addEventListener('mousemove', function (e) {
          var r = cv.getBoundingClientRect();
          mouse.x = (e.clientX - r.left) * dpr; mouse.y = (e.clientY - r.top) * dpr;
        });
        heroEl.addEventListener('mouseleave', function () { mouse.x = -9999; mouse.y = -9999; });
      }

      var maxD = 150 * dpr, inflD = 150 * dpr;
      (function frame() {
        var pal = palette();
        ctx.clearRect(0, 0, cv.width, cv.height);
        pts.forEach(function (p) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > cv.width) p.vx *= -1;
          if (p.y < 0 || p.y > cv.height) p.vy *= -1;
          var mdx = p.x - mouse.x, mdy = p.y - mouse.y, md = Math.hypot(mdx, mdy);
          if (md < inflD && md > .001) { p.x += mdx / md * .7; p.y += mdy / md * .7; }
        });
        for (var a = 0; a < pts.length; a++) {
          for (var b = a + 1; b < pts.length; b++) {
            var ddx = pts[a].x - pts[b].x, ddy = pts[a].y - pts[b].y, d = Math.hypot(ddx, ddy);
            if (d < maxD) {
              ctx.strokeStyle = 'rgba(' + pal.line + ',' + ((1 - d / maxD) * .4).toFixed(3) + ')';
              ctx.lineWidth = dpr;
              ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y); ctx.lineTo(pts[b].x, pts[b].y); ctx.stroke();
            }
          }
        }
        pts.forEach(function (p) {
          var near = Math.hypot(p.x - mouse.x, p.y - mouse.y) < inflD;
          ctx.fillStyle = near ? pal.hot : pal.node;
          ctx.beginPath(); ctx.arc(p.x, p.y, (near ? 2.4 : 1.6) * dpr, 0, Math.PI * 2); ctx.fill();
        });
        requestAnimationFrame(frame);
      })();
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
          gsap.to(o, {
            v: target, duration: 1.7, ease: 'power2.out',
            onUpdate: function () { el.textContent = pre + o.v.toFixed(dp) + post; },
            onComplete: function () { el.textContent = el.dataset.countText || (pre + target.toFixed(dp) + post); }
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

    /* ── Hero sunrise intro ── */
    runIntro();

    function runIntro() {
      var hero = document.querySelector('.hero');
      if (!hero) { if (window.__ariaOpenNav) setTimeout(window.__ariaOpenNav, 200); return; }

      var sun = document.getElementById('heroSun');
      var wm = document.getElementById('heroWordmark');
      var fg = document.getElementById('heroFg');
      var inEls = fg ? Array.prototype.slice.call(fg.querySelectorAll('[data-in]')) : [];
      var cue = document.getElementById('heroScrollCue');
      var canvas = document.getElementById('heroCanvas');

      /* Play the intro once per browser per day, like the GSES site. */
      var d = new Date();
      var today = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
      var seen = false;
      try { seen = localStorage.getItem('ariaIntroDate') === today; } catch (e) {}

      function settle() {
        if (sun) sun.style.opacity = '0';
        if (wm) wm.style.opacity = '0';
        if (fg) fg.style.opacity = '1';
        inEls.forEach(function (el) { el.style.opacity = '1'; el.style.transform = 'none'; });
        if (canvas) canvas.style.opacity = '1';
        if (cue) cue.style.opacity = '1';
        if (window.__ariaOpenNav) window.__ariaOpenNav();
      }

      if (reduced || seen) { settle(); return; }
      try { localStorage.setItem('ariaIntroDate', today); } catch (e) {}

      if (sun) { sun.style.transition = 'none'; sun.style.transform = 'scale(1.35)'; sun.style.opacity = '1'; }
      if (wm) { wm.style.transition = 'none'; wm.style.opacity = '0'; wm.style.transform = 'translate(-50%,-50%) scale(.72)'; }
      if (fg) fg.style.opacity = '0';
      inEls.forEach(function (el) { el.style.transition = 'none'; el.style.opacity = '0'; el.style.transform = 'translateY(26px)'; });

      setTimeout(function () {
        if (sun) {
          sun.style.transition = 'transform 1s cubic-bezier(.6,0,.15,1), opacity .4s ease';
          sun.style.transform = 'scale(.44) rotate(12deg)';
        }
      }, 90);

      setTimeout(function () {
        if (wm) {
          wm.style.transition = 'opacity .55s ease, transform .7s cubic-bezier(.16,1,.3,1)';
          wm.style.opacity = '1';
          wm.style.transform = 'translate(-50%,-50%) scale(1)';
        }
        if (sun) {
          sun.style.transition = 'transform .6s ease, opacity .6s ease';
          sun.style.transform = 'scale(.26) rotate(18deg)';
          sun.style.opacity = '0';
        }
      }, 650);

      setTimeout(function () {
        if (wm) {
          wm.style.transition = 'opacity .5s ease, transform .65s cubic-bezier(.16,1,.3,1)';
          wm.style.opacity = '0';
          wm.style.transform = 'translate(-50%, calc(-50% - 60px)) scale(.92)';
        }
        if (canvas) canvas.style.opacity = '1';
        if (fg) { fg.style.transition = 'opacity .55s ease'; fg.style.opacity = '1'; }
        inEls.forEach(function (el, i) {
          el.style.transition = 'opacity .6s cubic-bezier(.16,1,.3,1), transform .6s cubic-bezier(.16,1,.3,1)';
          el.style.transitionDelay = (i * .07) + 's';
          el.style.opacity = '1';
          el.style.transform = 'none';
        });
        if (cue) cue.style.opacity = '1';
      }, 1280);

      setTimeout(function () { if (window.__ariaOpenNav) window.__ariaOpenNav(); }, 1600);
    }
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
