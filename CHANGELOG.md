# Changelog

## 0.3.0 — 2026-10-17

Legal notice page.

- New `/legal-notice` page built with the UI kit: publisher and hosting cards (empty fields are hidden, email shown as a link), then free sections (intellectual property, personal data, cookies, links) with default texts matching how the site works
- CMS › Legal notice: publisher details (name, status, address, email, phone, publication director), host (Hostinger by default), reorderable sections; SEO title and description
- Footer: “Legal notice” link next to the copyright, its label editable in Site settings › Footer
- Sitemap and smoke test include the new page

### Commit
Step 1.2 - Legal notice page

## 0.2.0 — 2026-10-17

Image framing in the CMS.

- Every image field now has a framing tool: the preview takes the shape of the image's slot on the site (ratio and corners of the mock-up), drag the picture to move it, zoom up to 300% with the slider, the mouse wheel or + / −, arrow keys to nudge it, “Center” to reset
- Images are saved as `{ src, x, y, zoom }` (focus point in % and zoom), validated and clamped by the server; addresses saved by 0.1.0 are still read
- The site applies the framing with the new `FramedImage` component (homepage portrait, show artwork, host card, About photos)

### Commit
Step 1.1 - Image framing tool in the CMS

## 0.1.0 — 2026-10-17

First version of the website and its CMS, based on the “RealReelDrama” Figma mock-up.

- Public site (React + Vite): Homepage faithful to the mock-up (Meet Meagan, Real Reel Unscripted, Reviews & Industry, About, Social medias), About and Contact pages built with the same UI kit, 404 page; shared header and footer, mobile menu, tablet and mobile layouts
- Mock-up UI kit: styleguide colors and font substitutions approved in the kit (tokens), Button (Primary / Outline / Text, Regular / Small, all states), Link (Inline / Standalone), category Tag (6 colors, Selected state), Figma icons and photos (resized)
- API (Express + MongoDB): page content completed with the mock-up texts, contact form (5 messages per hour, bot trap), image upload stored in MongoDB (type checked from the file’s bytes, 8 MB max)
- CMS (`/cms`) styled with the styleguide: dashboard, forms generated from `server/src/data/pages.js` (reorderable and nested lists, tag color picker, image fields with upload, library and drag and drop), link validation, SEO per page with search preview, image library, contact messages, site settings; Google sign-in restricted to allowed emails
- Production: interface served by Express with per-page SEO tags, `sitemap.xml`, `robots.txt`, security headers, smoke test and GitHub workflows (CI, release to Hostinger)

### Commit
Step 1.0 - Real Reel Drama website and CMS
