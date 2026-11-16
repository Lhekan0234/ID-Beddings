import { Router } from 'express';
import prisma from '../db.js';
import { asyncHandler } from '../utils/async.js';
import { validate } from '../middleware/validate.js';
import { ApiError } from '../middleware/errors.js';
import { productParamsSchema, productQuerySchema } from '../validation/schemas.js';
import { serialiseProduct } from '../serialisers.js';

const router = Router();

const productInclude = {
  collection: true,
  images: { orderBy: { position: 'asc' } },
};

function orderByFor(sort) {
  switch (sort) {
    case 'price-asc':
      return [{ price: { sort: 'asc', nulls: 'last' } }, { name: 'asc' }];
    case 'price-desc':
      return [{ price: { sort: 'desc', nulls: 'last' } }, { name: 'asc' }];
    case 'name-asc':
      return [{ name: 'asc' }];
    case 'newest':
      return [{ dateAdded: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }];
    case 'featured':
    default:
      return [
        { isNewArrival: 'desc' },
        { dateAdded: { sort: 'desc', nulls: 'last' } },
        { name: 'asc' },
      ];
  }
}

/** GET /api/products — search, filter and sort the non-archived catalogue. */
router.get(
  '/',
  validate({ query: productQuerySchema }),
  asyncHandler(async (req, res) => {
    const { q, collection, firmness, size, inStock, sort } = req.query;

    const where = { isArchived: false };
    if (collection) where.collection = { slug: collection };
    if (firmness) where.firmness = { has: firmness };
    if (size) where.sizes = { has: size };
    if (inStock === 'true') where.stockStatus = 'In stock';
    if (q) {
      where.AND = [
        {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: orderByFor(sort),
      include: productInclude,
    });

    res.json({ products: products.map(serialiseProduct) });
  })
);

/** GET /api/products/:id — accepts either the product id or its slug. */
router.get(
  '/:id',
  validate({ params: productParamsSchema }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: {
        isArchived: false,
        OR: [{ id }, { slug: id }],
      },
      include: productInclude,
    });

    if (!product) {
      throw ApiError.notFound('Product not found.');
    }

    res.json({ product: serialiseProduct(product) });
  })
);

export default router;
