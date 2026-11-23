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
import paymentRoutes, { paystackWebhook } from './routes/payments.js';
import customerRoutes from './routes/customers.js';
import adminRoutes from './routes/admin.js';
import adminCatalogueRoutes from './routes/adminCatalogue.js';

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
// Paystack signs the exact raw bytes of the webhook body. This route MUST be
// registered before express.json(), otherwise the parser consumes the body and
// every signature check fails.
app.post('/api/payments/webhook', express.raw({ type: 'application/json', limit: '100kb' }), paystackWebhook);

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
app.use('/api/payments', paymentRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminCatalogueRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
