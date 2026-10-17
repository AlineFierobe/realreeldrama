import { Router } from 'express';
import Page from '../../models/Page.js';
import { PAGES, findPage } from '../../data/pages.js';
import { cleanContent, cleanSeo, defaultsOf, mergeContent } from '../../utils/content.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

// CMS › Pages: editable content of each page (definitions in data/pages.js)
const router = Router();

// GET /api/cms/pages -> list of pages with their last change date
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const docs = await Page.find({}, 'key updatedAt updatedBy').lean();
    const byKey = Object.fromEntries(docs.map((d) => [d.key, d]));
    res.json(
      PAGES.map((p) => ({
        key: p.key,
        name: p.name,
        path: p.path ?? null,
        description: p.description ?? '',
        sections: p.sections.map((s) => s.label),
        updatedAt: byKey[p.key]?.updatedAt ?? null,
        updatedBy: byKey[p.key]?.updatedBy ?? '',
      }))
    );
  })
);

// GET /api/cms/pages/:key -> definition (to build the form), content, default values, SEO
router.get(
  '/:key',
  asyncHandler(async (req, res) => {
    const page = findPage(req.params.key);
    if (!page) return res.status(404).json({ error: 'Page not found.' });
    const doc = await Page.findOne({ key: page.key }).lean();
    res.json({
      definition: page,
      content: mergeContent(page, doc?.content),
      defaults: defaultsOf(page),
      seo: doc?.seo ?? { title: '', description: '' },
      updatedAt: doc?.updatedAt ?? null,
      updatedBy: doc?.updatedBy ?? '',
    });
  })
);

// PUT /api/cms/pages/:key { content, seo } -> saves the page after validation
router.put(
  '/:key',
  asyncHandler(async (req, res) => {
    const page = findPage(req.params.key);
    if (!page) return res.status(404).json({ error: 'Page not found.' });
    const content = cleanContent(page, req.body?.content);
    const seo = cleanSeo(req.body?.seo);
    const doc = await Page.findOneAndUpdate(
      { key: page.key },
      { content, seo, updatedBy: req.user?.email ?? '' },
      { upsert: true, new: true, runValidators: true }
    ).lean();
    res.json({ content: mergeContent(page, doc.content), seo: doc.seo, updatedAt: doc.updatedAt, updatedBy: doc.updatedBy });
  })
);

export default router;
