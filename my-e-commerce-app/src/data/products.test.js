import {
  collections,
  products,
  getCollectionBySlug,
  getProductById,
  getProductsByCollection,
  getNewArrivals,
} from './products';

// The seven collections required by prd/agent.md section 5.
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
});

describe('placeholder products', () => {
  it('every product is clearly marked as a placeholder', () => {
    products.forEach((p) => expect(p.isPlaceholder).toBe(true));
  });

  it('never invents a price (all prices are null -> shown as Price TBD)', () => {
    products.forEach((p) => expect(p.price).toBeNull());
  });

  it('does not claim best-seller status (no invented sales claims)', () => {
    products.forEach((p) => expect(p.isBestSeller).toBe(false));
  });

  it('does not invent sizes, firmness, images or specs', () => {
    products.forEach((p) => {
      expect(p.sizes).toEqual([]);
      expect(p.firmness).toEqual([]);
      expect(p.images).toEqual([]);
      expect(p.specs).toEqual({});
      expect(p.stockStatus).toBe('TBD');
    });
  });

  it('every product belongs to a real collection', () => {
    products.forEach((p) => {
      expect(getCollectionBySlug(p.collection)).not.toBeNull();
    });
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
    expect(list.length).toBeGreaterThan(0);
    list.forEach((p) => expect(p.collection).toBe('budget-sleep'));
  });

  it('new arrivals returns most-recent first', () => {
    const arrivals = getNewArrivals();
    const dates = arrivals.map((p) => Date.parse(p.dateAdded));
    const sorted = [...dates].sort((a, b) => b - a);
    expect(dates).toEqual(sorted);
  });
});
