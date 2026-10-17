import Page from '../models/Page.js';
import { PAGES } from '../data/pages.js';
import { dbState } from '../db.js';

// SEO: <title>, description, canonical and share preview tags of each page.
// In production, the server writes them into index.html before sending it (utils/clientApp.js):
// search engines and share previews see the right title without running React.
// Default values: "seo" in data/pages.js; the CMS can replace them page by page.
export const SITE_NAME = 'Real Reel Drama';

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Public address of the site: SITE_URL in production, otherwise the request's address
export const siteOrigin = (req) => (process.env.SITE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

export const publicPages = () => PAGES.filter((p) => p.path);

// Title and description of an address; status 404 if it matches no page
export async function seoForPath(path) {
  const clean = path.length > 1 ? path.replace(/\/$/, '') : path;
  const page = publicPages().find((p) => p.path === clean);
  if (!page) return { title: `Page not found · ${SITE_NAME}`, description: '', status: 404 };
  const doc = dbState() === 'connected' ? await Page.findOne({ key: page.key }, 'seo').lean() : null;
  return {
    title: doc?.seo?.title || page.seo.title,
    description: doc?.seo?.description || page.seo.description,
  };
}

export function seoTags(seo, { origin, path }) {
  const url = `${origin}${path}`;
  return [
    `<title>${escapeHtml(seo.title)}</title>`,
    `<meta name="description" content="${escapeHtml(seo.description)}" />`,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${escapeHtml(seo.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(seo.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:image" content="${escapeHtml(`${origin}/images/meagan-hero.jpg`)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ].join('\n    ');
}
