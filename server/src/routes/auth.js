import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { asyncHandler } from '../utils/asyncHandler.js';
import { SESSION_COOKIE, createSessionToken, readCookie, readSessionToken, sessionCookie } from '../utils/auth.js';

// Google sign-in, mounted on /api/auth (reachable without being signed in)
export function authRouter(config) {
  const router = Router();
  const google = config.enabled ? new OAuth2Client(config.clientId) : null;

  // GET /session -> sign-in state for the front end:
  // { authEnabled, clientId, user } (user = null if nobody is signed in)
  router.get('/session', (req, res) => {
    if (!config.enabled) return res.json({ authEnabled: false, clientId: null, user: null });
    const user = readSessionToken(readCookie(req, SESSION_COOKIE), config.secret);
    const allowed = user && config.allowed.has(user.email);
    res.json({
      authEnabled: true,
      clientId: config.clientId,
      user: allowed ? { email: user.email, name: user.name, picture: user.picture } : null,
    });
  });

  // POST /google { credential } -> checks the identity token sent by Google
  // (signature, audience = our client id, expiry), then opens the session
  router.post(
    '/google',
    asyncHandler(async (req, res) => {
      if (!config.enabled) return res.status(400).json({ error: 'Authentication is disabled.' });
      const credential = req.body?.credential;
      if (typeof credential !== 'string') return res.status(400).json({ error: 'Missing Google credential.' });

      let payload;
      try {
        const ticket = await google.verifyIdToken({ idToken: credential, audience: config.clientId });
        payload = ticket.getPayload();
      } catch {
        return res.status(401).json({ error: 'Google sign-in could not be verified.' });
      }
      const email = payload?.email?.toLowerCase();
      if (!email || !payload.email_verified) return res.status(401).json({ error: 'Your Google email is not verified.' });
      if (!config.allowed.has(email)) return res.status(403).json({ error: 'This Google account is not allowed.' });

      const user = { email, name: payload.name ?? email, picture: payload.picture ?? '' };
      res.setHeader('Set-Cookie', sessionCookie(createSessionToken(user, config.secret), config));
      res.json({ user });
    })
  );

  // POST /logout -> deletes the session cookie
  router.post('/logout', (req, res) => {
    res.setHeader('Set-Cookie', sessionCookie('', { ...config, maxAgeDays: 0 }));
    res.status(204).end();
  });

  return router;
}
