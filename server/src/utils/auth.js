import crypto from 'node:crypto';

// Authentication: Google sign-in, restricted to allowed emails.
// No password is stored: Google proves the identity, then the server opens
// a session in a signed cookie (httpOnly: unreadable by the page's JavaScript).
//
// Variables in server/.env:
//   GOOGLE_CLIENT_ID  OAuth client id of the Google Cloud project ("Web application")
//   ALLOWED_EMAILS    allowed Google emails, comma-separated
//   SESSION_SECRET    long random string that signs the session cookies
// Without GOOGLE_CLIENT_ID, authentication is disabled — outside production only.

export const SESSION_COOKIE = 'rrd_session';
const SESSION_DAYS = 30;

// Reads the configuration once at startup; stops the server if it is incomplete
export function loadAuthConfig(env = process.env) {
  const production = env.NODE_ENV === 'production';
  const clientId = env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    if (production) throw new Error('GOOGLE_CLIENT_ID is required in production.');
    console.warn('⚠️  Authentication disabled: set GOOGLE_CLIENT_ID in server/.env to enable Google sign-in.');
    return { enabled: false, production };
  }
  const allowed = new Set(
    (env.ALLOWED_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
  if (allowed.size === 0) throw new Error('ALLOWED_EMAILS is required when GOOGLE_CLIENT_ID is set.');
  const secret = env.SESSION_SECRET ?? '';
  if (secret.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters.');
  return { enabled: true, production, clientId, allowed, secret };
}

const sign = (data, secret) => crypto.createHmac('sha256', secret).update(data).digest('base64url');

// Session token: encoded data + HMAC signature (any change makes it invalid)
export function createSessionToken(user, secret) {
  const payload = { ...user, exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000 };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${data}.${sign(data, secret)}`;
}

// Returns the token's user, or null if it is missing, forged or expired
export function readSessionToken(token, secret) {
  if (!token || !token.includes('.')) return null;
  const [data, signature] = token.split('.');
  const expected = sign(data, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

// Value of a request cookie
export function readCookie(req, name) {
  const header = req.headers.cookie ?? '';
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

// Set-Cookie header of the session (maxAge 0 = deletion)
export function sessionCookie(value, { production, maxAgeDays = SESSION_DAYS } = {}) {
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.round(maxAgeDays * 24 * 60 * 60)}`,
  ];
  if (production) parts.push('Secure'); // HTTPS only once online
  return parts.join('; ');
}

// Middleware: rejects (401) any request without a valid session.
// req.user = { email, name, picture } for the following routes.
export function requireAuth(config) {
  return (req, res, next) => {
    if (!config.enabled) return next();
    const user = readSessionToken(readCookie(req, SESSION_COOKIE), config.secret);
    if (!user || !config.allowed.has(user.email)) return res.status(401).json({ error: 'Sign in required.' });
    req.user = user;
    next();
  };
}
