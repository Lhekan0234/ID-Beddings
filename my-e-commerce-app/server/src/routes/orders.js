import { Router } from 'express';
import prisma from '../db.js';
import { asyncHandler } from '../utils/async.js';
import { validate } from '../middleware/validate.js';
import { authenticate, identify, requireAdmin } from '../middleware/auth.js';
import { ApiError } from '../middleware/errors.js';
import { priceOrder } from '../services/pricing.js';
import { generateOrderReference } from '../services/reference.js';
import { buildReceiptPdf } from '../services/receiptPdf.js';
import { serialiseOrder } from '../serialisers.js';
import {
  createOrderSchema,
  orderReferenceParamsSchema,
  paginationQuerySchema,
  receiptRequestSchema,
  trackOrderSchema,
  updateDeliverySchema,
  updateOrderStatusSchema,
} from '../validation/schemas.js';

const router = Router();

const orderInclude = {
  customer: true,
  items: true,
  events: { orderBy: { createdAt: 'asc' } },
};

/** Merge duplicate product+size lines so a hand-crafted request cannot dodge limits. */
function mergeLines(lines) {
  const merged = new Map();
  for (const line of lines) {
    const key = `${line.productId}::${line.size || ''}`;
    const existing = merged.get(key);
    if (existing) {
      existing.quantity += line.quantity;
    } else {
      merged.set(key, { ...line });
    }
  }
  return [...merged.values()];
}

async function nextOrderReference() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateOrderReference();
    const taken = await prisma.order.findUnique({
      where: { reference: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  throw new ApiError(503, 'Could not create a unique order reference. Please try again.');
}

/**
 * POST /api/orders — create an order and recalculate every total on the server
 * (prd/agent.md section 8). Delivery is quoted separately until the owner
 * supplies delivery charges, so `requiresDeliveryQuote` is true and the total
 * excludes delivery rather than inventing a fee.
 *
 * Payment is NOT taken here. Phase 6 initialises and verifies payment; until
 * then the order is recorded with paymentStatus PENDING.
 */
router.post(
  '/',
  validate({ body: createOrderSchema }),
  asyncHandler(async (req, res) => {
    const { customer } = req.body;
    const lines = mergeLines(req.body.items);

    const ids = [...new Set(lines.map((line) => line.productId))];
    const products = await prisma.product.findMany({ where: { id: { in: ids } } });
    const byId = new Map(products.map((product) => [product.id, product]));

    const priced = priceOrder(
      lines.map((line) => ({
        product: byId.get(line.productId),
        size: line.size,
        quantity: line.quantity,
      })),
      { deliveryFee: null }
    );

    const customerRecord = await prisma.customer.upsert({
      where: { email: customer.email },
      update: {
        fullName: customer.fullName,
        phone: customer.phone,
        address: customer.address,
        state: customer.state,
        city: customer.city,
      },
      create: {
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        state: customer.state,
        city: customer.city,
      },
    });

    const reference = await nextOrderReference();

    const order = await prisma.order.create({
      data: {
        reference,
        customerId: customerRecord.id,
        status: 'ORDER_PLACED',
        subtotal: priced.subtotal,
        deliveryFee: priced.deliveryFee,
        total: priced.total,
        requiresDeliveryQuote: priced.requiresDeliveryQuote,
        deliveryInstructions: customer.deliveryInstructions || null,
        items: { create: priced.items },
        events: {
          create: {
            status: 'ORDER_PLACED',
            note: 'Order placed. Awaiting delivery quote and payment confirmation.',
          },
        },
      },
      include: orderInclude,
    });

    res.status(201).json({ order: serialiseOrder(order) });
  })
);

/**
 * POST /api/orders/track — a customer checks their own order using the order
 * reference plus the email used at checkout. A wrong pair returns the same
 * generic 404 so references cannot be enumerated.
 */
router.post(
  '/track',
  validate({ body: trackOrderSchema }),
  asyncHandler(async (req, res) => {
    const { reference, email } = req.body;

    const order = await prisma.order.findUnique({
      where: { reference },
      include: orderInclude,
    });

    if (!order || order.customer?.email?.toLowerCase() !== email) {
      throw ApiError.notFound('No order matches that reference and email address.');
    }

    res.json({ order: serialiseOrder(order) });
  })
);

/**
 * GET /api/orders — signed-in customers see only their own orders; admins see
 * all orders. Pagination keeps responses bounded.
 */
router.get(
  '/',
  authenticate,
  validate({ query: paginationQuerySchema }),
  asyncHandler(async (req, res) => {
    const { page, pageSize } = req.query;
    const where =
      req.user.role === 'ADMIN'
        ? {}
        : { customer: { OR: [{ userId: req.user.id }, { email: req.user.email }] } };

    const [total, orders] = await prisma.$transaction([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    res.json({
      orders: orders.map(serialiseOrder),
      pagination: { page, pageSize, total },
    });
  })
);

/** GET /api/orders/:reference — owner or administrator only. */
router.get(
  '/:reference',
  authenticate,
  validate({ params: orderReferenceParamsSchema }),
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { reference: req.params.reference },
      include: orderInclude,
    });

    if (!order) {
      throw ApiError.notFound('Order not found.');
    }

    const isOwner =
      order.customer?.userId === req.user.id ||
      order.customer?.email?.toLowerCase() === req.user.email.toLowerCase();

    if (req.user.role !== 'ADMIN' && !isOwner) {
      // Do not reveal that the order exists.
      throw ApiError.notFound('Order not found.');
    }

    res.json({ order: serialiseOrder(order) });
  })
);

