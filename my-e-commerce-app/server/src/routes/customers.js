import { Router } from 'express';
import prisma from '../db.js';
import { asyncHandler } from '../utils/async.js';
import { validate } from '../middleware/validate.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { ApiError } from '../middleware/errors.js';
import { serialiseCustomer, serialiseOrder } from '../serialisers.js';
import {
  customerIdParamsSchema,
  customerSearchQuerySchema,
  paginationQuerySchema,
} from '../validation/schemas.js';

const router = Router();

const orderInclude = {
  customer: true,
  items: true,
  events: { orderBy: { createdAt: 'asc' } },
};

/** A signed-in user owns a customer record by linked userId or matching email. */
function ownerWhere(user) {
  return {
    OR: [{ userId: user.id }, { email: user.email.toLowerCase() }],
  };
}

/**
 * GET /api/customers/me — the signed-in customer's own saved delivery details.
 * A user who has never ordered has no customer record; we return null rather
 * than inventing one (prd/agent.md section 21).
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const customer = await prisma.customer.findFirst({ where: ownerWhere(req.user) });
    const orderCount = customer
      ? await prisma.order.count({ where: { customerId: customer.id } })
      : 0;

    res.json({ customer: serialiseCustomer(customer, { orderCount }) });
  })
);

/**
 * GET /api/customers/me/orders — only the signed-in customer's order history.
 * This is the persistent source of truth; localStorage is never used for it.
 */
router.get(
  '/me/orders',
  authenticate,
  validate({ query: paginationQuerySchema }),
  asyncHandler(async (req, res) => {
    const { page, pageSize } = req.query;
    const customer = await prisma.customer.findFirst({ where: ownerWhere(req.user) });
    if (!customer) {
      res.json({ orders: [], pagination: { page, pageSize, total: 0 } });
      return;
    }

    const where = { customerId: customer.id };
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

/** GET /api/customers — administrator-only search over real database records. */
router.get(
  '/',
  authenticate,
  requireAdmin,
  validate({ query: customerSearchQuerySchema }),
  asyncHandler(async (req, res) => {
    const { page, pageSize, q } = req.query;
    const where = q
      ? {
          OR: [
            { fullName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {};

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { orders: true } } },
    });

    res.json({
      customers: customers.map((customer) =>
        serialiseCustomer(customer, { orderCount: customer._count.orders })
      ),
      pagination: {
        page,
        pageSize,
        total: await prisma.customer.count({ where }),
      },
    });
  })
);

/** GET /api/customers/:id — administrator-only record with order history. */
router.get(
  '/:id',
  authenticate,
  requireAdmin,
  validate({ params: customerIdParamsSchema }),
  asyncHandler(async (req, res) => {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: { orders: { include: orderInclude, orderBy: { createdAt: 'desc' } } },
    });

    if (!customer) {
      throw ApiError.notFound('Customer not found.');
    }

    res.json({
      customer: serialiseCustomer(customer, { orderCount: customer.orders.length }),
      orders: customer.orders.map(serialiseOrder),
    });
  })
);

export default router;
