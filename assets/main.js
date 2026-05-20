/* ===== Theme Toggle ===== */
(function () {
  const THEME_KEY = 'kv-theme';
  const toggle = document.getElementById('theme-toggle');
  const root = document.documentElement;

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (toggle) toggle.textContent = theme === 'dark' ? '\u2600' : '\u263D';
  }

  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(saved);

  if (toggle) {
    toggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
    });
  }
})();

/* ===== Mobile Nav ===== */
(function () {
  const ham = document.getElementById('nav-hamburger');
  const links = document.getElementById('nav-links');
  if (ham && links) {
    ham.addEventListener('click', () => {
      links.classList.toggle('open');
      ham.setAttribute('aria-expanded', links.classList.contains('open'));
    });
  }
})();

/* ===== Active Nav Link ===== */
(function () {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
})();

/* ===== Collapsibles ===== */
document.querySelectorAll('.collapsible-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const body = btn.nextElementSibling;
    const isOpen = body.classList.toggle('open');
    const icon = btn.querySelector('.toggle-icon');
    const label = btn.querySelector('.toggle-label');
    if (icon) icon.textContent = isOpen ? '\u25B2' : '\u25BC';
    if (label) label.textContent = isOpen ? 'Hide' : btn.dataset.label || 'Show';
  });
});

/* ===== Filter Chips ===== */
(function () {
  const chips = document.querySelectorAll('.chip');
  const cards = document.querySelectorAll('[data-tags]');
  if (!chips.length) return;

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const filter = chip.dataset.filter;
      cards.forEach(card => {
        if (filter === 'all') { card.closest('.project-card-wrap').style.display = ''; return; }
        const tags = (card.dataset.tags || '').split(',');
        card.closest('.project-card-wrap').style.display = tags.includes(filter) ? '' : 'none';
      });
    });
  });
})();

/* ===== Timeline expand ===== */
document.querySelectorAll('.timeline-expand-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target);
    if (!target) return;
    const isOpen = target.classList.toggle('open');
    btn.textContent = isOpen ? 'Show less' : 'Show more';
  });
});

/* ===== Animated counter for stats ===== */
(function () {
  const counters = document.querySelectorAll('.aria-stat-value');
  if (!counters.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  counters.forEach(el => io.observe(el));
})();
