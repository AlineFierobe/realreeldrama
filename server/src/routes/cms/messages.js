import { Router } from 'express';
import Message from '../../models/Message.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validateIds } from '../../utils/validateId.js';

// CMS › Messages: messages received from the Contact page
const router = Router();

// GET /api/cms/messages -> most recent first (500 at most)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await Message.find().sort({ createdAt: -1 }).limit(500).lean());
  })
);

// PATCH /api/cms/messages/:id { read } -> marks as read / unread
router.patch(
  '/:id',
  validateIds('id'),
  asyncHandler(async (req, res) => {
    const msg = await Message.findByIdAndUpdate(req.params.id, { read: Boolean(req.body?.read) }, { new: true }).lean();
    if (!msg) return res.status(404).json({ error: 'Message not found.' });
    res.json(msg);
  })
);

// DELETE /api/cms/messages/:id
router.delete(
  '/:id',
  validateIds('id'),
  asyncHandler(async (req, res) => {
    const msg = await Message.findByIdAndDelete(req.params.id);
    if (!msg) return res.status(404).json({ error: 'Message not found.' });
    res.status(204).end();
  })
);

export default router;
