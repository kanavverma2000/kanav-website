/* ===== Theme Toggle ===== */
(function () {
  const THEME_KEY = 'kv-theme';
  const toggle = document.getElementById('theme-toggle');
  const root = document.documentElement;

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (toggle) toggle.textContent = theme === 'dark' ? '☀' : '☽';
  }

  const saved = localStorage.getItem(THEME_KEY) ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
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
    btn.querySelector('.toggle-icon').textContent = isOpen ? '▲' : '▼';
    btn.querySelector('.toggle-label').textContent = isOpen ? 'Hide' : btn.dataset.label || 'Show';
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

/* ===== Impossible List: search + filter + toggle ===== */
(function () {
  const search = document.getElementById('il-search');
  const chips = document.querySelectorAll('.il-cat-chip');
  const showDone = document.getElementById('il-show-done');
  const items = document.querySelectorAll('.il-item');
  const categories = document.querySelectorAll('.il-category');

  if (!search) return;

  function applyFilters() {
    const q = search.value.toLowerCase();
    const cat = document.querySelector('.il-cat-chip.active')?.dataset.cat || 'all';
    const hideDone = showDone && !showDone.checked;

    categories.forEach(c => {
      const cCat = c.dataset.cat;
      let visible = 0;
      c.querySelectorAll('.il-item').forEach(item => {
        const text = item.querySelector('.il-item-title').textContent.toLowerCase();
        const isDone = item.classList.contains('done');
        const matchQ = !q || text.includes(q);
        const matchCat = cat === 'all' || cat === cCat;
        const matchDone = !hideDone || !isDone;
        const show = matchQ && matchCat && matchDone;
        item.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      c.style.display = visible > 0 ? '' : 'none';
    });
  }

  search.addEventListener('input', applyFilters);
  chips.forEach(c => c.addEventListener('click', () => {
    chips.forEach(x => x.classList.remove('active'));
    c.classList.add('active');
    applyFilters();
  }));
  if (showDone) showDone.addEventListener('change', applyFilters);
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

// Background stays fixed; no parallax to avoid disappearing layers.
