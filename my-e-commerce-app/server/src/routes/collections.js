import { Router } from 'express';
import prisma from '../db.js';
import { asyncHandler } from '../utils/async.js';
import { validate } from '../middleware/validate.js';
import { ApiError } from '../middleware/errors.js';
import { collectionParamsSchema } from '../validation/schemas.js';
import { serialiseCollection, serialiseProduct } from '../serialisers.js';

const router = Router();

const productInclude = {
  collection: true,
  images: { orderBy: { position: 'asc' } },
};

/** GET /api/collections — the seven required collections in display order. */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const collections = await prisma.collection.findMany({
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { products: { where: { isArchived: false } } },
        },
      },
    });

    res.json({ collections: collections.map(serialiseCollection) });
  })
);

/** GET /api/collections/:slug — collection details plus its live products. */
router.get(
  '/:slug',
  validate({ params: collectionParamsSchema }),
  asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const collection = await prisma.collection.findUnique({
      where: { slug },
      include: {
        products: {
          where: { isArchived: false },
          orderBy: [{ isNewArrival: 'desc' }, { name: 'asc' }],
          include: productInclude,
        },
      },
    });

    if (!collection) {
      throw ApiError.notFound('Collection not found.');
    }

    res.json({
      collection: serialiseCollection(collection),
      products: collection.products.map(serialiseProduct),
    });
  })
);

export default router;
