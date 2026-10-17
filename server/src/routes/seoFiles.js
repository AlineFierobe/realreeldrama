import { Router } from 'express';
import { publicPages, siteOrigin } from '../utils/seo.js';

// /robots.txt and /sitemap.xml, at the root of the site. The CMS is excluded from search engines.
const router = Router();

router.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(`User-agent: *\nDisallow: /cms\nDisallow: /api/\n\nSitemap: ${siteOrigin(req)}/sitemap.xml\n`);
});

router.get('/sitemap.xml', (req, res) => {
  const origin = siteOrigin(req);
  const urls = publicPages()
    .map((p) => `  <url><loc>${origin}${p.path === '/' ? '/' : p.path}</loc></url>`)
    .join('\n');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
});

export default router;
