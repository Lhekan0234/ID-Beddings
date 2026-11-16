import { Router } from 'express';
import prisma from '../db.js';
import { asyncHandler } from '../utils/async.js';
import { validate } from '../middleware/validate.js';
import { recommendationSchema } from '../validation/schemas.js';
import { recommendProducts } from '../services/recommend.js';
import { serialiseProduct } from '../serialisers.js';

const router = Router();

/**
 * POST /api/recommendations — mattress matching (prd/agent.md section 7).
 * Matching runs on the server against the real catalogue. Products that lack a
 * price, firmness or audience are excluded rather than guessed at.
 */
router.post(
  '/',
  validate({ body: recommendationSchema }),
  asyncHandler(async (req, res) => {
    const answers = req.body;

    const products = await prisma.product.findMany({
      where: { isArchived: false },
      include: {
        collection: true,
        images: { orderBy: { position: 'asc' } },
      },
    });

    const matches = recommendProducts(products, answers);

    res.json({
      answers,
      products: matches.map(serialiseProduct),
    });
  })
);

export default router;
