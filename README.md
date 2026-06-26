# TempMailPro

Free temporary disposable email service — static HTML/CSS/JS site, AdSense-ready, SEO-optimized.

## Folder structure
```
tempmailsite/
├── index.html         # Main app (temp inbox)
├── style.css          # Global styles
├── script.js          # mail.tm client logic
├── about.html
├── privacy.html
├── terms.html
├── contact.html
├── 404.html
├── robots.txt
├── ads.txt            # Replace pub-XXXX with your AdSense publisher ID
├── sitemap.xml
├── assets/favicon.svg
└── blog/
    ├── index.html
    └── 12 long-form SEO articles
```

## Deploy to GitHub Pages / Cloudflare Pages / Netlify
1. Push this folder to a GitHub repo (root or `/docs`).
2. Enable Pages / connect to Cloudflare Pages — no build command, output dir = `/`.
3. Site is live.

## Before applying for AdSense
1. Open every `.html` and replace **`ca-pub-XXXXXXXXXXXXXXXX`** with your real AdSense publisher ID (3 places per blog post + index).
2. Update `ads.txt` with your real publisher ID.
3. Replace `data-ad-slot="1111111111"` / `"2222222222"` with real slot IDs from AdSense after you create ad units.
4. If you move to a custom domain, find/replace `https://tempmailpro.pages.dev` across all files.

## SEO checklist (all already done)
- Unique `<title>` + meta description on every page
- Canonical URLs on every page
- Open Graph + Twitter cards
- JSON-LD: WebApplication, FAQPage, Article
- Semantic HTML, single H1 per page, breadcrumbs
- `robots.txt` + `sitemap.xml`
- Mobile responsive, dark-mode aware
- Fast: zero frameworks, single CSS file
- 12 long-form blog posts for topical authority

## Local preview
Open `index.html` directly in a browser, or:
```
npx serve .
```