/**
 * PATCH /api/orders/:reference/status — fulfilment updates for administrators.
 * PAYMENT_CONFIRMED is deliberately rejected here: it may only be set by the
 * verified payment flow (Phase 6), never by a manual dashboard edit.
 */
router.patch(
  '/:reference/status',
  authenticate,
  requireAdmin,
  validate({ params: orderReferenceParamsSchema, body: updateOrderStatusSchema }),
  asyncHandler(async (req, res) => {
    const { status, note } = req.body;

    if (status === 'PAYMENT_CONFIRMED') {
      throw new ApiError(
        409,
        'Payment confirmation is recorded only after the payment provider verifies a transaction.'
      );
    }

    const order = await prisma.order.update({
      where: { reference: req.params.reference },
      data: {
        status,
        events: {
          create: {
            status,
            note: note || `Status updated to ${status}.`,
            createdBy: req.user.email,
          },
        },
      },
      include: orderInclude,
    });

    res.json({ order: serialiseOrder(order) });
  })
);

/**
 * PATCH /api/orders/:reference/delivery — an administrator confirms the
 * delivery charge. Payment cannot start until this has been done, because the
 * customer must see a complete total (prd/agent.md section 8).
 */
router.patch(
  '/:reference/delivery',
  authenticate,
  requireAdmin,
  validate({ params: orderReferenceParamsSchema, body: updateDeliverySchema }),
  asyncHandler(async (req, res) => {
    const { reference } = req.params;
    const { deliveryFee } = req.body;

    const existing = await prisma.order.findUnique({ where: { reference } });
    if (!existing) {
      throw ApiError.notFound('Order not found.');
    }
    if (existing.paymentStatus === 'PAID') {
      throw ApiError.conflict('The delivery charge on a paid order cannot be changed.');
    }

    const order = await prisma.order.update({
      where: { reference },
      data: {
        deliveryFee,
        total: existing.subtotal + deliveryFee,
        requiresDeliveryQuote: false,
        events: {
          create: {
            status: existing.status,
            note:
              deliveryFee === 0
                ? 'Delivery charge confirmed: free delivery.'
                : `Delivery charge confirmed: NGN ${deliveryFee.toLocaleString('en-NG')}.`,
            createdBy: req.user.email,
          },
        },
      },
      include: orderInclude,
    });

    res.json({ order: serialiseOrder(order) });
  })
);

/**
 * POST /api/orders/:reference/receipt — downloadable PDF receipt.
 *
 * Available only after the server has verified payment. Signed-in owners and
 * administrators are authorised by session; guests must supply the checkout
 * email, and a mismatch returns the same not-found response used elsewhere so
 * orders cannot be probed.
 */
router.post(
  '/:reference/receipt',
  identify,
  validate({ params: orderReferenceParamsSchema, body: receiptRequestSchema }),
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({
      where: { reference: req.params.reference },
      include: {
        customer: true,
        items: true,
        payments: { where: { status: 'PAID' }, orderBy: { paidAt: 'desc' } },
        receipt: true,
      },
    });

    if (!order) {
      throw ApiError.notFound('Order not found.');
    }

    const user = req.user;
    const isAdmin = user?.role === 'ADMIN';
    const isOwner =
      Boolean(user) &&
      (order.customer?.userId === user.id ||
        order.customer?.email?.toLowerCase() === user.email.toLowerCase());

    if (!isAdmin && !isOwner) {
      const email = req.body.email;
      if (!email || email !== order.customer?.email?.toLowerCase()) {
        throw ApiError.notFound('No order matches that reference and email address.');
      }
    }

    if (order.paymentStatus !== 'PAID' || !order.receipt) {
      throw new ApiError(
        409,
        'A receipt is available only after payment has been verified. This order is still awaiting payment.'
      );
    }

    const pdf = await buildReceiptPdf({
      order,
      payment: order.payments[0] || null,
      receipt: order.receipt,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="receipt-${order.receipt.receiptNumber}.pdf"`
    );
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(pdf);
  })
);

export default router;
