/* shared-components.js - injects nav + footer + background effects */
(function () {
  // ===== Animated Background =====
  const bgOrbs = document.createElement('div');
  bgOrbs.className = 'bg-orbs';
  bgOrbs.innerHTML = '<div class="bg-orb"></div><div class="bg-orb"></div><div class="bg-orb"></div>';
  document.body.insertBefore(bgOrbs, document.body.firstChild);

  const bgGrid = document.createElement('div');
  bgGrid.className = 'bg-grid';
  document.body.insertBefore(bgGrid, bgOrbs.nextSibling);

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
    <li><a href="projects.html">Projects</a></li>
    <li><a href="timeline.html">Timeline</a></li>
    <li><a href="cv.html">CV</a></li>
    <li><a href="contact.html">Contact</a></li>
    <li><a href="about.html">About Kanav</a></li>
  </ul>
  <div class="nav-actions">
    <button class="theme-toggle" id="theme-toggle" aria-label="Toggle dark mode" title="Toggle theme">Theme</button>
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
<div class="container">
  <p>&copy; ${new Date().getFullYear()} ARIA &mdash; Advanced Renewable Intelligence & Analytics &mdash; Built by <a href="about.html">Kanav Verma</a> &mdash; <a href="https://linkedin.com/in/kanavverma" target="_blank" rel="noopener">LinkedIn</a> &mdash; <a href="https://github.com/kanavverma2000" target="_blank" rel="noopener">GitHub</a></p>
</div>`;
  document.body.appendChild(footer);

  // ===== Scroll Reveal =====
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
    }, { threshold: 0.1 });
    reveals.forEach(el => io.observe(el));
  }

  // ===== Simple auto-reload for local development =====
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
