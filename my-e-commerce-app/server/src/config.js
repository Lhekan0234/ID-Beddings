import 'dotenv/config';

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const jwtSecret =
  process.env.JWT_SECRET ||
  (isProduction ? '' : 'dev-only-insecure-jwt-secret-change-me');

if (!jwtSecret) {
  throw new Error('JWT_SECRET must be set when NODE_ENV=production.');
}

export const config = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT || 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieName: 'idb_token',
  cookieMaxAgeMs: 7 * 24 * 60 * 60 * 1000,
  cookieSecure: isProduction,
};

export default config;
