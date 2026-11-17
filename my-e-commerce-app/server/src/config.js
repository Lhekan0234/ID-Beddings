import 'dotenv/config';

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const jwtSecret =
  process.env.JWT_SECRET ||
  (isProduction ? '' : 'dev-only-insecure-jwt-secret-change-me');

if (!jwtSecret) {
  throw new Error('JWT_SECRET must be set when NODE_ENV=production.');
}

const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

export const config = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT || 5000),
  clientOrigin,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieName: 'idb_token',
  cookieMaxAgeMs: 7 * 24 * 60 * 60 * 1000,
  cookieSecure: isProduction,
  paystack: {
    // Test and live keys are selected only through the server environment.
    // They are never exposed to the React app.
    secretKey: (process.env.PAYSTACK_SECRET_KEY || '').trim(),
    publicKey: (process.env.PAYSTACK_PUBLIC_KEY || '').trim(),
    // Paystack's newer webhook signing secret (starts with `whsec_`). When set,
    // the timestamped `Paystack-Signature` header is required. Otherwise the
    // legacy `x-paystack-signature` header (HMAC of the raw body with the
    // secret key) is used.
    webhookSecret: (process.env.PAYSTACK_WEBHOOK_SECRET || '').trim(),
    baseUrl: (process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co').replace(/\/$/, ''),
    callbackUrl:
      process.env.PAYMENT_CALLBACK_URL || `${clientOrigin}/payment/callback`,
  },
};

export default config;
