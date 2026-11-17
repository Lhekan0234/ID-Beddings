import { Router } from 'express';
import prisma from '../db.js';
import { config } from '../config.js';
import { asyncHandler } from '../utils/async.js';
import { validate } from '../middleware/validate.js';
import { ApiError } from '../middleware/errors.js';
import { paystack } from '../services/paystack.js';
import { verifyWebhookRequest } from '../services/paystackSignature.js';
import {
  applyPaymentTransaction,
  generatePaymentReference,
  PAYMENT_PROVIDER,
} from '../services/payments.js';
import {
  initializePaymentSchema,
  paymentReferenceParamsSchema,
  verifyPaymentQuerySchema,
} from '../validation/schemas.js';
import { serialiseOrder, serialisePayment } from '../serialisers.js';

const router = Router();

const orderInclude = {
  customer: true,
  items: true,
  events: { orderBy: { createdAt: 'asc' } },
};

/**
 * POST /api/payments/initialize
 *
 * Creates a payment attempt for an existing order and returns Paystack's hosted
 * checkout URL. The amount comes from the database order, never from the
 * browser. Payment is refused while the delivery charge is still unconfirmed,
 * because charging an incomplete total would be dishonest.
 */
router.post(
  '/initialize',
  validate({ body: initializePaymentSchema }),
  asyncHandler(async (req, res) => {
    const { reference, email } = req.body;

    const order = await prisma.order.findUnique({
      where: { reference },
      include: { customer: true },
    });

    if (!order || order.customer?.email?.toLowerCase() !== email) {
      throw ApiError.notFound('No order matches that reference and email address.');
    }
    if (order.status === 'CANCELLED') {
      throw ApiError.conflict('This order has been cancelled.');
    }
    if (order.paymentStatus === 'PAID') {
      throw ApiError.conflict('This order has already been paid.');
    }
    if (order.requiresDeliveryQuote) {
      throw ApiError.conflict(
        'Delivery charges for this order have not been confirmed yet. Please contact us so we can quote delivery before payment.'
      );
    }
    if (!Number.isInteger(order.total) || order.total <= 0) {
      throw ApiError.conflict('This order does not have a payable total yet.');
    }

    // Only one live attempt per order: expire stale pending attempts first.
    await prisma.payment.updateMany({
      where: { orderId: order.id, status: 'PENDING' },
      data: {
        status: 'EXPIRED',
        failureReason: 'Superseded by a newer payment attempt.',
      },
    });

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: PAYMENT_PROVIDER,
        reference: generatePaymentReference(),
        status: 'PENDING',
        amount: order.total,
        currency: order.currency,
      },
    });

    let transaction;
    try {
      transaction = await paystack.initializeTransaction({
        email: order.customer.email,
        amountKobo: order.total * 100,
        reference: payment.reference,
        callbackUrl: config.paystack.callbackUrl,
        metadata: {
          orderReference: order.reference,
          paymentReference: payment.reference,
          customerName: order.customer.fullName,
        },
      });
    } catch (error) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          failureReason: String(error.message || 'Could not start the payment.').slice(0, 500),
          verifiedAt: new Date(),
        },
      });
      throw error;
    }

    if (!transaction?.authorization_url) {
      throw new ApiError(
        502,
        'The payment provider did not return a checkout page. Please try again.'
      );
    }

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: { channel: transaction.channel || null },
    });

    res.status(201).json({
      payment: serialisePayment(updated),
      authorizationUrl: transaction.authorization_url,
      accessCode: transaction.access_code || null,
      orderReference: order.reference,
    });
  })
);

/**
 * GET /api/payments/verify/:reference?email=...
 *
 * The browser redirect is never proof of payment: this endpoint asks Paystack
 * for the transaction status, then validates reference, amount and currency
 * against the database before settling the order.
 *
 * The checkout email is required for guests so payment references cannot be
 * enumerated to read order details.
 */
router.get(
  '/verify/:reference',
  validate({ params: paymentReferenceParamsSchema, query: verifyPaymentQuerySchema }),
  asyncHandler(async (req, res) => {
    const { reference } = req.params;
    const { email } = req.query;

    const payment = await prisma.payment.findUnique({
      where: { reference },
      include: { order: { include: { customer: true } } },
    });

    if (!payment || payment.order?.customer?.email?.toLowerCase() !== email) {
      throw ApiError.notFound('No payment matches that reference and email address.');
    }

    const transaction = await paystack.verifyTransaction(payment.reference);
    const result = await applyPaymentTransaction(payment.id, transaction);

    const order = await prisma.order.findUnique({
      where: { id: payment.orderId },
      include: orderInclude,
    });

    res.json({
      payment: serialisePayment(result.payment),
      order: serialiseOrder(order),
      alreadyProcessed: Boolean(result.alreadyProcessed),
    });
  })
);

/**
 * POST /api/payments/webhook
 *
 * Mounted with `express.raw` before the JSON body parser (see src/app.js).
 * Paystack retries failed deliveries, so this handler must be idempotent and
 * must acknowledge genuine events with 200 even when there is nothing to do.
 */
export const paystackWebhook = asyncHandler(async (req, res) => {
  const genuine = verifyWebhookRequest({
    rawBody: req.body,
    headers: req.headers,
    secretKey: config.paystack.secretKey,
    webhookSecret: config.paystack.webhookSecret,
  });

  if (!genuine) {
    res.status(401).json({ error: 'Invalid webhook signature.' });
    return;
  }

  let event = null;
  try {
    event = JSON.parse(req.body.toString('utf8'));
  } catch {
    res.status(400).json({ error: 'Invalid webhook payload.' });
    return;
  }

  const reference = event?.data?.reference;
  if (!reference || typeof reference !== 'string') {
    res.json({ received: true, ignored: true });
    return;
  }

  const payment = await prisma.payment.findUnique({ where: { reference } });

  // Unknown references (for example another integration on the same account)
  // are acknowledged but ignored.
  if (!payment) {
    res.json({ received: true, ignored: true });
    return;
  }

  if (event.event === 'charge.success' || event.event === 'charge.failed') {
    try {
      await applyPaymentTransaction(payment.id, event.data);
    } catch (error) {
      // Never make Paystack retry a genuine event because our database rejected
      // it; log it for investigation instead.
      console.error(`[payments] webhook ${event.event} failed:`, error.message);
    }
  }

  res.json({ received: true });
});

export default router;
