import { Router } from 'express';
import { dbState } from '../db.js';

const router = Router();

// GET /api/health -> lets the front end check that the server and the database respond
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Real Reel Drama',
    database: dbState(),
    time: new Date().toISOString(),
  });
});

export default router;
