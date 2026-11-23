import { Router } from 'express';
import prisma from '../db.js';
import { asyncHandler } from '../utils/async.js';
import { validate } from '../middleware/validate.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import {
  buildSalesWhere,
  serialiseTransaction,
  transactionsToCsv,
  verifiedRevenue,
} from '../services/adminReports.js';
import {
  adminSalesQuerySchema,
  adminSettingsSchema,
} from '../validation/schemas.js';

const router = Router();

// Every route in this router is administrator-only: the frontend is never
// trusted to hide these endpoints (prd/agent.md section 13).
router.use(authenticate, requireAdmin);

const transactionInclude = {
  order: { include: { customer: true } },
};

/** Values shown before the owner supplies anything. Nothing is invented. */
const DEFAULT_SETTINGS = {
  contact: { phone: null, email: null, address: null },
  hours: null,
  whatsapp: {
    catalogue: 'https://wa.me/c/2349087201583',
    specialist: 'https://wa.me/c/2348038526476',
    verified: false,
  },
  delivery: { fee: null, note: null },
};

/**
 * GET /api/admin/overview — all figures come from real database records.
 * "Pending orders" means unpaid and not cancelled.
 */
router.get(
  '/overview',
  asyncHandler(async (_req, res) => {
    const [revenue, totalOrders, pendingOrders, customerCount, recent] =
      await Promise.all([
        prisma.payment.aggregate({
          where: { status: 'PAID' },
          _sum: { amount: true },
          _count: { _all: true },
        }),
        prisma.order.count(),
        prisma.order.count({
          where: { paymentStatus: { not: 'PAID' }, status: { not: 'CANCELLED' } },
        }),
        prisma.customer.count(),
        prisma.payment.findMany({
          where: { status: 'PAID' },
          include: transactionInclude,
          orderBy: { paidAt: 'desc' },
          take: 5,
        }),
      ]);

    res.json({
      overview: {
        verifiedRevenue: revenue._sum.amount || 0,
        verifiedPayments: revenue._count._all,
        totalOrders,
        pendingOrders,
        customerCount,
        currency: 'NGN',
        recentTransactions: recent.map(serialiseTransaction),
      },
    });
  })
);

/** GET /api/admin/sales — searchable, filterable, paginated payment records. */
router.get(
  '/sales',
  validate({ query: adminSalesQuerySchema }),
  asyncHandler(async (req, res) => {
    const { page, pageSize } = req.query;
    const where = buildSalesWhere(req.query);

    const [total, payments, revenueRows] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        include: transactionInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.payment.findMany({ where, select: { status: true, amount: true } }),
    ]);

    res.json({
      transactions: payments.map(serialiseTransaction),
      summary: {
        count: total,
        verifiedRevenue: verifiedRevenue(revenueRows),
      },
      pagination: { page, pageSize, total },
    });
  })
);

/** GET /api/admin/sales/export.csv — the same filters, exported as CSV. */
router.get(
  '/sales/export.csv',
  validate({ query: adminSalesQuerySchema }),
  asyncHandler(async (req, res) => {
    const payments = await prisma.payment.findMany({
      where: buildSalesWhere(req.query),
      include: transactionInclude,
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });

    const csv = transactionsToCsv(payments.map(serialiseTransaction));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="idb-sales.csv"');
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(csv);
  })
);

/** GET /api/admin/settings — saved values only, with honest blank defaults. */
router.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    const stored = await prisma.setting.findMany({
      where: { key: { in: Object.keys(DEFAULT_SETTINGS) } },
    });
    const byKey = new Map(stored.map((row) => [row.key, row.value]));

    const settings = {
      contact: { ...DEFAULT_SETTINGS.contact, ...(byKey.get('contact') || {}) },
      hours: byKey.get('hours') ?? DEFAULT_SETTINGS.hours,
      whatsapp: { ...DEFAULT_SETTINGS.whatsapp, ...(byKey.get('whatsapp') || {}) },
      delivery: { ...DEFAULT_SETTINGS.delivery, ...(byKey.get('delivery') || {}) },
    };

    res.json({ settings });
  })
);

/**
 * PUT /api/admin/settings — save owner-confirmed business details.
 * The `verified` flag is deliberately not writable through the API: a link is
 * only verified when the owner confirms the intended destination.
 */
router.put(
  '/settings',
  validate({ body: adminSettingsSchema }),
  asyncHandler(async (req, res) => {
    for (const [key, value] of Object.entries(req.body)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    const stored = await prisma.setting.findMany({
      where: { key: { in: Object.keys(DEFAULT_SETTINGS) } },
    });
    const byKey = new Map(stored.map((row) => [row.key, row.value]));

    res.json({
      settings: {
        contact: { ...DEFAULT_SETTINGS.contact, ...(byKey.get('contact') || {}) },
        hours: byKey.get('hours') ?? DEFAULT_SETTINGS.hours,
        whatsapp: { ...DEFAULT_SETTINGS.whatsapp, ...(byKey.get('whatsapp') || {}) },
        delivery: { ...DEFAULT_SETTINGS.delivery, ...(byKey.get('delivery') || {}) },
      },
    });
  })
);

export default router;
