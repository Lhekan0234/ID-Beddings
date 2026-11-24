import {
  collections,
  products,
  priceTiers,
  firmnessOptions,
  sizeOptions,
  getCollectionBySlug,
  getProductById,
  getProductsByCollection,
  getProductsByTier,
  getProductLines,
  getNewArrivals,
  getBestSellers,
} from './products';
import { ownerLines } from './ownerCatalogue.mjs';

const REQUIRED_COLLECTIONS = [
  'Budget Sleep',
  'Better Sleep',
  'Orthopedic Collection',
  'Luxury Sleep',
  'Hotel Collection',
  'New Home Bundle',
  'Couples Bundle',
];

describe('collections', () => {
  it('includes all seven required collections', () => {
    const names = collections.map((c) => c.name);
    expect(names).toEqual(expect.arrayContaining(REQUIRED_COLLECTIONS));
    expect(collections).toHaveLength(REQUIRED_COLLECTIONS.length);
  });

  it('exposes unique slugs', () => {
    const slugs = collections.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('leaves bundle collections empty rather than inventing bundle products', () => {
    expect(getProductsByCollection('new-home-bundle')).toHaveLength(0);
    expect(getProductsByCollection('couples-bundle')).toHaveLength(0);
  });
});

describe('owner-supplied catalogue', () => {
  it('contains exactly one product per price-list row', () => {
    const expected = ownerLines.reduce((sum, line) => sum + line.rows.length, 0);
    expect(expected).toBe(124);
    expect(products).toHaveLength(expected);
  });

  it('uses the exact labels and prices from the owner list', () => {
    ownerLines.forEach((line) => {
      line.rows.forEach(([label, size, price]) => {
        const product = products.find((p) => p.name === label);
        expect(product).toBeDefined();
        expect(product.price).toBe(price);
        expect(product.sizes).toEqual([size]);
        expect(product.specs.tier).toBe(line.tier);
        expect(product.specs.productLine).toBe(line.line);
      });
    });
  });

  it('never invents a price', () => {
    products.forEach((p) => {
      expect(Number.isInteger(p.price)).toBe(true);
      expect(p.price).toBeGreaterThan(0);
    });
  });

  it('preserves cut-off dimensions instead of guessing them', () => {
    const firmRows = products.filter((p) => p.name.startsWith('PILLOW TOP ROYAL FIRM'));
    expect(firmRows).toHaveLength(3);
    firmRows.forEach((p) => expect(p.sizes[0]).toMatch(/^75X\d+X\.\.\.$/));
    // MONDEO SPRING FIRM had no visible prices, so it must not exist.
    expect(products.some((p) => p.name.includes('MONDEO SPRING FIRM'))).toBe(false);
  });

  it('keeps the owner price tiers', () => {
    expect(priceTiers).toEqual(['LUXURY', 'COMFORT', 'VALUE']);
    expect(getProductsByTier('LUXURY')).toHaveLength(33);
    expect(getProductsByTier('COMFORT')).toHaveLength(66);
    expect(getProductsByTier('VALUE')).toHaveLength(25);
  });

  it('only assigns firmness and audience where the owner wording supports it', () => {
    products.forEach((p) => {
      expect(p.firmness).toEqual(p.name.startsWith('PILLOW TOP ROYAL FIRM') ? ['Firm'] : []);
      expect(p.audiences).toEqual(
        p.specs.productLine === 'BABY MATTRESS' || p.specs.productLine === 'MOUKA KIDDIES'
          ? ['child']
          : []
      );
    });
  });

  it('links every product to an illustrative local image', () => {
    products.forEach((p) => {
      expect(p.images).toHaveLength(1);
      expect(p.images[0]).toMatch(/^\/images\/beds\/[a-z-]+\.svg$/);
      expect(p.isImageIllustrative).toBe(true);
    });
  });

  it('does not invent stock, popularity or recency claims', () => {
    products.forEach((p) => {
      expect(p.stockStatus).toBe('TBD');
      expect(p.isPlaceholder).toBe(false);
      expect(p.isBestSeller).toBe(false);
      expect(p.isNewArrival).toBe(false);
      expect(p.dateAdded).toBeNull();
    });
    expect(getBestSellers()).toHaveLength(0);
    expect(getNewArrivals()).toHaveLength(0);
  });

  it('every product belongs to a real collection', () => {
    products.forEach((p) => expect(getCollectionBySlug(p.collection)).not.toBeNull());
  });

  it('derives size filter options only from supplied sizes', () => {
    expect(sizeOptions).toContain('75X54X8');
    expect(sizeOptions).not.toContain('75X54X...');
    expect(firmnessOptions).toContain('Firm');
  });
});

describe('lookup helpers', () => {
  it('finds a product by id', () => {
    const first = products[0];
    expect(getProductById(first.id)).toBe(first);
    expect(getProductById('does-not-exist')).toBeNull();
  });

  it('returns products for a collection', () => {
    const list = getProductsByCollection('budget-sleep');
    expect(list).toHaveLength(25);
    list.forEach((p) => expect(p.collection).toBe('budget-sleep'));
  });

  it('exposes the 14 owner bed lines', () => {
    const lines = getProductLines();
    expect(lines).toHaveLength(14);
    expect(lines.map((l) => l.line)).toContain('WELLBEING REGAL');
  });
});
