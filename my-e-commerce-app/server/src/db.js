import { PrismaClient } from '@prisma/client';
import { config } from './config.js';

// Reuse a single Prisma client across hot reloads in development so the
// connection pool is not exhausted by `node --watch`.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__idbPrisma ||
  new PrismaClient({
    log: config.isProduction ? ['error'] : ['warn', 'error'],
  });

if (!config.isProduction) {
  globalForPrisma.__idbPrisma = prisma;
}

export default prisma;
