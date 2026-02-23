# Kanav Verma — Personal Website

A clean, modern personal website for **Kanav Verma — Data Analyst (Energy + Automation)**.

Built with pure HTML, CSS, and vanilla JS. No frameworks. No build step. No external dependencies.

---

## Folder Structure

```
kanav-website/
├── index.html              # Home: hero, projects preview, timeline
├── impact.html             # Proof of Impact cards (Energy Synapse, FedEx, Oregon)
├── projects.html           # All projects with filter chips
├── project-detail.html     # Project detail template (loads data via ?id=...)
├── timeline.html           # Full career + education timeline
├── impossible-list.html    # Impossible List with search + filter
├── cv.html                 # ATS-friendly CV page
├── contact.html            # Contact info + form (mailto fallback)
├── assets/
│   ├── style.css           # All styles (CSS variables, light/dark, responsive)
│   ├── shared.js           # Nav, footer, background SVG (injected on every page)
│   ├── main.js             # Theme toggle, collapsibles, filter chips, IL logic
│   ├── kanav-verma-resume.pdf   # ← ADD YOUR PDF HERE
│   └── images/             # ← ADD screenshots, headshot, etc. here
└── README.md
```

---

## Setup & Customization

### 1. Replace placeholder content

Search for these strings across all HTML files and replace:

| Placeholder | Replace with |
|---|---|
| `kanav@example.com` | Your real email |
| `kanavverma` (in URLs) | Your real LinkedIn/GitHub handles |
| `$X`, `$XM`, `X%` | Real metrics |
| `[Year placeholder]` | Real dates |
| `X.X/4.0` | Your GPA |

### 2. Add your PDF resume

Drop your resume PDF at:
```
assets/kanav-verma-resume.pdf
```
The Download buttons throughout the site already point there.

### 3. Add project screenshots

Place images in `assets/images/` and reference them in `project-detail.html`:
```html
<img src="assets/images/my-project-screenshot.png" alt="Dashboard screenshot" />
```
Replace the `.screenshot-placeholder` divs with actual `<img>` tags.

### 4. Add a headshot (optional)

Drop `assets/images/headshot.jpg` and add it to the hero section in `index.html`:
```html
<img src="assets/images/headshot.jpg" alt="Kanav Verma" class="hero-photo" />
```

---

## Adding New Projects

In `projects.html`, copy any existing `<div class="project-card-wrap">` block and update:
- `data-tags` attribute (comma-separated, e.g. `"energy,data"`) for filter chips
- Title, description, tags, and link

In `project-detail.html`, add a new entry to the `PROJECTS` object in the `<script>` tag:
```js
'my-new-project': {
  title: 'My New Project',
  tagline: 'One-sentence summary.',
  tags: [{ label: 'Energy', cls: 'tag-energy' }],
  tools: ['Python', 'SQL'],
  role: 'Data Analyst',
  timeline: '2 months · 2024',
  team: 'Solo',
  metrics: [
    { value: '20%↑', label: 'Efficiency gain' }
  ]
}
```
Then update the prose in the HTML template for overview, architecture, learnings, etc.

---

## Dark / Light Theme

The theme toggle is in the nav (moon/sun icon). Preference is persisted in `localStorage` under the key `kv-theme`.

The theme is applied via `data-theme="light"` or `data-theme="dark"` on the `<html>` element, with all colors defined as CSS variables in `assets/style.css`.

---

## Hosting on GitHub Pages

### Option A — Default (project page)

1. Create a GitHub repo, e.g. `kanav-website`
2. Push all files to the `main` branch
3. Go to **Settings → Pages**
4. Set source to `main` branch, root `/`
5. Site will be live at `https://yourusername.github.io/kanav-website/`

### Option B — Custom domain (e.g. kanavverma.com)




1. Follow Option A first
2. In your domain registrar, add a CNAME record:
   - Name: `www`
   - Value: `yourusername.github.io`
   - Also add A records pointing to GitHub's IPs (see [GitHub docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site))
3. In **Settings → Pages → Custom domain**, enter your domain
4. Enable **Enforce HTTPS**

### Option C — Netlify (recommended for custom domain)

1. Push repo to GitHub
2. Go to [netlify.com](https://netlify.com), connect your GitHub repo
3. Deploy settings: build command = _(leave blank)_, publish directory = `.`
4. Add your custom domain in Netlify dashboard

---

## Accessibility Notes

- All interactive elements have `aria-label` or visible labels
- Color contrast meets WCAG AA (check with your own accessibility tool)
- Semantic HTML throughout (`<nav>`, `<main>`, `<section>`, `<aside>`, `<footer>`)
- Skip link can be added by placing `<a href="#main-content" class="sr-only">Skip to content</a>` as the first body element

---

## Performance

- No JavaScript frameworks
- No external CDN dependencies (fonts load async from Google Fonts)
- SVG background is inline CSS — zero extra requests
- Total JS: ~4KB unminified

For maximum performance, run a minifier on `style.css`, `main.js`, and `shared.js` before deploying:
```bash
npx terser assets/main.js -o assets/main.min.js
npx terser assets/shared.js -o assets/shared.min.js
npx cleancss assets/style.css -o assets/style.min.css
```
Then update the `<script>` and `<link>` references in each HTML file.

---

## License

Feel free to use and adapt this template for your own personal site.
