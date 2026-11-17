import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import prisma from '../db.js';
import { ApiError } from './errors.js';

/**
 * Authentication and authorisation (prd/agent.md sections 12, 13, 14).
 *
 * The JWT is delivered in an httpOnly cookie so page scripts cannot read it.
 * Roles are always re-read from the database rather than trusted from the
 * token, so revoking or changing a user's role takes effect immediately and a
 * customer can never grant themselves admin by editing a token.
 */

export function signAuthToken(user) {
  return jwt.sign({ sub: user.id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

export function authCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    maxAge: config.cookieMaxAgeMs,
    path: '/',
  };
}

export function setAuthCookie(res, token) {
  res.cookie(config.cookieName, token, authCookieOptions());
}

export function clearAuthCookie(res) {
  const { maxAge: _maxAge, ...options } = authCookieOptions();
  res.clearCookie(config.cookieName, options);
}

function readToken(req) {
  const cookieToken = req.cookies?.[config.cookieName];
  if (cookieToken) return cookieToken;

  const header = req.get('authorization');
  if (header && header.startsWith('Bearer ')) {
    return header.slice('Bearer '.length).trim();
  }
  return null;
}

/**
 * Require a valid session. Attaches `req.user` (id, email, name, role) loaded
 * from the database, or responds 401.
 */
export async function authenticate(req, res, next) {
  const token = readToken(req);
  if (!token) {
    next(ApiError.unauthorised('Please sign in to continue.'));
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      next(ApiError.unauthorised('Your session is no longer valid. Please sign in again.'));
      return;
    }

    req.user = user;
    next();
  } catch {
    next(ApiError.unauthorised('Your session has expired. Please sign in again.'));
  }
}

/**
 * Attach `req.user` when a valid session cookie/token is present, but never
 * reject the request. Used by endpoints that support both guests and signed-in
 * owners (for example, downloading a receipt with a reference + email).
 */
export async function identify(req, _res, next) {
  const token = readToken(req);
  if (!token) {
    next();
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true },
    });
    if (user) req.user = user;
  } catch {
    // An invalid token is treated as "not signed in" for optional auth.
  }
  next();
}

/** Require an authenticated user (run after `authenticate`). */
export function requireAuth(req, _res, next) {
  if (!req.user) {
    next(ApiError.unauthorised('Please sign in to continue.'));
    return;
  }
  next();
}

/** Require an authenticated administrator (run after `authenticate`). */
export function requireAdmin(req, _res, next) {
  if (!req.user) {
    next(ApiError.unauthorised('Please sign in to continue.'));
    return;
  }
  if (req.user.role !== 'ADMIN') {
    next(ApiError.forbidden('Administrator access is required.'));
    return;
  }
  next();
}
