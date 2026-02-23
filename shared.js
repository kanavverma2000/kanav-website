/* shared-components.js - injects nav + footer */
(function () {
  // ===== Navigation =====
  const nav = document.createElement('nav');
  nav.className = 'nav';
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', 'Main navigation');
  nav.innerHTML = `
<div class="nav-inner">
  <a class="nav-logo" href="index.html">Kanav<span>.</span></a>
  <ul class="nav-links" id="nav-links" role="list">
    <li><a href="index.html">Home</a></li>
    <li><a href="impact.html">About</a></li>
    <li><a href="projects.html">Projects</a></li>
    <li><a href="timeline.html">Timeline</a></li>
    <li><a href="impossible-list.html">Impossible List</a></li>
    <li><a href="cv.html">CV</a></li>
    <li><a href="contact.html">Contact</a></li>
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
  document.body.insertBefore(nav, document.body.firstChild);

  // ===== Footer =====
  const footer = document.createElement('footer');
  footer.innerHTML = `
<div class="container">
  <p>© ${new Date().getFullYear()} Kanav Verma · <a href="mailto:kanavverma2000@gmail.com">kanavverma2000@gmail.com</a> · <a href="https://linkedin.com/in/kanavverma" target="_blank" rel="noopener">LinkedIn</a> · <a href="https://github.com/kanavverma" target="_blank" rel="noopener">GitHub</a></p>
</div>`;
  document.body.appendChild(footer);

  // ===== Simple auto-reload for local development =====
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    let lastModified = null;
    const check = async () => {
      try {
        const res = await fetch(location.href, { method: 'HEAD', cache: 'no-store' });
        const lm = res.headers.get('Last-Modified');
        if (lastModified && lm && lm !== lastModified) {
          location.reload();
          return;
        }
        if (lm) lastModified = lm;
      } catch (e) {
        // ignore polling errors during local development
      }
      setTimeout(check, 2000);
    };
    setTimeout(check, 2000);
  }
})();
