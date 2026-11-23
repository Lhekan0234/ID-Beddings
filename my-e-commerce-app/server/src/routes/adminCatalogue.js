import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import prisma from '../db.js';
import { asyncHandler } from '../utils/async.js';
import { validate } from '../middleware/validate.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { ApiError } from '../middleware/errors.js';
import { serialiseCollection, serialiseProduct } from '../serialisers.js';
import {
  adminCollectionCreateSchema,
  adminCollectionUpdateSchema,
  adminProductCreateSchema,
  adminProductListQuerySchema,
  adminProductUpdateSchema,
  customerIdParamsSchema,
} from '../validation/schemas.js';

const router = Router();

// Catalogue changes are administrative actions, enforced on the server.
router.use(authenticate, requireAdmin);

const productInclude = {
  collection: true,
  images: { orderBy: { position: 'asc' } },
};

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 140);
}

async function uniqueSlug(requested, name) {
  const base = requested || slugify(name) || 'product';
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const taken = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!taken) return candidate;
  }
  throw new ApiError(503, 'Could not create a unique product slug. Please try again.');
}

function scalarProductData(data, { isCreate }) {
  const result = { ...data };
  delete result.images;
  delete result.slug;
  if (isCreate) result.isPlaceholder = false;
  if (Object.prototype.hasOwnProperty.call(result, 'stockQuantity') && result.stockQuantity === undefined) {
    delete result.stockQuantity;
  }
  return result;
}

/** GET /api/admin/products — includes archived items for management. */
router.get(
  '/products',
  validate({ query: adminProductListQuerySchema }),
  asyncHandler(async (req, res) => {
    const { page, pageSize, q, includeArchived } = req.query;
    const where = {};
    if (includeArchived !== 'true') where.isArchived = false;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: [{ isArchived: 'asc' }, { name: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    res.json({
      products: products.map(serialiseProduct),
      pagination: { page, pageSize, total },
    });
  })
);

/** POST /api/admin/products — add a real product supplied by the owner. */
router.post(
  '/products',
  validate({ body: adminProductCreateSchema }),
  asyncHandler(async (req, res) => {
    const { collectionId } = req.body;
    const collection = await prisma.collection.findUnique({ where: { id: collectionId } });
    if (!collection) {
      throw ApiError.badRequest('Choose an existing collection.', [
        { field: 'collectionId', message: 'Collection not found.' },
      ]);
    }

    const images = Array.isArray(req.body.images) ? req.body.images.filter(Boolean) : [];
    const product = await prisma.product.create({
      data: {
        ...scalarProductData(req.body, { isCreate: true }),
        id: randomUUID(),
        slug: await uniqueSlug(req.body.slug, req.body.name),
        images: {
          create: images.map((url, position) => ({ url, position })),
        },
      },
      include: productInclude,
    });

    res.status(201).json({ product: serialiseProduct(product) });
  })
);

/** PATCH /api/admin/products/:id — prices, stock, images, flags and archive. */
router.patch(
  '/products/:id',
  validate({ params: customerIdParamsSchema, body: adminProductUpdateSchema }),
  asyncHandler(async (req, res) => {
    const existing = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: productInclude,
    });
    if (!existing) {
      throw ApiError.notFound('Product not found.');
    }

    const { images, ...scalars } = req.body;
    if (scalars.collectionId) {
      const collection = await prisma.collection.findUnique({
        where: { id: scalars.collectionId },
      });
      if (!collection) {
        throw ApiError.badRequest('Choose an existing collection.', [
          { field: 'collectionId', message: 'Collection not found.' },
        ]);
      }
    }

    const product = await prisma.$transaction(async (tx) => {
      if (Array.isArray(images)) {
        await tx.productImage.deleteMany({ where: { productId: existing.id } });
      }
      return tx.product.update({
        where: { id: existing.id },
        data: {
          ...scalarProductData(scalars, { isCreate: false }),
          ...(Array.isArray(images)
            ? {
                images: {
                  create: images
                    .filter(Boolean)
                    .map((url, position) => ({ url, position })),
                },
              }
            : {}),
        },
        include: productInclude,
      });
    });

    res.json({ product: serialiseProduct(product) });
  })
);

/** GET /api/admin/collections — all collections with live product counts. */
router.get(
  '/collections',
  asyncHandler(async (_req, res) => {
    const collections = await prisma.collection.findMany({
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { products: true } } },
    });

    res.json({
      collections: collections.map((collection) =>
        serialiseCollection({ ...collection, productCount: collection._count.products })
      ),
    });
  })
);

/** POST /api/admin/collections — add a collection when the owner supplies one. */
router.post(
  '/collections',
  validate({ body: adminCollectionCreateSchema }),
  asyncHandler(async (req, res) => {
    const collection = await prisma.collection.create({
      data: req.body,
      include: { _count: { select: { products: true } } },
    });
    res.status(201).json({
      collection: serialiseCollection({
        ...collection,
        productCount: collection._count.products,
      }),
    });
  })
);

/** PATCH /api/admin/collections/:id — rename/reorder an existing collection. */
router.patch(
  '/collections/:id',
  validate({ params: customerIdParamsSchema, body: adminCollectionUpdateSchema }),
  asyncHandler(async (req, res) => {
    const collection = await prisma.collection.update({
      where: { id: req.params.id },
      data: req.body,
      include: { _count: { select: { products: true } } },
    });
    res.json({
      collection: serialiseCollection({
        ...collection,
        productCount: collection._count.products,
      }),
    });
  })
);

export default router;
