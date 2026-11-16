import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

/**
 * Seed the seven required collections and the clearly-labelled placeholder
 * catalogue. No prices, sizes, firmness, audiences, images or stock levels are
 * invented: those stay empty / null / TBD until the business owner supplies
 * real data (prd/agent.md sections 2.7 and 5).
 *
 * Safe to re-run: every record is upserted by a stable id.
 */
const prisma = new PrismaClient();

const collections = [
  {
    slug: 'budget-sleep',
    name: 'Budget Sleep',
    description: 'Affordable mattresses for everyday comfort.',
    position: 1,
  },
  {
    slug: 'better-sleep',
    name: 'Better Sleep',
    description: 'A step up in support and durability.',
    position: 2,
  },
  {
    slug: 'orthopedic-collection',
    name: 'Orthopedic Collection',
    description: 'Firmer options focused on support.',
    position: 3,
  },
  {
    slug: 'luxury-sleep',
    name: 'Luxury Sleep',
    description: 'Premium materials and finish.',
    position: 4,
  },
  {
    slug: 'hotel-collection',
    name: 'Hotel Collection',
    description: 'Hospitality-grade comfort.',
    position: 5,
  },
  {
    slug: 'new-home-bundle',
    name: 'New Home Bundle',
    description: 'Bundles for setting up a new home.',
    position: 6,
  },
  {
    slug: 'couples-bundle',
    name: 'Couples Bundle',
    description: 'Bundles sized for two.',
    position: 7,
  },
];

const products = [
  {
    id: 'budget-sleep-sample-1',
    slug: 'budget-sleep-sample-1',
    name: 'Budget Sleep Mattress (sample)',
    collectionSlug: 'budget-sleep',
    description:
      'Placeholder listing for the Budget Sleep collection. Real description, price and specifications to be provided by the business owner.',
    isNewArrival: true,
    dateAdded: '2026-01-05',
  },
  {
    id: 'budget-sleep-sample-2',
    slug: 'budget-sleep-sample-2',
    name: 'Budget Sleep Pillowtop (sample)',
    collectionSlug: 'budget-sleep',
    description:
      'Placeholder listing for the Budget Sleep collection. Real details to be provided by the business owner.',
    isNewArrival: false,
    dateAdded: '2025-12-01',
  },
  {
    id: 'better-sleep-sample-1',
    slug: 'better-sleep-sample-1',
    name: 'Better Sleep Mattress (sample)',
    collectionSlug: 'better-sleep',
    description:
      'Placeholder listing for the Better Sleep collection. Real details to be provided by the business owner.',
    isNewArrival: true,
    dateAdded: '2026-01-08',
  },
  {
    id: 'orthopedic-collection-sample-1',
    slug: 'orthopedic-collection-sample-1',
    name: 'Orthopedic Mattress (sample)',
    collectionSlug: 'orthopedic-collection',
    description:
      'Placeholder listing for the Orthopedic Collection. Real details to be provided by the business owner.',
    isNewArrival: false,
    dateAdded: '2025-11-20',
  },
  {
    id: 'luxury-sleep-sample-1',
    slug: 'luxury-sleep-sample-1',
    name: 'Luxury Sleep Mattress (sample)',
    collectionSlug: 'luxury-sleep',
    description:
      'Placeholder listing for the Luxury Sleep collection. Real details to be provided by the business owner.',
    isNewArrival: true,
    dateAdded: '2026-01-10',
  },
  {
    id: 'hotel-collection-sample-1',
    slug: 'hotel-collection-sample-1',
    name: 'Hotel Collection Mattress (sample)',
    collectionSlug: 'hotel-collection',
    description:
      'Placeholder listing for the Hotel Collection. Real details to be provided by the business owner.',
    isNewArrival: false,
    dateAdded: '2025-10-15',
  },
  {
    id: 'new-home-bundle-sample-1',
    slug: 'new-home-bundle-sample-1',
    name: 'New Home Bundle (sample)',
    collectionSlug: 'new-home-bundle',
    description:
      'Placeholder listing for the New Home Bundle. Real bundle contents and pricing to be provided by the business owner.',
    isNewArrival: true,
    dateAdded: '2026-01-12',
  },
  {
    id: 'couples-bundle-sample-1',
    slug: 'couples-bundle-sample-1',
    name: 'Couples Bundle (sample)',
    collectionSlug: 'couples-bundle',
    description:
      'Placeholder listing for the Couples Bundle. Real bundle contents and pricing to be provided by the business owner.',
    isNewArrival: false,
    dateAdded: '2025-09-30',
  },
];

async function seedCatalogue() {
  for (const collection of collections) {
    await prisma.collection.upsert({
      where: { slug: collection.slug },
      update: {
        name: collection.name,
        description: collection.description,
        position: collection.position,
      },
      create: {
        id: collection.slug,
        slug: collection.slug,
        name: collection.name,
        description: collection.description,
        position: collection.position,
      },
    });
  }

  for (const product of products) {
    const data = {
      slug: product.slug,
      name: product.name,
      description: product.description,
      collectionId: product.collectionSlug,
      price: null,
      currency: 'NGN',
      sizes: [],
      firmness: [],
      audiences: [],
      stockStatus: 'TBD',
      stockQuantity: null,
      specs: {},
      isPlaceholder: true,
      isArchived: false,
      isBestSeller: false,
      isNewArrival: product.isNewArrival,
      dateAdded: new Date(`${product.dateAdded}T00:00:00.000Z`),
    };

    await prisma.product.upsert({
      where: { id: product.id },
      update: data,
      create: { id: product.id, ...data },
    });
  }

  const counts = await prisma.$transaction([
    prisma.collection.count(),
    prisma.product.count(),
  ]);
  console.log(`[seed] catalogue ready: ${counts[0]} collections, ${counts[1]} products`);
}

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  const name = (process.env.ADMIN_NAME || 'Store administrator').trim();

  if (!email && !password) {
    console.log('[seed] ADMIN_EMAIL/ADMIN_PASSWORD not set — skipped admin account creation.');
    return;
  }
  if (!email || !password) {
    throw new Error('Set both ADMIN_EMAIL and ADMIN_PASSWORD, or neither.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    throw new Error('ADMIN_EMAIL is not a valid email address.');
  }
  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters.');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    // Never overwrite an existing password on re-seed; only ensure the role.
    update: { role: 'ADMIN' },
    create: { email, passwordHash, name, role: 'ADMIN' },
  });

  console.log(`[seed] administrator ensured for ${email}`);
}

async function main() {
  await seedCatalogue();
  await seedAdmin();
}

main()
  .catch((error) => {
    console.error('[seed] failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
