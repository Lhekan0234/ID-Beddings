import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ownerLines } from '../../src/data/ownerCatalogue.mjs';

/**
 * Seed the seven collections and the owner-supplied catalogue.
 *
 * Prices, labels and sizes come from `src/data/ownerCatalogue.mjs`, the same
 * source the storefront uses, so the API cannot drift from the website.
 * Stock levels and real product photographs are NOT invented: stock stays TBD
 * and images are local SVGs explicitly marked as illustrative in `specs`.
 *
 * Safe to re-run: collections and products are upserted by stable id.
 */
const prisma = new PrismaClient();

const collections = [
  { slug: 'budget-sleep', name: 'Budget Sleep', description: 'Affordable mattresses for everyday comfort.', position: 1 },
  { slug: 'better-sleep', name: 'Better Sleep', description: 'A step up in support and durability.', position: 2 },
  { slug: 'orthopedic-collection', name: 'Orthopedic Collection', description: 'Firmer options focused on support.', position: 3 },
  { slug: 'luxury-sleep', name: 'Luxury Sleep', description: 'Premium materials and finish.', position: 4 },
  { slug: 'hotel-collection', name: 'Hotel Collection', description: 'Hospitality and institutional mattresses.', position: 5 },
  { slug: 'new-home-bundle', name: 'New Home Bundle', description: 'Bundles for setting up a new home.', position: 6 },
  { slug: 'couples-bundle', name: 'Couples Bundle', description: 'Bundles sized for two.', position: 7 },
];

const slugify = (text) =>
  String(text).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const ownerProducts = ownerLines.flatMap((line) =>
  line.rows.map(([label, size, price], index) => ({
    id: `${slugify(line.line)}-${index + 1}`,
    slug: `${slugify(line.line)}-${index + 1}`,
    name: label,
    collectionSlug: line.collection,
    description: `${label} — owner-supplied price list. Size ${size}. Other specifications have not been supplied.`,
    price,
    size,
    firmness: line.firmness ? [...line.firmness] : [],
    audiences: line.audiences ? [...line.audiences] : [],
    image: `/images/beds/${line.image}.svg`,
    tier: line.tier,
    productLine: line.line,
  }))
);

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

  for (const product of ownerProducts) {
    const data = {
      slug: product.slug,
      name: product.name,
      description: product.description,
      collectionId: product.collectionSlug,
      price: product.price,
      currency: 'NGN',
      sizes: [product.size],
      firmness: product.firmness,
      audiences: product.audiences,
      stockStatus: 'TBD',
      stockQuantity: null,
      specs: {
        tier: product.tier,
        productLine: product.productLine,
        source: 'Owner price list, 2026-11-24',
        illustrativeImage: true,
      },
      isPlaceholder: false,
      isArchived: false,
      isBestSeller: false,
      isNewArrival: false,
      dateAdded: null,
    };

    await prisma.product.upsert({
      where: { id: product.id },
      update: data,
      create: { id: product.id, ...data },
    });

    // Replace images so a re-seed cannot leave stale or duplicated records.
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: product.image,
        alt: `${product.name} — illustrative image, not a product photograph`,
        position: 0,
      },
    });
  }

  const counts = await prisma.$transaction([
    prisma.collection.count(),
    prisma.product.count(),
    prisma.productImage.count(),
  ]);
  console.log(
    `[seed] catalogue ready: ${counts[0]} collections, ${counts[1]} products, ${counts[2]} illustrative images`
  );
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
