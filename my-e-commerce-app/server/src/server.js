import app from './app.js';
import prisma from './db.js';
import { config } from './config.js';

const server = app.listen(config.port, () => {
  console.log(`[api] ID Beddings API listening on http://localhost:${config.port} (${config.nodeEnv})`);
});

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[api] ${signal} received, shutting down…`);

  server.close(async () => {
    try {
      await prisma.$disconnect();
    } finally {
      process.exit(0);
    }
  });

  // Do not hang forever on open keep-alive connections.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
