import express, { Router } from 'express';
import Media from '../../models/Media.js';
import Page from '../../models/Page.js';
import { findPage } from '../../data/pages.js';
import { imagesIn } from '../../utils/content.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validateIds } from '../../utils/validateId.js';

// CMS › Images: pictures uploaded from the CMS, stored in MongoDB (models/Media.js)
const router = Router();

export const MAX_IMAGE_MB = 8;

// File type read from its first bytes (not from what the browser claims).
// SVG is refused: it can contain scripts.
function imageType(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buf.subarray(0, 4).toString('ascii') === 'GIF8') return 'image/gif';
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
}

const urlOf = (id) => `/api/media/${id}`;

// Pages that use each image: { "/api/media/<id>": ["Homepage", …] }
async function usage() {
  const docs = await Page.find({}, 'key content').lean();
  const used = {};
  for (const doc of docs) {
    const page = findPage(doc.key);
    if (!page) continue;
    for (const src of imagesIn(page, doc.content)) (used[src] ??= new Set()).add(page.name);
  }
  return used;
}

// GET /api/cms/media -> uploaded images, most recent first (without the file itself)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const [list, used] = await Promise.all([Media.find({}, '-data').sort({ createdAt: -1 }).limit(500).lean(), usage()]);
    res.json(list.map((m) => ({ ...m, url: urlOf(m._id), usedIn: [...(used[urlOf(m._id)] ?? [])] })));
  })
);

// POST /api/cms/media (body = the file, header X-Filename) -> { _id, url, … }
router.post(
  '/',
  express.raw({ type: () => true, limit: `${MAX_IMAGE_MB}mb` }),
  asyncHandler(async (req, res) => {
    const data = Buffer.isBuffer(req.body) ? req.body : null;
    if (!data?.length) return res.status(400).json({ error: 'No file received.' });
    const contentType = imageType(data);
    if (!contentType) return res.status(400).json({ error: 'Only JPEG, PNG, WebP or GIF images are accepted.' });
    let filename = 'image';
    try {
      filename = decodeURIComponent(req.get('X-Filename') ?? 'image').slice(0, 200) || 'image';
    } catch {
      // Badly encoded name: keep "image"
    }
    const media = await Media.create({ filename, contentType, size: data.length, data, uploadedBy: req.user?.email ?? '' });
    const { data: _, ...info } = media.toObject();
    res.status(201).json({ ...info, url: urlOf(media._id), usedIn: [] });
  })
);

// DELETE /api/cms/media/:id -> refused (409) while a page still uses the image
router.delete(
  '/:id',
  validateIds('id'),
  asyncHandler(async (req, res) => {
    const pages = [...((await usage())[urlOf(req.params.id)] ?? [])];
    if (pages.length) return res.status(409).json({ error: `This image is still used on: ${pages.join(', ')}. Replace it there first.` });
    const media = await Media.findByIdAndDelete(req.params.id);
    if (!media) return res.status(404).json({ error: 'Image not found.' });
    res.status(204).end();
  })
);

export default router;
