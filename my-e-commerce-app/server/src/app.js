import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import collectionRoutes from './routes/collections.js';
import recommendationRoutes from './routes/recommendations.js';
import orderRoutes from './routes/orders.js';

/**
 * Express application factory (prd/agent.md sections 14 and 15, Phase 5).
 * The app is exported without listening so tests can drive it directly with
 * supertest; `src/server.js` owns the HTTP listener.
 */
const app = express();

app.disable('x-powered-by');
// Behind a reverse proxy in production so secure cookies and rate limiting see
// the real client protocol/address.
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'id-beddings-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/orders', orderRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
