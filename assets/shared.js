/* shared-components.js - injects animated bg + nav + footer + scroll reveal */
(function () {
  // ===== Animated Background =====
  const bgOrbs = document.createElement('div');
  bgOrbs.className = 'bg-orbs';
  bgOrbs.innerHTML = '<div class="bg-orb"></div><div class="bg-orb"></div><div class="bg-orb"></div>';
  document.body.insertBefore(bgOrbs, document.body.firstChild);

  const bgGrid = document.createElement('div');
  bgGrid.className = 'bg-grid';
  document.body.insertBefore(bgGrid, bgOrbs.nextSibling);

  // ===== Floating Particles =====
  const particles = document.createElement('div');
  particles.className = 'bg-particles';
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.top = Math.random() * 100 + '%';
    p.style.animationDelay = (Math.random() * 15) + 's';
    p.style.animationDuration = (12 + Math.random() * 18) + 's';
    p.style.width = p.style.height = (2 + Math.random() * 3) + 'px';
    particles.appendChild(p);
  }
  document.body.insertBefore(particles, bgGrid.nextSibling);

  // ===== Navigation =====
  const nav = document.createElement('nav');
  nav.className = 'nav';
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', 'Main navigation');
  nav.innerHTML = `
<div class="nav-inner">
  <a class="nav-logo" href="index.html"><span>ARIA</span></a>
  <ul class="nav-links" id="nav-links" role="list">
    <li><a href="index.html">Home</a></li>
    <li><a href="platform.html">Platform</a></li>
    <li><a href="contact.html">Contact</a></li>
    <li><a href="about.html">About Kanav</a></li>
  </ul>
  <div class="nav-actions">
    <button class="theme-toggle" id="theme-toggle" aria-label="Toggle dark mode" title="Toggle theme">T</button>
    <button class="nav-hamburger" id="nav-hamburger" aria-label="Toggle navigation" aria-expanded="false">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
        <rect y="3" width="20" height="2" rx="1"/>
        <rect y="9" width="20" height="2" rx="1"/>
        <rect y="15" width="20" height="2" rx="1"/>
      </svg>
    </button>
  </div>
</div>`;
  document.body.insertBefore(nav, document.querySelector('.main-content') || document.body.firstChild);

  // ===== Footer =====
  const footer = document.createElement('footer');
  footer.innerHTML = `
<div class="container" style="text-align:center;">
  <p style="margin-bottom:8px;"><strong style="font-size:0.9rem;">ARIA</strong> &mdash; Advanced Renewable Intelligence & Analytics</p>
  <p>&copy; ${new Date().getFullYear()} Built by <a href="about.html">Kanav Verma</a> &mdash; <a href="https://linkedin.com/in/kanavverma" target="_blank" rel="noopener">LinkedIn</a> &mdash; <a href="https://github.com/kanavverma2000" target="_blank" rel="noopener">GitHub</a></p>
</div>`;
  document.body.appendChild(footer);

  // ===== Scroll Reveal =====
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08 });
    reveals.forEach(el => io.observe(el));
  }

  // ===== Dev auto-reload =====
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    let lastModified = null;
    const check = async () => {
      try {
        const res = await fetch(location.href, { method: 'HEAD', cache: 'no-store' });
        const lm = res.headers.get('Last-Modified');
        if (lastModified && lm && lm !== lastModified) { location.reload(); return; }
        if (lm) lastModified = lm;
      } catch (e) {}
      setTimeout(check, 2000);
    };
    setTimeout(check, 2000);
  }
})();
