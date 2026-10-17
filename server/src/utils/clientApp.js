import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { Router } from 'express';
import { seoForPath, seoTags, siteOrigin, SITE_NAME } from './seo.js';

// In production, the server also serves the built interface (client/dist, produced by
// "npm run build"): one application, one address (like I Love Verticals).
//   /assets/...  files versioned by Vite (hashed names): cached for a year
//   /images/...  mock-up photos: cached for a day
//   other URLs   index.html, and React Router shows the right page
// Before sending index.html, the server replaces the block between <!-- seo:start --> and
// <!-- seo:end --> with the tags of the requested page (utils/seo.js).
export const CLIENT_DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../client/dist');
const SEO_BLOCK = /<!-- seo:start -->[\s\S]*?<!-- seo:end -->/;

export function clientApp() {
  const indexFile = path.join(CLIENT_DIST, 'index.html');
  if (!fs.existsSync(indexFile)) {
    throw new Error('client/dist/index.html not found: run "npm run build" before starting in production.');
  }
  const template = fs.readFileSync(indexFile, 'utf8');
  if (!SEO_BLOCK.test(template)) throw new Error('client/index.html must contain the <!-- seo:start --> … <!-- seo:end --> block.');

  const router = Router();
  router.use(
    express.static(CLIENT_DIST, {
      index: false,
      setHeaders: (res, file) => {
        if (file.includes(`${path.sep}assets${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        else if (file.includes(`${path.sep}images${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=86400');
        else res.setHeader('Cache-Control', 'no-cache');
      },
    })
  );
  // Any other page (outside /api): index.html with its tags, always revalidated.
  // The CMS is not indexed; an unknown address answers 404 (the "Page not found" page still shows).
  router.get(/^(?!\/api(\/|$)).*/, async (req, res) => {
    let tags;
    let status = 200;
    if (req.path === '/cms' || req.path.startsWith('/cms/')) {
      tags = `<title>CMS · ${SITE_NAME}</title>\n    <meta name="robots" content="noindex" />`;
    } else {
      try {
        const seo = await seoForPath(req.path);
        status = seo.status ?? 200;
        tags = seoTags(seo, { origin: siteOrigin(req), path: req.path });
      } catch (err) {
        // Database unreachable: the page still shows, with the site title
        console.error('[seo] Tags not computed:', err.message);
        tags = `<title>${SITE_NAME}</title>`;
      }
    }
    res.setHeader('Cache-Control', 'no-cache');
    res.status(status).type('html').send(template.replace(SEO_BLOCK, `<!-- seo:start -->\n    ${tags}\n    <!-- seo:end -->`));
  });
  return router;
}
