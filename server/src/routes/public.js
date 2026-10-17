import { Router } from 'express';
import Page from '../models/Page.js';
import Message from '../models/Message.js';
import Media from '../models/Media.js';
import { findPage } from '../data/pages.js';
import { mergeContent } from '../utils/content.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { contactLimiter } from '../utils/security.js';
import { validateIds } from '../utils/validateId.js';
import { dbState } from '../db.js';

// Public routes of the site (read only, no sign-in)
export const publicPagesRouter = Router();

// GET /api/pages/:key -> content of a page (default texts completed by the CMS)
publicPagesRouter.get(
  '/:key',
  asyncHandler(async (req, res) => {
    const page = findPage(req.params.key);
    if (!page) return res.status(404).json({ error: 'Page not found.' });
    // Database briefly unreachable: the site still shows, with the default texts
    const doc = dbState() === 'connected' ? await Page.findOne({ key: page.key }).lean() : null;
    // SEO: values saved in the CMS, otherwise the page defaults (data/pages.js)
    const seo = {
      title: doc?.seo?.title || page.seo?.title || '',
      description: doc?.seo?.description || page.seo?.description || '',
    };
    res.json({ key: page.key, content: mergeContent(page, doc?.content), seo });
  })
);

// POST /api/messages -> Contact page form
export const publicMessagesRouter = Router();
publicMessagesRouter.post(
  '/',
  contactLimiter,
  asyncHandler(async (req, res) => {
    const { name, email, topic, message, website } = req.body ?? {};
    // Hidden "website" field: only filled in by bots
    if (website) return res.status(201).json({ ok: true });
    const str = (v) => (typeof v === 'string' ? v : '');
    await Message.create({ name: str(name), email: str(email), topic: str(topic), message: str(message) });
    res.status(201).json({ ok: true });
  })
);

// GET /api/media/:id -> image uploaded in the CMS. Its address changes with each upload,
// so the browser can keep it for a long time.
export const publicMediaRouter = Router();
publicMediaRouter.get(
  '/:id',
  validateIds('id'),
  asyncHandler(async (req, res) => {
    const media = await Media.findById(req.params.id).lean();
    if (!media) return res.status(404).json({ error: 'Image not found.' });
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.type(media.contentType).send(Buffer.from(media.data.buffer ?? media.data));
  })
);
