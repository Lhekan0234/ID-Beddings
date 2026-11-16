import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../db.js';
import { asyncHandler } from '../utils/async.js';
import { validate } from '../middleware/validate.js';
import {
  authenticate,
  clearAuthCookie,
  setAuthCookie,
  signAuthToken,
} from '../middleware/auth.js';
import { ApiError } from '../middleware/errors.js';
import { loginSchema, registerSchema } from '../validation/schemas.js';
import { serialiseUser } from '../serialisers.js';

const router = Router();

const BCRYPT_ROUNDS = 12;

/**
 * Create a customer account. The role is never taken from the request body:
 * every self-registered account is a CUSTOMER. Administrators are created by
 * the seed script from server-side environment variables.
 */
router.post(
  '/register',
  validate({ body: registerSchema }),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      throw ApiError.conflict('An account with this email already exists. Please sign in instead.');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: { email, passwordHash, name: name || null, role: 'CUSTOMER' },
      select: { id: true, email: true, name: true, role: true },
    });

    setAuthCookie(res, signAuthToken(user));
    res.status(201).json({ user: serialiseUser(user) });
  })
);

router.post(
  '/login',
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    // Same response whether the email is unknown or the password is wrong, so
    // the endpoint cannot be used to discover registered accounts.
    const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!valid) {
      throw ApiError.unauthorised('Incorrect email or password.');
    }

    setAuthCookie(res, signAuthToken(user));
    res.json({ user: serialiseUser(user) });
  })
);

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({ user: serialiseUser(req.user) });
  })
);

export default router;
