# Changelog

## 0.1.0 — 2026-10-17

First version of the website and its CMS, based on the “RealReelDrama” Figma mock-up.

- Public site (React + Vite): Homepage faithful to the mock-up (Meet Meagan, Real Reel Unscripted, Reviews & Industry, About, Social medias), About and Contact pages built with the same UI kit, 404 page; shared header and footer, mobile menu, tablet and mobile layouts
- Mock-up UI kit: styleguide colors and font substitutions approved in the kit (tokens), Button (Primary / Outline / Text, Regular / Small, all states), Link (Inline / Standalone), category Tag (6 colors, Selected state), Figma icons and photos (resized)
- API (Express + MongoDB): page content completed with the mock-up texts, contact form (5 messages per hour, bot trap), image upload stored in MongoDB (type checked from the file’s bytes, 8 MB max)
- CMS (`/cms`) styled with the styleguide: dashboard, forms generated from `server/src/data/pages.js` (reorderable and nested lists, tag color picker, image fields with upload, library and drag and drop), link validation, SEO per page with search preview, image library, contact messages, site settings; Google sign-in restricted to allowed emails
- Production: interface served by Express with per-page SEO tags, `sitemap.xml`, `robots.txt`, security headers, smoke test and GitHub workflows (CI, release to Hostinger)

### Commit
Step 1.0 - Real Reel Drama website and CMS
