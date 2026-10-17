import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Security headers (helmet), set up for Real Reel Drama (taken from I Love Verticals):
// - Content-Security-Policy: the page only loads its own files, plus the CMS
//   "Sign in with Google" button (script, iframe and styles from accounts.google.com/gsi)
//   and the Google account picture (googleusercontent.com)
// - Cross-Origin-Opener-Policy "same-origin-allow-popups": required by the Google sign-in window
// - Referrer-Policy: Google needs the page's origin to show its button
const GOOGLE_GSI = 'https://accounts.google.com/gsi/';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", `${GOOGLE_GSI}client`],
      frameSrc: [GOOGLE_GSI],
      connectSrc: ["'self'", GOOGLE_GSI],
      // 'unsafe-inline': React sets a few inline styles (image focus points…)
      styleSrc: ["'self'", "'unsafe-inline'", `${GOOGLE_GSI}style`],
      // blob: preview of an image before it is uploaded in the CMS
      imgSrc: ["'self'", 'data:', 'blob:', 'https://*.googleusercontent.com'],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

// Request limits per IP address (429 response beyond)
const limiter = (windowMs, max, message) =>
  rateLimit({ windowMs, limit: max, standardHeaders: 'draft-7', legacyHeaders: false, message: { error: message } });

const QUARTER = 15 * 60 * 1000;
// CMS sign-in: 20 attempts per quarter of an hour (against brute-force loops)
export const authLimiter = limiter(QUARTER, 20, 'Too many sign-in attempts. Try again in a few minutes.');
// API: 1000 requests per quarter of an hour
export const apiLimiter = limiter(QUARTER, 1000, 'Too many requests. Try again in a few minutes.');
// Contact page: 5 messages per hour
export const contactLimiter = limiter(60 * 60 * 1000, 5, 'Too many messages sent. Try again in an hour.');
