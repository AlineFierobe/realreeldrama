import dotenv from 'dotenv';
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import { connectDB } from './db.js';
import healthRouter from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { publicMediaRouter, publicMessagesRouter, publicPagesRouter } from './routes/public.js';
import seoFilesRouter from './routes/seoFiles.js';
import cmsPagesRouter from './routes/cms/pages.js';
import cmsMessagesRouter from './routes/cms/messages.js';
import cmsMediaRouter from './routes/cms/media.js';
import { loadAuthConfig, requireAuth } from './utils/auth.js';
import { apiLimiter, authLimiter, securityHeaders } from './utils/security.js';
import { clientApp } from './utils/clientApp.js';

// Variables from server/.env, whatever the launch folder (npm run dev or npm start at the root).
// On the host, they are set in its dashboard and this file doesn't exist.
dotenv.config({ path: new URL('../.env', import.meta.url) });

// 5004: 5000 is taken by AirPlay on macOS, 5001-5003 by Inkspire, I Love Verticals and Voices of Verticals
const PORT = process.env.PORT || 5004;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/real-reel-drama';
const PRODUCTION = process.env.NODE_ENV === 'production';
if (PRODUCTION && !process.env.MONGODB_URI) throw new Error('MONGODB_URI is required in production.');

// CMS Google sign-in: stops the server if the configuration is incomplete (see utils/auth.js)
const authConfig = loadAuthConfig();

const app = express();

// Behind the host's HTTPS proxy: real IP address (rate limits) and "Secure" cookies
if (PRODUCTION) app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(securityHeaders);
// Gzip compression of text responses (HTML, JSON, CSS, JS)
app.use(compression());
// CORS: only useful if the front end is served from another address (CORS_ORIGIN)
if (process.env.CORS_ORIGIN) app.use(cors({ origin: process.env.CORS_ORIGIN.split(','), credentials: true }));
app.use(express.json({ limit: '1mb' }));

// All API routes are prefixed with /api
app.use('/api/health', healthRouter);
app.use('/api/auth/google', authLimiter);
app.use('/api/auth', authRouter(authConfig));
if (PRODUCTION) app.use('/api', apiLimiter); // no limit in development (frequent reloads)

// Public site: read only, no sign-in (+ contact form)
app.use('/api/pages', publicPagesRouter);
app.use('/api/messages', publicMessagesRouter);
app.use('/api/media', publicMediaRouter);

// CMS: everything that changes the content requires an allowed Google session
app.use('/api/cms', requireAuth(authConfig));
app.use('/api/cms/pages', cmsPagesRouter);
app.use('/api/cms/messages', cmsMessagesRouter);
app.use('/api/cms/media', cmsMediaRouter);

// Unknown API route: JSON response (not the application page)
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

// Search engines: /robots.txt and /sitemap.xml (at the root of the site)
app.use(seoFilesRouter);

// Production: the built interface, served by the same server (with the SEO tags of each page)
if (PRODUCTION) app.use(clientApp());

// Error handler: must stay after the routes.
// It turns errors into JSON responses the front end can read.
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(' ');
    return res.status(400).json({ error: message });
  }
  if (err.name === 'CastError') return res.status(400).json({ error: `Invalid value for ${err.path}.` });
  if (err.status === 400) return res.status(400).json({ error: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON request body.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'File or request too large.' });
  console.error('[server] Error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`[server] Real Reel Drama (${PRODUCTION ? 'production' : 'development'}) on port ${PORT}`);
  connectDB(MONGODB_URI);
});
